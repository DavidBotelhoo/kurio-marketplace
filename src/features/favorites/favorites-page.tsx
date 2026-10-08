import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { topics } from '@/contracts/realtime-topics'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import {
  NftCard,
  NftCardSkeleton,
} from '@/features/catalog/components/nft-card'
import { useRealtimeTopics } from '@/lib/realtime/hooks'

import { useFavorites } from './queries'

const GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-2 md:gap-x-[1.75rem] md:gap-y-12 lg:grid-cols-3'

const IMAGE_SIZES =
  '(min-width: 1280px) 258px, (min-width: 1024px) 20vw, (min-width: 768px) 30vw, 46vw'

function countLabel(count: number) {
  return count === 1 ? '1 NFT salvo' : `${String(count)} NFTs salvos`
}

/**
 * "Lista de interesse": the collector's favorites, most recent first.
 * Removing one (heart) is optimistic, like everywhere else; prices follow
 * realtime updates.
 */
export function FavoritesPage() {
  const query = useFavorites()
  const items = query.data?.items ?? []
  const headingRef = useRef<HTMLHeadingElement>(null)
  const count = items.length
  const previousCount = useRef(count)

  useRealtimeTopics(items.map((item) => topics.nft(item.nftId)))

  // A removed card takes the focused heart with it: keep the user here.
  useEffect(() => {
    if (
      count < previousCount.current &&
      document.activeElement === document.body
    ) {
      headingRef.current?.focus()
    }
    previousCount.current = count
  }, [count])

  let content: React.ReactNode
  if (query.isPending) {
    content = (
      <ul aria-hidden="true" className={GRID_CLASS}>
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    )
  } else if (query.isError && !query.data) {
    content = (
      <div role="alert" className="grid justify-items-start gap-3">
        <p className="text-15 text-muted-foreground">
          Não foi possível carregar sua lista de interesse.
        </p>
        <Button
          variant="secondary"
          disabled={query.isFetching}
          onClick={() => {
            void query.refetch()
          }}
        >
          Tentar novamente
        </Button>
      </div>
    )
  } else if (count === 0) {
    content = (
      <div className="grid justify-items-center gap-4 rounded-md bg-card px-6 py-14 text-center">
        <p className="text-18 font-bold">Sua lista está vazia</p>
        <p className="max-w-sm text-14 text-muted-foreground">
          Toque no coração de um NFT para guardá-lo aqui e acompanhar o preço.
        </p>
        <Button asChild className="mt-2">
          <Link to="/" hash={CATALOG_ANCHOR}>
            Explorar o mercado
          </Link>
        </Button>
      </div>
    )
  } else {
    content = (
      <ul className={GRID_CLASS}>
        {items.map((item) => (
          <li key={item.nftId}>
            <NftCard nft={item.nft} imageSizes={IMAGE_SIZES} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby="favorites-title" aria-busy={query.isPending}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1
          id="favorites-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-16 font-bold outline-none"
        >
          Lista de interesse
        </h1>
        {query.data ? (
          <p role="status" className="text-14 text-muted-foreground">
            {countLabel(count)}
          </p>
        ) : null}
      </div>
      <p className="mt-2 text-14 text-muted-foreground">
        Os NFTs que você favoritou, do mais recente ao mais antigo.
      </p>
      <div className="mt-8">{content}</div>
    </section>
  )
}
