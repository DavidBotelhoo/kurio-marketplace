import {
  type AddCartItemRequest,
  type CartMergeResponse,
  cartMergeResponseSchema,
  type CartResponse,
  cartResponseSchema,
  GUEST_CART_HEADER,
} from '@/contracts/cart'
import { api } from '@/lib/api/client'
import { parseResponse } from '@/lib/api/parse'

/*
 * Collector requests are identified by the session token (added by the HTTP
 * client); visitor requests carry their cart id instead.
 */

const guestHeaders = (guestId: string | null) =>
  guestId ? { [GUEST_CART_HEADER]: guestId } : {}

const itemPath = (itemId: string) => `/cart/items/${encodeURIComponent(itemId)}`

export async function fetchCart(
  guestId: string | null,
  signal?: AbortSignal,
): Promise<CartResponse> {
  const { data } = await api.get<unknown>('/cart', {
    signal,
    headers: guestHeaders(guestId),
  })
  return parseResponse(cartResponseSchema, data)
}

export async function addCartItem(
  guestId: string | null,
  body: AddCartItemRequest,
): Promise<CartResponse> {
  const { data } = await api.post<unknown>('/cart/items', body, {
    headers: guestHeaders(guestId),
  })
  return parseResponse(cartResponseSchema, data)
}

export async function updateCartItem(
  guestId: string | null,
  itemId: string,
  quantity: number,
): Promise<CartResponse> {
  const { data } = await api.patch<unknown>(
    itemPath(itemId),
    { quantity },
    { headers: guestHeaders(guestId) },
  )
  return parseResponse(cartResponseSchema, data)
}

export async function removeCartItem(
  guestId: string | null,
  itemId: string,
): Promise<CartResponse> {
  const { data } = await api.delete<unknown>(itemPath(itemId), {
    headers: guestHeaders(guestId),
  })
  return parseResponse(cartResponseSchema, data)
}

/** Moves the visitor cart `guestId` into the signed-in collector's cart. */
export async function mergeGuestCart(
  guestId: string,
  signal?: AbortSignal,
): Promise<CartMergeResponse> {
  const { data } = await api.post<unknown>('/cart/merge', null, {
    signal,
    headers: guestHeaders(guestId),
  })
  return parseResponse(cartMergeResponseSchema, data)
}
