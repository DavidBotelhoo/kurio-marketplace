import { Link } from '@tanstack/react-router'

import { SearchIcon } from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '@/contracts/catalog'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { cn } from '@/lib/utils'

import { useChangedFlag } from '../hooks/use-changed-flag'
import { EthPrice } from './eth-price'
import { NftImage } from './nft-image'

const RARITY_LABEL = { raro: 'RARO', lendario: 'LENDÁRIO' } as const

const cardActionClass =
  'pointer-events-auto relative size-[1.6875rem] place-items-center rounded-full border border-border bg-muted text-primary transition-colors after:absolute after:-inset-2 hover:border-border-strong hover:text-highlight md:size-[2.125rem] md:rounded-[0.21875rem] md:text-foreground md:after:content-none md:data-[favorite=true]:text-primary'

/** Card widths per layout (staggered mobile grid, 3/2/3 columns above). */
export const CARD_IMAGE_SIZES =
  '(min-width: 1280px) 258px, (min-width: 1024px) 300px, (min-width: 768px) 31vw, 46vw'

interface NftCardProps {
  nft: NftSummary
  priority?: boolean
}

/*
 * Catalog card. Mobile (Figma 414 frame): rounded surface with a 168px image
 * and a round favorite button. Desktop (1440 frame): 258×300 surface with a
 * centered 250px image; the actions appear on hover or keyboard focus (always
 * on touch screens). Actions are siblings of the link: no buttons inside <a>.
 */
export function NftCard({ nft, priority = false }: NftCardProps) {
  const updated = useChangedFlag(nft.version)
  const soldOut = nft.availability === 'sold-out'
  const rarity = nft.rarity === 'comum' ? null : RARITY_LABEL[nft.rarity]

  return (
    <article className="group relative">
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="block rounded-[1.25rem] outline-offset-4 md:rounded-none"
      >
        <div className="relative grid aspect-[175/200] place-items-center overflow-hidden rounded-[1.25rem] bg-linear-to-b from-card to-muted md:aspect-[258/300] md:rounded-none md:bg-card md:from-card md:to-card md:group-focus-within:shadow-[inset_0_1px_0_var(--color-primary)] md:group-hover:shadow-[inset_0_1px_0_var(--color-primary)]">
          <NftImage
            image={nft.image}
            sizes={CARD_IMAGE_SIZES}
            priority={priority}
            className={cn(
              'aspect-square w-[96%] rounded-[1rem] object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none md:w-[97%] md:rounded-[0.9375rem]',
              soldOut && 'opacity-60 grayscale-[35%]',
            )}
          />
          {rarity ? (
            <span className="absolute top-[6%] left-0 bg-primary px-2 py-1.5 text-13 font-medium text-primary-foreground md:top-0">
              {rarity}
            </span>
          ) : null}
          {soldOut ? (
            <span className="absolute right-2 bottom-2 rounded-sm bg-background/90 px-2 py-1 text-12 font-bold tracking-brand text-foreground">
              ESGOTADO
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 line-clamp-2 px-2 text-15 text-foreground md:mt-3 md:px-0 md:text-16">
          {nft.name}
        </h3>
      </Link>
      <div className="pointer-events-none absolute top-3 right-2.5 flex gap-[0.6875rem] transition-opacity motion-reduce:transition-none md:top-0 md:right-0 md:left-0 md:aspect-[258/300] md:items-end md:justify-center md:pb-[2.9%] md:group-focus-within:opacity-100 md:pointer-fine:opacity-0 md:pointer-fine:group-hover:opacity-100">
        <FavoriteButton
          nft={nft}
          className={cardActionClass}
          iconClassName="size-[0.9375rem] md:size-5"
        />
        {/* Mouse shortcut to the details; the card link already covers it. */}
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          tabIndex={-1}
          aria-hidden="true"
          className={cn(cardActionClass, 'hidden md:grid')}
        >
          <SearchIcon className="size-[1.125rem]" />
        </Link>
      </div>
      <p
        className={cn(
          'mt-0.5 px-2 text-16 transition-colors md:mt-1.5 md:px-0 md:text-18',
          updated &&
            'animate-pulse rounded-sm bg-primary/15 motion-reduce:animate-none',
        )}
      >
        <EthPrice amount={nft.priceEth} previous={nft.compareAtPriceEth} />
      </p>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid aspect-[175/200] place-items-center rounded-[1.25rem] bg-card md:aspect-[258/300] md:rounded-none">
        <Skeleton className="aspect-square w-[96%] rounded-[1rem] md:w-[97%] md:rounded-[0.9375rem]" />
      </div>
      <div className="mt-2 grid gap-1.5 px-2 md:mt-3 md:px-0">
        <Skeleton className="h-[1.1rem] w-3/4 rounded-sm" />
        <Skeleton className="h-[1.3rem] w-1/3 rounded-sm" />
      </div>
    </div>
  )
}
