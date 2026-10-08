import { useId } from 'react'

import { ChevronDownIcon, CloseIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  CATEGORIES,
  NETWORKS,
  type NftSort,
  type NftTab,
} from '@/contracts/catalog-taxonomy'
import { cn } from '@/lib/utils'

import { formatEthAmount } from '../format'
import {
  useCatalogNavigate,
  useCatalogSearch,
  useOptimisticCatalog,
} from '../hooks/use-catalog'
import { type CatalogSearch, hasActiveFilters, withFilters } from '../search'

const TABS: readonly { id: NftTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

const SORTS: readonly { id: NftSort; label: string }[] = [
  { id: 'recent', label: 'Listados recentemente' },
  { id: 'price-asc', label: 'Menor preço' },
  { id: 'price-desc', label: 'Maior preço' },
  { id: 'popular', label: 'Mais populares' },
]

export function CatalogTabs() {
  const [search, update] = useOptimisticCatalog()
  const active = search.tab ?? 'all'

  return (
    <div
      role="group"
      aria-label="Seções do catálogo"
      className="-mx-1 flex [scrollbar-width:none] gap-3.5 overflow-x-auto px-1 pt-1 md:gap-12 md:overflow-visible"
    >
      {TABS.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              update(
                withFilters(search, {
                  tab: tab.id === 'all' ? undefined : tab.id,
                }),
              )
            }}
            className={cn(
              'relative cursor-pointer pb-1.5 text-14 whitespace-nowrap transition-colors md:text-15 md:font-medium',
              selected
                ? 'font-bold text-highlight after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary md:font-medium'
                : 'text-foreground hover:text-highlight',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function SortSelect({ className }: { className?: string }) {
  const [search, update] = useOptimisticCatalog()
  const id = useId()

  return (
    <div className={cn('flex items-center gap-2 text-15', className)}>
      <label htmlFor={id} className="whitespace-nowrap text-foreground">
        Ordenar por:
      </label>
      <div className="relative">
        <select
          id={id}
          value={search.sort ?? 'recent'}
          onChange={(event) => {
            const sort = event.target.value as NftSort
            update(
              withFilters(search, {
                sort: sort === 'recent' ? undefined : sort,
              }),
            )
          }}
          className="cursor-pointer appearance-none rounded-xs bg-transparent py-0.5 pr-6 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>option]:bg-card"
        >
          {SORTS.map((sort) => (
            <option key={sort.id} value={sort.id}>
              {sort.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 size-2.5 -translate-y-1/2 text-foreground"
        />
      </div>
    </div>
  )
}

interface Chip {
  key: string
  label: string
  remove: Partial<Omit<CatalogSearch, 'page'>>
}

function activeChips(search: CatalogSearch): Chip[] {
  const chips: Chip[] = []
  if (search.q)
    chips.push({
      key: 'q',
      label: `Busca: “${search.q}”`,
      remove: { q: undefined },
    })
  for (const id of search.categories ?? []) {
    const label = CATEGORIES.find((item) => item.id === id)?.label ?? id
    chips.push({
      key: `c:${id}`,
      label,
      remove: {
        categories: (search.categories ?? []).filter((item) => item !== id),
      },
    })
  }
  for (const id of search.networks ?? []) {
    const label = NETWORKS.find((item) => item.id === id)?.label ?? id
    chips.push({
      key: `n:${id}`,
      label,
      remove: {
        networks: (search.networks ?? []).filter((item) => item !== id),
      },
    })
  }
  if (search.minPrice || search.maxPrice) {
    const low = search.minPrice ? formatEthAmount(search.minPrice) : 'mín.'
    const high = search.maxPrice ? formatEthAmount(search.maxPrice) : 'máx.'
    chips.push({
      key: 'price',
      label: `${low} – ${high} ETH`,
      remove: { minPrice: undefined, maxPrice: undefined },
    })
  }
  return chips
}

/** Active filters as removable chips (not in Figma; shown only when filtering). */
export function ActiveFilters() {
  const search = useCatalogSearch()
  const navigateCatalog = useCatalogNavigate()
  const chips = activeChips(search)
  if (!chips.length && !hasActiveFilters(search)) return null

  return (
    <div
      className="mt-5 flex flex-wrap items-center gap-2"
      aria-label="Filtros ativos"
      role="group"
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          aria-label={`Remover filtro ${chip.label}`}
          onClick={() => {
            navigateCatalog(withFilters(search, chip.remove))
          }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-card px-3 py-1 text-13 text-foreground transition-colors hover:border-primary"
        >
          {chip.label}
          <CloseIcon aria-hidden="true" className="size-2.5 text-primary" />
        </button>
      ))}
      <Button
        variant="link"
        size="inline"
        className="ml-1 text-13"
        onClick={() => {
          navigateCatalog({ ...(search.sort ? { sort: search.sort } : {}) })
        }}
      >
        Limpar filtros
      </Button>
    </div>
  )
}
