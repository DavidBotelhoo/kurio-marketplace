import { Link } from '@tanstack/react-router'
import type { ComponentType } from 'react'

import {
  ActivityIcon,
  DangerTriangleIcon,
  DownloadIcon,
  HeartIcon,
  type IconProps,
  LocationIcon,
  LoginIcon,
  ShoppingCartIcon,
  UserIcon,
} from '@/components/icons'
import { UnavailableAction } from '@/components/unavailable-action'
import { useCurrentUser, useLogoutMutation } from '@/features/auth/queries'
import { cn } from '@/lib/utils'

import { UserAvatar } from './user-avatar'

type NavItem =
  | {
      label: string
      Icon: ComponentType<IconProps>
      to: '/perfil' | '/perfil/carteiras' | '/perfil/favoritos'
      exact?: boolean
    }
  | { label: string; Icon: ComponentType<IconProps>; feature: string }

/** Figma "Meu perfil" menu, in its order. */
const ITEMS: readonly NavItem[] = [
  { label: 'Dados do perfil', Icon: UserIcon, to: '/perfil', exact: true },
  { label: 'Carteiras', Icon: LocationIcon, to: '/perfil/carteiras' },
  {
    label: 'Atividade',
    Icon: ShoppingCartIcon,
    feature: 'O histórico de atividade',
  },
  { label: 'Lista de interesse', Icon: HeartIcon, to: '/perfil/favoritos' },
  { label: 'Ofertas', Icon: ActivityIcon, feature: 'A área de ofertas' },
  {
    label: 'Arquivos baixados',
    Icon: DownloadIcon,
    feature: 'A área de downloads',
  },
  {
    label: 'Suporte',
    Icon: DangerTriangleIcon,
    feature: 'A central de suporte',
  },
]

const sideItemClass =
  'group relative flex h-[2.8125rem] w-full cursor-pointer items-center gap-3 px-[1.125rem] text-left text-15 text-highlight transition-colors hover:bg-muted data-[status=active]:before:absolute data-[status=active]:before:inset-y-0 data-[status=active]:before:left-0 data-[status=active]:before:w-1.5 data-[status=active]:before:bg-primary'

const sideIconClass =
  'size-[1.0625rem] shrink-0 text-subtle-foreground group-data-[status=active]:text-primary'

/** Desktop and tablet sidebar (Figma 310px panel). */
export function ProfileSidebar({ className }: { className?: string }) {
  const logout = useLogoutMutation()
  return (
    <nav
      aria-label="Seções do perfil"
      className={cn('bg-card pt-[1.375rem]', className)}
    >
      <p
        aria-hidden="true"
        className="px-2.5 text-18 font-bold text-foreground"
      >
        Meu perfil
      </p>
      <ul className="mt-2.5">
        {ITEMS.map((item) => (
          <li key={item.label}>
            {'to' in item ? (
              <Link
                to={item.to}
                activeOptions={{ exact: item.exact ?? false }}
                className={sideItemClass}
              >
                <item.Icon aria-hidden="true" className={sideIconClass} />
                {item.label}
              </Link>
            ) : (
              <UnavailableAction
                feature={item.feature}
                className={sideItemClass}
              >
                <item.Icon aria-hidden="true" className={sideIconClass} />
                {item.label}
              </UnavailableAction>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-1.5 border-t border-primary/30">
        <button
          type="button"
          disabled={logout.isPending}
          onClick={() => {
            logout.mutate()
          }}
          className={cn(sideItemClass, 'font-bold')}
        >
          <LoginIcon
            aria-hidden="true"
            className="size-[1.0625rem] text-primary"
          />
          Sair
        </button>
      </div>
    </nav>
  )
}

const pillClass =
  'flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-14 whitespace-nowrap text-muted-foreground transition-colors hover:border-border-strong data-[status=active]:border-primary data-[status=active]:text-highlight'

/** Mobile: collector summary and the menu as scrollable pills. */
export function ProfileMobileNav({ className }: { className?: string }) {
  const user = useCurrentUser()
  const logout = useLogoutMutation()
  return (
    <div className={className}>
      {user ? (
        <div className="flex items-center gap-3">
          <UserAvatar src={user.avatarUrl} className="size-[3.0625rem]" />
          <div className="min-w-0">
            <p className="truncate text-16 font-bold">{user.displayName}</p>
            <p className="truncate text-13 text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      ) : null}
      <nav aria-label="Seções do perfil" className="-mx-(--gutter) mt-5">
        <ul className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-(--gutter) pb-1 [&::-webkit-scrollbar]:hidden">
          {ITEMS.map((item) => (
            <li key={item.label} className="shrink-0">
              {'to' in item ? (
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact ?? false }}
                  className={pillClass}
                >
                  <item.Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              ) : (
                <UnavailableAction feature={item.feature} className={pillClass}>
                  <item.Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </UnavailableAction>
              )}
            </li>
          ))}
          <li className="shrink-0">
            <button
              type="button"
              disabled={logout.isPending}
              onClick={() => {
                logout.mutate()
              }}
              className={cn(pillClass, 'font-bold text-highlight')}
            >
              <LoginIcon aria-hidden="true" className="size-4" />
              Sair
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
