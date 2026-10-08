import { HttpResponse } from 'msw'

import {
  changePasswordRequestSchema,
  updateAvatarRequestSchema,
  updateProfileRequestSchema,
} from '@/contracts/profile'

import { requireSession, toUserDto } from '../auth'
import { hashPassword, verifyPassword } from '../crypto'
import { db } from '../db/database'
import { readJsonBody, route } from '../http'
import { apiError } from '../responses'
import { validationError } from '../validation'

function updateUser(userId: string, changes: Record<string, unknown>) {
  return db.write((draft) => {
    const user = draft.users.find((item) => item.id === userId)
    if (!user) throw new Error(`Unknown user ${userId}`)
    Object.assign(user, changes, { updatedAt: new Date().toISOString() })
    return toUserDto(user)
  })
}

export const profileHandlers = [
  route(
    'get',
    '/profile',
    { operation: 'profile.get', label: 'Perfil (consulta)' },
    ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      return HttpResponse.json(toUserDto(check.user))
    },
  ),

  route(
    'patch',
    '/profile',
    { operation: 'profile.update', label: 'Perfil (atualizar dados)' },
    async ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const parsed = updateProfileRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      const { email, username } = parsed.data
      const others = db.read().users.filter((user) => user.id !== check.user.id)
      const fields: Record<string, string> = {}
      if (others.some((user) => user.email === email)) {
        fields.email = 'Este e-mail já está em uso por outra conta.'
      }
      if (others.some((user) => user.username === username)) {
        fields.username = 'Este nome de usuário já está em uso.'
      }
      if (Object.keys(fields).length) {
        return apiError(409, 'CONFLICT', {
          message: 'Alguns dados já estão em uso por outra conta.',
          fields,
        })
      }
      return HttpResponse.json(updateUser(check.user.id, parsed.data))
    },
  ),

  route(
    'put',
    '/profile/avatar',
    { operation: 'profile.avatar', label: 'Perfil (alterar avatar)' },
    async ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const parsed = updateAvatarRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      return HttpResponse.json(
        updateUser(check.user.id, { avatarUrl: parsed.data.avatar }),
      )
    },
  ),

  route(
    'delete',
    '/profile/avatar',
    { operation: 'profile.avatar.remove', label: 'Perfil (remover avatar)' },
    ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      return HttpResponse.json(updateUser(check.user.id, { avatarUrl: null }))
    },
  ),

  route(
    'post',
    '/profile/password',
    { operation: 'profile.password', label: 'Perfil (alterar senha)' },
    async ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const parsed = changePasswordRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      const { currentPassword, newPassword } = parsed.data
      if (!(await verifyPassword(currentPassword, check.user.passwordHash))) {
        return apiError(422, 'VALIDATION_ERROR', {
          message: 'Confira a senha atual.',
          fields: { currentPassword: 'Senha atual incorreta.' },
        })
      }
      const passwordHash = await hashPassword(newPassword)
      const now = new Date().toISOString()
      db.write((draft) => {
        const user = draft.users.find((item) => item.id === check.user.id)
        if (user) Object.assign(user, { passwordHash, updatedAt: now })
        // Other devices must sign in again with the new password.
        for (const session of draft.sessions) {
          if (
            session.userId === check.user.id &&
            session.token !== check.session.token &&
            !session.revokedAt
          ) {
            session.revokedAt = now
          }
        }
      })
      return new HttpResponse(null, { status: 204 })
    },
  ),
]
