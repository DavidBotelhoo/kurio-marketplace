import { type User, userSchema } from '@/contracts/auth'
import type {
  ChangePasswordRequest,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/contracts/profile'
import { api } from '@/lib/api/client'
import { parseResponse } from '@/lib/api/parse'

export async function fetchProfile(signal?: AbortSignal): Promise<User> {
  const { data } = await api.get<unknown>('/profile', { signal })
  return parseResponse(userSchema, data)
}

export async function updateProfile(body: UpdateProfileRequest): Promise<User> {
  const { data } = await api.patch<unknown>('/profile', body)
  return parseResponse(userSchema, data)
}

export async function updateAvatar(body: UpdateAvatarRequest): Promise<User> {
  const { data } = await api.put<unknown>('/profile/avatar', body)
  return parseResponse(userSchema, data)
}

export async function removeAvatar(): Promise<User> {
  const { data } = await api.delete<unknown>('/profile/avatar')
  return parseResponse(userSchema, data)
}

export async function changePassword(body: ChangePasswordRequest) {
  await api.post('/profile/password', body)
}
