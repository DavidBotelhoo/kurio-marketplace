import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  setAuthTokenProvider,
  setUnauthorizedHandler,
} from '@/lib/api/auth-token'
import type { AppRouter } from '@/router'

import { privateKeys, sessionKeys } from './query-keys'
import { isProtectedLocation } from './route-guard'
import { sessionStore } from './session-store'

/**
 * Wires the session into the HTTP client and the cache. Installed once,
 * before the first render, so the very first requests carry the token.
 */
export function installSessionLifecycle(
  router: AppRouter,
  queryClient: QueryClient,
) {
  setAuthTokenProvider(() => sessionStore.getToken())

  setUnauthorizedHandler((rejectedToken, code) => {
    // A late answer for a session that already changed must not end the new one.
    if (rejectedToken !== sessionStore.getToken()) return
    const expired = code === 'SESSION_EXPIRED'
    if (expired) {
      toast.info('Sua sessão expirou. Entre novamente para continuar.', {
        id: 'session-expired',
      })
    }
    if (isProtectedLocation(router)) {
      // Keep the place (and its search params) to resume after signing in.
      void router.navigate({
        to: '/login',
        search: {
          redirect: router.state.location.href,
          reason: expired ? 'expired' : 'required',
        },
        replace: true,
      })
    }
    sessionStore.set(null)
  })

  // A stored token the API no longer accepts (expired, revoked) is forgotten
  // once its session query settles; doing it inside the query would cancel
  // the request a route guard may be awaiting.
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return
    const [scope, token] = event.query.queryKey as readonly unknown[]
    if (scope !== sessionKeys.all[0] || typeof token !== 'string') return
    if (event.query.state.data !== null) return
    queueMicrotask(() => {
      if (sessionStore.getToken() === token) sessionStore.set(null)
    })
  })

  let currentUserId = sessionStore.get()?.userId ?? null
  sessionStore.subscribe((origin) => {
    const token = sessionStore.getToken()
    const userId = sessionStore.get()?.userId ?? null
    if (userId === currentUserId) return
    currentUserId = userId
    // Logout, expiry or another user (possibly from another tab): nothing of
    // the previous user may stay in memory or keep refetching.
    void queryClient.cancelQueries({ queryKey: privateKeys.all })
    queryClient.removeQueries({ queryKey: privateKeys.all })
    queryClient.removeQueries({
      queryKey: sessionKeys.all,
      predicate: (query) => query.queryKey[1] !== token,
    })
    // Local changes come with their own navigation (guard redirect, logout,
    // expiry handler). Another tab's change must re-run the guards here.
    if (origin === 'external') void router.invalidate()
  })
}
