import axios, { type InternalAxiosRequestConfig, isAxiosError } from 'axios'

import { env } from '@/lib/env'

import { getAuthToken, notifyUnauthorized } from './auth-token'
import { ApiError } from './errors'
import { toApiError } from './to-api-error'
import { waitForRequestGate } from './request-gate'

export const REQUEST_TIMEOUT_MS = 10_000

interface TimeoutState {
  timer: ReturnType<typeof setTimeout>
  timedOut: boolean
}

/*
 * Timeouts use a JS timer + AbortController instead of the XHR native timeout,
 * so they also cancel the request on the mock layer and can be driven by a
 * fake clock in end-to-end tests. The caller's signal (TanStack Query) is
 * combined with the timeout signal, so both cancellation sources apply.
 */
const timeouts = new WeakMap<InternalAxiosRequestConfig, TimeoutState>()

function clearTimeoutFor(config: InternalAxiosRequestConfig | undefined) {
  if (!config) return undefined
  const state = timeouts.get(config)
  if (state) clearTimeout(state.timer)
  timeouts.delete(config)
  return state
}

/**
 * Single HTTP client for the REST API. Every rejection is normalized to an
 * ApiError so queries, mutations and UI can branch on stable error codes.
 * Pass the TanStack Query `signal` to requests so obsolete calls are aborted.
 */
export const api = axios.create({
  baseURL: env.apiUrl,
  headers: { Accept: 'application/json' },
  // Arrays as repeated keys: ?categories=a&categories=b
  paramsSerializer: { indexes: null },
})

const sentTokens = new WeakMap<InternalAxiosRequestConfig, string>()

api.interceptors.request.use(async (config) => {
  await waitForRequestGate()
  const token = getAuthToken()
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
    sentTokens.set(config, token)
  }
  const controller = new AbortController()
  const state: TimeoutState = {
    timedOut: false,
    timer: setTimeout(() => {
      state.timedOut = true
      controller.abort()
    }, REQUEST_TIMEOUT_MS),
  }
  const callerSignal = config.signal as AbortSignal | undefined
  config.signal = callerSignal
    ? AbortSignal.any([callerSignal, controller.signal])
    : controller.signal
  timeouts.set(config, state)
  return config
})

api.interceptors.response.use(
  (response) => {
    clearTimeoutFor(response.config)
    return response
  },
  (error: unknown) => {
    const config = isAxiosError(error) ? error.config : undefined
    const state = clearTimeoutFor(config)
    const apiError = state?.timedOut
      ? new ApiError({ code: 'TIMEOUT', cause: error })
      : toApiError(error)
    // An authenticated request was rejected: let the session decide whether
    // it is still the current one (it may have changed meanwhile).
    const token = config ? sentTokens.get(config) : undefined
    if (token && apiError.status === 401)
      notifyUnauthorized(token, apiError.code)
    return Promise.reject(apiError)
  },
)
