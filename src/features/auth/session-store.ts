const STORAGE_KEY = 'kurio.session'

export interface StoredSession {
  token: string
  userId: string
  expiresAt: string
}

export type SessionEndReason = 'logout' | 'expired' | 'replaced'

/** "local": changed by this tab; "external": mirrored from another tab. */
export type SessionChangeOrigin = 'local' | 'external'

type Listener = (origin: SessionChangeOrigin) => void

function isStoredSession(value: unknown): value is StoredSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    typeof value.token === 'string' &&
    'userId' in value &&
    typeof value.userId === 'string' &&
    'expiresAt' in value &&
    typeof value.expiresAt === 'string'
  )
}

function read(): StoredSession | null {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null',
    )
    return isStoredSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

let current = read()
const listeners = new Set<Listener>()

function notify(origin: SessionChangeOrigin) {
  for (const listener of listeners) listener(origin)
}

/**
 * Persisted session reference (token + user id), so the session survives
 * refreshes. Only the opaque token is stored; the user data comes from
 * GET /auth/session. Changes in another tab are mirrored here.
 */
export const sessionStore = {
  get: () => current,

  getToken: () => current?.token ?? null,

  set: (next: StoredSession | null) => {
    current = next
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Blocked storage: the session lasts until the tab closes.
    }
    notify('local')
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return
  current = read()
  notify('external')
})
