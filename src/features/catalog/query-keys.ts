import type { NftListParams } from '@/contracts/catalog'

/** Query key factory for catalog data (shared by queries and realtime). */
export const catalogKeys = {
  all: ['nfts'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (params: NftListParams) => [...catalogKeys.lists(), params] as const,
  highlights: () => [...catalogKeys.all, 'highlights'] as const,
  details: () => [...catalogKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...catalogKeys.details(), nftId] as const,
  relatedAll: () => [...catalogKeys.all, 'related'] as const,
  related: (nftId: string) => [...catalogKeys.relatedAll(), nftId] as const,
}
