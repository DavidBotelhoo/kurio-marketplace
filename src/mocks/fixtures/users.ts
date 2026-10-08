import type { UserRecord } from '../db/schema'

/** Fixed reference date so seeded data is identical on every reset. */
export const SEED_DATE = '2026-09-01T12:00:00.000Z'

/*
 * Two collectors for login, user switching and data isolation scenarios.
 * Credentials are fictitious and listed in demo-credentials.ts / README.
 */
export const USERS: readonly UserRecord[] = [
  {
    id: 'usr_nova',
    email: 'nova@kurio.test',
    username: 'nova.ribeiro',
    displayName: 'Nova Ribeiro',
    ensName: 'nova.kurio',
    walletNickname: 'Principal',
    avatarUrl: null,
    passwordHash:
      'pbkdf2$50000$e+XrgIIyTSdULfU15DRSPg==$PxvJCyqEzTt8NuZq3W+3XDx9GCkoMd3gSfV07ihDk9M=',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 'usr_david',
    email: 'david@kurio.test',
    username: 'david.dev',
    displayName: 'David Dev',
    ensName: null,
    walletNickname: null,
    avatarUrl: null,
    passwordHash:
      'pbkdf2$50000$CPUKq1CmE84M4TwvLM0ysw==$JjxX6cVd0wqFHXaE11t7viHf7Db8FD5Zl00IxWHSV5I=',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
]
