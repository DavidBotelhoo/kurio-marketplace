/**
 * Realtime topic and message names. Kept free of schema code so the entry
 * chunk can use them without loading the validation library.
 */
export const topics = {
  nft: (nftId: string) => `nft:${nftId}`,
  /** Private: only the order owner's connection may subscribe. */
  order: (orderId: string) => `order:${orderId}`,
} as const

export const SUBSCRIBE = 'subscribe'
export const UNSUBSCRIBE = 'unsubscribe'
