const STORAGE_KEY = 'kurio.orders.pending'

interface PendingOrder {
  userId: string
  orderId: string
}

type Listener = () => void

function read(): PendingOrder[] {
  try {
    const parsed: unknown = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) ?? '[]',
    )
    if (!Array.isArray(parsed)) return []
    const items: unknown[] = parsed
    return items.filter(
      (item): item is PendingOrder =>
        typeof item === 'object' &&
        item !== null &&
        'userId' in item &&
        typeof item.userId === 'string' &&
        'orderId' in item &&
        typeof item.orderId === 'string',
    )
  } catch {
    return []
  }
}

let current = read()
const listeners = new Set<Listener>()

function write(next: PendingOrder[]) {
  current = next
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Blocked storage: pending orders are followed until the tab closes.
  }
  for (const listener of listeners) listener()
}

/**
 * Orders created in this tab that are still pending. They are followed on
 * any page (and after a reload) until confirmed or rejected.
 */
export const pendingOrders = {
  list: () => current,

  forUser: (userId: string | null) =>
    current
      .filter((item) => item.userId === userId)
      .map((item) => item.orderId),

  add: (userId: string, orderId: string) => {
    if (current.some((item) => item.orderId === orderId)) return
    write([...current, { userId, orderId }])
  },

  remove: (orderId: string) => {
    if (!current.some((item) => item.orderId === orderId)) return
    write(current.filter((item) => item.orderId !== orderId))
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
