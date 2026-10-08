import type { QueryKey } from '@tanstack/react-query'

import { privateKeys } from '@/features/auth/query-keys'

export const favoritesKeys = {
  /** Private to the user: removed with the rest of their data on logout. */
  list: (userId: string) => [...privateKeys.user(userId), 'favorites'] as const,
  /** Matches the favorites list of any user. */
  isList: (queryKey: QueryKey) =>
    queryKey[0] === privateKeys.all[0] && queryKey[2] === 'favorites',
  /** Every favorite toggle, to know when the last concurrent one settles. */
  toggle: () => ['favorites', 'toggle'] as const,
}
