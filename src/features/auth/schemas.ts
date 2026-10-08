import * as z from 'zod/mini'

import {
  emailSchema,
  newPasswordSchema,
  usernameSchema,
} from '@/contracts/auth'

/** Sign-up form: the API fields plus the password confirmation. */
export const registerFormSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z
      .string()
      .check(z.minLength(1, { error: 'Confirme sua senha.', abort: true })),
  })
  .check(
    z.refine((values) => values.password === values.confirmPassword, {
      error: 'As senhas não coincidem.',
      path: ['confirmPassword'],
    }),
  )

export type RegisterFormValues = z.input<typeof registerFormSchema>
