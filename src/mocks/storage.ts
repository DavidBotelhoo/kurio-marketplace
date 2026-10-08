/**
 * Every key written by the app and the mock layer starts with this prefix,
 * so a reset can wipe the whole demo state at once.
 */
export const STORAGE_PREFIX = 'kurio.'

export const MOCK_CONFIG_KEY = `${STORAGE_PREFIX}mocks.config`
export const MOCK_DB_KEY = `${STORAGE_PREFIX}mocks.db`

export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be full or blocked (private mode): state stays in memory.
  }
}

/** Removes every app/mock key, except the ones listed in `keep`. */
export function clearPrefixedStorage(keep: readonly string[] = []) {
  const shouldRemove = (key: string) =>
    key.startsWith(STORAGE_PREFIX) && !keep.includes(key)
  try {
    for (const key of Object.keys(localStorage)) {
      if (shouldRemove(key)) localStorage.removeItem(key)
    }
    for (const key of Object.keys(sessionStorage)) {
      if (shouldRemove(key)) sessionStorage.removeItem(key)
    }
  } catch {
    // Ignore blocked storage.
  }
}
