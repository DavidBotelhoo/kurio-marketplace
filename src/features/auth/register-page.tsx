import { getRouteApi } from '@tanstack/react-router'

import { useAuthLayout } from './components/auth-layout-context'
import { RegisterForm } from './components/register-form'

const route = getRouteApi('/_auth/cadastro')

export function RegisterPage() {
  const { redirect } = route.useSearch()
  return <RegisterForm layout={useAuthLayout()} redirect={redirect} />
}
