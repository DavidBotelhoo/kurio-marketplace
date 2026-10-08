import type { NetworkId } from '@/contracts/catalog'
import type {
  CreateOrderRequest,
  Order,
  QuoteOutdatedDetails,
} from '@/contracts/orders'
import type { OrderUpdatedEvent } from '@/contracts/realtime'
import { topics } from '@/contracts/realtime-topics'
import { multiplyEth, normalizeEth } from '@/lib/eth'

import { getMockConfig } from '../config'
import { db } from '../db/database'
import type { MockDatabase, OrderRecord, QuoteRecord } from '../db/schema'
import { artworkImage } from '../mappers/catalog'
import { publish, setTopicGuard } from '../realtime/server'
import { priceCart, quoteCart, userCart } from './cart'
import { sellEditionUnits } from './catalog'
import { findConnection } from './wallets'

const EXPLORERS: Record<NetworkId, { name: string; txUrl: string }> = {
  ethereum: { name: 'Etherscan', txUrl: 'https://etherscan.io/tx/' },
  polygon: { name: 'Polygonscan', txUrl: 'https://polygonscan.com/tx/' },
  solana: { name: 'Solscan', txUrl: 'https://solscan.io/tx/' },
}

const ORDER_LOCK = 'kurio.mocks.orders'
const SCHEDULER_INTERVAL_MS = 500

type OrderFailure =
  | { kind: 'idempotency-conflict' }
  | { kind: 'wallet-disconnected'; message: string }
  | { kind: 'quote-used'; orderId: string }
  | { kind: 'quote-outdated'; details: QuoteOutdatedDetails }

export class OrderError extends Error {
  readonly failure: OrderFailure

  constructor(failure: OrderFailure, message = failure.kind) {
    super(message)
    this.failure = failure
  }
}

const eth = (value: string) => `${normalizeEth(value, 2)} ETH`

/** JSON with sorted keys: equal bodies give equal fingerprints. */
function fingerprint(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(fingerprint).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${fingerprint(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function toOrderDto(record: OrderRecord): Order {
  const {
    userId: _userId,
    quoteId: _quoteId,
    connectionId: _connectionId,
    idempotencyKey: _idempotencyKey,
    requestHash: _requestHash,
    outcome: _outcome,
    settlesAt: _settlesAt,
    ...order
  } = record
  return order
}

function lineName(data: MockDatabase, nftId: string, editionId: string) {
  const nft = data.nfts.find((item) => item.id === nftId)
  const edition = nft?.editions.find((item) => item.id === editionId)
  return `${nft?.name ?? nftId} (edição ${edition?.label ?? editionId})`
}

/** What changed between the quote the collector saw and the cart now. */
function describeChanges(
  data: MockDatabase,
  previous: QuoteRecord,
  next: ReturnType<typeof priceCart>['record'],
) {
  const changes: string[] = []
  for (const line of previous.lines) {
    const name = lineName(data, line.nftId, line.editionId)
    const current = next.lines.find((item) => item.itemId === line.itemId)
    if (!current) changes.push(`${name} saiu do carrinho.`)
    else if (current.unitPriceEth !== line.unitPriceEth) {
      changes.push(
        `O preço de ${name} mudou de ${eth(line.unitPriceEth)} para ${eth(current.unitPriceEth)}.`,
      )
    } else if (current.quantity !== line.quantity) {
      changes.push(
        `A quantidade de ${name} mudou de ${String(line.quantity)} para ${String(current.quantity)}.`,
      )
    }
  }
  for (const line of next.lines) {
    if (!previous.lines.some((item) => item.itemId === line.itemId)) {
      changes.push(
        `${lineName(data, line.nftId, line.editionId)} entrou no carrinho.`,
      )
    }
  }
  if (previous.couponCode !== next.couponCode) {
    changes.push(
      previous.couponCode
        ? `O cupom ${previous.couponCode} não está mais sendo aplicado.`
        : `O cupom ${next.couponCode ?? ''} passou a ser aplicado.`,
    )
  }
  if (previous.networkFeeEth !== next.networkFeeEth) {
    changes.push(
      `A taxa de rede mudou de ${eth(previous.networkFeeEth)} para ${eth(next.networkFeeEth)}.`,
    )
  }
  if (changes.length && previous.totalEth !== next.totalEth) {
    changes.push(
      `O total passou de ${eth(previous.totalEth)} para ${eth(next.totalEth)}.`,
    )
  }
  return changes
}

/**
 * Creates an order from a quote, idempotently: the same key and body return
 * the order already created; the same key with another body is a conflict.
 * The quote must still match the cart (prices, availability, coupon, fees).
 */
export function createOrder(
  userId: string,
  idempotencyKey: string,
  input: CreateOrderRequest,
): { order: Order; replayed: boolean } {
  const data = db.read()
  const requestHash = fingerprint(input)
  const existing = data.orders.find(
    (order) =>
      order.userId === userId && order.idempotencyKey === idempotencyKey,
  )
  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new OrderError({ kind: 'idempotency-conflict' })
    }
    return { order: toOrderDto(existing), replayed: true }
  }

  const connection = findConnection(userId, input.connectionId)
  if (!connection) {
    throw new OrderError({
      kind: 'wallet-disconnected',
      message:
        'Sua carteira foi desconectada. Conecte novamente para continuar.',
    })
  }
  if (
    connection.address.toLowerCase() !== input.wallet.address.toLowerCase() ||
    connection.network !== input.wallet.network ||
    connection.provider !== input.wallet.provider
  ) {
    throw new OrderError({
      kind: 'wallet-disconnected',
      message:
        'A carteira conectada não corresponde ao endereço, à rede ou ao tipo informados. Conecte novamente.',
    })
  }

  const owner = userCart(userId)
  const quote = data.quotes.find(
    (item) => item.id === input.quoteId && item.owner === owner,
  )
  if (quote?.orderId) {
    throw new OrderError({ kind: 'quote-used', orderId: quote.orderId })
  }
  const now = Date.now()
  const priced = priceCart(owner)
  let changes = quote ? describeChanges(data, quote, priced.record) : []
  if (!priced.response.purchasable) {
    changes = [
      ...changes,
      ...priced.response.issues.map((issue) => issue.message),
    ]
  }
  if (!quote || Date.parse(quote.expiresAt) <= now || changes.length) {
    if (changes.length === 0) {
      changes = [
        'A cotação expirou. Confira os valores atualizados antes de confirmar.',
      ]
    }
    throw new OrderError({
      kind: 'quote-outdated',
      details: { quote: quoteCart(owner), changes },
    })
  }

  const created = new Date(now).toISOString()
  const config = getMockConfig()
  const coupon = data.coupons.find((item) => item.code === quote.couponCode)
  const record: OrderRecord = {
    id: `ord_${crypto.randomUUID()}`,
    version: 1,
    status: 'pending',
    createdAt: created,
    updatedAt: created,
    settledAt: null,
    items: quote.lines.map((line) => {
      const nft = data.nfts.find((item) => item.id === line.nftId)
      const edition = nft?.editions.find((item) => item.id === line.editionId)
      if (!nft || !edition) throw new Error(`Unknown line ${line.itemId}`)
      return {
        itemId: line.itemId,
        nftId: nft.id,
        editionId: edition.id,
        name: nft.name,
        tokenId: nft.tokenId,
        editionLabel: edition.label,
        image: artworkImage(nft.artwork),
        quantity: line.quantity,
        unitPriceEth: line.unitPriceEth,
        lineTotalEth: multiplyEth(line.unitPriceEth, line.quantity),
      }
    }),
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    coupon: coupon ? { code: coupon.code, label: coupon.label } : null,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    wallet: {
      nickname:
        data.wallets.find((wallet) => wallet.id === input.wallet.walletId)
          ?.nickname ?? null,
      provider: input.wallet.provider,
      network: input.wallet.network,
      address: input.wallet.address,
      secondaryAddress: input.wallet.secondaryAddress || null,
    },
    collector: input.collector,
    note: input.note,
    transaction: null,
    failure: null,
    userId,
    quoteId: quote.id,
    connectionId: connection.id,
    idempotencyKey,
    requestHash,
    outcome: config.paymentOutcome,
    settlesAt: new Date(now + config.settlementSeconds * 1000).toISOString(),
  }
  db.write((draft) => {
    draft.orders.push(record)
    const stored = draft.quotes.find((item) => item.id === quote.id)
    if (stored) stored.orderId = record.id
  })
  return { order: toOrderDto(record), replayed: false }
}

/** The collector's orders, most recent first. */
export function listOrders(userId: string) {
  return db
    .read()
    .orders.filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toOrderDto)
}

export function getOrder(userId: string, orderId: string) {
  const record = db
    .read()
    .orders.find((order) => order.id === orderId && order.userId === userId)
  return record ? toOrderDto(record) : null
}

/* ---------------------------------------------------------------------------
 * Settlement
 * ------------------------------------------------------------------------- */

function randomHash() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

function publishOrder(record: OrderRecord) {
  const event: OrderUpdatedEvent = {
    id: crypto.randomUUID(),
    type: 'order.updated',
    resource: { type: 'order', id: record.id },
    version: record.version,
    occurredAt: record.updatedAt,
    data: toOrderDto(record),
  }
  publish(topics.order(record.id), event)
}

/** Removes from the cart only what the order bought (and its coupon). */
function removePurchased(draft: MockDatabase, order: OrderRecord) {
  const cart = draft.carts.find((item) => item.owner === userCart(order.userId))
  if (!cart) return
  for (const item of order.items) {
    const line = cart.lines.find((entry) => entry.id === item.itemId)
    if (line) line.quantity -= item.quantity
  }
  cart.lines = cart.lines.filter((line) => line.quantity > 0)
  if (order.coupon?.code === cart.couponCode) {
    cart.couponCode = null
  }
  cart.updatedAt = new Date().toISOString()
}

/** Confirms or rejects one pending order (terminal) and publishes it. */
function settle(orderId: string) {
  const data = db.read()
  const order = data.orders.find((item) => item.id === orderId)
  if (order?.status !== 'pending') return

  let next: Pick<Order, 'status' | 'transaction' | 'failure'>
  const short = order.items.find((item) => {
    const edition = data.nfts
      .find((nft) => nft.id === item.nftId)
      ?.editions.find((entry) => entry.id === item.editionId)
    return (
      !edition ||
      (edition.available !== null && edition.available < item.quantity)
    )
  })
  if (order.outcome === 'decline') {
    next = {
      status: 'rejected',
      transaction: null,
      failure: {
        code: 'payment-declined',
        message:
          'O pagamento foi recusado pela carteira. Nenhum valor foi cobrado.',
      },
    }
  } else if (short) {
    next = {
      status: 'rejected',
      transaction: null,
      failure: {
        code: 'insufficient-stock',
        message: `A edição ${short.editionLabel} de ${short.name} esgotou antes da confirmação. Nenhum valor foi cobrado.`,
      },
    }
  } else {
    const hash = randomHash()
    const explorer = EXPLORERS[order.wallet.network]
    next = {
      status: 'confirmed',
      failure: null,
      transaction: {
        hash,
        explorerName: explorer.name,
        explorerUrl: `${explorer.txUrl}${hash}`,
      },
    }
  }

  const settled = db.write((draft) => {
    const target = draft.orders.find((item) => item.id === orderId)
    if (target?.status !== 'pending') return null
    const now = new Date().toISOString()
    Object.assign(target, next, {
      settledAt: now,
      updatedAt: now,
      version: target.version + 1,
    })
    if (next.status === 'confirmed') removePurchased(draft, target)
    return structuredClone(target)
  })
  if (!settled) return
  if (settled.status === 'confirmed') {
    for (const item of settled.items) {
      sellEditionUnits(item.nftId, item.editionId, item.quantity)
    }
  }
  publishOrder(settled)
}

let settling = false

/**
 * Settles every pending order whose time has come. Runs under a Web Lock and
 * re-reads the persisted snapshot, so two open tabs never settle twice.
 */
export async function settleDueOrders({ force = false } = {}) {
  if (settling) return
  settling = true
  const run = () => {
    db.refresh()
    const now = Date.now()
    const due = db
      .read()
      .orders.filter(
        (order) =>
          order.status === 'pending' &&
          (force || Date.parse(order.settlesAt) <= now),
      )
    for (const order of due) settle(order.id)
  }
  try {
    if ('locks' in navigator) await navigator.locks.request(ORDER_LOCK, run)
    else run()
  } finally {
    settling = false
  }
}

/** Background settlement while the app (and its mock API) is open. */
export function startOrderScheduler() {
  setInterval(() => {
    void settleDueOrders()
  }, SCHEDULER_INTERVAL_MS)
}

// Private topics: an order's events reach only its owner's connections.
setTopicGuard((token, topic) => {
  if (!topic.startsWith('order:')) return true
  const orderId = topic.slice('order:'.length)
  const data = db.read()
  const session = data.sessions.find(
    (item) =>
      item.token === token &&
      !item.revokedAt &&
      Date.parse(item.expiresAt) > Date.now(),
  )
  const order = data.orders.find((item) => item.id === orderId)
  return Boolean(session && order?.userId === session.userId)
})
