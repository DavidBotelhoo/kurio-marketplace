import type { CreateOrderRequest } from '@/contracts/orders'

const STORAGE_KEY = 'kurio.checkout.attempt'

/**
 * A purchase being sent: its idempotency key and body. Kept until the API
 * answers, so a reload during the request resends the same attempt (and gets
 * the same order back) instead of creating another purchase.
 */
export interface CheckoutAttempt {
  userId: string
  idempotencyKey: string
  body: CreateOrderRequest
  startedAt: string
}

export const checkoutAttempt = {
  get(userId: string): CheckoutAttempt | null {
    try {
      const parsed = JSON.parse(
        sessionStorage.getItem(STORAGE_KEY) ?? 'null',
      ) as CheckoutAttempt | null
      return parsed?.userId === userId ? parsed : null
    } catch {
      return null
    }
  },

  start(userId: string, body: CreateOrderRequest): CheckoutAttempt {
    const attempt: CheckoutAttempt = {
      userId,
      idempotencyKey: crypto.randomUUID(),
      body,
      startedAt: new Date().toISOString(),
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
    } catch {
      // Without storage the attempt still works; it just cannot survive a reload.
    }
    return attempt
  },

  clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing stored.
    }
  },
}
