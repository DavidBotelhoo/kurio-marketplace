/*
 * Records persisted by the mock database. They model what a backend would
 * store (internal fields included); handlers map them to the public contracts.
 */

/** Bump whenever record shapes change; stale snapshots are reseeded. */
export const DB_VERSION = 1

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

export interface MockDatabase {
  /** Bumped whenever the record shapes change; older snapshots are reseeded. */
  version: number
  dataset: DatasetId
  seededAt: string
  users: UserRecord[]
}
