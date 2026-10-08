import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/perfil')({
  staticData: { mobileTabBar: true },
  component: Outlet,
})
