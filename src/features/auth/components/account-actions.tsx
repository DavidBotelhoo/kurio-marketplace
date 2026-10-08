import { Link, useLocation } from '@tanstack/react-router'

import {
  HeartIcon,
  LocationIcon,
  LoginIcon,
  UserFilledIcon,
  UserIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

import { useLogoutMutation, useSession, useSessionToken } from '../queries'

const triggerClass = 'h-[2.1875rem] gap-1.5 px-2.5 text-16 font-medium'

/** Header slot: "Entrar" for visitors, the account menu once signed in. */
export function AccountActions() {
  const token = useSessionToken()
  const session = useSession()
  const location = useLocation()
  const onAuthScreen = /^\/(login|cadastro)(\/|$)/.test(location.pathname)
  const logout = useLogoutMutation()

  // Validating a stored session after a refresh: keep the slot's size.
  if (token && session.isPending) {
    return (
      <Skeleton className="h-[2.1875rem] w-[6.25rem]">
        <span className="sr-only">Carregando conta</span>
      </Skeleton>
    )
  }

  const user = session.data?.user
  if (!user) {
    return (
      <Button asChild size="sm" className={triggerClass}>
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

  const firstName = user.displayName.split(' ')[0] ?? user.displayName

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className={triggerClass}
          aria-label={`Conta de ${user.displayName}`}
        >
          <UserFilledIcon className="size-4" />
          <span className="max-w-[8ch] truncate">{firstName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <span className="block font-bold text-foreground">
            {user.displayName}
          </span>
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil">
            <UserIcon />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/perfil/carteiras">
            <LocationIcon />
            Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/perfil/favoritos">
            <HeartIcon />
            Lista de interesse
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={logout.isPending}
          onSelect={() => {
            logout.mutate()
          }}
        >
          <LoginIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
