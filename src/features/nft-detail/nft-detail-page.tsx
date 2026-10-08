import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useId, useState } from 'react'

import type { Edition, NftDetail } from '@/contracts/catalog'
import { topics } from '@/contracts/realtime-topics'
import { EthPrice } from '@/features/catalog/components/eth-price'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { formatEth } from '@/features/catalog/format'
import { useChangedFlag } from '@/features/catalog/hooks/use-changed-flag'
import { nftDetailQueryOptions } from '@/features/catalog/queries'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { useRealtimeEvent, useRealtimeTopics } from '@/lib/realtime/hooks'
import { cn } from '@/lib/utils'

import { EditionPicker, EditionStatus } from './components/edition-picker'
import { DesktopGallery, MobileGallery } from './components/gallery'
import { InfoTabs } from './components/info-tabs'
import {
  MobileTopBar,
  PurchaseActions,
  PurchaseBar,
} from './components/purchase'
import { RatingChip, RatingSummary } from './components/rating'
import { RelatedSection } from './components/related-section'
import { ShareLinks } from './components/share-links'
import { TokenFacts } from './components/token-facts'
import { type Purchase, usePurchase } from './use-purchase'

const route = getRouteApi('/nfts/$nftId')

interface LayoutProps {
  nft: NftDetail
  edition: Edition | undefined
  purchase: Purchase
  statusId: string
  onSelectEdition: (editionId: string) => void
}

/** Live-region text for realtime changes of the NFT being viewed. */
function useRealtimeAnnouncement(nft: NftDetail, edition: Edition | undefined) {
  const [message, setMessage] = useState('')
  useRealtimeEvent('nft.updated', (event) => {
    if (event.resource.id !== nft.id || event.version <= nft.version) return
    const next = event.data.editions.find((item) => item.id === edition?.id)
    if (!next || !edition) return
    const parts = []
    if (next.priceEth !== edition.priceEth) {
      parts.push(`preço atualizado para ${formatEth(next.priceEth)}`)
    }
    if (
      next.status !== edition.status ||
      next.available !== edition.available
    ) {
      parts.push(
        next.status === 'sold-out'
          ? 'edição esgotada'
          : 'disponibilidade atualizada',
      )
    }
    if (parts.length) {
      setMessage(`Edição ${edition.label}: ${parts.join(', ')}.`)
    }
  })
  return message
}

function EditionBlock({
  nft,
  edition,
  purchase,
  statusId,
  onSelectEdition,
  className,
}: LayoutProps & { className?: string }) {
  return (
    <div className={className}>
      <EditionPicker
        editions={nft.editions}
        selectedId={edition?.id}
        onSelect={onSelectEdition}
        describedBy={statusId}
      />
      <EditionStatus
        id={statusId}
        edition={edition}
        allSoldOut={nft.availability === 'sold-out'}
        inCart={purchase.inCart}
        remaining={purchase.remaining}
        className="mt-2.5"
      />
    </div>
  )
}

function DesktopLayout(props: LayoutProps) {
  const { nft, edition } = props
  const priceChanged = useChangedFlag(nft.version)
  const price = edition?.priceEth ?? nft.priceEth
  // The struck-through price belongs to the default edition (card price).
  const previous =
    edition?.id === nft.defaultEditionId ? nft.compareAtPriceEth : null

  return (
    <div className="container-page pt-7 pb-6">
      <nav aria-label="Trilha de navegação">
        <ol className="flex flex-wrap gap-1.5 text-15 font-bold text-foreground">
          <li>
            <Link to="/" className="hover:text-highlight">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash={CATALOG_ANCHOR} className="hover:text-highlight">
              Mercado
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mt-3 grid gap-8 md:grid-cols-2 xl:grid-cols-[35.75rem_minmax(0,1fr)] xl:gap-[2.0625rem]">
        <DesktopGallery nft={nft} />

        <div className="min-w-0">
          <h1 className="text-24 leading-[1.2] font-bold xl:text-28">
            {nft.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-primary/30 pb-2.5">
            <p
              className={cn(
                'rounded-sm text-22 transition-colors',
                priceChanged &&
                  'animate-pulse bg-primary/15 motion-reduce:animate-none',
              )}
            >
              <EthPrice
                amount={price}
                previous={previous}
                previousClassName="text-16"
              />
            </p>
            <RatingSummary
              average={nft.rating.average}
              count={nft.rating.count}
            />
          </div>

          <h2 className="mt-6 text-15 font-bold">Sobre este NFT:</h2>
          <p className="mt-2.5 max-w-[36rem] text-14 leading-[1.55] text-muted-foreground">
            {nft.description}
          </p>

          <EditionBlock {...props} className="mt-4" />
          <div className="mt-5">
            <PurchaseActions {...props} />
          </div>
          <TokenFacts nft={nft} className="mt-6" />
          <ShareLinks
            name={nft.name}
            path={`/nfts/${nft.id}`}
            className="mt-3"
          />
        </div>
      </div>

      <InfoTabs nft={nft} className="mt-16 xl:mt-20" />
      <RelatedSection nftId={nft.id} className="mt-20 xl:mt-24" />
    </div>
  )
}

function MobileLayout(props: LayoutProps) {
  const { nft } = props
  return (
    <div>
      <div className="bg-linear-135 from-card to-muted">
        <MobileTopBar nft={nft} />
        <div className="px-[1.625rem]">
          <MobileGallery nft={nft} />
        </div>
      </div>
      <div className="relative -mt-[1.875rem] rounded-t-[1.9375rem] bg-card px-6 pt-9 pb-[calc(12.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-20 leading-[1.25] font-bold">{nft.name}</h1>
          <RatingChip average={nft.rating.average} count={nft.rating.count} />
        </div>
        <p className="mt-4 text-14 leading-[1.7] text-muted-foreground">
          {nft.description}
        </p>
        <EditionBlock {...props} className="mt-4" />
        <TokenFacts nft={nft} className="mt-4" />
        <InfoTabs nft={nft} className="mt-10" />
        <RelatedSection nftId={nft.id} className="mt-12" />
      </div>
      <PurchaseBar {...props} />
    </div>
  )
}

/**
 * NFT detail. The route loader guarantees the data (or a 404); realtime
 * events keep price and availability current while the page is open.
 */
export function NftDetailPage() {
  const { nftId } = route.useParams()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data: nft } = useSuspenseQuery(nftDetailQueryOptions(nftId))
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const statusId = useId()

  const edition =
    nft.editions.find((item) => item.id === search.edition) ??
    nft.editions.find((item) => item.id === nft.defaultEditionId) ??
    nft.editions[0]
  const purchase = usePurchase(nft, edition)
  const announcement = useRealtimeAnnouncement(nft, edition)
  useRealtimeTopics([topics.nft(nft.id)])

  const props: LayoutProps = {
    nft,
    edition,
    purchase,
    statusId,
    // The edition lives in the URL (shareable); the default one is implicit.
    onSelectEdition: (editionId) => {
      void navigate({
        search:
          editionId === nft.defaultEditionId ? {} : { edition: editionId },
        replace: true,
        resetScroll: false,
      })
    },
  }

  return (
    <article>
      {desktop ? <DesktopLayout {...props} /> : <MobileLayout {...props} />}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </article>
  )
}
