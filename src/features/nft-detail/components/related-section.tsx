import { useQuery } from '@tanstack/react-query'

import { Carousel } from '@/components/carousel'
import { Button } from '@/components/ui/button'
import { topics } from '@/contracts/realtime-topics'
import {
  NftCard,
  NftCardSkeleton,
} from '@/features/catalog/components/nft-card'
import { relatedQueryOptions } from '@/features/catalog/queries'
import { useRealtimeTopics } from '@/lib/realtime/hooks'
import { cn } from '@/lib/utils'

/** 2 cards per view on phones, 3 on tablets, 5 on desktop (Figma 219px). */
const ITEM_CLASS =
  'basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2*1.5rem)/3)] lg:basis-[calc((100%-4*1.625rem)/5)]'
const GAP_CLASS = 'gap-4 md:gap-6 lg:gap-[1.625rem]'
const RELATED_IMAGE_SIZES =
  '(min-width: 1280px) 213px, (min-width: 1024px) 17vw, (min-width: 768px) 30vw, 45vw'

/** "Mais desta coleção": same collection first, then the same category. */
export function RelatedSection({
  nftId,
  className,
}: {
  nftId: string
  className?: string
}) {
  const query = useQuery(relatedQueryOptions(nftId))
  const items = query.data?.items ?? []
  useRealtimeTopics(items.map((item) => topics.nft(item.id)))

  if (query.isSuccess && items.length === 0) return null

  return (
    <section aria-labelledby="related-title" className={className}>
      <h2
        id="related-title"
        className="border-b border-primary/30 pb-3 text-15 font-bold text-highlight md:text-17"
      >
        Mais desta coleção
      </h2>
      <div className="mt-8">
        {query.isPending ? (
          <ul
            aria-hidden="true"
            className={cn('flex overflow-hidden', GAP_CLASS)}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index} className={cn('shrink-0', ITEM_CLASS)}>
                <NftCardSkeleton />
              </li>
            ))}
          </ul>
        ) : query.isError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3">
            <p className="text-14 text-muted-foreground">
              Não foi possível carregar outros NFTs desta coleção.
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={query.isFetching}
              onClick={() => {
                void query.refetch()
              }}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <Carousel
            label="NFTs relacionados"
            itemClassName={ITEM_CLASS}
            gapClassName={GAP_CLASS}
            items={items.map((item) => ({
              key: item.id,
              node: (
                <NftCard nft={item} compact imageSizes={RELATED_IMAGE_SIZES} />
              ),
            }))}
          />
        )}
      </div>
    </section>
  )
}
