import { useQuery } from '@tanstack/react-query'

import { Carousel } from '@/components/carousel'
import { topics } from '@/contracts/realtime-topics'
import { NftCard } from '@/features/catalog/components/nft-card'
import { nftListQueryOptions } from '@/features/catalog/queries'
import { toListParams } from '@/features/catalog/search'
import { useRealtimeTopics } from '@/lib/realtime/hooks'

const POPULAR = toListParams({ sort: 'popular' })
const ITEM_CLASS =
  'basis-[calc((100%-2*1.5rem)/3)] lg:basis-[calc((100%-4*1.625rem)/5)]'
const IMAGE_SIZES = '(min-width: 1280px) 213px, (min-width: 1024px) 17vw, 30vw'

/** "Colecionadores também viram": popular NFTs not already in the cart. */
export function Recommendations({
  excludeIds,
  className,
}: {
  excludeIds: readonly string[]
  className?: string
}) {
  const { data } = useQuery(nftListQueryOptions(POPULAR))
  const items = (data?.items ?? []).filter(
    (item) => !excludeIds.includes(item.id),
  )
  useRealtimeTopics(items.map((item) => topics.nft(item.id)))
  if (items.length === 0) return null

  return (
    <section aria-labelledby="recommendations-title" className={className}>
      <h2
        id="recommendations-title"
        className="border-b border-primary/30 pb-3 text-17 font-bold text-highlight"
      >
        Colecionadores também viram
      </h2>
      <Carousel
        className="mt-8"
        label="NFTs populares"
        itemClassName={ITEM_CLASS}
        gapClassName="gap-6 lg:gap-[1.625rem]"
        items={items.map((item) => ({
          key: item.id,
          node: <NftCard nft={item} compact imageSizes={IMAGE_SIZES} />,
        }))}
      />
    </section>
  )
}
