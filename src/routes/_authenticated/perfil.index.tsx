import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/_authenticated/perfil/')({
  head: () => ({ meta: [{ title: 'Meu perfil | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Perfil do colecionador" />,
})
