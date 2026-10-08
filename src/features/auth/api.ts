import {
  type AuthResponse,
  authResponseSchema,
  type LoginRequest,
  type RegisterRequest,
} from '@/contracts/auth'
import { api } from '@/lib/api/client'
import { hasErrorCode } from '@/lib/api/errors'
import { parseResponse } from '@/lib/api/parse'

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<unknown>('/auth/login', body)
  return parseResponse(authResponseSchema, data)
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<unknown>('/auth/register', body)
  return parseResponse(authResponseSchema, data)
}

/** Current session for `token`; null when it is missing, revoked or expired. */
export async function fetchSession(
  token: string | null,
  signal?: AbortSignal,
): Promise<AuthResponse | null> {
  if (!token) return null
  try {
    const { data } = await api.get<unknown>('/auth/session', {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    })
    return parseResponse(authResponseSchema, data)
  } catch (error) {
    if (
      hasErrorCode(error, 'UNAUTHENTICATED') ||
      hasErrorCode(error, 'SESSION_EXPIRED')
    ) {
      return null
    }
    throw error
  }
}

export async function logout(token: string) {
  await api.post('/auth/logout', null, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
