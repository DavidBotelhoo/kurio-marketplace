import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import { NotFound } from '@/components/layout/not-found'
import { RouteError } from '@/components/layout/route-error'
import { parseSearchParams, stringifySearchParams } from '@/lib/search-params'

import { routeTree } from './routeTree.gen'

export interface RouterContext {
  queryClient: QueryClient
}

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // Data freshness is owned by TanStack Query, not by the router cache.
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => <NotFound />,
    defaultErrorComponent: RouteError,
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }

  interface HistoryState {
    /** Set by the header search button: focus the catalog search field. */
    focusSearch?: boolean
  }

  interface StaticDataRouteOption {
    /** Shows the bottom tab bar on mobile (top-level sections only). */
    mobileTabBar?: boolean
    /** false hides the site footer on mobile (focused, app-like screens). */
    mobileFooter?: boolean
  }
}
