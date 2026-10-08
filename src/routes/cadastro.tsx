import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/cadastro')({
  head: () => ({ meta: [{ title: 'Criar conta | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Criar perfil de colecionador" />,
})
