import { type AnyRouter, redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { sessionQueryOptions } from './queries'
import { sessionStore } from './session-store'

/** Routes under this layout require a session (see routes/_authenticated). */
export const PROTECTED_LAYOUT_ID = '/_authenticated'

export function isProtectedLocation(router: AnyRouter) {
  return router.state.matches.some((match) =>
    match.routeId.startsWith(PROTECTED_LAYOUT_ID),
  )
}

/**
 * beforeLoad of the protected layout: validates the stored session with the
 * API and, without one, redirects to /login keeping the requested location so
 * the flow resumes right after signing in.
 */
export async function requireSession(queryClient: QueryClient, href: string) {
  const token = sessionStore.getToken()
  // Always revalidated on entry, so an expired session is caught while
  // navigating (concurrent checks share the same request).
  const auth = await queryClient.query({
    ...sessionQueryOptions(token),
    staleTime: 0,
  })
  if (!auth) {
    throw redirect({
      to: '/login',
      search: { redirect: href, reason: token ? 'expired' : 'required' },
    })
  }
  return { user: auth.user }
}
