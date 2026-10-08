import { createFileRoute, redirect } from '@tanstack/react-router'

import { ScreenPlaceholder } from '@/components/layout/screen-placeholder'
import { sessionQueryOptions } from '@/features/auth/queries'
import { validateAuthSearch } from '@/features/auth/redirect'
import { sessionStore } from '@/features/auth/session-store'

export const Route = createFileRoute('/login')({
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ context, search }) => {
    const token = sessionStore.getToken()
    if (!token) return
    const auth = await context.queryClient.query(sessionQueryOptions(token))
    if (auth) throw redirect({ href: search.redirect ?? '/', replace: true })
  },
  head: () => ({ meta: [{ title: 'Entrar | Kurio' }] }),
  component: () => <ScreenPlaceholder title="Entrar" />,
})
