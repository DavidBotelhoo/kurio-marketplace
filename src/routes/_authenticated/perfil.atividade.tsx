import { createFileRoute } from '@tanstack/react-router'

import { ActivityPage } from '@/features/orders/activity-page'

export const Route = createFileRoute('/_authenticated/perfil/atividade')({
  head: () => ({ meta: [{ title: 'Atividade | Kurio' }] }),
  component: ActivityPage,
})
