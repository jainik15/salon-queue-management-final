export interface Barber {
  id: string
  name: string
  specialty: string
  status: 'available' | 'break' | 'offline'
  avatar: string
  queue_count: number
  served_today: number
  avg_duration: number
}

export interface QueueEntry {
  id: string
  token: string
  customer_name: string
  service: string
  service_duration: number
  barber_id: string
  barber_name: string
  status: 'waiting' | 'serving' | 'completed' | 'absent' | 'expired'
  position: number
  timestamp_joined: Date
  timestamp_called?: Date
  timestamp_completed?: Date
  estimated_wait: number
  language: 'en' | 'gu'
}

export interface Service {
  id: string
  name_en: string
  name_gu: string
  icon: string
  duration: number
  price: number
}

export type Lang = 'en' | 'gu'

export interface ReviewEntry {
  id: string
  token: string
  customer_name: string
  barber_id: string
  barber_name: string
  service: string
  rating: number
  comment?: string
  aspects?: { waitTime: boolean | null; styling: boolean | null; ambiance: boolean | null }
  created_at: string
}

