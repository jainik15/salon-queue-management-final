import { create } from 'zustand'
import { apiFetch } from '../lib/api'

export interface UserSession {
  role: 'admin' | 'barber'
  name: string
  email?: string
  token: string
}

interface AuthState {
  user: UserSession | null
  token: string | null
  isLoading: boolean
  error: string | null

  login: (credentials: { identifier?: string; password?: string; pin?: string }) => Promise<boolean>
  logout: () => void
  isAuthenticated: () => boolean
}

// A new key invalidates legacy client-generated sessions that were not verified by the server.
const STORAGE_KEY_AUTH = 'latecuts_server_auth_session'
const LEGACY_STORAGE_KEY_AUTH = 'luxe_cuts_auth_session'

function getSavedSession(): UserSession | null {
  if (typeof window === 'undefined') return null
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY_AUTH)
    const raw = localStorage.getItem(STORAGE_KEY_AUTH)
    const session = raw ? JSON.parse(raw) as UserSession : null
    if (!session?.token || !sessionExpiresInFuture(session.token)) {
      localStorage.removeItem(STORAGE_KEY_AUTH)
      return null
    }
    return session
  } catch {
    return null
  }
}

function sessionExpiresInFuture(token: string): boolean {
  try {
    const payload = token.split('.')[0]
    if (!payload) return false
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const parsed = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
    return parsed.sub === 'staff' && parsed.role === 'admin' && Number(parsed.exp) > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getSavedSession(),
  token: getSavedSession()?.token || null,
  isLoading: false,
  error: null,

  login: async ({ identifier, password, pin }) => {
    set({ isLoading: true, error: null })

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, pin }),
      })

      const data = await response.json().catch(() => null) as {
        success?: boolean
        message?: string
        token?: string
        user?: { role?: UserSession['role']; name?: string; email?: string }
      } | null

      if (!response.ok || !data?.success || !data.token || !data.user) {
        throw new Error(data?.message || 'Staff sign-in was rejected. Please try again.')
      }

      const session: UserSession = {
        role: data.user.role || 'admin',
        name: data.user.name || 'Salon Staff',
        email: data.user.email || (identifier?.includes('@') ? identifier : undefined),
        token: data.token,
      }
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session))
      set({ user: session, token: session.token, isLoading: false, error: null })
      window.dispatchEvent(new Event('latecuts:session-change'))
      return true
    } catch (err) {
      const message = err instanceof TypeError
        ? 'Staff sign-in is unavailable. Start the backend and configure its secure credentials and database connection.'
        : err instanceof Error ? err.message : 'Staff sign-in failed. Please try again.'
      set({ isLoading: false, error: message })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_AUTH)
    localStorage.removeItem(LEGACY_STORAGE_KEY_AUTH)
    set({ user: null, token: null, error: null })
    window.dispatchEvent(new Event('latecuts:session-change'))
  },

  isAuthenticated: () => Boolean(get().user && get().token && sessionExpiresInFuture(get().token!)),
}))
