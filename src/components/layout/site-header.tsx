import { Link, useLocation } from '@tanstack/react-router'

import { CartIcon, SearchIcon } from '@/components/icons'
import { UnavailableAction } from '@/components/unavailable-action'
import { AccountActions } from '@/features/auth/components/account-actions'
import { CartBadge } from '@/features/cart/components/cart-badge'
import { cartLabel } from '@/features/cart/labels'
import { useCartCount } from '@/features/cart/queries'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { cn } from '@/lib/utils'

const MARKET_PATHS = /^\/(nfts|carrinho|pagamento|pedidos)(\/|$)/

const navItemClass =
  'relative block px-2.5 pt-[3px] pb-6 text-16 whitespace-nowrap text-foreground transition-colors hover:text-highlight data-[active=true]:font-bold data-[active=true]:text-highlight data-[active=true]:after:absolute data-[active=true]:after:inset-x-0 data-[active=true]:after:-bottom-px data-[active=true]:after:h-[3px] data-[active=true]:after:bg-primary'

function useActiveSection() {
  const { pathname, hash } = useLocation()
  if (pathname === '/') return hash === CATALOG_ANCHOR ? 'market' : 'home'
  if (MARKET_PATHS.test(pathname)) return 'market'
  return null
}

function MainNav() {
  const active = useActiveSection()

  return (
    <nav aria-label="Principal">
      <ul className="flex gap-6 lg:gap-[2.375rem]">
        <li>
          <Link
            to="/"
            activeOptions={{ exact: true, includeHash: true }}
            data-active={active === 'home'}
            className={navItemClass}
          >
            Início
          </Link>
        </li>
        <li>
          <Link
            to="/"
            hash={CATALOG_ANCHOR}
            activeOptions={{ exact: true, includeHash: true }}
            data-active={active === 'market'}
            className={navItemClass}
          >
            Mercado
          </Link>
        </li>
        <li>
          <UnavailableAction
            feature="A página de criadores"
            className={cn(navItemClass, 'cursor-pointer')}
          >
            Criadores
          </UnavailableAction>
        </li>
        <li>
          <UnavailableAction
            feature="A central de conteúdos"
            className={cn(navItemClass, 'cursor-pointer')}
          >
            Aprenda
          </UnavailableAction>
        </li>
      </ul>
    </nav>
  )
}

function HeaderActions() {
  const cartCount = useCartCount()
  return (
    <div className="flex items-center gap-7">
      <Link
        to="/"
        hash={CATALOG_ANCHOR}
        state={{ focusSearch: true }}
        aria-label="Buscar NFTs"
        className="text-foreground transition-colors hover:text-highlight"
      >
        <SearchIcon className="size-5" />
      </Link>
      <Link
        to="/carrinho"
        aria-label={cartLabel(cartCount)}
        className="relative text-foreground transition-colors hover:text-highlight"
      >
        <CartIcon className="size-6" />
        <CartBadge count={cartCount} />
      </Link>
      <AccountActions />
    </div>
  )
}

/** Desktop and tablet header. Mobile screens use the bottom tab bar. */
export function SiteHeader() {
  return (
    <header className="hidden md:block">
      <div className="container-page">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-6 border-b border-primary/40 pt-6">
          <Link
            to="/"
            aria-label="Kurio, página inicial"
            className="mt-2.5 justify-self-start text-14 font-bold tracking-brand text-foreground"
          >
            KURIO
          </Link>
          <MainNav />
          <div className="justify-self-end">
            <HeaderActions />
          </div>
        </div>
      </div>
    </header>
  )
}
