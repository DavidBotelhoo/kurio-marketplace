import * as z from 'zod/mini'

import type { User } from '@/contracts/auth'
import { newPasswordSchema } from '@/contracts/auth'
import { updateProfileRequestSchema } from '@/contracts/profile'

/**
 * "Dados do perfil" form: the profile fields plus the optional password
 * change. The password fields are validated only when one of them is filled.
 */
export const profileFormSchema = z
  .object({
    ...updateProfileRequestSchema.shape,
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .check(
    z.superRefine((values, ctx) => {
      const { currentPassword, newPassword, confirmPassword } = values
      if (!currentPassword && !newPassword && !confirmPassword) return
      if (!currentPassword) {
        ctx.issues.push({
          code: 'custom',
          input: currentPassword,
          path: ['currentPassword'],
          message: 'Informe sua senha atual.',
        })
      }
      const rules = newPasswordSchema.safeParse(newPassword)
      if (!rules.success) {
        ctx.issues.push({
          code: 'custom',
          input: newPassword,
          path: ['newPassword'],
          message: rules.error.issues[0]?.message ?? 'Senha inválida.',
        })
      } else if (newPassword === currentPassword) {
        ctx.issues.push({
          code: 'custom',
          input: newPassword,
          path: ['newPassword'],
          message: 'A nova senha deve ser diferente da atual.',
        })
      }
      if (confirmPassword !== newPassword) {
        ctx.issues.push({
          code: 'custom',
          input: confirmPassword,
          path: ['confirmPassword'],
          message: 'As senhas não coincidem.',
        })
      }
    }),
  )

export type ProfileFormValues = z.input<typeof profileFormSchema>

export const PROFILE_FIELDS = [
  'displayName',
  'username',
  'email',
  'ensName',
  'walletNickname',
] as const satisfies readonly (keyof ProfileFormValues)[]

export const PASSWORD_FIELDS = [
  'currentPassword',
  'newPassword',
  'confirmPassword',
] as const satisfies readonly (keyof ProfileFormValues)[]

export function profileValues(user: User): ProfileFormValues {
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName ?? '',
    walletNickname: user.walletNickname ?? '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}
