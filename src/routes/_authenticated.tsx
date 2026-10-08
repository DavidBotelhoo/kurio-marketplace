import { createFileRoute } from '@tanstack/react-router'

import { requireSession } from '@/features/auth/route-guard'

/**
 * Pathless layout for private screens (checkout, orders, profile, wallets,
 * favorites): only reachable with a valid session.
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) =>
    requireSession(context.queryClient, location.href),
})
