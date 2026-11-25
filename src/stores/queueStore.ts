import { create } from 'zustand'
import type { Barber, QueueEntry, ReviewEntry, Service } from '../types'
import { getServiceDisplayName } from '../lib/utils'
import { apiFetch, apiUrl } from '../lib/api'
import { queueBroadcast, broadcastStateChange } from '../lib/supabase'

type NewQueueEntry = Omit<QueueEntry, 'id' | 'token' | 'position' | 'status' | 'timestamp_joined' | 'estimated_wait'> & {
  service_ids?: string[]
  isWalkIn?: boolean
  join_request_id?: string
  barber_preference?: 'any' | 'specific'
}

export type ServiceCatalogStatus = 'loading' | 'ready' | 'empty' | 'error'

function parseQueueItem(item: any): QueueEntry {
  const displayName = ({ zara: 'Ramesh', marcus: 'Vinod', dev: 'Arjun' } as Record<string, string>)[item.barber_id]
  return {
    ...item,
    barber_name: displayName || item.barber_name,
    timestamp_joined: new Date(item.timestamp_joined),
    timestamp_called: item.timestamp_called ? new Date(item.timestamp_called) : undefined,
    timestamp_completed: item.timestamp_completed ? new Date(item.timestamp_completed) : undefined,
  }
}

function presentBarbers(rows: Barber[]): Barber[] {
  const displayNames: Record<string, string> = { zara: 'Ramesh', marcus: 'Vinod', dev: 'Arjun' }
  return rows.map(barber => ({ ...barber, name: displayNames[barber.id] || barber.name }))
}

function makeRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const value = Math.random() * 16 | 0
    return (char === 'x' ? value : (value & 0x3 | 0x8)).toString(16)
  })
}

async function readError(response: Response): Promise<string> {
  const data = await response.json().catch(() => null)
  return typeof data?.message === 'string' ? data.message : `Request failed (${response.status}).`
}

interface QueueStore {
  queue: QueueEntry[]
  barbers: Barber[]
  services: Service[]
  servicesStatus: ServiceCatalogStatus
  servicesError: string | null
  reviews: ReviewEntry[]
  nextTokenNum: number
  isLiveDbConnected: boolean
  syncError: string | null

  addToQueue: (entryData: NewQueueEntry) => Promise<QueueEntry>
  updateStatus: (id: string, status: QueueEntry['status']) => Promise<void>
  callNext: (barberId: string) => Promise<void>
  markDone: (id: string) => Promise<void>
  markAbsent: (id: string) => Promise<void>
  removeWaitingEntry: (id: string) => Promise<void>
  cancelQueueEntry: (accessToken: string) => Promise<void>
  updateBarberStatus: (barberId: string, status: Barber['status']) => Promise<void>
  addFeedback: (accessToken: string, review: Pick<ReviewEntry, 'rating' | 'comment' | 'aspects'>) => Promise<void>
  initRealtimeSync: () => (() => void) | void
  refreshServices: () => Promise<void>
  resetToSampleData: () => Promise<void>
  getBarberQueue: (barberId: string) => QueueEntry[]
  getCurrentlyServing: (barberId: string) => QueueEntry | undefined
  getWaitingCount: () => number
}

export const useQueueStore = create<QueueStore>((set, get) => {
  let refreshInFlight: Promise<void> | null = null
  let servicesRefreshInFlight: Promise<void> | null = null

  const refreshServices = (): Promise<void> => {
    if (servicesRefreshInFlight) return servicesRefreshInFlight
    if (get().services.length === 0) set({ servicesStatus: 'loading', servicesError: null })

    servicesRefreshInFlight = apiFetch('/api/services')
      .then(async response => {
        if (!response.ok) throw new Error(await readError(response))
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.toLowerCase().includes('application/json')) {
          throw new Error('The services endpoint did not return JSON. Check the configured API base URL.')
        }

        const data = await response.json()
        if (!Array.isArray(data?.services)) throw new Error('The service catalog response is invalid.')
        const services = data.services as Service[]
        const validCatalog = services.every(service =>
          service &&
          typeof service.id === 'string' && service.id.length > 0 &&
          typeof service.name_en === 'string' && typeof service.name_gu === 'string' &&
          typeof service.icon === 'string' &&
          Number.isFinite(service.duration) && Number.isFinite(service.price),
        )
        if (!validCatalog) throw new Error('The service catalog contains invalid entries.')

        set({
          services,
          servicesStatus: services.length > 0 ? 'ready' : 'empty',
          servicesError: null,
        })
      })
      .catch(error => {
        set({
          servicesStatus: 'error',
          servicesError: error instanceof Error ? error.message : 'The service menu could not be loaded.',
        })
      })
      .finally(() => {
        servicesRefreshInFlight = null
      })

    return servicesRefreshInFlight
  }

  const refreshFromServer = (): Promise<void> => {
    if (refreshInFlight) return refreshInFlight
    void refreshServices()
    refreshInFlight = apiFetch('/api/queue').then(async queueResponse => {
      if (!queueResponse.ok) throw new Error(await readError(queueResponse))
      const queueData = await queueResponse.json()
      const queue: QueueEntry[] = Array.isArray(queueData.queue) ? (queueData.queue as unknown[]).map(parseQueueItem) : []
      const barbers = Array.isArray(queueData.barbers) ? presentBarbers(queueData.barbers) : []
      const reviews = Array.isArray(queueData.reviews) ? queueData.reviews.map((review: ReviewEntry) => ({
        ...review,
        barber_name: ({ zara: 'Ramesh', marcus: 'Vinod', dev: 'Arjun' } as Record<string, string>)[review.barber_id] || review.barber_name,
      })) : []
      const nextTokenNum = queue.reduce<number>((max, entry) => {
        const number = Number(entry.token.match(/(\d+)$/)?.[1] || 0)
        return Math.max(max, number + 1)
      }, 1)
      set({ queue, barbers, reviews, nextTokenNum, isLiveDbConnected: true, syncError: null })
    }).catch(error => {
      set({ isLiveDbConnected: false, syncError: error instanceof Error ? error.message : 'Queue service is unavailable.' })
      throw error
    }).finally(() => {
      refreshInFlight = null
    })
    return refreshInFlight
  }

  const postStaffAction = async (path: string, body?: unknown) => {
    const response = await apiFetch(path, {
      method: 'POST',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    if (!response.ok) throw new Error(await readError(response))
    const result = await response.json().catch(() => ({}))
    await refreshFromServer().catch(() => null)
    return result
  }

  return {
    queue: [],
    barbers: [],
    services: [],
    servicesStatus: 'loading',
    servicesError: null,
    reviews: [],
    nextTokenNum: 1,
    isLiveDbConnected: false,
    syncError: null,

    addToQueue: async (entryData) => {
      const { isWalkIn, service_ids, join_request_id, ...entry } = entryData
      const response = await apiFetch(isWalkIn ? '/api/queue/walk-in' : '/api/queue/join', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: entry.customer_name,
          service: getServiceDisplayName(entry.service),
          service_duration: entry.service_duration,
          barber_id: entry.barber_id,
          barber_preference: isWalkIn ? 'specific' : entry.barber_preference || 'specific',
          language: entry.language,
          service_ids: service_ids || [],
          join_request_id: join_request_id || makeRequestId(),
        }),
      })
      if (!response.ok) throw new Error(await readError(response))
      const created = parseQueueItem(await response.json())
      // The API response confirms persistence. A failed follow-up read must not
      // make a customer retry and create a second entry.
      await refreshFromServer().catch(() => null)
      return created
    },

    updateStatus: async (id, status) => {
      if (status !== 'completed' && status !== 'absent') throw new Error('That queue transition is not supported.')
      await postStaffAction(`/api/queue/${status === 'completed' ? 'mark-done' : 'mark-absent'}`, { id })
      broadcastStateChange('QUEUE_REFRESH', null)
    },

    callNext: async (barberId) => {
      await postStaffAction('/api/queue/call-next', { barberId })
      broadcastStateChange('QUEUE_REFRESH', null)
    },

    markDone: async (id) => get().updateStatus(id, 'completed'),
    markAbsent: async (id) => get().updateStatus(id, 'absent'),

    removeWaitingEntry: async (id) => {
      await postStaffAction('/api/queue/remove-waiting', { id })
      broadcastStateChange('QUEUE_REFRESH', null)
    },

    cancelQueueEntry: async (accessToken) => {
      const response = await apiFetch('/api/queue/cancel', {
        method: 'POST',
        body: JSON.stringify({ access_token: accessToken }),
      })
      if (!response.ok) throw new Error(await readError(response))
      await refreshFromServer().catch(() => null)
      broadcastStateChange('QUEUE_REFRESH', null)
    },

    updateBarberStatus: async (barberId, status) => {
      await postStaffAction('/api/barbers/status', { barberId, status })
      broadcastStateChange('QUEUE_REFRESH', null)
    },

    addFeedback: async (accessToken, review) => {
      const response = await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          access_token: accessToken,
          rating: review.rating,
          comment: review.comment,
          aspects: review.aspects,
        }),
      })
      if (!response.ok) throw new Error(await readError(response))
      await refreshFromServer().catch(() => null)
      broadcastStateChange('FEEDBACK_REFRESH', null)
    },

    resetToSampleData: async () => {
      await postStaffAction('/api/database/reset')
      broadcastStateChange('QUEUE_REFRESH', null)
    },

    initRealtimeSync: () => {
      let stopped = false
      const refreshSafely = () => {
        if (!stopped) void refreshFromServer().catch(() => null)
      }
      refreshSafely()

      let eventSource: EventSource | null = null
      try {
        eventSource = new EventSource(apiUrl('/api/events'))
        eventSource.onerror = () => {
          eventSource?.close()
          eventSource = null
          set({ isLiveDbConnected: false })
        }
        for (const eventName of ['QUEUE_UPDATE', 'CALL_NEXT', 'MARK_DONE', 'MARK_ABSENT', 'BARBER_UPDATE', 'RESET_DATA', 'FEEDBACK_UPDATE']) {
          eventSource.addEventListener(eventName, (event) => {
            refreshSafely()
            try {
              const detail = JSON.parse((event as MessageEvent).data)
              window.dispatchEvent(new CustomEvent('latecuts:queue-event', { detail: { type: eventName, data: detail } }))
            } catch { /* Ignore malformed notifications. */ }
          })
        }
      } catch {
        eventSource = null
      }

      if (queueBroadcast) {
        queueBroadcast.onmessage = () => refreshSafely()
      }
      window.addEventListener('latecuts:session-change', refreshSafely)

      return () => {
        stopped = true
        eventSource?.close()
        window.removeEventListener('latecuts:session-change', refreshSafely)
        if (queueBroadcast) queueBroadcast.onmessage = null
      }
    },

    refreshServices,

    getBarberQueue: (barberId) => get().queue
      .filter(entry => entry.barber_id === barberId && (entry.status === 'waiting' || entry.status === 'serving'))
      .sort((a, b) => a.timestamp_joined.getTime() - b.timestamp_joined.getTime()),

    getCurrentlyServing: (barberId) => get().queue.find(entry => entry.barber_id === barberId && entry.status === 'serving'),

    getWaitingCount: () => get().queue.filter(entry => entry.status === 'waiting').length,
  }
})
