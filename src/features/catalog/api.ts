import {
  type HighlightsResponse,
  highlightsResponseSchema,
  type NftDetail,
  nftDetailSchema,
  type NftListResponse,
  nftListResponseSchema,
  type RelatedResponse,
  relatedResponseSchema,
} from '@/contracts/catalog'
import { api } from '@/lib/api/client'
import { parseResponse } from '@/lib/api/parse'

import type { CatalogListParams } from './search'

export async function fetchNftList(
  params: CatalogListParams,
  signal?: AbortSignal,
): Promise<NftListResponse> {
  const { data } = await api.get<unknown>('/nfts', { params, signal })
  return parseResponse(nftListResponseSchema, data)
}

export async function fetchHighlights(
  signal?: AbortSignal,
): Promise<HighlightsResponse> {
  const { data } = await api.get<unknown>('/nfts/highlights', { signal })
  return parseResponse(highlightsResponseSchema, data)
}

export async function fetchNft(
  nftId: string,
  signal?: AbortSignal,
): Promise<NftDetail> {
  const { data } = await api.get<unknown>(
    `/nfts/${encodeURIComponent(nftId)}`,
    {
      signal,
    },
  )
  return parseResponse(nftDetailSchema, data)
}

export async function fetchRelated(
  nftId: string,
  signal?: AbortSignal,
): Promise<RelatedResponse> {
  const { data } = await api.get<unknown>(
    `/nfts/${encodeURIComponent(nftId)}/related`,
    { signal },
  )
  return parseResponse(relatedResponseSchema, data)
}
