import { MOCK_DB_KEY, readJson, writeJson } from '../storage'
import { type DatasetId, DB_VERSION, type MockDatabase } from './schema'
import { createSeed } from './seed'

type Listener = () => void

let state: MockDatabase | null = null
/** Bumped on every change; snapshot key for useSyncExternalStore. */
let revision = 0
let dataset: DatasetId = 'default'
const listeners = new Set<Listener>()

function isCompatible(value: unknown): value is MockDatabase {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === DB_VERSION &&
    'dataset' in value &&
    value.dataset === dataset
  )
}

function persist(next: MockDatabase) {
  writeJson(MOCK_DB_KEY, next)
}

function load(): MockDatabase {
  const stored = readJson(MOCK_DB_KEY)
  if (isCompatible(stored)) return stored
  const seeded = createSeed(dataset)
  persist(seeded)
  return seeded
}

function notify() {
  revision += 1
  for (const listener of listeners) listener()
}

/**
 * In-memory database persisted to localStorage, so data survives refreshes
 * and stays consistent across REST responses (and, later, realtime events).
 */
export const db = {
  /** Selects the seed used when the stored snapshot is missing or stale. */
  configure(nextDataset: DatasetId) {
    if (nextDataset === dataset) return
    dataset = nextDataset
    state = null
  },

  read(): MockDatabase {
    state ??= load()
    return state
  },

  /** Applies a mutation and persists it. Handlers must write only through here. */
  write<T>(mutate: (draft: MockDatabase) => T): T {
    const current = db.read()
    const result = mutate(current)
    persist(current)
    notify()
    return result
  },

  /**
   * Drops the in-memory copy so the next read loads the persisted snapshot
   * (another tab may have written it). Used inside cross-tab locks.
   */
  refresh() {
    state = null
  },

  /** Restores the seeded snapshot of the active dataset. */
  reset() {
    state = createSeed(dataset)
    persist(state)
    notify()
  },

  revision: () => revision,

  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

// Keep tabs consistent: another tab persisted a newer snapshot.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== MOCK_DB_KEY) return
    state = null
    notify()
  })
}
