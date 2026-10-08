import { createCatalogFixtures } from '../fixtures/catalog'
import { SEED_DATE, USERS } from '../fixtures/users'
import { type DatasetId, DB_VERSION, type MockDatabase } from './schema'

/** Builds a fresh, deterministic snapshot for a dataset. */
export function createSeed(dataset: DatasetId): MockDatabase {
  return {
    version: DB_VERSION,
    dataset,
    seededAt: SEED_DATE,
    users: structuredClone([...USERS]),
    sessions: [],
    nfts: dataset === 'empty-catalog' ? [] : createCatalogFixtures(),
    // Nova starts with one favorite (shown as a filled heart in Figma).
    favorites:
      dataset === 'empty-catalog'
        ? []
        : [
            {
              userId: 'usr_nova',
              nftId: 'emerald-ape-042',
              createdAt: SEED_DATE,
            },
          ],
  }
}
