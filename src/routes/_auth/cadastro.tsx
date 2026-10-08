import { createFileRoute } from '@tanstack/react-router'

import { RegisterPage } from '@/features/auth/register-page'

export const Route = createFileRoute('/_auth/cadastro')({
  head: () => ({ meta: [{ title: 'Criar conta | Kurio' }] }),
  component: RegisterPage,
})
