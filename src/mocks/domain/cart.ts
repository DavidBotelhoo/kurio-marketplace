import type {
  AvailabilityConflictDetails,
  CartItem,
  CartMergeResponse,
  CartResponse,
} from '@/contracts/cart'
import { addEth, multiplyEth } from '@/lib/eth'

import { db } from '../db/database'
import type {
  CartLineRecord,
  CartOwner,
  CartRecord,
  EditionRecord,
  MockDatabase,
  NftRecord,
} from '../db/schema'
import { toEdition, toNftSummary } from '../mappers/catalog'
import { cartLineId, maxQuantity } from './cart-rules'

/*
 * Cart rules of the mock API: every limit is checked here, against the same
 * catalog records that REST and realtime expose.
 */

export const userCart = (userId: string): CartOwner => `user:${userId}`
export const guestCart = (guestId: string): CartOwner => `guest:${guestId}`

export type CartFailure =
  | { kind: 'not-found'; message: string }
  | {
      kind: 'availability'
      message: string
      details: AvailabilityConflictDetails
    }

export class CartError extends Error {
  readonly failure: CartFailure

  constructor(failure: CartFailure) {
    super(failure.message)
    this.failure = failure
  }
}

function findEdition(
  nfts: readonly NftRecord[],
  nftId: string,
  editionId: string,
) {
  const nft = nfts.find((item) => item.id === nftId)
  const edition = nft?.editions.find((item) => item.id === editionId)
  return nft && edition ? { nft, edition } : null
}

function requireEdition(
  nfts: readonly NftRecord[],
  nftId: string,
  editionId: string,
) {
  const found = findEdition(nfts, nftId, editionId)
  if (!found) {
    throw new CartError({
      kind: 'not-found',
      message: 'NFT ou edição não encontrada.',
    })
  }
  return found
}

function assertQuantity(
  nft: NftRecord,
  edition: EditionRecord,
  quantity: number,
) {
  const max = maxQuantity(edition)
  if (quantity <= max) return
  throw new CartError({
    kind: 'availability',
    message:
      max === 0
        ? `A edição ${edition.label} de ${nft.name} está esgotada.`
        : `Você pode levar no máximo ${String(max)} ${max === 1 ? 'unidade' : 'unidades'} da edição ${edition.label} de ${nft.name}.`,
    details: {
      nftId: nft.id,
      editionId: edition.id,
      available: edition.available,
      maxPerOrder: edition.maxPerOrder,
      maxQuantity: max,
    },
  })
}

function toCartItem(
  line: CartLineRecord,
  nft: NftRecord,
  edition: EditionRecord,
): CartItem {
  const max = maxQuantity(edition)
  return {
    id: line.id,
    nft: toNftSummary(nft),
    edition: toEdition(edition),
    quantity: line.quantity,
    maxQuantity: max,
    unitPriceEth: edition.priceEth,
    previousUnitPriceEth: line.unitPriceEth,
    lineTotalEth: multiplyEth(edition.priceEth, line.quantity),
    issue:
      max === 0
        ? 'sold-out'
        : line.quantity > max
          ? 'quantity-unavailable'
          : null,
    addedAt: line.addedAt,
  }
}

/** Public view of a cart; lines whose NFT left the catalog are skipped. */
export function toCartResponse(
  cart: CartRecord | undefined,
  nfts: readonly NftRecord[],
): CartResponse {
  const items = (cart?.lines ?? []).flatMap((line) => {
    const found = findEdition(nfts, line.nftId, line.editionId)
    return found ? [toCartItem(line, found.nft, found.edition)] : []
  })
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalEth: addEth('0', ...items.map((item) => item.lineTotalEth)),
    updatedAt: cart?.updatedAt ?? null,
  }
}

export function readCart(owner: CartOwner) {
  const { carts, nfts } = db.read()
  return toCartResponse(
    carts.find((cart) => cart.owner === owner),
    nfts,
  )
}

function cartOf(draft: MockDatabase, owner: CartOwner, now: string) {
  let cart = draft.carts.find((item) => item.owner === owner)
  if (!cart) {
    cart = { owner, lines: [], updatedAt: now }
    draft.carts.push(cart)
  }
  return cart
}

/** Adds the edition to the cart or increments its line. */
export function addCartItem(
  owner: CartOwner,
  input: { nftId: string; editionId: string; quantity: number },
) {
  // Validate before writing: the database is mutated in place.
  const { carts, nfts } = db.read()
  const { nft, edition } = requireEdition(nfts, input.nftId, input.editionId)
  const id = cartLineId(nft.id, edition.id)
  const current = carts
    .find((cart) => cart.owner === owner)
    ?.lines.find((line) => line.id === id)
  const quantity = (current?.quantity ?? 0) + input.quantity
  assertQuantity(nft, edition, quantity)

  db.write((draft) => {
    const now = new Date().toISOString()
    const cart = cartOf(draft, owner, now)
    const line = cart.lines.find((item) => item.id === id)
    if (line) {
      Object.assign(line, {
        quantity,
        unitPriceEth: edition.priceEth,
        updatedAt: now,
      })
    } else {
      cart.lines.push({
        id,
        nftId: nft.id,
        editionId: edition.id,
        quantity,
        unitPriceEth: edition.priceEth,
        addedAt: now,
        updatedAt: now,
      })
    }
    cart.updatedAt = now
  })
  return readCart(owner)
}

export function updateCartItem(
  owner: CartOwner,
  itemId: string,
  quantity: number,
) {
  const { carts, nfts } = db.read()
  const existing = carts
    .find((cart) => cart.owner === owner)
    ?.lines.find((line) => line.id === itemId)
  if (!existing) {
    throw new CartError({
      kind: 'not-found',
      message: 'Item não encontrado no carrinho.',
    })
  }
  const { nft, edition } = requireEdition(
    nfts,
    existing.nftId,
    existing.editionId,
  )
  assertQuantity(nft, edition, quantity)

  db.write((draft) => {
    const cart = draft.carts.find((item) => item.owner === owner)
    const line = cart?.lines.find((item) => item.id === itemId)
    if (!cart || !line) return
    const now = new Date().toISOString()
    Object.assign(line, {
      quantity,
      unitPriceEth: edition.priceEth,
      updatedAt: now,
    })
    cart.updatedAt = now
  })
  return readCart(owner)
}

export function removeCartItem(owner: CartOwner, itemId: string) {
  db.write((draft) => {
    const cart = draft.carts.find((item) => item.owner === owner)
    if (!cart?.lines.some((line) => line.id === itemId)) return
    cart.lines = cart.lines.filter((line) => line.id !== itemId)
    cart.updatedAt = new Date().toISOString()
  })
  return readCart(owner)
}

/**
 * Moves a visitor's lines into the collector's cart. Quantities of the same
 * edition are combined up to what it allows now; lines that cannot be
 * bought (sold out) are kept so the collector sees and removes them.
 */
export function mergeGuestCart(
  userId: string,
  guestId: string,
): CartMergeResponse {
  const owner = userCart(userId)
  const result = db.write((draft) => {
    const guest = draft.carts.find((item) => item.owner === guestCart(guestId))
    if (!guest || guest.lines.length === 0) {
      draft.carts = draft.carts.filter((item) => item !== guest)
      return { mergedLines: 0, adjustments: [] }
    }
    const now = new Date().toISOString()
    const cart = cartOf(draft, owner, now)
    const adjustments: CartMergeResponse['adjustments'] = []
    for (const guestLine of guest.lines) {
      const found = findEdition(
        draft.nfts,
        guestLine.nftId,
        guestLine.editionId,
      )
      if (!found) continue
      const line = cart.lines.find((item) => item.id === guestLine.id)
      const requested = (line?.quantity ?? 0) + guestLine.quantity
      const max = maxQuantity(found.edition)
      const quantity = max === 0 ? requested : Math.min(requested, max)
      if (quantity !== requested) {
        adjustments.push({ itemId: guestLine.id, requested, quantity })
      }
      if (line) {
        Object.assign(line, {
          quantity,
          unitPriceEth: found.edition.priceEth,
          updatedAt: now,
        })
      } else {
        cart.lines.push({ ...guestLine, quantity, updatedAt: now })
      }
    }
    cart.updatedAt = now
    const mergedLines = guest.lines.length
    draft.carts = draft.carts.filter((item) => item !== guest)
    return { mergedLines, adjustments }
  })
  return { cart: readCart(owner), ...result }
}
