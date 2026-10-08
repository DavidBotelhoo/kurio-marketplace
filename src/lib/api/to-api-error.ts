import { isAxiosError, isCancel } from 'axios'

import { isApiErrorBody } from '@/contracts/errors'

import { ApiError, CODE_BY_STATUS, isApiError } from './errors'

/*
 * Axios → ApiError conversion. Kept apart from errors.ts so code that only
 * checks errors (query client, UI) does not pull the HTTP client into the
 * entry chunk.
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (isCancel(error)) return new ApiError({ code: 'CANCELED', cause: error })

  if (!isAxiosError(error))
    return new ApiError({ code: 'UNKNOWN', cause: error })

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError({ code: 'TIMEOUT', cause: error })
  }

  const { response } = error
  if (!response) return new ApiError({ code: 'NETWORK_ERROR', cause: error })

  const { status } = response
  const data: unknown = response.data
  if (isApiErrorBody(data)) {
    return new ApiError({ ...data.error, status, cause: error })
  }

  const code =
    CODE_BY_STATUS[status] ?? (status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN')
  return new ApiError({ code, status, cause: error })
}
