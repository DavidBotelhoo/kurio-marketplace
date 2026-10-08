import { useMemo, useState } from 'react'

import { DangerTriangleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { NFT_PAGE_SIZE } from '@/contracts/catalog-taxonomy'
import { topics } from '@/contracts/realtime-topics'
import { isApiError } from '@/lib/api/errors'
import { useRealtimeEvent, useRealtimeTopics } from '@/lib/realtime/hooks'
import { cn } from '@/lib/utils'

import { formatEth } from '../format'
import {
  useCatalogNavigate,
  useCatalogQuery,
  useCatalogSearch,
} from '../hooks/use-catalog'
import { hasActiveFilters } from '../search'
import { CatalogPagination } from './catalog-pagination'
import { NftCard, NftCardSkeleton } from './nft-card'

const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-[1.375rem] max-md:pb-8 max-md:[&>*:nth-child(even)]:translate-y-8 md:grid-cols-3 md:gap-x-[2.125rem] md:gap-y-[4.25rem] lg:grid-cols-2 xl:grid-cols-3'

function countLabel(total: number) {
  if (total === 0) return 'Nenhum NFT encontrado.'
  return total === 1
    ? '1 NFT encontrado.'
    : `${String(total)} NFTs encontrados.`
}

function EmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean
  onClear: () => void
}) {
  return (
    <div className="grid justify-items-center gap-3 rounded-sm border border-dashed border-border-strong px-6 py-16 text-center">
      <p className="text-18 font-bold text-foreground">Nenhum NFT encontrado</p>
      <p className="max-w-sm text-14 text-muted-foreground">
        {filtered
          ? 'Nenhum item corresponde à busca e aos filtros selecionados. Remova algum filtro ou tente outros termos.'
          : 'Ainda não há NFTs disponíveis no catálogo.'}
      </p>
      {filtered ? (
        <Button variant="outline" className="mt-2" onClick={onClear}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string
  onRetry: () => void
  retrying: boolean
}) {
  return (
    <div
      role="alert"
      className="grid justify-items-center gap-3 rounded-sm border border-destructive/60 bg-destructive/5 px-6 py-16 text-center"
    >
      <DangerTriangleIcon
        aria-hidden="true"
        className="size-6 text-destructive"
      />
      <p className="text-18 font-bold text-foreground">
        Não foi possível carregar o catálogo
      </p>
      <p className="max-w-sm text-14 text-muted-foreground">{message}</p>
      <Button className="mt-2" onClick={onRetry} disabled={retrying}>
        {retrying ? 'Tentando novamente…' : 'Tentar novamente'}
      </Button>
    </div>
  )
}

/** Grid with loading, empty, error, out-of-range and background-refresh states. */
export function CatalogResults() {
  const search = useCatalogSearch()
  const navigateCatalog = useCatalogNavigate()
  const query = useCatalogQuery()
  const { data } = query
  const [announcement, setAnnouncement] = useState('')

  const visibleIds = useMemo(
    () => data?.items.map((item) => item.id) ?? [],
    [data],
  )
  useRealtimeTopics(visibleIds.map(topics.nft))

  // Announce real-time changes of visible NFTs (state is patched in the cache).
  useRealtimeEvent('nft.updated', (event) => {
    const nft = data?.items.find((item) => item.id === event.resource.id)
    if (!nft) return
    const parts = []
    if (event.data.changes.includes('price')) {
      parts.push(`preço atualizado para ${formatEth(event.data.priceEth)}`)
    }
    if (event.data.changes.includes('availability')) {
      parts.push(
        event.data.availability === 'sold-out'
          ? 'esgotado'
          : 'disponibilidade atualizada',
      )
    }
    setAnnouncement(`${nft.name}: ${parts.join(', ')}.`)
  })

  const clearFilters = () => {
    navigateCatalog({ ...(search.sort ? { sort: search.sort } : {}) })
  }

  let content: React.ReactNode
  if (query.isPending) {
    content = (
      <ul className={gridClass} aria-hidden="true">
        {Array.from({ length: NFT_PAGE_SIZE }, (_, index) => (
          <li key={index}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    )
  } else if (!data) {
    content = (
      <ErrorState
        message={
          isApiError(query.error)
            ? query.error.message
            : 'Tente novamente em instantes.'
        }
        retrying={query.isFetching}
        onRetry={() => {
          void query.refetch()
        }}
      />
    )
  } else if (data.items.length === 0 && data.meta.totalItems > 0) {
    content = (
      <div className="grid justify-items-center gap-3 py-16 text-center">
        <p className="text-18 font-bold">Esta página não existe</p>
        <p className="text-14 text-muted-foreground">
          O catálogo tem {data.meta.totalPages} páginas para estes filtros.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            const { page: _page, ...rest } = search
            navigateCatalog(rest)
          }}
        >
          Ir para a primeira página
        </Button>
      </div>
    )
  } else if (data.items.length === 0) {
    content = (
      <EmptyState filtered={hasActiveFilters(search)} onClear={clearFilters} />
    )
  } else {
    content = (
      <>
        <ul
          className={cn(
            gridClass,
            query.isPlaceholderData && 'opacity-60 transition-opacity',
          )}
          aria-busy={query.isPlaceholderData}
        >
          {data.items.map((nft, index) => (
            <li key={nft.id}>
              <NftCard nft={nft} priority={index < 3} />
            </li>
          ))}
        </ul>
        <CatalogPagination
          search={search}
          page={data.meta.page}
          totalPages={data.meta.totalPages}
        />
      </>
    )
  }

  const refreshFailed = query.isRefetchError && Boolean(data)

  return (
    <div className="mt-7 md:mt-[1.75rem]">
      {/* Polite announcements: result counts and real-time changes. */}
      <p role="status" className="sr-only">
        {query.isPlaceholderData
          ? 'Atualizando resultados…'
          : data
            ? `${countLabel(data.meta.totalItems)} ${announcement}`
            : ''}
      </p>
      {refreshFailed ? (
        <p
          role="alert"
          className="mb-4 flex items-center gap-2 text-13 text-destructive"
        >
          <DangerTriangleIcon aria-hidden="true" className="size-4" />
          Não foi possível atualizar os resultados.
          <Button
            variant="link"
            size="inline"
            className="text-13"
            onClick={() => {
              void query.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </p>
      ) : null}
      {content}
    </div>
  )
}
