import { Outlet } from '@tanstack/react-router'

import { ProfileMobileNav, ProfileSidebar } from './components/profile-nav'

/** "Meu perfil": the Figma sidebar on desktop, pills on mobile. */
export function ProfileLayout() {
  return (
    <div className="container-page pt-8 pb-24 md:flex md:items-start md:gap-7 md:pt-[2.0625rem]">
      <ProfileSidebar className="hidden w-56 shrink-0 md:block lg:w-[19.375rem]" />
      <ProfileMobileNav className="md:hidden" />
      <div className="mt-8 min-w-0 flex-1 md:mt-0">
        <Outlet />
      </div>
    </div>
  )
}
