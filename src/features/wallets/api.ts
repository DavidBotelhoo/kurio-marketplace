import {
  type ConnectWalletRequest,
  type CreateWalletRequest,
  type UpdateWalletRequest,
  type Wallet,
  type WalletConnection,
  walletConnectionSchema,
  walletSchema,
  type WalletsResponse,
  walletsResponseSchema,
} from '@/contracts/wallets'
import { api } from '@/lib/api/client'
import { parseResponse } from '@/lib/api/parse'

export async function fetchWallets(
  signal?: AbortSignal,
): Promise<WalletsResponse> {
  const { data } = await api.get<unknown>('/wallets', { signal })
  return parseResponse(walletsResponseSchema, data)
}

export async function createWallet(body: CreateWalletRequest): Promise<Wallet> {
  const { data } = await api.post<unknown>('/wallets', body)
  return parseResponse(walletSchema, data)
}

export async function updateWallet(
  walletId: string,
  body: UpdateWalletRequest,
): Promise<Wallet> {
  const { data } = await api.patch<unknown>(
    `/wallets/${encodeURIComponent(walletId)}`,
    body,
  )
  return parseResponse(walletSchema, data)
}

export async function connectWallet(
  body: ConnectWalletRequest,
): Promise<WalletConnection> {
  const { data } = await api.post<unknown>('/wallet-connections', body)
  return parseResponse(walletConnectionSchema, data)
}

export async function fetchConnection(
  connectionId: string,
  signal?: AbortSignal,
): Promise<WalletConnection> {
  const { data } = await api.get<unknown>(
    `/wallet-connections/${encodeURIComponent(connectionId)}`,
    { signal },
  )
  return parseResponse(walletConnectionSchema, data)
}

export async function disconnectWallet(connectionId: string): Promise<void> {
  await api.delete(`/wallet-connections/${encodeURIComponent(connectionId)}`)
}
