import { HttpResponse } from 'msw'

import { loginRequestSchema, registerRequestSchema } from '@/contracts/auth'

import {
  authResponse,
  createSession,
  readBearerToken,
  requireSession,
  revokeSession,
} from '../auth'
import { hashPassword, verifyPassword } from '../crypto'
import { db } from '../db/database'
import type { UserRecord } from '../db/schema'
import { route } from '../http'
import { apiError } from '../responses'
import { validationError } from '../validation'

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export const authHandlers = [
  route(
    'post',
    '/auth/register',
    { operation: 'auth.register', label: 'Cadastro' },
    async ({ request }) => {
      const parsed = registerRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      const { username, email, password } = parsed.data

      const { users } = db.read()
      const fields: Record<string, string> = {}
      if (users.some((user) => user.email === email)) {
        fields.email = 'Este e-mail já está cadastrado. Entre ou use outro.'
      }
      if (users.some((user) => user.username === username)) {
        fields.username = 'Este nome de usuário já está em uso.'
      }
      if (Object.keys(fields).length) {
        return apiError(409, 'CONFLICT', {
          message: 'Já existe uma conta com estes dados.',
          fields,
        })
      }

      const now = new Date().toISOString()
      const user: UserRecord = {
        id: `usr_${crypto.randomUUID()}`,
        email,
        username,
        displayName: username,
        ensName: null,
        walletNickname: null,
        avatarUrl: null,
        passwordHash: await hashPassword(password),
        createdAt: now,
        updatedAt: now,
      }
      db.write((draft) => {
        draft.users.push(user)
      })
      return HttpResponse.json(authResponse(user, createSession(user.id)), {
        status: 201,
      })
    },
  ),

  route(
    'post',
    '/auth/login',
    { operation: 'auth.login', label: 'Login' },
    async ({ request }) => {
      const parsed = loginRequestSchema.safeParse(await readJsonBody(request))
      if (!parsed.success) return validationError(parsed.error.issues)
      const { email, password } = parsed.data

      const user = db.read().users.find((item) => item.email === email)
      // Same answer for unknown e-mail and wrong password (no enumeration).
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return apiError(401, 'INVALID_CREDENTIALS')
      }
      return HttpResponse.json(authResponse(user, createSession(user.id)))
    },
  ),

  route(
    'get',
    '/auth/session',
    { operation: 'auth.session', label: 'Sessão (consulta)' },
    ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      return HttpResponse.json(authResponse(check.user, check.session))
    },
  ),

  route(
    'post',
    '/auth/logout',
    { operation: 'auth.logout', label: 'Logout' },
    ({ request }) => {
      const token = readBearerToken(request)
      if (token) revokeSession(token)
      return new HttpResponse(null, { status: 204 })
    },
  ),
]
