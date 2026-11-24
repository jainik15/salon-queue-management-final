// Supabase access is server-only. This module now provides only same-origin tab
// notifications; it never creates a browser Supabase client or exposes keys.
export const queueBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('latecuts_queue_sync_channel')
  : null

export function broadcastStateChange(action: string, payload: unknown) {
  if (!queueBroadcast) return
  try {
    // Do not put queue/customer records into BroadcastChannel messages.
    queueBroadcast.postMessage({ action, payload: payload === null ? null : undefined, timestamp: Date.now() })
  } catch (error) {
    console.warn('BroadcastChannel notification error:', error)
  }
}
