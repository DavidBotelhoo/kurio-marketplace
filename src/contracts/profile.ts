import * as z from 'zod/mini'

import { emailSchema, newPasswordSchema, usernameSchema } from './auth'
import { walletFieldsSchema } from './wallets'

/*
 * Profile of the signed-in collector (Bearer token required). The profile
 * is the account user (see auth.ts userSchema).
 *
 * GET    /profile            → 200 User
 * PATCH  /profile            UpdateProfileRequest → 200 User
 *                            409 CONFLICT (fields: e-mail or username in use)
 *                            422 VALIDATION_ERROR (fields)
 * PUT    /profile/avatar     UpdateAvatarRequest → 200 User
 *                            422 VALIDATION_ERROR (fields.avatar: type or size)
 * DELETE /profile/avatar     → 200 User (idempotent)
 * POST   /profile/password   ChangePasswordRequest → 204
 *                            422 VALIDATION_ERROR (fields.currentPassword when
 *                            wrong; fields.newPassword for the rules). The
 *                            collector's other sessions are ended.
 */

const fields = walletFieldsSchema.shape

export const updateProfileRequestSchema = z.object({
  displayName: fields.displayName,
  username: usernameSchema,
  email: emailSchema,
  /** ENS name without ".eth". */
  ensName: fields.ensName,
  /** "Apelido da carteira" shown to other collectors. */
  walletNickname: fields.nickname,
})

export type UpdateProfileRequest = z.input<typeof updateProfileRequestSchema>

export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

/** Largest accepted avatar (after the client resizes it). */
export const AVATAR_MAX_BYTES = 512 * 1024

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/

/** Decoded size of a base64 data URL, or null when it is not an image. */
export function dataUrlBytes(value: string) {
  const match = DATA_URL.exec(value)
  if (!match?.[2]) return null
  const base64 = match[2]
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return (base64.length * 3) / 4 - padding
}

export const updateAvatarRequestSchema = z.object({
  avatar: z.string().check(
    z.refine(
      (value) => dataUrlBytes(value) !== null,
      'Envie uma imagem PNG, JPG ou WebP.',
    ),
    z.refine(
      (value) => (dataUrlBytes(value) ?? Infinity) <= AVATAR_MAX_BYTES,
      'A imagem deve ter no máximo 512 KB.',
    ),
  ),
})

export type UpdateAvatarRequest = z.input<typeof updateAvatarRequestSchema>

export const changePasswordRequestSchema = z
  .object({
    currentPassword: z
      .string()
      .check(
        z.minLength(1, { error: 'Informe sua senha atual.', abort: true }),
      ),
    newPassword: newPasswordSchema,
  })
  .check(
    z.refine((value) => value.newPassword !== value.currentPassword, {
      error: 'A nova senha deve ser diferente da atual.',
      path: ['newPassword'],
    }),
  )

export type ChangePasswordRequest = z.input<typeof changePasswordRequestSchema>
