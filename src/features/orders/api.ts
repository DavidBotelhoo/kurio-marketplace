import {
  type CreateOrderRequest,
  IDEMPOTENCY_HEADER,
  type Order,
  orderSchema,
} from '@/contracts/orders'
import { api } from '@/lib/api/client'
import { parseResponse } from '@/lib/api/parse'

/** The key identifies one purchase attempt: retries reuse it. */
export async function createOrder(
  body: CreateOrderRequest,
  idempotencyKey: string,
): Promise<Order> {
  const { data } = await api.post<unknown>('/orders', body, {
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  })
  return parseResponse(orderSchema, data)
}

export async function fetchOrder(
  orderId: string,
  signal?: AbortSignal,
): Promise<Order> {
  const { data } = await api.get<unknown>(
    `/orders/${encodeURIComponent(orderId)}`,
    { signal },
  )
  return parseResponse(orderSchema, data)
}
