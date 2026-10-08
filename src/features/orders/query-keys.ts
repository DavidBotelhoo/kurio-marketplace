import { privateKeys } from '@/features/auth/query-keys'

export const orderKeys = {
  detail: (userId: string, orderId: string) =>
    [...privateKeys.user(userId), 'order', orderId] as const,
}
