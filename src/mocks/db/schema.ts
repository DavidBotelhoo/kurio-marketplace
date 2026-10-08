import type { CategoryId, NetworkId } from '@/contracts/catalog'

/*
 * Records persisted by the mock database. They model what a backend would
 * store (internal fields included); handlers map them to the public contracts.
 */

/** Bump whenever record shapes change; stale snapshots are reseeded. */
export const DB_VERSION = 5

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

export interface MockDatabase {
  /** Bumped whenever the record shapes change; older snapshots are reseeded. */
  version: number
  dataset: DatasetId
  seededAt: string
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: FavoriteRecord[]
}
