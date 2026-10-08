import * as z from 'zod/mini'

import {
  ethAmountSchema,
  imageSchema,
  isoDateTimeSchema,
  pageMetaSchema,
} from './common'

/* ---------------------------------------------------------------------------
 * Taxonomy
 * ------------------------------------------------------------------------- */

export const CATEGORIES = [
  { id: 'arte-digital', label: 'Arte digital' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'arte-3d', label: 'Arte 3D' },
  { id: 'colecionaveis', label: 'Colecionáveis' },
  { id: 'generativa', label: 'Generativa' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'utilidade', label: 'Utilidade' },
] as const

export const NETWORKS = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'solana', label: 'Solana' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']
export type NetworkId = (typeof NETWORKS)[number]['id']

const ids = <T extends readonly { id: string }[]>(items: T) =>
  items.map((item) => item.id) as [T[number]['id'], ...T[number]['id'][]]

export const categoryIdSchema = z.enum(ids(CATEGORIES))
export const networkIdSchema = z.enum(ids(NETWORKS))

/** Catalog tabs: "Todos os NFTs", "Novos lançamentos", "Em alta". */
export const NFT_TABS = ['all', 'new', 'trending'] as const
export const nftTabSchema = z.enum(NFT_TABS)
export type NftTab = z.infer<typeof nftTabSchema>

export const NFT_SORTS = [
  'recent',
  'price-asc',
  'price-desc',
  'popular',
] as const
export const nftSortSchema = z.enum(NFT_SORTS)
export type NftSort = z.infer<typeof nftSortSchema>

/* ---------------------------------------------------------------------------
 * NFTs
 * ------------------------------------------------------------------------- */

export const availabilitySchema = z.enum(['available', 'sold-out'])
export type Availability = z.infer<typeof availabilitySchema>

export const editionSchema = z.object({
  id: z.string(),
  /** "1/1", "1/10", "1/50" or "ABERTA". */
  label: z.string(),
  kind: z.enum(['limited', 'open']),
  /** Total supply; null for open editions. */
  supply: z.nullable(z.int()),
  /** Units left; null means unlimited (open edition). */
  available: z.nullable(z.int()),
  /** Largest quantity accepted in a single order. */
  maxPerOrder: z.int(),
  priceEth: ethAmountSchema,
  status: availabilitySchema,
})

export type Edition = z.infer<typeof editionSchema>

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Display token id, e.g. "#0042". */
  tokenId: z.string(),
  collection: z.object({ id: z.string(), name: z.string() }),
  category: categoryIdSchema,
  network: networkIdSchema,
  image: imageSchema,
  /** Price of the default edition. */
  priceEth: ethAmountSchema,
  /** Previous price, shown struck through when present. */
  compareAtPriceEth: z.nullable(ethAmountSchema),
  rarity: z.enum(['comum', 'raro', 'lendario']),
  availability: availabilitySchema,
  listedAt: isoDateTimeSchema,
  /**
   * Monotonic resource version. Realtime events carry the same number so the
   * client can drop stale or duplicated updates.
   */
  version: z.int(),
})

export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftDetailSchema = z.extend(nftSummarySchema, {
  description: z.string(),
  story: z.array(z.string()),
  attributes: z.array(z.string()),
  rating: z.object({ average: z.number(), count: z.int() }),
  gallery: z.array(imageSchema),
  editions: z.array(editionSchema),
  defaultEditionId: z.string(),
  creator: z.object({ name: z.string(), royaltyPercent: z.number() }),
  contract: z.object({
    address: z.string(),
    standard: z.string(),
    storage: z.string(),
  }),
})

export type NftDetail = z.infer<typeof nftDetailSchema>

/* ---------------------------------------------------------------------------
 * GET /nfts
 * ------------------------------------------------------------------------- */

const positiveInt = (min: number, max: number) =>
  z.coerce.number().check(z.multipleOf(1), z.gte(min), z.lte(max))

export const NFT_PAGE_SIZE = 9

/** Query parameters (arrays as repeated keys: ?categories=a&categories=b). */
export const nftListQuerySchema = z.object({
  q: z.optional(z.string().check(z.trim(), z.maxLength(80))),
  categories: z.optional(z.array(categoryIdSchema)),
  networks: z.optional(z.array(networkIdSchema)),
  minPrice: z.optional(ethAmountSchema),
  maxPrice: z.optional(ethAmountSchema),
  tab: z._default(nftTabSchema, 'all'),
  sort: z._default(nftSortSchema, 'recent'),
  page: z._default(positiveInt(1, 10_000), 1),
  pageSize: z._default(positiveInt(1, 48), NFT_PAGE_SIZE),
})

export type NftListQuery = z.input<typeof nftListQuerySchema>
export type NftListParams = z.output<typeof nftListQuerySchema>

export const facetCountSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Matches when this value is selected along with the other active filters. */
  count: z.int(),
})

export type FacetCount = z.infer<typeof facetCountSchema>

export const nftListResponseSchema = z.object({
  items: z.array(nftSummarySchema),
  meta: pageMetaSchema,
  facets: z.object({
    categories: z.array(facetCountSchema),
    networks: z.array(facetCountSchema),
    /** Bounds of the whole catalog, for the price slider. */
    priceRange: z.object({ minEth: ethAmountSchema, maxEth: ethAmountSchema }),
  }),
})

export type NftListResponse = z.infer<typeof nftListResponseSchema>

/* ---------------------------------------------------------------------------
 * GET /nfts/highlights · GET /nfts/:id/related
 * ------------------------------------------------------------------------- */

export const highlightsResponseSchema = z.object({
  /** Hero carousel. */
  hero: z.array(nftSummarySchema),
  /** "NFT em destaque · Oferta limitada"; null when the catalog is empty. */
  featured: z.nullable(nftSummarySchema),
})

export type HighlightsResponse = z.infer<typeof highlightsResponseSchema>

export const relatedResponseSchema = z.object({
  items: z.array(nftSummarySchema),
})

export type RelatedResponse = z.infer<typeof relatedResponseSchema>
