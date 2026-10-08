import { createFileRoute } from '@tanstack/react-router'

import { toListParams, validateCatalogSearch } from '@/features/catalog/search'
import { HomePage } from '@/features/home/home-page'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => toListParams(search),
  // Starts both requests without blocking the navigation: skeletons render
  // right away and data arrives in parallel with the screen's code. The query
  // module (HTTP client + schemas) is loaded on demand, outside the entry chunk.
  loader: async ({ context, deps }) => {
    const { highlightsQueryOptions, nftListQueryOptions } =
      await import('@/features/catalog/queries')
    const noop = () => undefined
    void context.queryClient.query(nftListQueryOptions(deps)).catch(noop)
    void context.queryClient.query(highlightsQueryOptions()).catch(noop)
  },
  head: () => ({ meta: [{ title: 'Kurio | Marketplace de NFTs' }] }),
  staticData: { mobileTabBar: true },
  component: HomePage,
})
