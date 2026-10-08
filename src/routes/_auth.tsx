import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthShell } from '@/features/auth/components/auth-shell'
import { sessionQueryOptions } from '@/features/auth/queries'
import { validateAuthSearch } from '@/features/auth/redirect'
import { sessionStore } from '@/features/auth/session-store'

/** Pathless layout of /login and /cadastro (one modal on desktop). */
export const Route = createFileRoute('/_auth')({
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ context, search }) => {
    const token = sessionStore.getToken()
    if (!token) return
    const auth = await context.queryClient.query(sessionQueryOptions(token))
    // Already signed in: go straight to where the flow was heading.
    if (auth) throw redirect({ href: search.redirect ?? '/', replace: true })
  },
  staticData: { mobileFooter: false },
  component: AuthShell,
})
