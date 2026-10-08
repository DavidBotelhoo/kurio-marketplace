import { useLocation, useRouter } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'

import { SearchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

import { useCatalogNavigate, useCatalogSearch } from '../hooks/use-catalog'
import {
  type CatalogSearch,
  validateCatalogSearch,
  withFilters,
} from '../search'

const DEBOUNCE_MS = 350

/**
 * Debounced catalog search. Typing replaces the history entry (no entry per
 * keystroke); external URL changes (back/forward, clearing filters) are
 * mirrored into the field.
 */
export function CatalogSearchField({ className }: { className?: string }) {
  const search = useCatalogSearch()
  const navigateCatalog = useCatalogNavigate()
  const router = useRouter()
  const wantsFocus = useLocation({
    select: (location) => location.state.focusSearch === true,
  })
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(search.q ?? '')
  const submitted = useRef(search.q ?? '')
  const latestSearch = useRef<CatalogSearch>(search)

  useEffect(() => {
    latestSearch.current = search
  })

  // Mirror URL changes that did not come from typing here.
  useEffect(
    () =>
      router.subscribe('onResolved', ({ toLocation }) => {
        if (toLocation.pathname !== '/') return
        const q = validateCatalogSearch(toLocation.search).q ?? ''
        if (q === submitted.current) return
        submitted.current = q
        setValue(q)
      }),
    [router],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = value.trim()
      if (q === submitted.current) return
      submitted.current = q
      navigateCatalog(
        withFilters(latestSearch.current, { q: q || undefined }),
        {
          replace: true,
        },
      )
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [value, navigateCatalog])

  // The header search button navigates here asking for focus.
  useEffect(() => {
    if (wantsFocus) inputRef.current?.focus()
  }, [wantsFocus])

  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(event) => {
        event.preventDefault()
        const q = value.trim()
        submitted.current = q
        navigateCatalog(
          withFilters(latestSearch.current, { q: q || undefined }),
        )
      }}
    >
      <label htmlFor={id} className="sr-only">
        Buscar NFTs
      </label>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-subtle-foreground"
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder="Explorar coleções"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
        }}
        className="h-[2.8125rem] w-full rounded-[0.625rem] bg-card pr-3 pl-11 text-14 text-foreground outline-none placeholder:font-bold placeholder:text-subtle-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:cursor-pointer"
      />
    </form>
  )
}
