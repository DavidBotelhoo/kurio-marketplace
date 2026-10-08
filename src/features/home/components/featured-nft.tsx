import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Skeleton } from '@/components/ui/skeleton'
import { topics } from '@/contracts/realtime-topics'
import { EthPrice } from '@/features/catalog/components/eth-price'
import { NftImage } from '@/features/catalog/components/nft-image'
import { highlightsQueryOptions } from '@/features/catalog/queries'
import { useRealtimeTopics } from '@/lib/realtime/hooks'

/**
 * "NFT em destaque · Oferta limitada" under the catalog filters (desktop).
 * The name and price over the artwork are not in Figma; without them the
 * offer would not say what or how much.
 */
export function FeaturedNft() {
  const { data, isPending } = useQuery(highlightsQueryOptions())
  const featured = data?.featured
  useRealtimeTopics(featured ? [topics.nft(featured.id)] : [])

  if (!isPending && !featured) return null

  return (
    <section
      aria-labelledby="featured-title"
      className="relative overflow-hidden bg-linear-to-b from-primary/10 to-primary/[0.03] pt-[1.6875rem]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[18.75rem] left-[1.0625rem] size-5 rounded-md border-2 border-[#46a358]/80"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[21.4rem] right-5 size-[2.8125rem] rounded-full bg-linear-to-b from-primary to-primary/0"
      />
      <h2 id="featured-title" className="px-5 text-24 font-bold text-highlight">
        NFT EM DESTAQUE
      </h2>
      <p className="mt-3.5 text-center text-22 font-bold">OFERTA LIMITADA</p>
      <div className="relative mt-[1.125rem] aspect-[310/368]">
        {featured ? (
          <Link
            to="/nfts/$nftId"
            params={{ nftId: featured.id }}
            className="group block size-full rounded-[1.375rem] outline-offset-4"
          >
            <NftImage
              image={featured.image}
              sizes="310px"
              className="size-full rounded-[1.375rem] object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 grid gap-0.5 rounded-b-[1.375rem] bg-linear-to-t from-background/90 to-transparent px-5 pt-10 pb-4">
              <span className="text-16 text-foreground group-hover:underline">
                {featured.name}
              </span>
              <span className="text-18">
                <EthPrice
                  amount={featured.priceEth}
                  previous={featured.compareAtPriceEth}
                />
              </span>
            </span>
          </Link>
        ) : (
          <Skeleton className="size-full rounded-[1.375rem]" />
        )}
      </div>
    </section>
  )
}
