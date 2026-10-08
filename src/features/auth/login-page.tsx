import { getRouteApi, Link } from '@tanstack/react-router'

import { AuthShell } from './components/auth-shell'
import { LoginForm } from './components/login-form'

const route = getRouteApi('/login')

export function LoginPage() {
  const search = route.useSearch()
  return (
    <AuthShell
      mode="login"
      title="Entrar"
      description="Entre para gerenciar sua carteira, coleção e perfil de criador."
      switchLink={
        <>
          Novo na Kurio?{' '}
          <Link
            to="/cadastro"
            search={search}
            className="text-highlight underline-offset-4 hover:underline"
          >
            Crie uma conta
          </Link>
        </>
      }
    >
      {(layout) => <LoginForm layout={layout} redirect={search.redirect} />}
    </AuthShell>
  )
}
