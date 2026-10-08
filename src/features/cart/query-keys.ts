import type { QueryKey } from '@tanstack/react-query'

import { privateKeys } from '@/features/auth/query-keys'

/** Whose cart a request addresses. */
export type CartIdentity =
  { kind: 'user'; userId: string } | { kind: 'guest'; guestId: string | null }

export const cartKeys = {
  /** Collector carts are private data (removed on logout). */
  user: (userId: string) => [...privateKeys.user(userId), 'cart'] as const,
  guest: (guestId: string | null) => ['cart', 'guest', guestId] as const,
  of: (identity: CartIdentity) =>
    identity.kind === 'user'
      ? cartKeys.user(identity.userId)
      : cartKeys.guest(identity.guestId),
  /**
   * Quote of a cart. It lives under the cart key, so invalidating the cart
   * (realtime changes, reconnection) also re-prices it.
   */
  quote: (identity: CartIdentity) =>
    [...cartKeys.of(identity), 'quote'] as const,
  /** Matches any cart entry (collector or visitor). */
  isCart: (queryKey: QueryKey) =>
    (queryKey[0] === privateKeys.all[0] && queryKey[2] === 'cart') ||
    (queryKey[0] === 'cart' && queryKey[1] === 'guest'),
  /** Every cart write, serialized in one mutation scope. */
  mutation: () => ['cart', 'mutation'] as const,
}
