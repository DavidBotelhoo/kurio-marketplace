import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Kurio | Marketplace de NFTs' }] }),
  staticData: { mobileTabBar: true },
  component: () => <ScreenPlaceholder title="Início" />,
})
