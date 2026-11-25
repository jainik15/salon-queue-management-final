import type { Barber, QueueEntry, ReviewEntry } from '../types'
export { formatQueueToken } from './queueToken.js'

const legacyServiceNames: Record<string, string> = {
  'Royal Fade': 'Fade',
  'રોયલ ફેડ': 'Fade',
  'Beard Sculpt': 'Beard Style',
  'બીયર્ડ સ્કલ્પ્ટ': 'Beard Style',
  'Head Spa Treatment': 'Hair Spa',
  'Head Spa': 'Hair Spa',
  'હેડ સ્પા': 'Hair Spa',
  'Bridal & Styling': 'D-Tan',
  'Bridal Styling': 'D-Tan',
  'બ્રાઇડલ સ્ટાઇલિંગ': 'D-Tan',
  'Bridal & Head Spa': 'D-Tan & Hair Spa',
  'Royal Fade & Classic': 'Fade & Classic',
}
const currentServiceNames = new Set(['Classic Cut', 'Beard Style', 'Fade', 'Kids Cut', 'Hair Spa', 'D-Tan'])

/** Normalize service labels from older queue/review records for display only. */
export const getServiceDisplayName = (service: string): string =>
  service.split(/(\s\+\s)/).map(part => {
    if (part.trim() === '+') return part
    const label = part.trim()
    const legacyLabel = Object.keys(legacyServiceNames).find(name => name.toLowerCase() === label.toLowerCase())
    const canonicalLabel = legacyLabel ? legacyServiceNames[legacyLabel] : label
    const currentLabel = [...currentServiceNames].find(name => name.toLowerCase() === canonicalLabel.toLowerCase())
    return currentLabel || canonicalLabel
  }).join('')

export const INITIAL_BARBERS: Barber[] = [
  { id: 'zara', name: 'Ramesh', specialty: 'D-Tan & Hair Spa', status: 'available', avatar: 'R', queue_count: 2, served_today: 7, avg_duration: 32 },
  { id: 'marcus', name: 'Vinod', specialty: 'Fade & Classic', status: 'available', avatar: 'V', queue_count: 3, served_today: 9, avg_duration: 28 },
  { id: 'dev', name: 'Arjun', specialty: 'Beard & Kids', status: 'break', avatar: 'A', queue_count: 1, served_today: 6, avg_duration: 25 },
]

export const INITIAL_REVIEWS: ReviewEntry[] = [
  { id: 'rev-1', token: 'LC-00', customer_name: 'Aditi V.', barber_id: 'zara', barber_name: 'Ramesh', service: 'Hair Spa', rating: 5, comment: 'Absolutely divine head spa treatment. Ramesh is a master of relaxation.', created_at: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 'rev-2', token: 'LC-00b', customer_name: 'Rohan K.', barber_id: 'marcus', barber_name: 'Vinod', service: 'Fade', rating: 5, comment: 'Cleanest low fade in town. Sharp lines and great conversation.', created_at: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: 'rev-3', token: 'LC-00c', customer_name: 'Tanvi M.', barber_id: 'dev', barber_name: 'Arjun', service: 'Beard Style', rating: 4, comment: 'Very gentle and precise with the razor. Highly recommend Arjun.', created_at: new Date(Date.now() - 140 * 60000).toISOString() },
  { id: 'rev-4', token: 'LC-00d', customer_name: 'Siddharth P.', barber_id: 'marcus', barber_name: 'Vinod', service: 'Classic Cut', rating: 5, comment: 'No wait, seated immediately. Pristine salon lounge ambiance.', created_at: new Date(Date.now() - 210 * 60000).toISOString() },
]

export const SAMPLE_QUEUE: QueueEntry[] = [
  { id: '1', token: 'LC-01', customer_name: 'Priya', service: 'Fade', service_duration: 35, barber_id: 'zara', barber_name: 'Ramesh', status: 'serving', position: 1, timestamp_joined: new Date(Date.now() - 40 * 60000), timestamp_called: new Date(Date.now() - 5 * 60000), estimated_wait: 0, language: 'en' },
  { id: '2', token: 'LC-02', customer_name: 'Rahul', service: 'Classic Cut', service_duration: 25, barber_id: 'marcus', barber_name: 'Vinod', status: 'serving', position: 1, timestamp_joined: new Date(Date.now() - 35 * 60000), timestamp_called: new Date(Date.now() - 8 * 60000), estimated_wait: 0, language: 'en' },
  { id: '3', token: 'LC-03', customer_name: 'Aisha', service: 'Hair Spa', service_duration: 45, barber_id: 'zara', barber_name: 'Ramesh', status: 'waiting', position: 2, timestamp_joined: new Date(Date.now() - 25 * 60000), estimated_wait: 30, language: 'en' },
  { id: '4', token: 'LC-04', customer_name: 'Kabir', service: 'Beard Style', service_duration: 20, barber_id: 'marcus', barber_name: 'Vinod', status: 'waiting', position: 2, timestamp_joined: new Date(Date.now() - 20 * 60000), estimated_wait: 20, language: 'en' },
  { id: '5', token: 'LC-05', customer_name: 'Meera', service: 'Kids Cut', service_duration: 20, barber_id: 'dev', barber_name: 'Arjun', status: 'waiting', position: 1, timestamp_joined: new Date(Date.now() - 15 * 60000), estimated_wait: 25, language: 'en' },
  { id: '6', token: 'LC-06', customer_name: 'Arjun', service: 'Fade', service_duration: 35, barber_id: 'zara', barber_name: 'Ramesh', status: 'waiting', position: 3, timestamp_joined: new Date(Date.now() - 10 * 60000), estimated_wait: 65, language: 'en' },
  { id: '7', token: 'LC-07', customer_name: 'Nisha', service: 'Classic Cut', service_duration: 25, barber_id: 'marcus', barber_name: 'Vinod', status: 'waiting', position: 3, timestamp_joined: new Date(Date.now() - 5 * 60000), estimated_wait: 45, language: 'en' },
]

export const getWaitTime = (position: number, barberAvgDuration: number) =>
  Math.max(0, (position - 1) * barberAvgDuration)

export const formatWait = (minutes: number): string => {
  if (minutes === 0) return "It's your turn!"
  if (minutes < 60) return `~${minutes} min`
  return `~${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export const generateToken = (count: number): string =>
  `LC-${String(count).padStart(2, '0')}`
