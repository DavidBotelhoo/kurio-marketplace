import {
  CATEGORIES,
  type CategoryId,
  NETWORKS,
  type NetworkId,
  NFT_PAGE_SIZE,
  NFT_SORTS,
  NFT_TABS,
  type NftSort,
  type NftTab,
} from '@/contracts/catalog-taxonomy'
import { compareEth, isEthAmount, normalizeEth } from '@/lib/eth'

/**
 * Catalog state kept in the URL of "/" (survives refresh and history).
 * Defaults are omitted so URLs stay short: no tab = "all", no sort = "recent",
 * no page = 1.
 */
export interface CatalogSearch {
  q?: string
  categories?: CategoryId[]
  networks?: NetworkId[]
  minPrice?: string
  maxPrice?: string
  tab?: Exclude<NftTab, 'all'>
  sort?: Exclude<NftSort, 'recent'>
  page?: number
}

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((item) => item.id))
const NETWORK_IDS = new Set<string>(NETWORKS.map((item) => item.id))
const MAX_QUERY_LENGTH = 80

function asList(value: unknown) {
  if (Array.isArray(value))
    return value.filter((item) => typeof item === 'string')
  return typeof value === 'string' ? [value] : []
}

/** Known ids only, without duplicates, in a canonical order. */
function pickIds<T extends string>(
  value: unknown,
  allowed: Set<string>,
  order: readonly { id: T }[],
) {
  const selected = new Set(asList(value).filter((id) => allowed.has(id)))
  const ids = order.map((item) => item.id).filter((id) => selected.has(id))
  return ids.length ? ids : undefined
}

function asPrice(value: unknown) {
  const text =
    typeof value === 'string' || typeof value === 'number' ? String(value) : ''
  return isEthAmount(text) ? normalizeEth(text) : undefined
}

/** validateSearch of "/": tolerant of hand-edited URLs, drops invalid values. */
export function validateCatalogSearch(
  raw: Record<string, unknown>,
): CatalogSearch {
  const q =
    typeof raw.q === 'string' ? raw.q.trim().slice(0, MAX_QUERY_LENGTH) : ''
  let minPrice = asPrice(raw.minPrice)
  let maxPrice = asPrice(raw.maxPrice)
  if (minPrice && maxPrice && compareEth(minPrice, maxPrice) > 0) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }
  const tab = NFT_TABS.find(
    (item): item is Exclude<NftTab, 'all'> =>
      item !== 'all' && item === raw.tab,
  )
  const sort = NFT_SORTS.find(
    (item): item is Exclude<NftSort, 'recent'> =>
      item !== 'recent' && item === raw.sort,
  )
  const page = Number(raw.page)

  const search: CatalogSearch = {}
  if (q) search.q = q
  const categories = pickIds(raw.categories, CATEGORY_IDS, CATEGORIES)
  if (categories) search.categories = categories
  const networks = pickIds(raw.networks, NETWORK_IDS, NETWORKS)
  if (networks) search.networks = networks
  if (minPrice) search.minPrice = minPrice
  if (maxPrice) search.maxPrice = maxPrice
  if (tab) search.tab = tab
  if (sort) search.sort = sort
  if (Number.isInteger(page) && page > 1) search.page = page
  return search
}

/** Full API params (defaults included): the cache key of the list query. */
export function toListParams(search: CatalogSearch) {
  return {
    ...(search.q ? { q: search.q } : {}),
    ...(search.categories ? { categories: search.categories } : {}),
    ...(search.networks ? { networks: search.networks } : {}),
    ...(search.minPrice ? { minPrice: search.minPrice } : {}),
    ...(search.maxPrice ? { maxPrice: search.maxPrice } : {}),
    tab: search.tab ?? 'all',
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
    pageSize: NFT_PAGE_SIZE,
  } satisfies Record<string, unknown>
}

export type CatalogListParams = ReturnType<typeof toListParams>

/** Search after a filter change: pagination restarts. */
export function withFilters(
  current: CatalogSearch,
  changes: Partial<Omit<CatalogSearch, 'page'>>,
): CatalogSearch {
  const { page: _page, ...filters } = current
  const next: CatalogSearch = {}
  const entries: [string, unknown][] = Object.entries({
    ...filters,
    ...changes,
  })
  for (const [key, value] of entries) {
    if (value === undefined || (Array.isArray(value) && value.length === 0))
      continue
    Object.assign(next, { [key]: value })
  }
  return next
}

export function hasActiveFilters(search: CatalogSearch) {
  return Boolean(
    search.q ??
    search.categories ??
    search.networks ??
    search.minPrice ??
    search.maxPrice ??
    search.tab,
  )
}
