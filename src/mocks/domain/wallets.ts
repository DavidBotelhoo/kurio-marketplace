import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  Wallet,
  WalletConnection,
} from '@/contracts/wallets'

import { getMockConfig } from '../config'
import { db } from '../db/database'
import type { WalletConnectionRecord, WalletRecord } from '../db/schema'

/** A connection stays valid for 30 minutes (a checkout's length). */
const CONNECTION_TTL_MS = 30 * 60_000

export class WalletError extends Error {
  readonly kind: 'not-found' | 'slot-taken' | 'rejected'

  constructor(kind: WalletError['kind'], message: string) {
    super(message)
    this.kind = kind
  }
}

export function toWalletDto(record: WalletRecord): Wallet {
  const { userId: _userId, ...wallet } = record
  return wallet
}

export function listWallets(userId: string) {
  return db
    .read()
    .wallets.filter((wallet) => wallet.userId === userId)
    .sort((a, b) => (a.slot === b.slot ? 0 : a.slot === 'primary' ? -1 : 1))
    .map(toWalletDto)
}

type ParsedFields = Omit<CreateWalletRequest, 'slot'>

function normalize(fields: ParsedFields | UpdateWalletRequest) {
  return {
    ...fields,
    secondaryAddress: fields.secondaryAddress ? fields.secondaryAddress : null,
  }
}

export function createWallet(userId: string, input: CreateWalletRequest) {
  const taken = db
    .read()
    .wallets.some(
      (wallet) => wallet.userId === userId && wallet.slot === input.slot,
    )
  if (taken) {
    throw new WalletError(
      'slot-taken',
      input.slot === 'primary'
        ? 'Você já tem uma carteira principal.'
        : 'Você já tem uma carteira secundária.',
    )
  }
  const now = new Date().toISOString()
  const { slot, ...fields } = input
  const record: WalletRecord = {
    id: `wal_${crypto.randomUUID()}`,
    userId,
    slot,
    ...normalize(fields),
    createdAt: now,
    updatedAt: now,
  }
  db.write((draft) => {
    draft.wallets.push(record)
  })
  return toWalletDto(record)
}

export function updateWallet(
  userId: string,
  walletId: string,
  input: UpdateWalletRequest,
) {
  const exists = db
    .read()
    .wallets.some(
      (wallet) => wallet.id === walletId && wallet.userId === userId,
    )
  if (!exists) throw new WalletError('not-found', 'Carteira não encontrada.')
  return db.write((draft) => {
    const wallet = draft.wallets.find((item) => item.id === walletId)
    if (!wallet) throw new WalletError('not-found', 'Carteira não encontrada.')
    Object.assign(wallet, normalize(input), {
      updatedAt: new Date().toISOString(),
    })
    return toWalletDto(wallet)
  })
}

/* ---------------------------------------------------------------------------
 * Connections (simulated wallet extension)
 * ------------------------------------------------------------------------- */

function toConnectionDto(record: WalletConnectionRecord): WalletConnection {
  const { userId: _userId, revokedAt: _revokedAt, ...connection } = record
  return connection
}

function isLive(record: WalletConnectionRecord, now = Date.now()) {
  return !record.revokedAt && Date.parse(record.expiresAt) > now
}

/** The extension prompt: approved or refused according to the scenario. */
export function connectWallet(
  userId: string,
  input: Omit<WalletConnection, 'id' | 'connectedAt' | 'expiresAt'>,
) {
  if (input.walletId) {
    const owned = db
      .read()
      .wallets.some(
        (wallet) => wallet.id === input.walletId && wallet.userId === userId,
      )
    if (!owned) throw new WalletError('not-found', 'Carteira não encontrada.')
  }
  if (getMockConfig().walletApproval === 'reject') {
    throw new WalletError(
      'rejected',
      'A conexão foi recusada na carteira. Aprove o pedido na extensão ou escolha outra carteira.',
    )
  }
  const now = Date.now()
  const record: WalletConnectionRecord = {
    id: `wcn_${crypto.randomUUID()}`,
    userId,
    ...input,
    connectedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + CONNECTION_TTL_MS).toISOString(),
    revokedAt: null,
  }
  db.write((draft) => {
    draft.walletConnections = draft.walletConnections.filter((item) =>
      isLive(item, now),
    )
    draft.walletConnections.push(record)
  })
  return toConnectionDto(record)
}

/** Live connection of the collector, or null (disconnected or expired). */
export function findConnection(userId: string, connectionId: string) {
  const record = db
    .read()
    .walletConnections.find(
      (item) => item.id === connectionId && item.userId === userId,
    )
  return record && isLive(record) ? record : null
}

export function getConnection(userId: string, connectionId: string) {
  const record = findConnection(userId, connectionId)
  return record ? toConnectionDto(record) : null
}

export function disconnectWallet(userId: string, connectionId: string) {
  db.write((draft) => {
    const record = draft.walletConnections.find(
      (item) => item.id === connectionId && item.userId === userId,
    )
    if (record && !record.revokedAt) record.revokedAt = new Date().toISOString()
  })
}

/** Drops every live connection (panel and tests: "wallet disconnected"). */
export function disconnectAllWallets() {
  const now = new Date().toISOString()
  db.write((draft) => {
    for (const record of draft.walletConnections) record.revokedAt ??= now
  })
}
