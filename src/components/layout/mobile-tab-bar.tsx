import { Link, type LinkProps } from '@tanstack/react-router'
import type { ComponentType, ReactNode } from 'react'

import {
  HeartFilledIcon,
  HomeIcon,
  ScanIcon,
  ShopIcon,
  UserFilledIcon,
  type IconProps,
} from '@/components/icons'
import { UnavailableAction } from '@/components/unavailable-action'
import { CartBadge } from '@/features/cart/components/cart-badge'
import { cartLabel } from '@/features/cart/labels'
import { useCartCount } from '@/features/cart/queries'

/** Height of the Figma bar (notch included). */
const BAR_HEIGHT = '5.9375rem'

/**
 * Space taken at the bottom of the screen, reserved by pages that show the
 * bar: the Figma bar plus the area under it that the system or the browser
 * toolbar covers (home indicator).
 */
export const MOBILE_TAB_BAR_HEIGHT = `calc(${BAR_HEIGHT} + env(safe-area-inset-bottom))`

/** Figma tab bar notch (x 131–283 of the 414px frame), in local coordinates. */
const NOTCH_PATH =
  'M152 0C138.09 0 125.87 8.2 120.02 20.65 112.26 37.17 95.46 48.62 76 48.62S39.74 37.18 31.98 20.65C26.13 8.2 13.9 0 0 0v95h152z'

interface TabProps {
  to: LinkProps['to']
  label: string
  Icon: ComponentType<IconProps>
  /** Icon size from the Figma frame (icons have square view boxes). */
  iconClassName: string
  exact?: boolean
  badge?: ReactNode
}

function Tab({
  to,
  label,
  Icon,
  iconClassName,
  exact = false,
  badge,
}: TabProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      activeOptions={{ exact }}
      className="grid h-12 place-items-center text-muted-foreground transition-colors data-[status=active]:text-highlight"
    >
      <span className="relative grid place-items-center">
        <Icon className={iconClassName} />
        {badge}
      </span>
    </Link>
  )
}

/**
 * Bottom navigation from the mobile home frame. The center notch is an SVG
 * segment between two flexible bars, so the shape holds for any phone width.
 */
export function MobileTabBar() {
  const cartCount = useCartCount()
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ height: MOBILE_TAB_BAR_HEIGHT }}
    >
      {/* The Figma shape keeps its 95px; the safe area below is plain card. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col drop-shadow-[0_-10px_15px_rgb(10_6_4/0.45)]"
      >
        <div className="flex shrink-0" style={{ height: BAR_HEIGHT }}>
          <div className="-mr-px flex-1 rounded-tl-[1.8rem] bg-card" />
          <svg
            viewBox="0 0 152 95"
            className="h-full w-[9.5rem] shrink-0 fill-card"
            preserveAspectRatio="none"
          >
            <path d={NOTCH_PATH} />
          </svg>
          <div className="-ml-px flex-1 rounded-tr-[1.8rem] bg-card" />
        </div>
        <div className="-mt-px flex-1 bg-card" />
      </div>

      <ul className="relative grid h-full grid-cols-5 items-start px-2 pt-[1.75rem] pb-[env(safe-area-inset-bottom)]">
        <li>
          <Tab
            to="/"
            label="Início"
            Icon={HomeIcon}
            iconClassName="size-[1.05rem]"
            exact
          />
        </li>
        <li>
          <Tab
            to="/perfil/favoritos"
            label="Favoritos"
            Icon={HeartFilledIcon}
            iconClassName="size-5"
          />
        </li>
        <li className="relative">
          <UnavailableAction
            feature="A leitura de QR code"
            aria-label="Escanear QR code"
            className="absolute -top-[3.75rem] left-1/2 grid size-[4.0625rem] -translate-x-1/2 cursor-pointer place-items-center rounded-full bg-linear-to-b from-primary/40 to-primary text-foreground"
          >
            <ScanIcon className="size-[1.675rem]" />
          </UnavailableAction>
        </li>
        <li>
          <Tab
            to="/carrinho"
            label={cartLabel(cartCount)}
            Icon={ShopIcon}
            iconClassName="size-[1.1rem]"
            badge={<CartBadge count={cartCount} className="-top-2 -right-3" />}
          />
        </li>
        <li>
          <Tab
            to="/perfil"
            label="Perfil"
            Icon={UserFilledIcon}
            iconClassName="size-[1.05rem]"
            exact
          />
        </li>
      </ul>
    </nav>
  )
}
