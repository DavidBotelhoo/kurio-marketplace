import * as z from 'zod/mini'

import { isoDateTimeSchema } from './common'

/*
 * Session and account contract.
 *
 * POST /auth/register  RegisterRequest → 201 AuthResponse
 *                      422 VALIDATION_ERROR (fields) · 409 CONFLICT (fields)
 * POST /auth/login     LoginRequest    → 200 AuthResponse · 401 INVALID_CREDENTIALS
 * GET  /auth/session   (Bearer token)  → 200 AuthResponse
 *                      401 UNAUTHENTICATED · 401 SESSION_EXPIRED
 * POST /auth/logout    (Bearer token)  → 204 (idempotent)
 *
 * Authenticated requests send `Authorization: Bearer <token>`. Tokens are
 * opaque and expire at `session.expiresAt`; any endpoint may then answer
 * 401 SESSION_EXPIRED.
 *
 * The field rules below are shared by the client forms and the mock server.
 */

/** Required-field check that stops the remaining checks of the field. */
const required = (error: string) => z.minLength(1, { error, abort: true })

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/

export const emailSchema = z
  .string()
  .check(
    z.trim(),
    z.toLowerCase(),
    required('Informe seu e-mail.'),
    z.regex(EMAIL_PATTERN, 'Informe um e-mail válido.'),
  )

export const usernameSchema = z
  .string()
  .check(
    z.trim(),
    z.toLowerCase(),
    required('Informe um nome de usuário.'),
    z.regex(
      USERNAME_PATTERN,
      'Use de 3 a 30 caracteres: letras minúsculas, números, ponto ou sublinhado.',
    ),
  )

export const PASSWORD_RULES = 'Mínimo de 8 caracteres, com letras e números.'

export const newPasswordSchema = z.string().check(
  required('Crie uma senha.'),
  z.maxLength(72, 'Use no máximo 72 caracteres.'),
  z.refine(
    (value) => value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value),
    PASSWORD_RULES,
  ),
)

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().check(required('Informe sua senha.')),
})

export type LoginRequest = z.input<typeof loginRequestSchema>

export const registerRequestSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: newPasswordSchema,
})

export type RegisterRequest = z.input<typeof registerRequestSchema>

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  displayName: z.string(),
  ensName: z.nullable(z.string()),
  walletNickname: z.nullable(z.string()),
  avatarUrl: z.nullable(z.string()),
  createdAt: isoDateTimeSchema,
})

export type User = z.infer<typeof userSchema>

export const sessionSchema = z.object({
  token: z.string(),
  expiresAt: isoDateTimeSchema,
})

export type Session = z.infer<typeof sessionSchema>

export const authResponseSchema = z.object({
  session: sessionSchema,
  user: userSchema,
})

export type AuthResponse = z.infer<typeof authResponseSchema>
