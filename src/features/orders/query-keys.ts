import { privateKeys } from '@/features/auth/query-keys'

export const orderKeys = {
  list: (userId: string) => [...privateKeys.user(userId), 'orders'] as const,
  detail: (userId: string, orderId: string) =>
    [...privateKeys.user(userId), 'order', orderId] as const,
}
