import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/perfil/carteiras')({
  head: () => ({ meta: [{ title: 'Carteiras | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Carteiras" />,
})
