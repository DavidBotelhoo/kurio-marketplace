import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { fetchHighlights, fetchNft, fetchNftList, fetchRelated } from './api'
import { catalogKeys } from './query-keys'
import type { CatalogListParams } from './search'

/*
 * The AbortSignal is forwarded to the HTTP client: when the parameters change
 * before a response arrives, TanStack Query cancels the obsolete request, and
 * each parameter set has its own cache entry, so a late answer can never
 * overwrite the current results.
 */

export function nftListQueryOptions(params: CatalogListParams) {
  return queryOptions({
    queryKey: catalogKeys.list(params),
    queryFn: ({ signal }) => fetchNftList(params, signal),
    // Keep showing the previous page while the next one loads.
    placeholderData: keepPreviousData,
  })
}

export function highlightsQueryOptions() {
  return queryOptions({
    queryKey: catalogKeys.highlights(),
    queryFn: ({ signal }) => fetchHighlights(signal),
    staleTime: 5 * 60_000,
  })
}

export function nftDetailQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: catalogKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNft(nftId, signal),
  })
}

export function relatedQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: catalogKeys.related(nftId),
    queryFn: ({ signal }) => fetchRelated(nftId, signal),
    staleTime: 5 * 60_000,
  })
}
