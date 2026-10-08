export const sessionKeys = {
  all: ['session'] as const,
  /** Keyed by token: data of different sessions never share an entry. */
  current: (token: string | null) => [...sessionKeys.all, token] as const,
}

/**
 * Private data lives under ["private", userId, …]: it is isolated per user
 * and removed in one call when the session ends or changes.
 */
export const privateKeys = {
  all: ['private'] as const,
  user: (userId: string) => [...privateKeys.all, userId] as const,
}
