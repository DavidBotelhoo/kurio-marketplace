import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { CartItem } from '@/contracts/cart'
import { multiplyEth } from '@/lib/eth'

import { notifyCartError } from './notices'
import { useAddToCart, useRemoveCartItem, useUpdateCartItem } from './queries'

/** Pause after the last click before the quantity is sent. */
const QUANTITY_DEBOUNCE_MS = 400

/**
 * Quantity and removal of one cart line. Clicks update the stepper at once
 * and a single request carries the last value; the API answer (or its
 * error) then replaces the local value.
 */
export function useCartLine(item: CartItem) {
  const { mutate: update, isPending: updating } = useUpdateCartItem()
  const { mutate: remove, isPending: removing } = useRemoveCartItem()
  const { mutate: add } = useAddToCart()
  const [draft, setDraft] = useState<number | null>(null)
  const quantity = draft ?? item.quantity
  const name = `${item.nft.name} (edição ${item.edition.label})`

  useEffect(() => {
    if (draft === null || draft === item.quantity) return undefined
    const timer = setTimeout(() => {
      update(
        { itemId: item.id, quantity: draft },
        {
          onError: notifyCartError,
          onSettled: () => {
            // Keep a newer choice made while this request was running.
            setDraft((current) => (current === draft ? null : current))
          },
        },
      )
    }, QUANTITY_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [draft, item.id, item.quantity, update])

  const removeLine = () => {
    const { nft, edition } = item
    const removedQuantity = quantity
    remove(item.id, {
      onSuccess: () => {
        toast.success(`${name} foi removido do carrinho.`, {
          action: {
            label: 'Desfazer',
            onClick: () => {
              add(
                {
                  nftId: nft.id,
                  editionId: edition.id,
                  quantity: removedQuantity,
                },
                { onError: notifyCartError },
              )
            },
          },
        })
      },
      onError: notifyCartError,
    })
  }

  return {
    name,
    quantity,
    /** Line total for the quantity on screen (the API total once synced). */
    lineTotalEth:
      draft === null
        ? item.lineTotalEth
        : multiplyEth(item.unitPriceEth, quantity),
    setQuantity: setDraft,
    /** Lowering is always allowed; raising stops at what the API accepts. */
    max: Math.max(item.maxQuantity, Math.min(quantity, item.quantity)),
    busy: updating || removing || (draft !== null && draft !== item.quantity),
    removing,
    remove: removeLine,
  }
}
