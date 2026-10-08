import type { WalletRecord } from '../db/schema'
import { SEED_DATE } from './users'

/**
 * Nova's wallets as in the Figma payment frame: "Principal" on Ethereum
 * (0xA91F…E82C) and "Reserva" on Polygon (nova.kurio.eth). David has none,
 * to exercise the first registration and the manual payment form.
 */
export const WALLETS: readonly WalletRecord[] = [
  {
    id: 'wal_nova_primary',
    userId: 'usr_nova',
    slot: 'primary',
    nickname: 'Principal',
    displayName: 'Nova Ribeiro',
    profileName: 'Coleção da Nova',
    network: 'ethereum',
    address: '0xa91f3c7d52b04e6a9d18f0c4b7e2a65d3c19e82c',
    secondaryAddress: null,
    provider: 'metamask',
    referralCode: 'KURIO-NOVA',
    email: 'nova@kurio.test',
    ensName: 'nova.kurio',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 'wal_nova_secondary',
    userId: 'usr_nova',
    slot: 'secondary',
    nickname: 'Reserva',
    displayName: 'Nova Ribeiro',
    profileName: 'Coleção da Nova',
    network: 'polygon',
    address: '0x5be2f0a8c4d19e7b3a6c0f52d8e1b94a7c03d6f1',
    secondaryAddress: 'nova.kurio.eth',
    provider: 'coinbase',
    referralCode: 'KURIO-NOVA',
    email: 'nova@kurio.test',
    ensName: 'nova.kurio',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
]
