import { toast } from 'sonner'

import { isApiError } from '@/lib/api/errors'

/** Confirmation with a shortcut to the cart. */
export function notifyAddedToCart(itemName: string, openCart: () => void) {
  toast.success(`${itemName} foi adicionado ao carrinho.`, {
    action: { label: 'Ver carrinho', onClick: openCart },
  })
}

/** Failure of a cart write; the API message explains limits and stock. */
export function notifyCartError(error: unknown) {
  // An ended session has its own notice (see session-lifecycle).
  if (isApiError(error) && error.status === 401) return
  toast.error(
    isApiError(error)
      ? error.message
      : 'Não foi possível atualizar o carrinho. Tente novamente.',
  )
}
