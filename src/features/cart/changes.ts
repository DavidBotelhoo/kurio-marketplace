import type { CartItem, CartResponse } from '@/contracts/cart'
import { formatEth } from '@/features/catalog/format'

const unitsLeft = (count: number) =>
  count === 1 ? 'Resta 1 unidade' : `Restam ${String(count)} unidades`

/**
 * User notices for what changed in the cart lines of one NFT between two API
 * responses (price, sold out, fewer units). Only server-computed fields are
 * compared, so the client never re-implements availability rules.
 */
export function describeCartChanges(
  before: readonly CartItem[],
  after: CartResponse,
): { itemId: string; message: string }[] {
  return before.flatMap((previous) => {
    const next = after.items.find((item) => item.id === previous.id)
    if (!next) return []
    const name = `${next.nft.name} (edição ${next.edition.label})`
    if (next.issue === 'sold-out' && previous.issue !== 'sold-out') {
      return [
        {
          itemId: next.id,
          message: `${name} esgotou. Remova o item do carrinho para finalizar a compra.`,
        },
      ]
    }
    if (
      next.issue === 'quantity-unavailable' &&
      next.maxQuantity !== previous.maxQuantity
    ) {
      return [
        {
          itemId: next.id,
          message: `${unitsLeft(next.maxQuantity)} de ${name}. Ajuste a quantidade no carrinho.`,
        },
      ]
    }
    if (next.unitPriceEth !== previous.unitPriceEth) {
      return [
        {
          itemId: next.id,
          message: `O preço de ${name} mudou de ${formatEth(previous.unitPriceEth)} para ${formatEth(next.unitPriceEth)}.`,
        },
      ]
    }
    return []
  })
}
