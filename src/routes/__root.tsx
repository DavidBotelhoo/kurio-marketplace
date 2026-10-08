import { createRootRouteWithContext } from '@tanstack/react-router'

import { RootLayout } from '@/components/layout/root-layout'
import type { RouterContext } from '@/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [{ title: 'Kurio | Marketplace de NFTs' }],
  }),
  component: RootLayout,
})
