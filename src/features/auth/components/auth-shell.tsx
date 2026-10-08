import {
  Link,
  Outlet,
  useMatchRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { useRef } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { HomePage } from '@/features/home/home-page'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import { type AuthSearch, isPrivatePath, validateAuthSearch } from '../redirect'
import { AuthLayoutContext } from './auth-layout-context'
import { SocialSignIn } from './social-sign-in'

type AuthMode = 'login' | 'register'

const COPY: Record<AuthMode, { title: string; description: string }> = {
  login: {
    title: 'Entrar',
    description:
      'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  register: {
    title: 'Criar perfil de colecionador',
    description:
      'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
}

const REASON_MESSAGES = {
  expired: 'Sua sessão expirou. Entre novamente para continuar de onde parou.',
  required: 'Entre na sua conta para continuar.',
} as const

function useAuthSearch(): AuthSearch {
  return useSearch({ strict: false, select: validateAuthSearch })
}

function ReasonNotice() {
  const { reason } = useAuthSearch()
  if (!reason) return null
  return (
    <p
      role="status"
      className="mb-4 rounded-sm border border-border-strong bg-muted px-3 py-2 text-13 text-foreground"
    >
      {REASON_MESSAGES[reason]}
    </p>
  )
}

function AuthTabs() {
  const search = useAuthSearch()
  const tabClass =
    'text-20 font-medium text-foreground transition-colors hover:text-highlight data-[status=active]:text-highlight'
  return (
    <nav
      aria-label="Acesso à conta"
      className="flex items-center justify-center gap-2"
    >
      <Link to="/login" search={search} className={tabClass}>
        Entrar
      </Link>
      <span aria-hidden="true" className="h-5 w-px bg-destructive" />
      <Link to="/cadastro" search={search} className={tabClass}>
        Criar conta
      </Link>
    </nav>
  )
}

function SwitchLink({ mode }: { mode: AuthMode }) {
  const search = useAuthSearch()
  const linkClass = 'text-highlight underline-offset-4 hover:underline'
  return mode === 'login' ? (
    <>
      Novo na Kurio?{' '}
      <Link to="/cadastro" search={search} className={linkClass}>
        Crie uma conta
      </Link>
    </>
  ) : (
    <>
      Já tem uma conta?{' '}
      <Link to="/login" search={search} className={linkClass}>
        Entre
      </Link>
    </>
  )
}

/**
 * Shared layout of /login and /cadastro. Desktop: one modal over the home page
 * (as in the Figma file) that stays open while switching tabs, so focus and
 * the animation are not reset. Mobile: full page.
 * Closing the modal returns to the page the visitor came from, unless it is a
 * private one (it would send them straight back here).
 */
export function AuthShell() {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const { redirect } = useAuthSearch()
  const contentRef = useRef<HTMLDivElement>(null)
  const mode: AuthMode = matchRoute({ to: '/cadastro' }) ? 'register' : 'login'
  const { title, description } = COPY[mode]

  if (desktop) {
    return (
      <>
        <HomePage />
        <Dialog
          open
          onOpenChange={(open) => {
            if (open) return
            void navigate({
              href: redirect && !isPrivatePath(redirect) ? redirect : '/',
            })
          }}
        >
          <DialogContent
            ref={contentRef}
            accent
            closeLabel="Fechar e voltar"
            onOpenAutoFocus={(event) => {
              // Start at the first field rather than at the tabs.
              event.preventDefault()
              contentRef.current?.querySelector('input')?.focus()
            }}
            className={cn(
              'max-w-[31.25rem] pt-12',
              mode === 'login' ? 'pb-[5.75rem]' : 'pb-[4.5rem]',
            )}
          >
            <AuthTabs />
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <DialogDescription className="mx-auto mt-[2.375rem] max-w-[21.1875rem] px-4 text-center leading-[1.2] sm:px-0">
              {description}
            </DialogDescription>
            <div className="mx-auto mt-[1.5625rem] w-full max-w-[21.1875rem] px-4 sm:px-0">
              <ReasonNotice />
              <AuthLayoutContext value="dialog">
                <Outlet />
              </AuthLayoutContext>
            </div>
            <SocialSignIn layout="dialog" />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <section className="mx-auto w-full max-w-[calc(22.3125rem+2*var(--gutter))] px-(--gutter) pt-16 pb-12">
      <Link
        to="/"
        aria-label="Kurio, página inicial"
        className="block text-center text-32 font-bold tracking-brand text-foreground"
      >
        KURIO
      </Link>
      <h1 className="mt-[5.25rem] text-center text-20 font-bold">{title}</h1>
      <div className="mt-9">
        <ReasonNotice />
        <AuthLayoutContext value="page">
          <Outlet />
        </AuthLayoutContext>
      </div>
      <SocialSignIn layout="page" />
      <p className="mt-11 text-center text-15 text-muted-foreground">
        <SwitchLink mode={mode} />
      </p>
    </section>
  )
}
