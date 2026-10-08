import type { QueryClient } from '@tanstack/react-query'

import type {
  HighlightsResponse,
  NftDetail,
  NftListResponse,
  NftSummary,
  RelatedResponse,
} from '@/contracts/catalog'
import type { FavoritesResponse } from '@/contracts/favorites'
import type { NftUpdatedEvent } from '@/contracts/realtime'
import { favoritesKeys } from '@/features/favorites/query-keys'

import { catalogKeys } from './query-keys'

/**
 * Applies an `nft.updated` event to every cached view of the NFT (lists,
 * highlights, related, detail, favorites). Each entry only accepts a newer version, so
 * duplicated or late events never regress the state.
 */
export function applyNftUpdated(
  queryClient: QueryClient,
  event: NftUpdatedEvent,
) {
  const { id } = event.resource
  const { priceEth, compareAtPriceEth, availability, editions } = event.data

  const patch = <T extends NftSummary>(item: T): T =>
    item.id !== id || item.version >= event.version
      ? item
      : {
          ...item,
          priceEth,
          compareAtPriceEth,
          availability,
          version: event.version,
        }

  queryClient.setQueriesData<NftListResponse>(
    { queryKey: catalogKeys.lists() },
    (data) => data && { ...data, items: data.items.map(patch) },
  )
  queryClient.setQueriesData<HighlightsResponse>(
    { queryKey: catalogKeys.highlights() },
    (data) =>
      data && {
        hero: data.hero.map(patch),
        featured: data.featured && patch(data.featured),
      },
  )
  queryClient.setQueriesData<RelatedResponse>(
    { queryKey: catalogKeys.relatedAll() },
    (data) => data && { items: data.items.map(patch) },
  )
  queryClient.setQueriesData<FavoritesResponse>(
    { predicate: (query) => favoritesKeys.isList(query.queryKey) },
    (data) =>
      data && {
        items: data.items.map((item) =>
          item.nftId === id ? { ...item, nft: patch(item.nft) } : item,
        ),
      },
  )
  queryClient.setQueryData<NftDetail>(catalogKeys.detail(id), (data) =>
    !data || data.version >= event.version
      ? data
      : { ...patch(data), editions },
  )

  // A new price may change which filtered pages the NFT belongs to: mark lists
  // stale so they refetch on the next mount or focus, without flicker now.
  void queryClient.invalidateQueries({
    queryKey: catalogKeys.lists(),
    refetchType: 'none',
  })
}
