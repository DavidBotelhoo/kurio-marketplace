import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  WalletsResponse,
} from '@/contracts/wallets'
import { useSessionUserId } from '@/features/auth/queries'

import {
  connectWallet,
  createWallet,
  disconnectWallet,
  fetchWallets,
  updateWallet,
} from './api'
import { walletKeys } from './query-keys'

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: walletKeys.list(userId),
    queryFn: ({ signal }) => fetchWallets(signal),
  })
}

/** Registered wallets of the signed-in collector (primary first). */
export function useWallets() {
  const userId = useSessionUserId()
  return useQuery({
    ...walletsQueryOptions(userId ?? ''),
    enabled: userId !== null,
  })
}

function useWalletsCache() {
  const queryClient = useQueryClient()
  const userId = useSessionUserId()
  return (update: (data: WalletsResponse) => WalletsResponse) => {
    if (!userId) return
    const { queryKey } = walletsQueryOptions(userId)
    queryClient.setQueryData(queryKey, (data) => data && update(data))
    void queryClient.invalidateQueries({ queryKey })
  }
}

export function useCreateWallet() {
  const updateCache = useWalletsCache()
  return useMutation({
    mutationFn: (body: CreateWalletRequest) => createWallet(body),
    onSuccess: (wallet) => {
      updateCache((data) => ({ items: [...data.items, wallet] }))
    },
  })
}

export function useUpdateWallet() {
  const updateCache = useWalletsCache()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateWalletRequest }) =>
      updateWallet(id, body),
    onSuccess: (wallet) => {
      updateCache((data) => ({
        items: data.items.map((item) =>
          item.id === wallet.id ? wallet : item,
        ),
      }))
    },
  })
}

/**
 * Asks the (simulated) wallet extension to connect. Not retried: a refusal
 * is the collector's answer, and a new prompt must be their decision.
 */
export function useConnectWallet() {
  return useMutation({ mutationFn: connectWallet })
}

export function useDisconnectWallet() {
  return useMutation({ mutationFn: disconnectWallet })
}
