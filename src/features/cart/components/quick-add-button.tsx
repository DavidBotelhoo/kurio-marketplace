import { useNavigate } from '@tanstack/react-router'

import { ShoppingCartIcon } from '@/components/icons'
import type { NftSummary } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

import { notifyAddedToCart, notifyCartError } from '../notices'
import { useAddToCart } from '../queries'

/** Adds one unit of the NFT's default edition (card shortcut). */
export function QuickAddButton({
  nft,
  className,
  iconClassName,
}: {
  nft: NftSummary
  className?: string
  iconClassName?: string
}) {
  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const soldOut = nft.availability === 'sold-out'

  return (
    <button
      type="button"
      aria-label={
        soldOut ? `${nft.name} esgotado` : `Adicionar ${nft.name} ao carrinho`
      }
      disabled={soldOut || addToCart.isPending}
      aria-busy={addToCart.isPending}
      onClick={() => {
        addToCart.mutate(
          { nftId: nft.id, editionId: nft.defaultEditionId, quantity: 1 },
          {
            onSuccess: () => {
              notifyAddedToCart(nft.name, () => {
                void navigate({ to: '/carrinho' })
              })
            },
            onError: notifyCartError,
          },
        )
      }}
      className={cn(
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <ShoppingCartIcon className={iconClassName} />
    </button>
  )
}
