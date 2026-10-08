import * as z from 'zod/mini'

import { appliedCouponSchema, quoteResponseSchema } from './cart'
import { ethAmountSchema, imageSchema, isoDateTimeSchema } from './common'
import {
  walletAddressSchema,
  walletFieldsSchema,
  walletNetworkSchema,
  walletProviderSchema,
} from './wallets'

/*
 * Orders of the signed-in collector (Bearer token required).
 *
 * POST /orders   Idempotency-Key: <uuid>   CreateOrderRequest
 *   201 Order (status "pending")
 *   200 Order: same key and same body; the order already created (header
 *       Idempotent-Replayed: true), so retries never buy twice
 *   409 IDEMPOTENCY_CONFLICT: the key was used with a different body
 *   409 QUOTE_OUTDATED: the quote expired or prices, availability, coupon
 *       or fees changed (details: QuoteOutdatedDetails, with a new quote)
 *   409 CONFLICT: the quote already created another order (details.orderId)
 *   409 WALLET_DISCONNECTED: the wallet connection ended
 *   422 VALIDATION_ERROR: collector fields, or a missing Idempotency-Key
 * GET  /orders/:orderId → 200 Order · 404
 *
 * Status: "pending" → "confirmed" | "rejected" (terminal). Changes arrive
 * as "order.updated" on the topic order:<id> (owner only). Orders keep a
 * snapshot of items and values: later catalog changes never alter them.
 */

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

const collectorFields = z.pick(walletFieldsSchema, {
  displayName: true,
  profileName: true,
  referralCode: true,
  email: true,
  ensName: true,
})

export const createOrderRequestSchema = z.object({
  quoteId: z.string().check(z.minLength(1)),
  connectionId: z.string().check(z.minLength(1)),
  collector: z.extend(collectorFields, {
    username: z
      .string()
      .check(
        z.trim(),
        z.minLength(1, 'Informe o nome de usuário.'),
        z.maxLength(30, 'Use no máximo 30 caracteres.'),
      ),
  }),
  wallet: z.object({
    walletId: z.nullable(z.string()),
    network: walletNetworkSchema,
    provider: walletProviderSchema,
    address: walletAddressSchema,
    secondaryAddress: walletFieldsSchema.shape.secondaryAddress,
  }),
  note: z
    .string()
    .check(z.trim(), z.maxLength(280, 'Use no máximo 280 caracteres.')),
})

export type CreateOrderRequest = z.input<typeof createOrderRequestSchema>

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])

export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderItemSchema = z.object({
  itemId: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  editionLabel: z.string(),
  image: imageSchema,
  quantity: z.int(),
  unitPriceEth: ethAmountSchema,
  lineTotalEth: ethAmountSchema,
})

export type OrderItem = z.infer<typeof orderItemSchema>

export const orderSchema = z.object({
  id: z.string(),
  /** Monotonic version, shared with realtime events. */
  version: z.int(),
  status: orderStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  settledAt: z.nullable(isoDateTimeSchema),
  items: z.array(orderItemSchema),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  coupon: z.nullable(appliedCouponSchema),
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  wallet: z.object({
    nickname: z.nullable(z.string()),
    provider: walletProviderSchema,
    network: walletNetworkSchema,
    address: z.string(),
    secondaryAddress: z.nullable(z.string()),
  }),
  collector: z.object({
    displayName: z.string(),
    username: z.string(),
    profileName: z.string(),
    email: z.string(),
    referralCode: z.string(),
    ensName: z.string(),
  }),
  note: z.string(),
  /** Simulated on-chain transaction, set when confirmed. */
  transaction: z.nullable(
    z.object({
      hash: z.string(),
      explorerName: z.string(),
      explorerUrl: z.string(),
    }),
  ),
  /** Why a rejected order failed; nothing was charged. */
  failure: z.nullable(
    z.object({
      code: z.enum(['payment-declined', 'insufficient-stock']),
      message: z.string(),
    }),
  ),
})

export type Order = z.infer<typeof orderSchema>

export const quoteOutdatedDetailsSchema = z.object({
  quote: quoteResponseSchema,
  /** What changed, as sentences for the collector. */
  changes: z.array(z.string()),
})

export type QuoteOutdatedDetails = z.infer<typeof quoteOutdatedDetailsSchema>
