import { delay, HttpResponse } from 'msw'

import {
  consumeFailureRule,
  type FailureRule,
  getMockConfig,
  type LatencyProfileId,
} from './config'
import { apiError } from './responses'
import { createRandom, hashString, randomInt } from './random'

const requestCounts = new Map<string, number>()
let countersKey = ''

/**
 * Sequences restart whenever the latency profile or seed changes, so the
 * first request after enabling a scenario is always request #1.
 */
function syncCounters(profile: LatencyProfileId, seed: number) {
  const key = `${profile}:${String(seed)}`
  if (key === countersKey) return
  countersKey = key
  requestCounts.clear()
}

function nextRequestNumber(operation: string) {
  const count = (requestCounts.get(operation) ?? 0) + 1
  requestCounts.set(operation, count)
  return count
}

function latencyFor(
  profile: LatencyProfileId,
  seed: number,
  operation: string,
  requestNumber: number,
) {
  const random = createRandom(
    hashString(`${String(seed)}:${operation}:${String(requestNumber)}`),
  )
  switch (profile) {
    case 'none':
      return 0
    case 'fast':
      return 80
    case 'realistic':
      return randomInt(random, 150, 500)
    case 'slow':
      return randomInt(random, 1800, 3500)
    case 'out-of-order':
      return requestNumber % 2 === 1 ? 1600 : 250
  }
}

function matchFailure(operation: string, phase: FailureRule['phase']) {
  return getMockConfig().failures.find(
    (rule) =>
      rule.phase === phase &&
      (rule.operation === '*' || rule.operation === operation),
  )
}

async function failureResponse(rule: FailureRule) {
  switch (rule.kind) {
    case 'server-error':
      return apiError(500, 'SERVER_ERROR')
    case 'unavailable':
      return apiError(503, 'SERVICE_UNAVAILABLE')
    case 'rate-limited':
      return apiError(429, 'RATE_LIMITED')
    case 'network':
      return HttpResponse.error()
    case 'timeout':
      // Never answers; the client aborts after its timeout.
      await delay('infinite')
      return HttpResponse.error()
  }
}

/**
 * Network conditions applied before the handler runs: offline mode,
 * deterministic latency and "before" failure rules.
 */
export async function applyRequestConditions(operation: string) {
  const config = getMockConfig()
  if (config.offline) return HttpResponse.error()

  syncCounters(config.latency, config.seed)
  const ms = latencyFor(
    config.latency,
    config.seed,
    operation,
    nextRequestNumber(operation),
  )
  if (ms > 0) await delay(ms)

  const rule = matchFailure(operation, 'before')
  if (!rule) return null
  consumeFailureRule(rule.id)
  return failureResponse(rule)
}

/** "After" failure rules: the handler already ran, but the response is lost. */
export async function applyResponseConditions(operation: string) {
  const rule = matchFailure(operation, 'after')
  if (!rule) return null
  consumeFailureRule(rule.id)
  return failureResponse(rule)
}

/** Restarts the per-operation counters (deterministic sequences after reset). */
export function resetRequestCounters() {
  requestCounts.clear()
}
