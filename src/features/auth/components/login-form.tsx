import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PasswordField, TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { type LoginRequest, loginRequestSchema } from '@/contracts/auth'
import { applyApiErrors } from '@/lib/forms'
import { notifyUnavailable } from '@/lib/unavailable'

import { useLoginMutation } from '../queries'
import type { AuthLayout } from './auth-shell'
import { FormAlert } from './form-alert'

interface LoginFormProps {
  layout: AuthLayout
  /** Where to resume after signing in (already validated). */
  redirect: string | undefined
}

export function LoginForm({ layout, redirect }: LoginFormProps) {
  const navigate = useNavigate()
  const login = useLoginMutation()
  const page = layout === 'page'
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: standardSchemaResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { user } = await login.mutateAsync(values)
      toast.success(
        `Olá, ${user.displayName.split(' ')[0] ?? user.displayName}!`,
      )
      await navigate({ href: redirect ?? '/', replace: true })
    } catch (error) {
      applyApiErrors(error, setError, ['email', 'password'])
    }
  })

  return (
    <form
      noValidate
      aria-busy={login.isPending}
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <FormAlert message={errors.root?.server?.message} />
      <div className="grid gap-[0.8125rem]">
        <TextField
          label="E-mail"
          hideLabel
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="contato@email.com"
          size={page ? 'lg' : 'md'}
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Senha"
          hideLabel
          autoComplete="current-password"
          placeholder="Senha"
          size={page ? 'lg' : 'md'}
          error={errors.password?.message}
          {...register('password')}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          variant="link"
          size="inline"
          className="text-14 font-normal"
          onClick={() => {
            notifyUnavailable('A recuperação de senha')
          }}
        >
          Esqueceu a senha?
        </Button>
      </div>
      <Button
        type="submit"
        size={page ? 'xl' : 'lg'}
        className={page ? 'mt-10 w-full' : 'mt-6 w-full rounded-[0.3125rem]'}
        disabled={login.isPending}
      >
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
