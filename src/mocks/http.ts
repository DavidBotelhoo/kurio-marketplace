import {
  type DefaultBodyType,
  http,
  type HttpResponseResolver,
  type PathParams,
} from 'msw'

import { env } from '@/lib/env'

import { applyRequestConditions, applyResponseConditions } from './network'
import { registerOperation } from './operations'

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

interface RouteOptions {
  /** Stable id used by failure rules ("nfts.list"). */
  operation: string
  /** Human label for the control panel. */
  label: string
}

/** Parsed JSON body, or null when it is missing or malformed. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

/**
 * Declares a mocked REST endpoint. Every route goes through the same network
 * conditions (offline, latency, injected failures) before and after the
 * resolver runs, so scenarios apply uniformly to the whole API.
 */
export function route<
  Params extends PathParams = PathParams,
  RequestBody extends DefaultBodyType = DefaultBodyType,
>(
  method: Method,
  path: `/${string}`,
  { operation, label }: RouteOptions,
  resolver: HttpResponseResolver<Params, RequestBody>,
) {
  registerOperation({
    id: operation,
    label,
    method: method.toUpperCase(),
    path,
  })

  return http[method]<Params, RequestBody>(
    `${env.apiUrl}${path}`,
    async (info) => {
      const failure = await applyRequestConditions(operation)
      if (failure) return failure

      const response = await resolver(info)

      const lost = await applyResponseConditions(operation)
      return lost ?? response
    },
  )
}
