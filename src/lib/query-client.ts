import { QueryClient } from '@tanstack/react-query'

import { isApiError } from '@/lib/api/errors'

const MAX_QUERY_RETRIES = 2

/**
 * Cache policy (documented in ARCHITECTURE.md):
 * - queries are fresh for 30s and kept for 5 min after the last observer;
 * - only transient failures (network, timeout, 429, 5xx) are retried, with
 *   exponential backoff; 4xx responses fail fast;
 * - a query that already failed is not refetched just because a component
 *   mounted (retryOnMount: false): the number of automatic attempts stays
 *   fixed even when a route loader prefetched it, and the user decides when
 *   to retry (reconnecting still refetches);
 * - mutations never retry automatically: duplicated side effects are avoided
 *   and order creation relies on idempotency keys instead.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) =>
          isApiError(error) &&
          error.retryable &&
          failureCount < MAX_QUERY_RETRIES,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
        retryOnMount: false,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
