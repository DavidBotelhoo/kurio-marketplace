import { Link, useLocation } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { CartIcon, SearchIcon } from '@/components/icons'
import { UnavailableAction } from '@/components/unavailable-action'
import { AccountActions } from '@/features/auth/components/account-actions'
import { CartBadge } from '@/features/cart/components/cart-badge'
import { cartLabel } from '@/features/cart/labels'
import { useCartCount } from '@/features/cart/queries'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import { searchTriggerClass } from './header-search-trigger'

// The search field and its data layer load on demand, outside the entry chunk.
const HeaderSearch = lazy(() => import('./header-search'))

const MARKET_PATHS = /^\/(nfts|carrinho|pagamento|pedidos)(\/|$)/

// Figma: 40px between labels, baselines at 40.7px, the active underline as
// wide as the label and resting on the header divider (69px tall header).
const navItemClass =
  'relative block pb-[1.4375rem] text-16 leading-[1.3125rem] whitespace-nowrap text-foreground transition-colors hover:text-highlight data-[active=true]:font-bold data-[active=true]:text-highlight data-[active=true]:after:absolute data-[active=true]:after:inset-x-0 data-[active=true]:after:-bottom-px data-[active=true]:after:h-[3px] data-[active=true]:after:bg-primary'

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
      <ul className="flex gap-8 lg:gap-10">
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
  // The header (and its search) only exists from md on.
  const desktop = useMediaQuery(DESKTOP_QUERY)
  return (
    <div className="flex items-center gap-7">
      {desktop ? (
        <Suspense
          fallback={
            <span aria-hidden="true" className={searchTriggerClass}>
              <SearchIcon className="size-5" />
            </span>
          }
        >
          <HeaderSearch />
        </Suspense>
      ) : null}
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
        {/* xl: the menu starts where the 1440 frame puts it (x = 496). */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-6 border-b border-primary/40 pt-6 xl:grid-cols-[22rem_auto_1fr]">
          <Link
            to="/"
            aria-label="Kurio, página inicial"
            className="mt-1.5 justify-self-start text-14 font-bold tracking-brand text-foreground"
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
