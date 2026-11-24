import { createClient } from '@supabase/supabase-js'

// Public client configuration only; privileged service-role keys belong on a trusted server.
const metaEnv = (import.meta as any).env || {}
const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL ||
  metaEnv.SUPABASE_URL ||
  metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
  ''

const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.SUPABASE_ANON_KEY ||
  metaEnv.SUPABASE_PUBLISHABLE_KEY ||
  metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'))

// Supabase client instance (or null if unconfigured)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Cross-tab real-time sync channel using Web Standards BroadcastChannel
export const queueBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('luxe_cuts_sync_channel')
  : null

// Helper to broadcast state changes across all browser tabs
export function broadcastStateChange(action: string, payload: unknown) {
  if (queueBroadcast) {
    try {
      queueBroadcast.postMessage({ action, payload, timestamp: Date.now() })
    } catch (e) {
      console.warn('BroadcastChannel error:', e)
    }
  }
}
