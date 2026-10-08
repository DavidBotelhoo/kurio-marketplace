import * as z from 'zod/mini'

import { emailSchema } from './auth'
import { NETWORKS } from './catalog-taxonomy'
import { isoDateTimeSchema } from './common'
import {
  WALLET_PROVIDERS,
  WALLET_SLOTS,
  type WalletProviderId,
} from './wallet-providers'

/*
 * Registered wallets of the signed-in collector (Bearer token required).
 * A collector has up to two: "primary" and "secondary".
 *
 * GET   /wallets             → 200 WalletsResponse (primary first)
 * POST  /wallets             CreateWalletRequest → 201 Wallet
 *                            409 CONFLICT (slot already used) · 422 (fields)
 * PATCH /wallets/:walletId   UpdateWalletRequest → 200 Wallet · 404 · 422
 *
 * Wallet connection (simulated extension prompt, see mocks):
 * POST   /wallet-connections        ConnectWalletRequest → 201 WalletConnection
 *                                   403 WALLET_REJECTED (refused in the wallet)
 * GET    /wallet-connections/:id    → 200 WalletConnection · 404 (disconnected)
 * DELETE /wallet-connections/:id    → 204 (idempotent)
 *
 * The field rules below are shared by the forms and the mock server.
 */

export {
  WALLET_PROVIDERS,
  WALLET_SLOTS,
  type WalletProviderId,
  type WalletSlot,
} from './wallet-providers'

const required = (error: string) => z.minLength(1, { error, abort: true })

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/
const ENS_NAME_PATTERN =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/
const ENS_FULL_PATTERN = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.eth$/i
const REFERRAL_PATTERN = /^[A-Z0-9-]{4,20}$/

const ids = <T extends readonly { id: string }[]>(items: T) =>
  items.map((item) => item.id) as [T[number]['id'], ...T[number]['id'][]]

export const walletAddressSchema = z
  .string()
  .check(
    z.trim(),
    required('Informe o endereço da carteira.'),
    z.regex(
      ADDRESS_PATTERN,
      'Use um endereço 0x seguido de 40 caracteres hexadecimais.',
    ),
  )

export const walletNetworkSchema = z.enum(ids(NETWORKS), {
  error: 'Selecione uma rede.',
})

export const walletProviderSchema = z.enum(ids(WALLET_PROVIDERS), {
  error: 'Selecione o tipo de carteira.',
})

export const walletFieldsSchema = z.object({
  nickname: z
    .string()
    .check(
      z.trim(),
      required('Informe um apelido para a carteira.'),
      z.maxLength(30, 'Use no máximo 30 caracteres.'),
    ),
  displayName: z
    .string()
    .check(
      z.trim(),
      required('Informe o nome de exibição.'),
      z.maxLength(60, 'Use no máximo 60 caracteres.'),
    ),
  profileName: z
    .string()
    .check(
      z.trim(),
      required('Informe o nome do perfil.'),
      z.maxLength(60, 'Use no máximo 60 caracteres.'),
    ),
  network: walletNetworkSchema,
  address: walletAddressSchema,
  /** "ENS ou carteira secundária (opcional)": a .eth name or a 0x address. */
  secondaryAddress: z.string().check(
    z.trim(),
    z.refine(
      (value) =>
        value === '' ||
        ADDRESS_PATTERN.test(value) ||
        ENS_FULL_PATTERN.test(value),
      'Informe um nome ENS terminado em .eth ou um endereço 0x.',
    ),
  ),
  provider: walletProviderSchema,
  referralCode: z
    .string()
    .check(
      z.trim(),
      z.toUpperCase(),
      required('Informe o código de indicação.'),
      z.regex(REFERRAL_PATTERN, 'Use de 4 a 20 letras, números ou hífen.'),
    ),
  email: emailSchema,
  /** ENS name without the ".eth" suffix (chosen in a separate select). */
  ensName: z.string().check(
    z.trim(),
    z.toLowerCase(),
    z.overwrite((value) => value.replace(/\.eth$/, '')),
    required('Informe o nome ENS.'),
    z.maxLength(40, 'Use no máximo 40 caracteres.'),
    z.regex(
      ENS_NAME_PATTERN,
      'Use letras minúsculas, números, hífen ou ponto.',
    ),
  ),
})

export type WalletFields = z.input<typeof walletFieldsSchema>

export const createWalletRequestSchema = z.extend(walletFieldsSchema, {
  slot: z.enum(WALLET_SLOTS),
})

export type CreateWalletRequest = z.input<typeof createWalletRequestSchema>

export const updateWalletRequestSchema = walletFieldsSchema

export type UpdateWalletRequest = z.input<typeof updateWalletRequestSchema>

export const walletSchema = z.object({
  id: z.string(),
  slot: z.enum(WALLET_SLOTS),
  nickname: z.string(),
  displayName: z.string(),
  profileName: z.string(),
  network: walletNetworkSchema,
  address: z.string(),
  secondaryAddress: z.nullable(z.string()),
  provider: walletProviderSchema,
  referralCode: z.string(),
  email: z.string(),
  ensName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export type Wallet = z.infer<typeof walletSchema>

export const walletsResponseSchema = z.object({
  items: z.array(walletSchema),
})

export type WalletsResponse = z.infer<typeof walletsResponseSchema>

export const connectWalletRequestSchema = z.object({
  /** Registered wallet being connected; null for a one-off address. */
  walletId: z.nullable(z.string()),
  provider: walletProviderSchema,
  network: walletNetworkSchema,
  address: walletAddressSchema,
})

export type ConnectWalletRequest = z.input<typeof connectWalletRequestSchema>

export const walletConnectionSchema = z.object({
  id: z.string(),
  walletId: z.nullable(z.string()),
  provider: walletProviderSchema,
  network: walletNetworkSchema,
  address: z.string(),
  connectedAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
})

export type WalletConnection = z.infer<typeof walletConnectionSchema>

export function providerLabel(provider: WalletProviderId) {
  return (
    WALLET_PROVIDERS.find((item) => item.id === provider)?.label ?? provider
  )
}
