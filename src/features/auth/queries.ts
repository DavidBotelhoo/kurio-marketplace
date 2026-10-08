import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '@/contracts/auth'

import { sessionKeys } from './query-keys'
import { isProtectedLocation } from './route-guard'
import { sessionStore } from './session-store'

/*
 * The API module (HTTP client + contract schemas) is loaded on demand: the
 * header needs it only when a stored session must be validated, so visitors'
 * first render does not wait for it.
 */
const loadApi = () => import('./api')

export function sessionQueryOptions(token: string | null) {
  return queryOptions({
    queryKey: sessionKeys.current(token),
    queryFn: async ({ signal }) =>
      token ? (await loadApi()).fetchSession(token, signal) : null,
    staleTime: 60_000,
  })
}

export function useSessionToken() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getToken)
}

/** Current session; `data` is null for visitors. */
export function useSession() {
  return useQuery(sessionQueryOptions(useSessionToken()))
}

export function useCurrentUser() {
  return useSession().data?.user ?? null
}

/** Stores a new session (login or sign-up) and seeds its query. */
export function startSession(queryClient: QueryClient, auth: AuthResponse) {
  queryClient.setQueryData(sessionKeys.current(auth.session.token), auth)
  sessionStore.set({
    token: auth.session.token,
    userId: auth.user.id,
    expiresAt: auth.session.expiresAt,
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: LoginRequest) => (await loadApi()).login(body),
    onSuccess: (auth) => {
      startSession(queryClient, auth)
    },
  })
}

export function useRegisterMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: RegisterRequest) =>
      (await loadApi()).register(body),
    onSuccess: (auth) => {
      startSession(queryClient, auth)
    },
  })
}

export function useLogoutMutation() {
  const router = useRouter()
  return useMutation({
    mutationFn: async () => {
      const token = sessionStore.getToken()
      // A failed request must not keep the user signed in locally.
      if (token) await (await loadApi()).logout(token).catch(() => undefined)
    },
    onSettled: async () => {
      if (isProtectedLocation(router)) await router.navigate({ to: '/' })
      sessionStore.set(null)
      toast.success('Você saiu da sua conta.')
    },
  })
}
