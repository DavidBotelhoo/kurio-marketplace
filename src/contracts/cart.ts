import * as z from 'zod/mini'

import { editionSchema, nftSummarySchema } from './catalog'
import { ethAmountSchema, isoDateTimeSchema } from './common'

/*
 * Cart of the current shopper. The API owns every rule (availability, limits,
 * prices); the client only renders what it returns.
 *
 * Identity, in this order:
 *   Authorization: Bearer <token>  → the collector's cart
 *   X-Guest-Cart: <id>              → a visitor's cart (random id created by
 *                                    the client before its first addition)
 * Without either, GET answers an empty cart and writes answer 401.
 *
 * GET    /cart                CartResponse
 * POST   /cart/items          AddCartItemRequest    → 200 CartResponse
 *                             (adds the edition or increments its line)
 * PATCH  /cart/items/:itemId  UpdateCartItemRequest → 200 CartResponse
 * DELETE /cart/items/:itemId  → 200 CartResponse (idempotent)
 * POST   /cart/merge          Bearer + X-Guest-Cart → 200 CartMergeResponse
 *                             (moves the visitor's lines into the collector's
 *                             cart and deletes the visitor cart; idempotent)
 *
 * 404 NOT_FOUND unknown NFT, edition or line · 422 VALIDATION_ERROR
 * 409 AVAILABILITY_CONFLICT when the edition cannot take the quantity
 *     (details: AvailabilityConflictDetails)
 */

export const GUEST_CART_HEADER = 'X-Guest-Cart'

export const quantitySchema = z
  .int()
  .check(z.positive('Informe uma quantidade.'))

export const cartItemIssueSchema = z.enum([
  /** The edition has no units left. */
  'sold-out',
  /** Fewer units left (or a lower per-order limit) than the line quantity. */
  'quantity-unavailable',
])

export type CartItemIssue = z.infer<typeof cartItemIssueSchema>

export const cartItemSchema = z.object({
  id: z.string(),
  nft: nftSummarySchema,
  /** Current state of the chosen edition (price, units left, limits). */
  edition: editionSchema,
  quantity: z.int(),
  /** Largest quantity accepted now (0 when sold out). */
  maxQuantity: z.int(),
  /** Current edition price. */
  unitPriceEth: ethAmountSchema,
  /**
   * Price when the shopper last changed the line; differs from
   * `unitPriceEth` after a price update they have not acted on yet.
   */
  previousUnitPriceEth: ethAmountSchema,
  lineTotalEth: ethAmountSchema,
  /** Blocks checkout of the line until it is fixed or removed. */
  issue: z.nullable(cartItemIssueSchema),
  addedAt: isoDateTimeSchema,
})

export type CartItem = z.infer<typeof cartItemSchema>

export const cartResponseSchema = z.object({
  items: z.array(cartItemSchema),
  /** Units in the cart (header badge). */
  itemCount: z.int(),
  /** Sum of the line totals; the quote adds discounts and fees. */
  subtotalEth: ethAmountSchema,
  updatedAt: z.nullable(isoDateTimeSchema),
})

export type CartResponse = z.infer<typeof cartResponseSchema>

export const addCartItemRequestSchema = z.object({
  nftId: z.string().check(z.minLength(1)),
  editionId: z.string().check(z.minLength(1)),
  quantity: quantitySchema,
})

export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>

export const updateCartItemRequestSchema = z.object({
  quantity: quantitySchema,
})

export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>

export const cartMergeResponseSchema = z.object({
  cart: cartResponseSchema,
  /** Visitor lines moved into the collector's cart. */
  mergedLines: z.int(),
  /** Lines whose combined quantity was reduced to what the edition allows. */
  adjustments: z.array(
    z.object({
      itemId: z.string(),
      requested: z.int(),
      quantity: z.int(),
    }),
  ),
})

export type CartMergeResponse = z.infer<typeof cartMergeResponseSchema>

export interface AvailabilityConflictDetails {
  nftId: string
  editionId: string
  /** Units left; null for open editions. */
  available: number | null
  maxPerOrder: number
  /** Largest quantity the line can have now. */
  maxQuantity: number
}
