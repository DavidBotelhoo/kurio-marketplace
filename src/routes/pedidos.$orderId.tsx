import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/pedidos/$orderId')({
  head: () => ({ meta: [{ title: 'Confirmação de pedido | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Confirmação de pedido" />,
})
