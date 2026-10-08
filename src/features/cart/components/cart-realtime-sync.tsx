import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { CartResponse } from '@/contracts/cart'
import { topics } from '@/contracts/realtime-topics'
import { useRealtimeEvent, useRealtimeTopics } from '@/lib/realtime/hooks'

import { describeCartChanges } from '../changes'
import { cartQueryOptions, useCart, useCartIdentity } from '../queries'

/**
 * Follows the NFTs in the cart on any page: a price or availability change
 * refetches the cart from the API (the source of its totals and limits) and
 * tells the shopper what changed.
 */
export function CartRealtimeSync() {
  const queryClient = useQueryClient()
  const identity = useCartIdentity()
  const items = useCart().data?.items ?? []

  useRealtimeTopics(items.map((item) => topics.nft(item.nft.id)))

  useRealtimeEvent('nft.updated', (event) => {
    // Stale or duplicated events carry a version the cart already reflects.
    const affected = items.filter(
      (item) =>
        item.nft.id === event.resource.id && event.version > item.nft.version,
    )
    if (affected.length === 0) return
    const { queryKey } = cartQueryOptions(identity)
    void queryClient.invalidateQueries({ queryKey }).then(() => {
      const next = queryClient.getQueryData<CartResponse>(queryKey)
      if (!next) return
      for (const { itemId, message } of describeCartChanges(affected, next)) {
        toast.info(message, { id: `cart-change-${itemId}` })
      }
    })
  })

  return null
}
