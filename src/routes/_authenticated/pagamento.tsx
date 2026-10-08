import { createFileRoute } from '@tanstack/react-router'

import { PaymentPage } from '@/features/checkout/payment-page'

export const Route = createFileRoute('/_authenticated/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento | Kurio' }] }),
  // The mobile frame ends with the "Confirmar compra" button.
  staticData: { mobileFooter: false },
  component: PaymentPage,
})
