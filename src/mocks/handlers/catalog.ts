import { HttpResponse } from 'msw'

import {
  CATEGORIES,
  type HighlightsResponse,
  NETWORKS,
  type NftListParams,
  nftListQuerySchema,
  type NftListResponse,
  type RelatedResponse,
} from '@/contracts/catalog'
import { compareEth, formatEth, parseEth } from '@/lib/eth'

import { db } from '../db/database'
import type { NftRecord } from '../db/schema'
import { HIGHLIGHTS } from '../fixtures/catalog'
import { route } from '../http'
import { displayPrice, toNftDetail, toNftSummary } from '../mappers/catalog'
import { apiError } from '../responses'
import { fieldErrors } from '../validation'

const RELATED_LIMIT = 10

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Reads repeated keys as arrays and single keys as strings. */
function readQuery(url: URL) {
  const { searchParams } = url
  const get = (key: string) => searchParams.get(key) ?? undefined
  const all = (key: string) => {
    const values = searchParams.getAll(key)
    return values.length ? values : undefined
  }
  return {
    q: get('q'),
    categories: all('categories'),
    networks: all('networks'),
    minPrice: get('minPrice'),
    maxPrice: get('maxPrice'),
    tab: get('tab'),
    sort: get('sort'),
    page: get('page'),
    pageSize: get('pageSize'),
  }
}

type Filter = 'text' | 'tab' | 'price' | 'categories' | 'networks'

function matches(record: NftRecord, params: NftListParams, skip?: Filter) {
  if (skip !== 'text' && params.q) {
    const query = normalize(params.q)
    const haystack = normalize(
      `${record.name} ${record.tokenId} ${record.collectionId.replace(/-/g, ' ')}`,
    )
    if (!haystack.includes(query)) return false
  }
  if (skip !== 'tab') {
    if (params.tab === 'new' && !record.isNew) return false
    if (params.tab === 'trending' && !record.isTrending) return false
  }
  if (skip !== 'price') {
    const price = displayPrice(record)
    if (params.minPrice && compareEth(price, params.minPrice) < 0) return false
    if (params.maxPrice && compareEth(price, params.maxPrice) > 0) return false
  }
  if (skip !== 'categories' && params.categories?.length) {
    if (!params.categories.includes(record.category)) return false
  }
  if (skip !== 'networks' && params.networks?.length) {
    if (!params.networks.includes(record.network)) return false
  }
  return true
}

const SORTERS: Record<
  NftListParams['sort'],
  (a: NftRecord, b: NftRecord) => number
> = {
  recent: (a, b) =>
    b.listedAt.localeCompare(a.listedAt) || a.id.localeCompare(b.id),
  'price-asc': (a, b) =>
    compareEth(displayPrice(a), displayPrice(b)) || a.id.localeCompare(b.id),
  'price-desc': (a, b) =>
    compareEth(displayPrice(b), displayPrice(a)) || a.id.localeCompare(b.id),
  popular: (a, b) => b.popularity - a.popularity || a.id.localeCompare(b.id),
}

function priceRange(records: NftRecord[]) {
  if (records.length === 0) return { minEth: '0', maxEth: '0' }
  const units = records.map((record) => parseEth(displayPrice(record)))
  const min = units.reduce((a, b) => (b < a ? b : a))
  const max = units.reduce((a, b) => (b > a ? b : a))
  return { minEth: formatEth(min), maxEth: formatEth(max) }
}

export const catalogHandlers = [
  route(
    'get',
    '/nfts',
    { operation: 'nfts.list', label: 'Catálogo (listagem)' },
    ({ request }) => {
      const parsed = nftListQuerySchema.safeParse(
        readQuery(new URL(request.url)),
      )
      if (!parsed.success) {
        return apiError(400, 'VALIDATION_ERROR', {
          fields: fieldErrors(parsed.error.issues),
        })
      }
      const params = parsed.data
      if (
        params.minPrice &&
        params.maxPrice &&
        compareEth(params.minPrice, params.maxPrice) > 0
      ) {
        return apiError(400, 'VALIDATION_ERROR', {
          fields: { maxPrice: 'O preço máximo deve ser maior que o mínimo.' },
        })
      }

      const all = db.read().nfts
      const filtered = all.filter((record) => matches(record, params))
      const sorted = [...filtered].sort(SORTERS[params.sort])
      const totalPages = Math.ceil(sorted.length / params.pageSize)
      const start = (params.page - 1) * params.pageSize

      const countBy = <K extends 'category' | 'network'>(
        key: K,
        skip: Filter,
        options: readonly { id: NftRecord[K]; label: string }[],
      ) => {
        const pool = all.filter((record) => matches(record, params, skip))
        return options.map(({ id, label }) => ({
          id,
          label,
          count: pool.filter((record) => record[key] === id).length,
        }))
      }

      const body: NftListResponse = {
        items: sorted.slice(start, start + params.pageSize).map(toNftSummary),
        meta: {
          page: params.page,
          pageSize: params.pageSize,
          totalItems: sorted.length,
          totalPages,
        },
        facets: {
          categories: countBy('category', 'categories', CATEGORIES),
          networks: countBy('network', 'networks', NETWORKS),
          priceRange: priceRange(all),
        },
      }
      return HttpResponse.json(body)
    },
  ),

  // Declared before /nfts/:nftId so "highlights" is not read as an id.
  route(
    'get',
    '/nfts/highlights',
    { operation: 'nfts.highlights', label: 'Catálogo (destaques)' },
    () => {
      const { nfts } = db.read()
      const hero = HIGHLIGHTS.hero.flatMap((id) => {
        const record = nfts.find((nft) => nft.id === id)
        return record ? [toNftSummary(record)] : []
      })
      const featured = nfts.find((nft) =>
        nft.name.startsWith(HIGHLIGHTS.featuredName),
      )
      const body: HighlightsResponse = {
        hero,
        featured: featured ? toNftSummary(featured) : null,
      }
      return HttpResponse.json(body)
    },
  ),

  route<{ nftId: string }>(
    'get',
    '/nfts/:nftId',
    { operation: 'nfts.get', label: 'NFT (detalhe)' },
    ({ params }) => {
      const record = db.read().nfts.find((nft) => nft.id === params.nftId)
      if (!record) {
        return apiError(404, 'NOT_FOUND', { message: 'NFT não encontrado.' })
      }
      return HttpResponse.json(toNftDetail(record))
    },
  ),

  route<{ nftId: string }>(
    'get',
    '/nfts/:nftId/related',
    { operation: 'nfts.related', label: 'NFT (relacionados)' },
    ({ params }) => {
      const { nfts } = db.read()
      const record = nfts.find((nft) => nft.id === params.nftId)
      if (!record) {
        return apiError(404, 'NOT_FOUND', { message: 'NFT não encontrado.' })
      }
      const others = nfts.filter((nft) => nft.id !== record.id)
      const sameCollection = others.filter(
        (nft) => nft.collectionId === record.collectionId,
      )
      const sameCategory = others.filter(
        (nft) =>
          nft.collectionId !== record.collectionId &&
          nft.category === record.category,
      )
      const body: RelatedResponse = {
        items: [...sameCollection, ...sameCategory]
          .slice(0, RELATED_LIMIT)
          .map(toNftSummary),
      }
      return HttpResponse.json(body)
    },
  ),
]
