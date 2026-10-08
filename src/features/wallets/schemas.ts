import * as z from 'zod/mini'

import type { User } from '@/contracts/auth'
import { NETWORKS, type NetworkId } from '@/contracts/catalog-taxonomy'
import {
  WALLET_PROVIDERS,
  type WalletProviderId,
} from '@/contracts/wallet-providers'
import {
  type UpdateWalletRequest,
  type Wallet,
  walletFieldsSchema,
} from '@/contracts/wallets'

export const isNetwork = (value: string): value is NetworkId =>
  NETWORKS.some((network) => network.id === value)

export const isProvider = (value: string): value is WalletProviderId =>
  WALLET_PROVIDERS.some((provider) => provider.id === value)

/** Wallet form: API rules; network and type start empty ("Selecione…"). */
export const walletFormSchema = z.object({
  ...walletFieldsSchema.shape,
  network: z.string().check(z.refine(isNetwork, 'Selecione uma rede.')),
  provider: z
    .string()
    .check(z.refine(isProvider, 'Selecione o tipo de carteira.')),
})

export type WalletFormValues = z.input<typeof walletFormSchema>

export const WALLET_FORM_FIELDS = [
  'nickname',
  'displayName',
  'profileName',
  'network',
  'address',
  'secondaryAddress',
  'provider',
  'referralCode',
  'email',
  'ensName',
] as const satisfies readonly (keyof WalletFormValues)[]

export function walletFormValues(wallet: Wallet): WalletFormValues {
  return {
    nickname: wallet.nickname,
    displayName: wallet.displayName,
    profileName: wallet.profileName,
    network: wallet.network,
    address: wallet.address,
    secondaryAddress: wallet.secondaryAddress ?? '',
    provider: wallet.provider,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensName: wallet.ensName,
  }
}

/** A first wallet starts from what the account already knows. */
export function newWalletValues(
  user: User,
  nickname: string,
): WalletFormValues {
  return {
    nickname,
    displayName: user.displayName,
    profileName: '',
    network: '',
    address: '',
    secondaryAddress: '',
    provider: '',
    referralCode: '',
    email: user.email,
    ensName: user.ensName ?? '',
  }
}

export function toWalletRequest(values: WalletFormValues): UpdateWalletRequest {
  const { network, provider } = values
  if (!isNetwork(network) || !isProvider(provider)) {
    throw new Error('Network and wallet type must be validated first')
  }
  return { ...values, network, provider }
}
