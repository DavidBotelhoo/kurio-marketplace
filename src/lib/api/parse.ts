import { ApiError } from './errors'

interface Schema<T> {
  safeParse: (
    data: unknown,
  ) =>
    | { success: true; data: T }
    | { success: false; error: { issues: unknown[] } }
}

/**
 * Validates a response body against its contract. A mismatch means the
 * server broke the contract: it surfaces as ApiError INVALID_RESPONSE instead
 * of letting malformed data reach the UI.
 */
export function parseResponse<T>(schema: Schema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  if (import.meta.env.DEV)
    console.error('Contract violation', result.error.issues, data)
  throw new ApiError({ code: 'INVALID_RESPONSE', details: result.error.issues })
}
