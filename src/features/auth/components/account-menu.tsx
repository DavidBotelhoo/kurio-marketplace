import { Link } from '@tanstack/react-router'

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
import type { User } from '@/contracts/auth'

import { useLogoutMutation } from '../queries'
import { accountTriggerClass } from './account-trigger'

/** Account dropdown; its own chunk, loaded only for signed-in users. */
export default function AccountMenu({ user }: { user: User }) {
  const logout = useLogoutMutation()
  const firstName = user.displayName.split(' ')[0] ?? user.displayName

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className={accountTriggerClass}
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
