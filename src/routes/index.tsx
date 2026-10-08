import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/features/home/home-page'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Kurio | Marketplace de NFTs' }] }),
  staticData: { mobileTabBar: true },
  component: HomePage,
})
