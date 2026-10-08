import { createFileRoute } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'

export const Route = createFileRoute('/nfts/$nftId')({
  head: () => ({ meta: [{ title: 'Detalhes do NFT | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Detalhes do NFT" />,
})
