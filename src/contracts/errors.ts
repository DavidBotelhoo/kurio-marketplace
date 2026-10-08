/**
 * Error contract shared by the HTTP client and the mock API.
 *
 * Every non-2xx response carries an `ApiErrorBody`. `code` is the stable,
 * machine-readable reason; `message` is a user-facing pt-BR fallback;
 * `fields` maps form field names to validation messages.
 */
export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'AVAILABILITY_CONFLICT',
  'WALLET_REJECTED',
  'RATE_LIMITED',
  'SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    fields?: Record<string, string>
    details?: unknown
  }
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false
  }
  const { error } = value
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    (API_ERROR_CODES as readonly string[]).includes(error.code) &&
    'message' in error &&
    typeof error.message === 'string'
  )
}
