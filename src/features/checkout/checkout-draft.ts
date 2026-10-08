import type { PaymentFormValues } from './schemas'

const STORAGE_KEY = 'kurio.checkout.draft'

/**
 * Checkout form values kept while the collector types, so an expired
 * session (login and back) or a reload resumes with the same data.
 */
export const checkoutDraft = {
  read(userId: string): PaymentFormValues | null {
    try {
      const parsed = JSON.parse(
        sessionStorage.getItem(STORAGE_KEY) ?? 'null',
      ) as {
        userId: string
        values: PaymentFormValues
      } | null
      return parsed?.userId === userId ? parsed.values : null
    } catch {
      return null
    }
  },

  save(userId: string, values: PaymentFormValues) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, values }))
    } catch {
      // Without storage the form simply starts again from the wallet.
    }
  },

  clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing stored.
    }
  },
}
