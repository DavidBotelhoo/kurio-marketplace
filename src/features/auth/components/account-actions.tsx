import { Link, useLocation } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { LoginIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useSession, useSessionToken } from '../queries'
import { accountTriggerClass } from './account-trigger'

const AccountMenu = lazy(() => import('./account-menu'))

function AccountSkeleton() {
  return (
    <Skeleton className="h-[2.1875rem] w-[6.25rem]">
      <span className="sr-only">Carregando conta</span>
    </Skeleton>
  )
}

/** Header slot: "Entrar" for visitors, the account menu once signed in. */
export function AccountActions() {
  const token = useSessionToken()
  const session = useSession()
  const location = useLocation()
  const onAuthScreen = /^\/(login|cadastro)(\/|$)/.test(location.pathname)

  // Validating a stored session after a refresh: keep the slot's size.
  if (token && session.isPending) return <AccountSkeleton />

  const user = session.data?.user
  if (!user) {
    return (
      <Button asChild size="sm" className={accountTriggerClass}>
        <Link
          to="/login"
          // On the auth screens keep the pending destination instead of
          // nesting the current URL inside it.
          search={(previous) =>
            onAuthScreen ? previous : { redirect: location.href }
          }
        >
          <LoginIcon className="size-4" />
          Entrar
        </Link>
      </Button>
    )
  }

  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountMenu user={user} />
    </Suspense>
  )
}
