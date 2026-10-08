import { useId, useState } from 'react'

import { CheckIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import {
  CATEGORIES,
  type CategoryId,
  NETWORKS,
  type NetworkId,
} from '@/contracts/catalog-taxonomy'
import { cn } from '@/lib/utils'

import { formatEthAmount } from '../format'
import {
  useCatalogNavigate,
  useCatalogQuery,
  useCatalogSearch,
  useOptimisticCatalog,
} from '../hooks/use-catalog'
import { withFilters } from '../search'

interface FacetOption<T extends string> {
  id: T
  label: string
}

interface FacetListProps<T extends string> {
  title: string
  options: readonly FacetOption<T>[]
  counts: ReadonlyMap<string, number> | undefined
  selected: readonly T[]
  onToggle: (id: T) => void
}

function FacetList<T extends string>({
  title,
  options,
  counts,
  selected,
  onToggle,
}: FacetListProps<T>) {
  return (
    <fieldset>
      <legend className="text-18 font-bold text-foreground">{title}</legend>
      <ul className="mt-5 grid gap-[1.4375rem]">
        {options.map(({ id, label }) => {
          const checked = selected.includes(id)
          const count = counts?.get(id)
          return (
            <li key={id}>
              <label
                className={cn(
                  'relative flex cursor-pointer items-center justify-between gap-3 rounded-xs pl-3 text-15 leading-[1.1rem] transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring',
                  checked
                    ? 'text-highlight'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => {
                    onToggle(id)
                  }}
                />
                {checked ? (
                  <CheckIcon
                    aria-hidden="true"
                    className="absolute -left-1 size-3"
                  />
                ) : null}
                <span className={cn(checked && 'font-bold')}>{label}</span>
                {count === undefined ? (
                  <Skeleton className="h-4 w-7 rounded-xs" />
                ) : (
                  <span
                    className={cn(
                      'font-bold tabular-nums',
                      checked
                        ? 'text-highlight'
                        : count === 0
                          ? 'text-subtle-foreground'
                          : '',
                    )}
                  >
                    <span className="sr-only">, </span>({count})
                    <span className="sr-only"> NFTs</span>
                  </span>
                )}
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

function toggle<T extends string>(list: readonly T[] | undefined, id: T) {
  const current = list ?? []
  return current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]
}

const STEP = 0.01

function toAmount(value: number) {
  return (Math.round(value / STEP) * STEP).toFixed(2)
}

function PriceRangeFilter() {
  const search = useCatalogSearch()
  const navigateCatalog = useCatalogNavigate()
  const { data } = useCatalogQuery()
  const titleId = useId()
  const bounds = data?.facets.priceRange
  const min = bounds ? Number(bounds.minEth) : 0
  const max = bounds ? Number(bounds.maxEth) : 0
  const applied: [number, number] = [
    search.minPrice ? Number(search.minPrice) : min,
    search.maxPrice ? Number(search.maxPrice) : max,
  ]
  const appliedKey = `${String(min)}:${String(max)}:${applied.join(':')}`

  // Local value while dragging; reset whenever bounds or the URL change.
  const [draft, setDraft] = useState({ key: appliedKey, value: applied })
  if (draft.key !== appliedKey) setDraft({ key: appliedKey, value: applied })
  const [low, high] = draft.value

  const disabled = !bounds || max <= min

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId} className="text-18 font-bold text-foreground">
        Faixa de preço
      </h3>
      <div className="mt-3 pl-3">
        {disabled ? (
          <Skeleton className="h-[1.125rem] w-full rounded-full" />
        ) : (
          <Slider
            min={min}
            max={max}
            step={STEP}
            minStepsBetweenThumbs={1}
            value={draft.value}
            onValueChange={(value) => {
              const [nextLow = low, nextHigh = high] = value
              setDraft({ key: appliedKey, value: [nextLow, nextHigh] })
            }}
            thumbLabels={['Preço mínimo', 'Preço máximo']}
            formatValue={(value) => `${toAmount(value)} ETH`}
          />
        )}
        <p className="mt-4 text-15 text-foreground" aria-live="off">
          Preço:{' '}
          {disabled
            ? '—'
            : `${formatEthAmount(toAmount(low))} - ${formatEthAmount(toAmount(high))}`}{' '}
          ETH
        </p>
        <div className="mt-3 flex items-center gap-4">
          <Button
            size="sm"
            className="h-9 px-3 text-16"
            disabled={disabled}
            onClick={() => {
              navigateCatalog(
                withFilters(search, {
                  minPrice:
                    Math.abs(low - min) < STEP / 2 ? undefined : toAmount(low),
                  maxPrice:
                    Math.abs(high - max) < STEP / 2
                      ? undefined
                      : toAmount(high),
                }),
              )
            }}
          >
            Aplicar
          </Button>
          {search.minPrice || search.maxPrice ? (
            <Button
              variant="link"
              size="inline"
              className="text-14"
              onClick={() => {
                navigateCatalog(
                  withFilters(search, {
                    minPrice: undefined,
                    maxPrice: undefined,
                  }),
                )
              }}
            >
              Limpar preço
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/** Collections, price range and networks (sidebar and mobile drawer). */
export function CatalogFilters() {
  const [search, update] = useOptimisticCatalog()
  const { data } = useCatalogQuery()

  const categoryCounts = data
    ? new Map(data.facets.categories.map((facet) => [facet.id, facet.count]))
    : undefined
  const networkCounts = data
    ? new Map(data.facets.networks.map((facet) => [facet.id, facet.count]))
    : undefined

  return (
    <div className="grid gap-12">
      <FacetList<CategoryId>
        title="Coleções"
        options={CATEGORIES}
        counts={categoryCounts}
        selected={search.categories ?? []}
        onToggle={(id) => {
          update(
            withFilters(search, { categories: toggle(search.categories, id) }),
          )
        }}
      />
      <PriceRangeFilter />
      <FacetList<NetworkId>
        title="Rede"
        options={NETWORKS}
        counts={networkCounts}
        selected={search.networks ?? []}
        onToggle={(id) => {
          update(withFilters(search, { networks: toggle(search.networks, id) }))
        }}
      />
    </div>
  )
}
