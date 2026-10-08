const STORAGE_KEY = 'kurio.guest-cart'

type Listener = () => void

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let current = read()
const listeners = new Set<Listener>()

function update(next: string | null) {
  current = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, next)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Blocked storage: the visitor cart lasts until the tab closes.
  }
  for (const listener of listeners) listener()
}

/**
 * Id of the visitor's cart on the API (sent as X-Guest-Cart). Created before
 * the first addition, forgotten once the cart is merged into an account.
 */
export const guestCartStore = {
  get: () => current,

  ensure: () => {
    if (current) return current
    const id = crypto.randomUUID()
    update(id)
    return id
  },

  /** Forgets `id` unless another one replaced it meanwhile. */
  clear: (id: string) => {
    if (current === id) update(null)
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
  for (const listener of listeners) listener()
})
