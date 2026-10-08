import { getRouteApi } from '@tanstack/react-router'

import { useAuthLayout } from './components/auth-layout-context'
import { LoginForm } from './components/login-form'

const route = getRouteApi('/_auth/login')

export function LoginPage() {
  const { redirect } = route.useSearch()
  return <LoginForm layout={useAuthLayout()} redirect={redirect} />
}
