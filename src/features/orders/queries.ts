import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { CreateOrderRequest, Order } from '@/contracts/orders'
import type { OrderUpdatedEvent } from '@/contracts/realtime'
import { useSessionUserId } from '@/features/auth/queries'
import { cartKeys } from '@/features/cart/query-keys'
import { isApiError } from '@/lib/api/errors'

import { orderKeys } from './query-keys'

/** HTTP client and schemas load on demand (the realtime sync is global). */
const loadApi = () => import('./api')

export function orderQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: orderKeys.detail(userId, orderId),
    queryFn: async ({ signal }) =>
      (await loadApi()).fetchOrder(orderId, signal),
  })
}

export function useOrder(orderId: string) {
  const userId = useSessionUserId()
  return useQuery({
    ...orderQueryOptions(userId ?? '', orderId),
    enabled: userId !== null,
  })
}

/**
 * Stores a newer order state (REST or realtime). Older or duplicated
 * versions are ignored, so a late event never reverts a terminal status.
 * Returns true when the state changed.
 */
export function storeOrder(
  queryClient: QueryClient,
  userId: string,
  order: Order,
) {
  const { queryKey } = orderQueryOptions(userId, order.id)
  const current = queryClient.getQueryData(queryKey)
  if (current && current.version >= order.version) return false
  queryClient.setQueryData(queryKey, order)
  if (order.status === 'confirmed') {
    // The API removed the purchased items from the cart.
    void queryClient.invalidateQueries({
      predicate: (query) => cartKeys.isCart(query.queryKey),
    })
  }
  return true
}

export function applyOrderUpdated(
  queryClient: QueryClient,
  userId: string,
  event: OrderUpdatedEvent,
) {
  return storeOrder(queryClient, userId, event.data)
}

/**
 * Creates an order. Retries are safe: they reuse the attempt's idempotency
 * key, so a request that timed out after the order was created gets that
 * same order back.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  const userId = useSessionUserId()
  return useMutation({
    mutationKey: ['orders', 'create'],
    mutationFn: async ({
      body,
      idempotencyKey,
    }: {
      body: CreateOrderRequest
      idempotencyKey: string
    }) => (await loadApi()).createOrder(body, idempotencyKey),
    retry: (failureCount, error) =>
      isApiError(error) && error.retryable && failureCount < 3,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
    onSuccess: (order) => {
      if (userId) storeOrder(queryClient, userId, order)
    },
  })
}
