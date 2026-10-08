import { createFileRoute } from '@tanstack/react-router'

import { CartPage } from '@/features/cart/cart-page'

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho | Kurio' }] }),
  // The mobile frame ends with the summary panel.
  staticData: { mobileFooter: false },
  component: CartPage,
})
