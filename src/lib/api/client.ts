import axios from 'axios'

import { env } from '@/lib/env'

import { toApiError } from './errors'

/**
 * Single HTTP client for the REST API. Every rejection is normalized to an
 * ApiError so queries, mutations and UI can branch on stable error codes.
 * Pass the TanStack Query `signal` to requests so obsolete calls are aborted.
 */
export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)
