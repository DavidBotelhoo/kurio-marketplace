import { useState } from 'react'

import { FilterIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import {
  useCatalogNavigate,
  useCatalogQuery,
  useCatalogSearch,
} from '../hooks/use-catalog'
import { CatalogFilters } from './catalog-filters'
import { SortSelect } from './catalog-toolbar'

function activeCount(search: ReturnType<typeof useCatalogSearch>) {
  return (
    (search.categories?.length ?? 0) +
    (search.networks?.length ?? 0) +
    (search.minPrice || search.maxPrice ? 1 : 0)
  )
}

/**
 * Filter drawer for screens without the sidebar. Filters apply as they are
 * chosen (each choice is a history entry), the footer shows the result count.
 */
export function MobileFilters() {
  const [open, setOpen] = useState(false)
  const search = useCatalogSearch()
  const navigateCatalog = useCatalogNavigate()
  const { data, isFetching } = useCatalogQuery()
  const count = activeCount(search)
  const total = data?.meta.totalItems

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={count ? `Filtros, ${String(count)} ativos` : 'Filtros'}
          className="relative grid size-[2.8125rem] shrink-0 cursor-pointer place-items-center rounded-[0.875rem] bg-linear-to-br from-primary/45 to-primary text-primary-foreground transition-opacity hover:opacity-90"
        >
          <FilterIcon className="size-[1rem]" />
          {count ? (
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-foreground text-10 font-bold text-background"
            >
              {count}
            </span>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" closeLabel="Fechar filtros">
        <div className="px-6 pt-6 pb-2">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>
            Os resultados mudam conforme você escolhe.
          </SheetDescription>
        </div>
        <div className="grid gap-10 overflow-y-auto px-6 py-6">
          <SortSelect />
          <CatalogFilters />
        </div>
        <div className="flex items-center gap-3 border-t border-border px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            onClick={() => {
              navigateCatalog({
                ...(search.q ? { q: search.q } : {}),
                ...(search.sort ? { sort: search.sort } : {}),
              })
            }}
            disabled={count === 0}
          >
            Limpar
          </Button>
          <Button
            className="flex-1"
            aria-busy={isFetching}
            onClick={() => {
              setOpen(false)
            }}
          >
            {total === undefined
              ? 'Ver resultados'
              : total === 1
                ? 'Ver 1 NFT'
                : `Ver ${String(total)} NFTs`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
