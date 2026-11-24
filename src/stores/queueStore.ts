import { create } from 'zustand'
import type { Barber, QueueEntry, ReviewEntry } from '../types'
import { INITIAL_BARBERS, SAMPLE_QUEUE, INITIAL_REVIEWS, generateToken } from '../lib/utils'
import { supabase, isSupabaseConfigured, queueBroadcast, broadcastStateChange } from '../lib/supabase'

const STORAGE_KEY_QUEUE = 'luxe_cuts_db_queue'
const STORAGE_KEY_BARBERS = 'luxe_cuts_db_barbers'
const STORAGE_KEY_TOKEN_COUNT = 'luxe_cuts_db_token_counter'
const STORAGE_KEY_REVIEWS = 'luxe_cuts_db_reviews'

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

function loadSavedQueue(): QueueEntry[] {
  if (typeof window === 'undefined') return SAMPLE_QUEUE
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE)
    if (!raw) return SAMPLE_QUEUE
    const parsed = JSON.parse(raw)
    return parsed.map(parseQueueItem)
  } catch {
    return SAMPLE_QUEUE
  }
}

function loadSavedBarbers(): Barber[] {
  if (typeof window === 'undefined') return INITIAL_BARBERS
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BARBERS)
    return raw ? presentBarbers(JSON.parse(raw) as Barber[]) : INITIAL_BARBERS
  } catch {
    return INITIAL_BARBERS
  }
}

function loadSavedReviews(): ReviewEntry[] {
  if (typeof window === 'undefined') return INITIAL_REVIEWS
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS)
    return raw ? (JSON.parse(raw) as ReviewEntry[]).map(review => ({ ...review, barber_name: ({ zara: 'Ramesh', marcus: 'Vinod', dev: 'Arjun' } as Record<string, string>)[review.barber_id] || review.barber_name })) : INITIAL_REVIEWS
  } catch {
    return INITIAL_REVIEWS
  }
}

function loadSavedCounter(): number {
  if (typeof window === 'undefined') return 8
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOKEN_COUNT)
    return raw ? parseInt(raw, 10) : 8
  } catch {
    return 8
  }
}

interface QueueStore {
  queue: QueueEntry[]
  barbers: Barber[]
  reviews: ReviewEntry[]
  nextTokenNum: number
  isLiveDbConnected: boolean
  syncError: string | null

  addToQueue: (entryData: Omit<QueueEntry, 'id' | 'token' | 'position' | 'status' | 'timestamp_joined' | 'estimated_wait'>) => Promise<QueueEntry>
  updateStatus: (id: string, status: QueueEntry['status']) => Promise<void>
  callNext: (barberId: string) => Promise<void>
  markDone: (id: string) => Promise<void>
  markAbsent: (id: string) => Promise<void>
  updateBarberStatus: (barberId: string, status: Barber['status']) => Promise<void>
  addFeedback: (review: Omit<ReviewEntry, 'id' | 'created_at'>) => Promise<void>
  initRealtimeSync: () => (() => void) | void
  resetToSampleData: () => Promise<void>
  getBarberQueue: (barberId: string) => QueueEntry[]
  getCurrentlyServing: (barberId: string) => QueueEntry | undefined
  getWaitingCount: () => number
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  queue: loadSavedQueue(),
  barbers: loadSavedBarbers(),
  reviews: loadSavedReviews(),
  nextTokenNum: loadSavedCounter(),
  isLiveDbConnected: isSupabaseConfigured,
  syncError: null,

  addToQueue: async (entryData) => {
    const { queue, barbers, nextTokenNum } = get()
    const barber = barbers.find(b => b.id === entryData.barber_id)!
    const barberQueue = queue.filter(e => e.barber_id === entryData.barber_id && e.status === 'waiting')
    const position = barberQueue.length + 1
    const estimated_wait = position * barber.avg_duration

    const newEntry: QueueEntry = {
      ...entryData,
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      token: generateToken(nextTokenNum),
      status: 'waiting',
      position,
      timestamp_joined: new Date(),
      estimated_wait,
    }

    const updatedQueue = [...queue, newEntry]
    const updatedCounter = nextTokenNum + 1
    const updatedBarbers = barbers.map(b =>
      b.id === entryData.barber_id ? { ...b, queue_count: b.queue_count + 1 } : b
    )

    // Save locally
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(updatedQueue))
    localStorage.setItem(STORAGE_KEY_TOKEN_COUNT, updatedCounter.toString())
    localStorage.setItem(STORAGE_KEY_BARBERS, JSON.stringify(updatedBarbers))

    set({
      queue: updatedQueue,
      nextTokenNum: updatedCounter,
      barbers: updatedBarbers,
    })

    // Broadcast cross-tab instant update
    broadcastStateChange('ADD_ENTRY', { queue: updatedQueue, barbers: updatedBarbers })

    // Call backend Node.js REST API
    fetch('/api/queue/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    }).catch(err => console.info('Backend sync note (join):', err))

    // If Supabase configured, insert row in DB
    if (supabase) {
      try {
        await supabase.from('queue_entries').insert({
          id: newEntry.id,
          token: newEntry.token,
          customer_name: newEntry.customer_name,
          service: newEntry.service,
          service_duration: newEntry.service_duration,
          barber_id: newEntry.barber_id,
          barber_name: newEntry.barber_name,
          status: newEntry.status,
          position: newEntry.position,
          timestamp_joined: newEntry.timestamp_joined.toISOString(),
          estimated_wait: newEntry.estimated_wait,
          language: newEntry.language,
        })
      } catch (err) {
        console.warn('Supabase DB Insert note:', err)
      }
    }

    return newEntry
  },

  updateStatus: async (id, status) => {
    const updatedQueue = get().queue.map(e => e.id === id ? { ...e, status } : e)
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(updatedQueue))
    set({ queue: updatedQueue })
    broadcastStateChange('UPDATE_STATUS', { id, status })

    if (supabase) {
      try {
        await supabase.from('queue_entries').update({ status }).eq('id', id)
      } catch (err) {
        console.warn('Supabase DB Update error:', err)
      }
    }
  },

  callNext: async (barberId) => {
    const { queue } = get()
    const next = queue
      .filter(e => e.barber_id === barberId && e.status === 'waiting')
      .sort((a, b) => a.timestamp_joined.getTime() - b.timestamp_joined.getTime())[0]

    if (!next) return

    const now = new Date()
    const updatedQueue = queue.map(e =>
      e.id === next.id
        ? { ...e, status: 'serving' as const, timestamp_called: now }
        : e
    )

    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(updatedQueue))
    set({ queue: updatedQueue })
    broadcastStateChange('CALL_NEXT', { barberId, entryId: next.id, timestamp: now.toISOString() })

    // Call backend Node.js REST API
    fetch('/api/queue/call-next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId }),
    }).catch(err => console.info('Backend sync note (call-next):', err))

    if (supabase) {
      try {
        await supabase.from('queue_entries').update({
          status: 'serving',
          timestamp_called: now.toISOString(),
        }).eq('id', next.id)
      } catch (err) {
        console.warn('Supabase DB Update error:', err)
      }
    }
  },

  markDone: async (id) => {
    const now = new Date()
    const entry = get().queue.find(e => e.id === id)
    const updatedQueue = get().queue.map(e =>
      e.id === id
        ? { ...e, status: 'completed' as const, timestamp_completed: now }
        : e
    )
    const updatedBarbers = get().barbers.map(b =>
      b.id === entry?.barber_id
        ? { ...b, served_today: b.served_today + 1, queue_count: Math.max(0, b.queue_count - 1) }
        : b
    )

    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(updatedQueue))
    localStorage.setItem(STORAGE_KEY_BARBERS, JSON.stringify(updatedBarbers))
    set({ queue: updatedQueue, barbers: updatedBarbers })
    broadcastStateChange('MARK_DONE', { id })

    // Call backend Node.js REST API
    fetch('/api/queue/mark-done', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(err => console.info('Backend sync note (mark-done):', err))

    if (supabase) {
      try {
        await supabase.from('queue_entries').update({
          status: 'completed',
          timestamp_completed: now.toISOString(),
        }).eq('id', id)
      } catch (err) {
        console.warn('Supabase DB Update error:', err)
      }
    }
  },

  markAbsent: async (id) => {
    const updatedQueue = get().queue.map(e => e.id === id ? { ...e, status: 'absent' as const } : e)
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(updatedQueue))
    set({ queue: updatedQueue })
    broadcastStateChange('MARK_ABSENT', { id })

    // Call backend Node.js REST API
    fetch('/api/queue/mark-absent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(err => console.info('Backend sync note (mark-absent):', err))

    if (supabase) {
      try {
        await supabase.from('queue_entries').update({ status: 'absent' }).eq('id', id)
      } catch (err) {
        console.warn('Supabase DB Update error:', err)
      }
    }
  },

  updateBarberStatus: async (barberId, status) => {
    const updatedBarbers = get().barbers.map(b => b.id === barberId ? { ...b, status } : b)
    localStorage.setItem(STORAGE_KEY_BARBERS, JSON.stringify(updatedBarbers))
    set({ barbers: updatedBarbers })
    broadcastStateChange('UPDATE_BARBER', { barberId, status })

    // Call backend Node.js REST API
    fetch('/api/barbers/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId, status }),
    }).catch(err => console.info('Backend sync note (barber-status):', err))

    if (supabase) {
      try {
        await supabase.from('barbers').update({ status }).eq('id', barberId)
      } catch (err) {
        console.warn('Supabase DB Barber Update error:', err)
      }
    }
  },

  addFeedback: async (reviewData) => {
    const { reviews } = get()
    const newReview: ReviewEntry = {
      ...reviewData,
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
    }
    const updatedReviews = [newReview, ...reviews]
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updatedReviews))
    set({ reviews: updatedReviews })
    broadcastStateChange('ADD_REVIEW', { reviews: updatedReviews })
  },

  resetToSampleData: async () => {
    localStorage.removeItem(STORAGE_KEY_QUEUE)
    localStorage.removeItem(STORAGE_KEY_BARBERS)
    localStorage.removeItem(STORAGE_KEY_TOKEN_COUNT)
    localStorage.removeItem(STORAGE_KEY_REVIEWS)
    set({
      queue: SAMPLE_QUEUE,
      barbers: INITIAL_BARBERS,
      reviews: INITIAL_REVIEWS,
      nextTokenNum: 8,
    })
    broadcastStateChange('RESET_DATA', null)

    // Call backend reset
    fetch('/api/database/reset', { method: 'POST' }).catch(() => null)
  },

  initRealtimeSync: () => {
    // 1. Initial hydration from Node.js Backend Server API
    fetch('/api/queue')
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : null))
      .then(data => {
        if (data && Array.isArray(data.queue)) {
          const parsedQueue = data.queue.map(parseQueueItem)
          const parsedBarbers = data.barbers ? presentBarbers(data.barbers) : get().barbers
          localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(parsedQueue))
          if (data.barbers) localStorage.setItem(STORAGE_KEY_BARBERS, JSON.stringify(parsedBarbers))
          set({ queue: parsedQueue, barbers: parsedBarbers, isLiveDbConnected: true })
        }
      })
      .catch(() => {
        // Backend might be offline; local storage and BroadcastChannel keep running
      })

    // 2. Connect to Server-Sent Events (SSE) live stream
    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource('/api/events')
      eventSource.onopen = () => {
        set({ isLiveDbConnected: true })
      }
      eventSource.onerror = () => {
        // Close gracefully if SSE endpoint is not available on static hosts like Vercel
        if (eventSource) {
          eventSource.close()
          eventSource = null
        }
      }
      const syncFromSSE = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.queue && Array.isArray(payload.queue)) {
            const parsedQueue = payload.queue.map(parseQueueItem)
            const parsedBarbers = payload.barbers ? presentBarbers(payload.barbers) : get().barbers
            localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(parsedQueue))
            if (payload.barbers) localStorage.setItem(STORAGE_KEY_BARBERS, JSON.stringify(parsedBarbers))
            set({ queue: parsedQueue, barbers: parsedBarbers, isLiveDbConnected: true })
          }
        } catch {
          // Ignore parse errors on ping
        }
      }

      eventSource.addEventListener('QUEUE_UPDATE', syncFromSSE)
      eventSource.addEventListener('CALL_NEXT', syncFromSSE)
      eventSource.addEventListener('MARK_DONE', syncFromSSE)
      eventSource.addEventListener('MARK_ABSENT', syncFromSSE)
      eventSource.addEventListener('BARBER_UPDATE', syncFromSSE)
      eventSource.addEventListener('RESET_DATA', syncFromSSE)
    } catch {
      // EventSource fallback
    }

    // 3. Listen for cross-tab sync messages via BroadcastChannel
    if (queueBroadcast) {
      queueBroadcast.onmessage = (event) => {
        if (!event.data) return
        const freshQueue = loadSavedQueue()
        const freshBarbers = loadSavedBarbers()
        const freshReviews = loadSavedReviews()
        set({ queue: freshQueue, barbers: freshBarbers, reviews: freshReviews })
      }
    }

    // 4. If Supabase configured, hydrate and subscribe to PostgreSQL database changes
    let supabaseChannel: any = null
    if (supabase) {
      set({ isLiveDbConnected: true })

      // Fetch initial data from Supabase
      supabase.from('barbers').select('*').then(
        ({ data }: any) => {
          if (data && data.length > 0) {
            const normalized = presentBarbers(data)
            set({ barbers: normalized })
            localStorage.setItem(STORAGE_KEY_BARBERS, JSON.stringify(normalized))
          }
        },
        () => { /* ignore offline */ }
      )

      supabase.from('queue_entries').select('*').then(
        ({ data }: any) => {
          if (data && data.length > 0) {
            const parsed = data.map(parseQueueItem)
            set({ queue: parsed })
            localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(parsed))
          }
        },
        () => { /* ignore offline */ }
      )

      supabaseChannel = supabase
        .channel('db-realtime-luxe')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'queue_entries' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const row = payload.new as any
              const entry = parseQueueItem(row)
              set(s => ({
                queue: s.queue.some(e => e.id === entry.id) ? s.queue : [...s.queue, entry]
              }))
            } else if (payload.eventType === 'UPDATE') {
              const row = payload.new as any
              set(s => ({
                queue: s.queue.map(e => e.id === row.id ? { ...e, ...parseQueueItem(row) } : e)
              }))
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'barbers' },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              const row = payload.new as any
              set(s => ({
                barbers: s.barbers.map(b => b.id === row.id ? presentBarbers([{ ...b, ...row }])[0] : b)
              }))
            }
          }
        )
        .subscribe()
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (supabase && supabaseChannel) {
        supabase.removeChannel(supabaseChannel)
      }
    }
  },

  getBarberQueue: (barberId) => {
    return get().queue
      .filter(e => e.barber_id === barberId && (e.status === 'waiting' || e.status === 'serving'))
      .sort((a, b) => a.timestamp_joined.getTime() - b.timestamp_joined.getTime())
  },

  getCurrentlyServing: (barberId) => {
    return get().queue.find(e => e.barber_id === barberId && e.status === 'serving')
  },

  getWaitingCount: () => {
    return get().queue.filter(e => e.status === 'waiting').length
  },
}))
