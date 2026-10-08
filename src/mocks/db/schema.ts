import type { CategoryId, NetworkId } from '@/contracts/catalog'

/*
 * Records persisted by the mock database. They model what a backend would
 * store (internal fields included); handlers map them to the public contracts.
 */

/** Bump whenever record shapes change; stale snapshots are reseeded. */
export const DB_VERSION = 7

/**
 * Seed variants: "default" is the full catalog; "empty-catalog" keeps users
 * and removes every NFT (empty results).
 */
export const DATASET_IDS = ['default', 'empty-catalog'] as const
export type DatasetId = (typeof DATASET_IDS)[number]

export interface UserRecord {
  id: string
  email: string
  username: string
  displayName: string
  ensName: string | null
  walletNickname: string | null
  avatarUrl: string | null
  /** PBKDF2 hash (see mocks/crypto.ts); plain passwords are never stored. */
  passwordHash: string
  createdAt: string
  updatedAt: string
}

export type { ArtworkId } from '@/lib/artwork-image'
import type { ArtworkId } from '@/lib/artwork-image'

export interface EditionRecord {
  id: string
  label: string
  kind: 'limited' | 'open'
  supply: number | null
  /** Units left; null for open editions (unlimited). */
  available: number | null
  maxPerOrder: number
  priceEth: string
}

export interface NftRecord {
  id: string
  name: string
  tokenId: string
  artwork: ArtworkId
  collectionId: string
  category: CategoryId
  network: NetworkId
  compareAtPriceEth: string | null
  rarity: 'comum' | 'raro' | 'lendario'
  isNew: boolean
  isTrending: boolean
  popularity: number
  listedAt: string
  rating: { average: number; count: number }
  attributes: string[]
  contractAddress: string
  editions: EditionRecord[]
  defaultEditionId: string
  /** Incremented on every change to price or availability. */
  version: number
  updatedAt: string
}

export interface SessionRecord {
  /** Opaque bearer token. */
  token: string
  userId: string
  createdAt: string
  expiresAt: string
  /** Set by logout; revoked tokens answer 401 UNAUTHENTICATED. */
  revokedAt: string | null
}

export interface FavoriteRecord {
  userId: string
  nftId: string
  createdAt: string
}

export interface CartLineRecord {
  /** Stable per cart: one line per NFT edition. */
  id: string
  nftId: string
  editionId: string
  quantity: number
  /** Edition price when the shopper last changed the line. */
  unitPriceEth: string
  addedAt: string
  updatedAt: string
}

/** "user:<userId>" for collectors, "guest:<id>" for visitors. */
export type CartOwner = `user:${string}` | `guest:${string}`

export interface CartRecord {
  owner: CartOwner
  lines: CartLineRecord[]
  /** Applied coupon; re-validated by every quote. */
  couponCode: string | null
  updatedAt: string
}

export interface CouponRecord {
  code: string
  /** Summary row label. */
  label: string
  /** Percentage in basis points (1000 = 10%) or a fixed ETH amount. */
  discount:
    { kind: 'percent'; basisPoints: number } | { kind: 'amount'; eth: string }
  expiresAt: string
}

/** Priced snapshot of a cart; orders must reference a fresh one. */
export interface QuoteRecord {
  id: string
  owner: CartOwner
  createdAt: string
  expiresAt: string
  lines: {
    itemId: string
    nftId: string
    editionId: string
    quantity: number
    unitPriceEth: string
  }[]
  couponCode: string | null
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

export interface MockDatabase {
  /** Bumped whenever the record shapes change; older snapshots are reseeded. */
  version: number
  dataset: DatasetId
  seededAt: string
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: FavoriteRecord[]
  carts: CartRecord[]
  coupons: CouponRecord[]
  quotes: QuoteRecord[]
}
