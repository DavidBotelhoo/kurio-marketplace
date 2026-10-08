import { createContext, useContext } from 'react'

export type AuthLayout = 'dialog' | 'page'

export const AuthLayoutContext = createContext<AuthLayout>('page')

/** Layout of the auth screen the form is rendered in (dialog or page). */
export function useAuthLayout() {
  return useContext(AuthLayoutContext)
}
