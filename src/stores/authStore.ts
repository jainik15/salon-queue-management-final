import { create } from 'zustand'

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
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
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
      const response = await fetch('/api/auth/login', {
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
      return true
    } catch (err) {
      const message = err instanceof TypeError
        ? 'Staff authentication is unavailable. Start the backend and configure STAFF_PIN on the server.'
        : err instanceof Error ? err.message : 'Staff sign-in failed. Please try again.'
      set({ isLoading: false, error: message })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_AUTH)
    localStorage.removeItem(LEGACY_STORAGE_KEY_AUTH)
    set({ user: null, token: null, error: null })
  },

  isAuthenticated: () => Boolean(get().user && get().token),
}))
