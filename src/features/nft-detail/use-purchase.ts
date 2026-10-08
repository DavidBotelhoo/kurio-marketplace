import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import type { Edition, NftDetail } from '@/contracts/catalog'
import { notifyAddedToCart, notifyCartError } from '@/features/cart/notices'
import { useAddToCart, useCart } from '@/features/cart/queries'

/**
 * Quantity and purchase actions for the selected edition. Limits come from
 * the API: the edition's per-order limit (never above the units left) and,
 * when the edition is already in the cart, what that line can still take.
 */
export function usePurchase(nft: NftDetail, edition: Edition | undefined) {
  const navigate = useNavigate()
  const { data: cart } = useCart()
  const addToCart = useAddToCart()
  const [choice, setChoice] = useState({ editionId: edition?.id, quantity: 1 })

  const line = edition
    ? cart?.items.find(
        (item) => item.nft.id === nft.id && item.edition.id === edition.id,
      )
    : undefined
  const inCart = line?.quantity ?? 0
  const soldOut = !edition || edition.status === 'sold-out'
  const limit = soldOut ? 0 : (line?.maxQuantity ?? edition.maxPerOrder)
  /** Units this edition can still add to the cart. */
  const remaining = Math.max(0, limit - inCart)
  // A new edition starts again at 1; a lower limit (realtime) caps the value.
  const requested = choice.editionId === edition?.id ? choice.quantity : 1
  const quantity = Math.min(Math.max(requested, 1), Math.max(remaining, 1))

  const openCart = () => {
    void navigate({ to: '/carrinho' })
  }

  const add = (thenOpenCart: boolean) => {
    if (!edition || soldOut) return
    if (remaining === 0) {
      // Everything allowed is already in the cart: buying continues there.
      if (thenOpenCart) openCart()
      return
    }
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () => {
          setChoice({ editionId: edition.id, quantity: 1 })
          if (thenOpenCart) openCart()
          else
            notifyAddedToCart(`${nft.name} (edição ${edition.label})`, openCart)
        },
        onError: notifyCartError,
      },
    )
  }

  return {
    soldOut,
    inCart,
    remaining,
    quantity,
    setQuantity: (value: number) => {
      setChoice({ editionId: edition?.id, quantity: value })
    },
    pending: addToCart.isPending,
    /** Adds and stays on the page. */
    add: () => {
      add(false)
    },
    /** Adds and continues to the cart. */
    buy: () => {
      add(true)
    },
  }
}

export type Purchase = ReturnType<typeof usePurchase>
