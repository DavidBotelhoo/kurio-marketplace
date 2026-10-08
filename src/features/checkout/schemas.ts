import * as z from 'zod/mini'

import type { User } from '@/contracts/auth'
import {
  type CreateOrderRequest,
  createOrderRequestSchema,
} from '@/contracts/orders'
import { type Wallet, walletFieldsSchema } from '@/contracts/wallets'
import { isNetwork, isProvider } from '@/features/wallets/schemas'

const fields = walletFieldsSchema.shape
const collector = createOrderRequestSchema.shape.collector.shape

/**
 * "Perfil do colecionador" of the checkout: the Figma fields with the API
 * rules. Network and wallet type start empty ("Selecione…") in the form.
 */
export const paymentFormSchema = z.object({
  displayName: fields.displayName,
  username: collector.username,
  network: z.string().check(z.refine(isNetwork, 'Selecione uma rede.')),
  profileName: fields.profileName,
  address: fields.address,
  secondaryAddress: fields.secondaryAddress,
  provider: z
    .string()
    .check(z.refine(isProvider, 'Selecione o tipo de carteira.')),
  referralCode: fields.referralCode,
  email: fields.email,
  ensName: fields.ensName,
  note: createOrderRequestSchema.shape.note,
  /** Registered wallet in use; null when typed by hand ("outra carteira"). */
  walletId: z.nullable(z.string()),
})

export type PaymentFormValues = z.input<typeof paymentFormSchema>

/** Wallet-specific fields, replaced when another wallet is chosen. */
export function walletValues(wallet: Wallet) {
  return {
    network: wallet.network,
    address: wallet.address,
    secondaryAddress: wallet.secondaryAddress ?? '',
    provider: wallet.provider,
    walletId: wallet.id,
  } satisfies Partial<PaymentFormValues>
}

export function valuesFromWallet(
  wallet: Wallet,
  user: User,
): PaymentFormValues {
  return {
    displayName: wallet.displayName,
    username: user.username,
    profileName: wallet.profileName,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensName: wallet.ensName,
    note: '',
    ...walletValues(wallet),
  }
}

/** Collector without a registered wallet: what the account already knows. */
export function manualValues(user: User): PaymentFormValues {
  return {
    displayName: user.displayName,
    username: user.username,
    network: '',
    profileName: '',
    address: '',
    secondaryAddress: '',
    provider: '',
    referralCode: '',
    email: user.email,
    ensName: user.ensName ?? '',
    note: '',
    walletId: null,
  }
}

export const EMPTY_WALLET_VALUES = {
  network: '',
  address: '',
  secondaryAddress: '',
  provider: '',
  walletId: null,
} satisfies Partial<PaymentFormValues>

/** Connection target of the form (null until network and type are chosen). */
export function connectionTarget(values: PaymentFormValues) {
  const { network, provider } = values
  if (!isNetwork(network) || !isProvider(provider)) return null
  return {
    walletId: values.walletId,
    network,
    provider,
    address: values.address.trim(),
  }
}

export function toOrderBody(
  values: PaymentFormValues,
  quoteId: string,
  connectionId: string,
): CreateOrderRequest {
  const target = connectionTarget(values)
  if (!target)
    throw new Error('Network and wallet type must be validated first')
  return {
    quoteId,
    connectionId,
    collector: {
      displayName: values.displayName,
      username: values.username,
      profileName: values.profileName,
      email: values.email,
      referralCode: values.referralCode,
      ensName: values.ensName,
    },
    wallet: { ...target, secondaryAddress: values.secondaryAddress },
    note: values.note,
  }
}

const FORM_FIELDS = [
  'displayName',
  'username',
  'network',
  'profileName',
  'address',
  'secondaryAddress',
  'provider',
  'referralCode',
  'email',
  'ensName',
  'note',
] as const satisfies readonly (keyof PaymentFormValues)[]

/** API field paths ("collector.email", "wallet.address") → form fields. */
export function formFieldOf(apiPath: string) {
  const name = apiPath.split('.').at(-1)
  return FORM_FIELDS.find((field) => field === name) ?? null
}
