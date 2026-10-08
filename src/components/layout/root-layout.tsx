import { HeadContent, Outlet, useMatches } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import {
  MOBILE_TAB_BAR_HEIGHT,
  MobileTabBar,
} from '@/components/layout/mobile-tab-bar'
import { RealtimeSync } from '@/components/layout/realtime-sync'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Toaster } from '@/components/ui/sonner'
import { useFocusOnNavigate } from '@/hooks/use-focus-on-navigate'

const MAIN_ID = 'conteudo'

const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null

const QueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )
  : () => null

export function RootLayout() {
  const showTabBar = useMatches({
    select: (matches) =>
      matches.some((match) => match.staticData.mobileTabBar === true),
  })
  useFocusOnNavigate(MAIN_ID)

  return (
    <>
      <HeadContent />
      <a
        href={`#${MAIN_ID}`}
        className="sr-only z-50 rounded-sm bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <div
        className="flex min-h-dvh flex-col max-md:pb-(--tab-bar-space)"
        style={
          {
            '--tab-bar-space': showTabBar ? MOBILE_TAB_BAR_HEIGHT : '0px',
          } as React.CSSProperties
        }
      >
        <SiteHeader />
        <main id={MAIN_ID} tabIndex={-1} className="flex-1 outline-none">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      {showTabBar ? <MobileTabBar /> : null}
      <Toaster />
      <RealtimeSync />
      <Suspense>
        <RouterDevtools position="top-right" />
        <QueryDevtools buttonPosition="bottom-right" />
      </Suspense>
    </>
  )
}
