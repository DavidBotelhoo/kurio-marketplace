import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useCallback, useOptimistic, useTransition } from 'react'

import { nftListQueryOptions } from '../queries'
import { type CatalogSearch, toListParams } from '../search'

const route = getRouteApi('/')

export function useCatalogSearch() {
  return route.useSearch()
}

/** Navigates to a new catalog state without jumping to the top of the page. */
export function useCatalogNavigate() {
  const navigate = route.useNavigate()
  return useCallback(
    (search: CatalogSearch, options: { replace?: boolean } = {}) => {
      void navigate({
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
  const navigate = route.useNavigate()
  const [optimistic, setOptimistic] = useOptimistic(search)
  const [, startTransition] = useTransition()
  const update = useCallback(
    (next: CatalogSearch) => {
      startTransition(async () => {
        setOptimistic(next)
        await navigate({ search: next, resetScroll: false })
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
