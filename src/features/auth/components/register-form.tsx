import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PasswordField, TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { PASSWORD_RULES } from '@/contracts/auth'
import { applyApiErrors } from '@/lib/forms'

import { useRegisterMutation } from '../queries'
import { registerFormSchema, type RegisterFormValues } from '../schemas'
import type { AuthLayout } from './auth-layout-context'
import { FormAlert } from './form-alert'

interface RegisterFormProps {
  layout: AuthLayout
  redirect: string | undefined
}

export function RegisterForm({ layout, redirect }: RegisterFormProps) {
  const navigate = useNavigate()
  const registerAccount = useRegisterMutation()
  const page = layout === 'page'
  const size = page ? 'lg' : 'md'
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: standardSchemaResolver(registerFormSchema),
    mode: 'onTouched',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async ({ username, email, password }) => {
    try {
      const { user } = await registerAccount.mutateAsync({
        username,
        email,
        password,
      })
      toast.success(`Conta criada. Boas-vindas, ${user.displayName}!`)
      await navigate({ href: redirect ?? '/', replace: true })
    } catch (error) {
      // 409 (e-mail or username taken) and 422 come back per field.
      applyApiErrors(error, setError, ['username', 'email', 'password'])
    }
  })

  return (
    <form
      noValidate
      aria-busy={registerAccount.isPending}
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <FormAlert message={errors.root?.server?.message} />
      <div className="grid gap-[0.8125rem]">
        <TextField
          label="Nome de usuário"
          hideLabel
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Nome de usuário"
          size={size}
          error={errors.username?.message}
          {...register('username')}
        />
        <TextField
          label="E-mail"
          hideLabel
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          size={size}
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Senha"
          hideLabel
          autoComplete="new-password"
          placeholder="Senha"
          description={PASSWORD_RULES}
          hideDescription
          size={size}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          label="Confirmar senha"
          hideLabel
          autoComplete="new-password"
          placeholder="Confirmar senha"
          size={size}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>
      <Button
        type="submit"
        size={page ? 'xl' : 'lg'}
        className={page ? 'mt-12 w-full' : 'mt-6 w-full rounded-[0.3125rem]'}
        disabled={registerAccount.isPending}
      >
        {registerAccount.isPending
          ? 'Criando conta…'
          : page
            ? 'Criar perfil'
            : 'Criar conta'}
      </Button>
    </form>
  )
}
