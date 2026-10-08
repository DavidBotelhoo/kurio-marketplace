import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { type ReactNode, useRef } from 'react'

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
import { SocialSignIn } from './social-sign-in'

export type AuthLayout = 'dialog' | 'page'

interface AuthShellProps {
  mode: 'login' | 'register'
  /** Mobile page heading and dialog title. */
  title: string
  /** Dialog subtitle (desktop). */
  description: string
  children: (layout: AuthLayout) => ReactNode
  /** Link shown under the page on mobile (switch between sign in/up). */
  switchLink: ReactNode
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

function AuthTabs({ mode }: { mode: AuthShellProps['mode'] }) {
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
      <span className="sr-only">
        {mode === 'login' ? 'Entrar selecionado' : 'Criar conta selecionado'}
      </span>
    </nav>
  )
}

/**
 * Desktop: modal over the home page, as in the Figma file. Mobile: full page.
 * Closing the modal returns to the page the visitor came from, unless it is a
 * private one (it would send them straight back here).
 */
export function AuthShell({
  mode,
  title,
  description,
  children,
  switchLink,
}: AuthShellProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const navigate = useNavigate()
  const { redirect } = useAuthSearch()
  const contentRef = useRef<HTMLDivElement>(null)

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
            <AuthTabs mode={mode} />
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <DialogDescription className="mx-auto mt-[2.375rem] max-w-[21.1875rem] px-4 text-center leading-[1.2] sm:px-0">
              {description}
            </DialogDescription>
            <div className="mx-auto mt-[1.5625rem] w-full max-w-[21.1875rem] px-4 sm:px-0">
              <ReasonNotice />
              {children('dialog')}
            </div>
            <SocialSignIn layout="dialog" />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <section className="mx-auto w-full max-w-[22.3125rem] px-(--gutter) pt-16 pb-12">
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
        {children('page')}
      </div>
      <SocialSignIn layout="page" />
      <p className="mt-11 text-center text-15 text-muted-foreground">
        {switchLink}
      </p>
    </section>
  )
}
