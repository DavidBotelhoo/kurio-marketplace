import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PasswordField, TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/contracts/auth'
import { FormAlert } from '@/features/auth/components/form-alert'
import { EnsNameField } from '@/features/wallets/components/wallet-fields'
import { applyApiErrors } from '@/lib/forms'

import { AvatarField } from './components/avatar-field'
import { useChangePassword, useProfile, useUpdateProfile } from './queries'
import {
  PASSWORD_FIELDS,
  PROFILE_FIELDS,
  type ProfileFormValues,
  profileFormSchema,
  profileValues,
} from './schemas'

function ProfileForm({ user }: { user: User }) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const form = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileFormSchema),
    defaultValues: profileValues(user),
  })
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = form

  const onSubmit = handleSubmit(async (values) => {
    const saved = profileValues(user)
    const profileChanged = PROFILE_FIELDS.some(
      (name) => values[name] !== saved[name],
    )
    const passwordFilled = PASSWORD_FIELDS.some((name) => values[name] !== '')
    if (!profileChanged && !passwordFilled) {
      toast.info('Nenhuma alteração para salvar.')
      return
    }

    let current = user
    if (profileChanged) {
      try {
        current = await updateProfile.mutateAsync({
          displayName: values.displayName,
          username: values.username,
          email: values.email,
          ensName: values.ensName,
          walletNickname: values.walletNickname,
        })
        toast.success('Dados do perfil salvos.')
      } catch (error) {
        applyApiErrors(error, setError, PROFILE_FIELDS)
        return
      }
    }

    if (passwordFilled) {
      try {
        await changePassword.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
        toast.success('Senha alterada. As outras sessões foram encerradas.')
      } catch (error) {
        // Saved data stays saved; only the password fields keep their state.
        reset({ ...profileValues(current), ...pickPasswords(values) })
        applyApiErrors(error, setError, PASSWORD_FIELDS)
        return
      }
    }
    reset(profileValues(current))
  })

  return (
    <FormProvider {...form}>
      <form
        noValidate
        aria-busy={isSubmitting}
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        <h1 className="text-16 font-bold">Perfil do colecionador</h1>
        <FormAlert message={errors.root?.server?.message} />
        <div className="mt-9 grid gap-x-[1.8125rem] gap-y-[1.9375rem] lg:grid-cols-2">
          <TextField
            label="Nome de exibição"
            required
            autoComplete="name"
            error={errors.displayName?.message}
            {...register('displayName')}
          />
          <TextField
            label="Nome de usuário"
            required
            autoComplete="username"
            autoCapitalize="none"
            error={errors.username?.message}
            {...register('username')}
          />
          <TextField
            label="E-mail"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <EnsNameField />
          <TextField
            label="Apelido da carteira"
            required
            error={errors.walletNickname?.message}
            {...register('walletNickname')}
          />
          <AvatarField user={user} />
        </div>

        <fieldset className="mt-12 max-w-[26rem]">
          <legend className="text-16 font-medium">Alterar senha</legend>
          <p className="mt-1 text-13 text-muted-foreground">
            Preencha apenas se quiser trocar a senha.
          </p>
          <div className="mt-6 grid gap-[1.9375rem]">
            <PasswordField
              label="Senha atual"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <PasswordField
              label="Nova senha"
              autoComplete="new-password"
              description="Mínimo de 8 caracteres, com letras e números."
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <PasswordField
              label="Confirmar nova senha"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
        </fieldset>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 w-[8.1875rem] rounded-[0.1875rem]"
        >
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </FormProvider>
  )
}

function pickPasswords(values: ProfileFormValues) {
  return {
    currentPassword: values.currentPassword,
    newPassword: values.newPassword,
    confirmPassword: values.confirmPassword,
  }
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Carregando o perfil…</span>
      <Skeleton className="h-6 w-56" />
      <div className="mt-9 grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** "Dados do perfil": account data, avatar and password. */
export function ProfileDataPage() {
  const profile = useProfile()
  if (profile.data) return <ProfileForm user={profile.data} />
  if (profile.isError) {
    return (
      <div role="alert" className="grid justify-items-start gap-3">
        <h1 className="text-18 font-bold">
          Não foi possível carregar o perfil
        </h1>
        <Button
          variant="secondary"
          onClick={() => {
            void profile.refetch()
          }}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }
  return <ProfileSkeleton />
}
