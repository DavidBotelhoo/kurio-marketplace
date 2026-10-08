import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Entrar | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Entrar" />,
})
