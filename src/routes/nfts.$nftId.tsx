import { createFileRoute, notFound } from '@tanstack/react-router'

import { NftDetailSkeleton } from '@/features/nft-detail/components/nft-detail-skeleton'
import { NftNotFound } from '@/features/nft-detail/components/nft-not-found'
import { NftDetailPage } from '@/features/nft-detail/nft-detail-page'
import { validateNftDetailSearch } from '@/features/nft-detail/search'
import { isApiError } from '@/lib/api/errors'

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: validateNftDetailSearch,
  // The detail is awaited (the page needs it, and an unknown id is a 404);
  // related NFTs load in parallel without blocking. Slow loads show the
  // skeleton after 200 ms. The query module loads outside the entry chunk.
  loader: async ({ context, params }) => {
    const { nftDetailQueryOptions, relatedQueryOptions } =
      await import('@/features/catalog/queries')
    void context.queryClient
      .query(relatedQueryOptions(params.nftId))
      .catch(() => undefined)
    try {
      const nft = await context.queryClient.query(
        nftDetailQueryOptions(params.nftId),
      )
      return { name: nft.name, description: nft.description }
    } catch (error) {
      if (isApiError(error) && error.code === 'NOT_FOUND') throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} | Kurio` },
          { name: 'description', content: loaderData.description },
        ]
      : [{ title: 'NFT não encontrado | Kurio' }],
  }),
  pendingMs: 200,
  pendingMinMs: 400,
  pendingComponent: NftDetailSkeleton,
  notFoundComponent: NftNotFound,
  // The mobile frame ends with the fixed purchase bar.
  staticData: { mobileFooter: false },
  component: NftDetailPage,
})
