/** Wallet constants, free of schema code (usable from any chunk). */

/** Order of the Figma "Carteira e rede" options. */
export const WALLET_PROVIDERS = [
  { id: 'walletconnect', label: 'WalletConnect' },
  { id: 'metamask', label: 'MetaMask' },
  { id: 'coinbase', label: 'Coinbase Wallet' },
] as const

export type WalletProviderId = (typeof WALLET_PROVIDERS)[number]['id']

export const WALLET_SLOTS = ['primary', 'secondary'] as const

export type WalletSlot = (typeof WALLET_SLOTS)[number]

/** Suffix options of the "Nome ENS" select. */
export const ENS_SUFFIXES = ['.eth'] as const
