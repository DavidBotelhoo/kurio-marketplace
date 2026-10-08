import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Carrinho de NFTs" />,
})
