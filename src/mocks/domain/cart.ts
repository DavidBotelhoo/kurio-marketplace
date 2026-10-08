import {
  type AppliedCoupon,
  type AvailabilityConflictDetails,
  type CartItem,
  type CartMergeResponse,
  type CartResponse,
  QUOTE_TTL_SECONDS,
  type QuoteIssue,
  type QuoteResponse,
} from '@/contracts/cart'
import {
  addEth,
  compareEth,
  multiplyEth,
  scaleEth,
  subtractEth,
} from '@/lib/eth'

import { db } from '../db/database'
import type {
  CartLineRecord,
  CartOwner,
  CartRecord,
  CouponRecord,
  EditionRecord,
  MockDatabase,
  NftRecord,
  QuoteRecord,
} from '../db/schema'
import { NETWORK_FEES_ETH } from '../fixtures/coupons'
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
  | { kind: 'coupon'; message: string }
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

function cartItems(cart: CartRecord | undefined, nfts: readonly NftRecord[]) {
  return (cart?.lines ?? []).flatMap((line) => {
    const found = findEdition(nfts, line.nftId, line.editionId)
    return found ? [toCartItem(line, found.nft, found.edition)] : []
  })
}

function appliedCoupon(
  cart: CartRecord | undefined,
  coupons: readonly CouponRecord[],
): AppliedCoupon | null {
  const coupon = coupons.find((item) => item.code === cart?.couponCode)
  return coupon ? { code: coupon.code, label: coupon.label } : null
}

/** Public view of a cart; lines whose NFT left the catalog are skipped. */
export function toCartResponse(
  cart: CartRecord | undefined,
  { nfts, coupons }: Pick<MockDatabase, 'nfts' | 'coupons'>,
): CartResponse {
  const items = cartItems(cart, nfts)
  return {
    items,
    coupon: appliedCoupon(cart, coupons),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalEth: addEth('0', ...items.map((item) => item.lineTotalEth)),
    updatedAt: cart?.updatedAt ?? null,
  }
}

export function readCart(owner: CartOwner | null) {
  const data = db.read()
  return toCartResponse(
    owner ? data.carts.find((cart) => cart.owner === owner) : undefined,
    data,
  )
}

function cartOf(draft: MockDatabase, owner: CartOwner, now: string) {
  let cart = draft.carts.find((item) => item.owner === owner)
  if (!cart) {
    cart = { owner, lines: [], couponCode: null, updatedAt: now }
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
    // The collector's own coupon wins; otherwise the visitor's comes along.
    cart.couponCode ??= guest.couponCode
    cart.updatedAt = now
    const mergedLines = guest.lines.length
    draft.carts = draft.carts.filter((item) => item !== guest)
    return { mergedLines, adjustments }
  })
  return { cart: readCart(owner), ...result }
}

/* ---------------------------------------------------------------------------
 * Coupons and quotes
 * ------------------------------------------------------------------------- */

function isExpired(coupon: CouponRecord, now = Date.now()) {
  return Date.parse(coupon.expiresAt) <= now
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeZone: 'UTC',
})

/** Validates and stores a promo code in the cart. */
export function applyCoupon(owner: CartOwner, rawCode: string) {
  const code = rawCode.trim().toUpperCase()
  const coupon = db.read().coupons.find((item) => item.code === code)
  if (!coupon) {
    throw new CartError({
      kind: 'coupon',
      message: 'Código promocional inválido. Confira e tente novamente.',
    })
  }
  if (isExpired(coupon)) {
    throw new CartError({
      kind: 'coupon',
      message: `O código ${coupon.code} expirou em ${dateFormat.format(new Date(coupon.expiresAt))}.`,
    })
  }
  db.write((draft) => {
    const now = new Date().toISOString()
    const cart = cartOf(draft, owner, now)
    cart.couponCode = coupon.code
    cart.updatedAt = now
  })
  return readCart(owner)
}

export function removeCoupon(owner: CartOwner) {
  db.write((draft) => {
    const cart = draft.carts.find((item) => item.owner === owner)
    if (!cart?.couponCode) return
    cart.couponCode = null
    cart.updatedAt = new Date().toISOString()
  })
  return readCart(owner)
}

/** Makes a coupon expire now (control panel and tests). */
export function expireCoupon(code: string) {
  db.write((draft) => {
    const coupon = draft.coupons.find((item) => item.code === code)
    if (coupon) coupon.expiresAt = new Date().toISOString()
  })
}

function discountFor(coupon: CouponRecord, subtotalEth: string) {
  if (coupon.discount.kind === 'percent') {
    return scaleEth(subtotalEth, coupon.discount.basisPoints)
  }
  // A fixed discount never exceeds the subtotal.
  return compareEth(coupon.discount.eth, subtotalEth) > 0
    ? subtotalEth
    : coupon.discount.eth
}

function issueFor(item: CartItem): QuoteIssue | null {
  if (!item.issue) return null
  const name = `${item.nft.name} (edição ${item.edition.label})`
  return {
    code: 'item-unavailable',
    itemId: item.id,
    message:
      item.issue === 'sold-out'
        ? `${name} esgotou. Remova o item para continuar.`
        : `Restam ${String(item.maxQuantity)} ${item.maxQuantity === 1 ? 'unidade' : 'unidades'} de ${name}. Ajuste a quantidade para continuar.`,
  }
}

/**
 * Prices the cart as it is now: line totals, the coupon (re-validated),
 * one estimated network fee per network in the cart, and the issues that
 * block checkout. The snapshot is stored so orders can reference it.
 */
export function quoteCart(owner: CartOwner): QuoteResponse {
  const data = db.read()
  const cart = data.carts.find((item) => item.owner === owner)
  const items = cartItems(cart, data.nfts)
  const subtotalEth = addEth('0', ...items.map((item) => item.lineTotalEth))

  const coupon = data.coupons.find((item) => item.code === cart?.couponCode)
  const couponExpired = coupon ? isExpired(coupon) : false
  const discountEth =
    coupon && !couponExpired ? discountFor(coupon, subtotalEth) : '0'

  const networks = [...new Set(items.map((item) => item.nft.network))]
  const networkFeeEth = addEth(
    '0',
    ...networks.map((network) => NETWORK_FEES_ETH[network]),
  )
  const totalEth = addEth(subtractEth(subtotalEth, discountEth), networkFeeEth)

  const issues: QuoteIssue[] = items.length
    ? items.flatMap((item) => issueFor(item) ?? [])
    : [
        {
          code: 'empty-cart',
          itemId: null,
          message: 'Seu carrinho está vazio.',
        },
      ]

  const now = Date.now()
  const record: QuoteRecord = {
    id: `qt_${crypto.randomUUID()}`,
    owner,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_SECONDS * 1000).toISOString(),
    lines: items.map((item) => ({
      itemId: item.id,
      nftId: item.nft.id,
      editionId: item.edition.id,
      quantity: item.quantity,
      unitPriceEth: item.unitPriceEth,
    })),
    couponCode: coupon && !couponExpired ? coupon.code : null,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
  }
  db.write((draft) => {
    // Keep only live quotes to bound the stored snapshot.
    draft.quotes = draft.quotes.filter(
      (quote) => Date.parse(quote.expiresAt) > now,
    )
    draft.quotes.push(record)
  })

  return {
    id: record.id,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    items: items.map((item) => ({
      itemId: item.id,
      nftId: item.nft.id,
      editionId: item.edition.id,
      quantity: item.quantity,
      unitPriceEth: item.unitPriceEth,
      lineTotalEth: item.lineTotalEth,
    })),
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    coupon: coupon
      ? {
          code: coupon.code,
          label: coupon.label,
          status: couponExpired ? 'expired' : 'applied',
        }
      : null,
    purchasable: issues.length === 0,
    issues,
  }
}
