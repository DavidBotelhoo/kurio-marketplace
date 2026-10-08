import { privateKeys } from '@/features/auth/query-keys'

export const walletKeys = {
  list: (userId: string) => [...privateKeys.user(userId), 'wallets'] as const,
  connection: (userId: string, connectionId: string) =>
    [...privateKeys.user(userId), 'wallet-connection', connectionId] as const,
}
