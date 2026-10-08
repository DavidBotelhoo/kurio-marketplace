import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/perfil')({
  staticData: { mobileTabBar: true },
  component: Outlet,
})
