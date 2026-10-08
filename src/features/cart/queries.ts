import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import type { AddCartItemRequest, CartResponse } from '@/contracts/cart'
import { useSessionUserId } from '@/features/auth/queries'
import { sessionStore } from '@/features/auth/session-store'
import { isApiError } from '@/lib/api/errors'

import { guestCartStore } from './guest-cart-store'
import { type CartIdentity, cartKeys } from './query-keys'

/*
 * The API module (HTTP client + schemas) loads on demand: the header badge
 * needs the cart on every page, and the entry chunk stays free of it.
 */
const loadApi = () => import('./api')
type CartApi = Awaited<ReturnType<typeof loadApi>>

export function useCartIdentity(): CartIdentity {
  const userId = useSessionUserId()
  const guestId = useSyncExternalStore(
    guestCartStore.subscribe,
    guestCartStore.get,
  )
  return userId ? { kind: 'user', userId } : { kind: 'guest', guestId }
}

/** Identity at request time (the session may change while a write waits). */
function currentIdentity(createGuest: boolean): CartIdentity {
  const userId = sessionStore.get()?.userId
  if (userId) return { kind: 'user', userId }
  return {
    kind: 'guest',
    guestId: createGuest ? guestCartStore.ensure() : guestCartStore.get(),
  }
}

/**
 * Collector cart. A visitor cart left from before signing in (in this or
 * another tab) is merged into it first, so its items are never lost.
 */
async function fetchUserCart(api: CartApi, signal: AbortSignal) {
  const guestId = guestCartStore.get()
  if (!guestId) return api.fetchCart(null, signal)
  const result = await api.mergeGuestCart(guestId, signal)
  guestCartStore.clear(guestId)
  if (result.mergedLines > 0) {
    toast.success(
      result.adjustments.length
        ? 'Os itens que você escolheu antes de entrar estão no carrinho. Algumas quantidades foram ajustadas ao limite disponível.'
        : 'Os itens que você escolheu antes de entrar estão no seu carrinho.',
      { id: 'cart-merged' },
    )
  }
  return result.cart
}

export function cartQueryOptions(identity: CartIdentity) {
  return queryOptions({
    queryKey: cartKeys.of(identity),
    queryFn: async ({ signal }): Promise<CartResponse> => {
      const api = await loadApi()
      return identity.kind === 'user'
        ? fetchUserCart(api, signal)
        : api.fetchCart(identity.guestId, signal)
    },
  })
}

export function useCart() {
  return useQuery(cartQueryOptions(useCartIdentity()))
}

/** Units in the cart; 0 while it loads. */
export function useCartCount() {
  const { data = 0 } = useQuery({
    ...cartQueryOptions(useCartIdentity()),
    select: (cart) => cart.itemCount,
  })
  return data
}

/**
 * Cart writes. They share one mutation scope, so they reach the API in the
 * order they were made, and each response replaces the cached cart.
 */
function useCartMutation<Variables>(
  write: (
    api: CartApi,
    guestId: string | null,
    variables: Variables,
  ) => Promise<CartResponse>,
  { createGuest = false } = {},
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: cartKeys.mutation(),
    scope: { id: 'cart' },
    mutationFn: async (variables: Variables) => {
      const identity = currentIdentity(createGuest)
      const queryKey = cartKeys.of(identity)
      // A fetch in flight would overwrite the newer cart from this write.
      await queryClient.cancelQueries({ queryKey })
      const guestId = identity.kind === 'guest' ? identity.guestId : null
      const cart = await write(await loadApi(), guestId, variables)
      return { identity, cart }
    },
    onSuccess: ({ identity, cart }) => {
      queryClient.setQueryData(cartQueryOptions(identity).queryKey, cart)
    },
    onError: (error) => {
      // Availability or the line changed on the server: show its current state.
      if (
        isApiError(error) &&
        (error.code === 'AVAILABILITY_CONFLICT' || error.code === 'NOT_FOUND')
      ) {
        void queryClient.invalidateQueries({
          predicate: (query) => cartKeys.isCart(query.queryKey),
        })
      }
    },
  })
}

export function useAddToCart() {
  return useCartMutation(
    (api, guestId, item: AddCartItemRequest) => api.addCartItem(guestId, item),
    { createGuest: true },
  )
}

export function useUpdateCartItem() {
  return useCartMutation(
    (
      api,
      guestId,
      { itemId, quantity }: { itemId: string; quantity: number },
    ) => api.updateCartItem(guestId, itemId, quantity),
  )
}

export function useRemoveCartItem() {
  return useCartMutation((api, guestId, itemId: string) =>
    api.removeCartItem(guestId, itemId),
  )
}
