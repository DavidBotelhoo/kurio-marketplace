import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useOptimistic, useTransition } from 'react'

import { nftListQueryOptions } from '../queries'
import {
  type CatalogSearch,
  toListParams,
  validateCatalogSearch,
} from '../search'

const DEFAULT_SEARCH = validateCatalogSearch({})

/**
 * Catalog state from the home URL. The home page is also rendered outside
 * its route (behind the desktop login modal); there it shows the default
 * catalog instead of failing for lack of an active "/" match.
 */
export function useCatalogSearch(): CatalogSearch {
  return useSearch({ from: '/', shouldThrow: false }) ?? DEFAULT_SEARCH
}

/** Navigates to a new catalog state without jumping to the top of the page. */
export function useCatalogNavigate() {
  const navigate = useNavigate()
  return useCallback(
    (search: CatalogSearch, options: { replace?: boolean } = {}) => {
      void navigate({
        to: '/',
        search,
        resetScroll: false,
        replace: options.replace ?? false,
      })
    },
    [navigate],
  )
}

/**
 * URL state with instant feedback: controls (checkboxes, tabs, sort) show
 * the new value right away while the navigation completes, instead of
 * flicking back to the previous URL value for a moment.
 */
export function useOptimisticCatalog() {
  const search = useCatalogSearch()
  const navigate = useNavigate()
  const [optimistic, setOptimistic] = useOptimistic(search)
  const [, startTransition] = useTransition()
  const update = useCallback(
    (next: CatalogSearch) => {
      startTransition(async () => {
        setOptimistic(next)
        await navigate({ to: '/', search: next, resetScroll: false })
      })
    },
    [navigate, setOptimistic],
  )
  return [optimistic, update] as const
}

/** List query for the current URL state (previous page kept while loading). */
export function useCatalogQuery() {
  const search = useCatalogSearch()
  return useQuery(nftListQueryOptions(toListParams(search)))
}
