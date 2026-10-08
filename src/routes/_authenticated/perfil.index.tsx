import { createFileRoute } from '@tanstack/react-router'

import { ProfileDataPage } from '@/features/profile/profile-data-page'

export const Route = createFileRoute('/_authenticated/perfil/')({
  head: () => ({ meta: [{ title: 'Meu perfil | Kurio' }] }),
  component: ProfileDataPage,
})
