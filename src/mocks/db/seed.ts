import { SEED_DATE, USERS } from '../fixtures/users'
import { type DatasetId, DB_VERSION, type MockDatabase } from './schema'

/** Builds a fresh, deterministic snapshot for a dataset. */
export function createSeed(dataset: DatasetId): MockDatabase {
  return {
    version: DB_VERSION,
    dataset,
    seededAt: SEED_DATE,
    users: structuredClone([...USERS]),
  }
}
