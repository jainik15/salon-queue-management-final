const viteEnv = (import.meta as any).env || {}
const configuredBase = typeof viteEnv.VITE_API_BASE_URL === 'string' ? viteEnv.VITE_API_BASE_URL.trim() : ''
const apiBase = configuredBase.replace(/\/+$/, '')
const AUTH_STORAGE_KEY = 'latecuts_server_auth_session'

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiBase}${normalizedPath}`
}

function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    const session = raw ? JSON.parse(raw) : null
    return typeof session?.token === 'string' ? session.token : null
  } catch {
    return null
  }
}

/** All browser API calls use the Node API; the browser never accesses Supabase. */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {})
  const token = getSessionToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(apiUrl(path), { ...init, headers })
}
