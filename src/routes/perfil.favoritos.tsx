import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/perfil/favoritos')({
  head: () => ({ meta: [{ title: 'Lista de interesse | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Lista de interesse" />,
})
