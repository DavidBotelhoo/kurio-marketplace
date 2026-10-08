import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/_authenticated/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Pagamento" />,
})
