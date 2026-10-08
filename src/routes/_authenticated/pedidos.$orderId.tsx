import { createFileRoute } from '@tanstack/react-router'

import { OrderPage } from '@/features/orders/order-page'

export const Route = createFileRoute('/_authenticated/pedidos/$orderId')({
  head: () => ({ meta: [{ title: 'Confirmação de pedido | Kurio' }] }),
  staticData: { mobileFooter: false },
  component: OrderPage,
})
