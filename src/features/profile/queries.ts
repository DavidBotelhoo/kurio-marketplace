import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { AuthResponse, User } from '@/contracts/auth'
import { privateKeys, sessionKeys } from '@/features/auth/query-keys'
import { useSessionUserId } from '@/features/auth/queries'
import { sessionStore } from '@/features/auth/session-store'

import {
  changePassword,
  fetchProfile,
  removeAvatar,
  updateAvatar,
  updateProfile,
} from './api'

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: [...privateKeys.user(userId), 'profile'] as const,
    queryFn: ({ signal }) => fetchProfile(signal),
  })
}

export function useProfile() {
  const userId = useSessionUserId()
  return useQuery({
    ...profileQueryOptions(userId ?? ''),
    enabled: userId !== null,
  })
}

/**
 * Stores the updated user in the profile query and in the session (the
 * header and checkout read the user from there).
 */
function useStoreUser() {
  const queryClient = useQueryClient()
  return (user: User) => {
    queryClient.setQueryData(profileQueryOptions(user.id).queryKey, user)
    queryClient.setQueryData<AuthResponse | null>(
      sessionKeys.current(sessionStore.getToken()),
      (data) => data && { ...data, user },
    )
  }
}

export function useUpdateProfile() {
  const storeUser = useStoreUser()
  return useMutation({ mutationFn: updateProfile, onSuccess: storeUser })
}

export function useUpdateAvatar() {
  const storeUser = useStoreUser()
  return useMutation({ mutationFn: updateAvatar, onSuccess: storeUser })
}

export function useRemoveAvatar() {
  const storeUser = useStoreUser()
  return useMutation({ mutationFn: removeAvatar, onSuccess: storeUser })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
