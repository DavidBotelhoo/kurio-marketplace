import { setupWorker } from 'msw/browser'

import { env } from '@/lib/env'

import {
  configFromPreset,
  DEFAULT_CONFIG,
  getMockConfig,
  isPresetId,
  type MockConfig,
  type PresetId,
  setMockConfig,
  updateMockConfig,
} from './config'
import { db } from './db/database'
import type { MockDatabase } from './db/schema'
import { handlers } from './handlers'
import { resetRequestCounters } from './network'
import { listOperations, type OperationInfo } from './operations'
import { clearPrefixedStorage, MOCK_CONFIG_KEY } from './storage'
import type { MockUrlOverrides } from './url-overrides'

export const worker = setupWorker(...handlers)

/** Applies a named scenario; a different dataset reseeds the database. */
export function applyPreset(id: PresetId) {
  const previous = getMockConfig()
  const next = setMockConfig(configFromPreset(id, previous))
  db.configure(next.dataset)
  if (next.dataset !== previous.dataset) db.reset()
  resetRequestCounters()
  return next
}

/**
 * Restores the seeded data and clears every app key (session, cart, cache
 * hints), keeping the selected scenario. Callers reload the page afterwards.
 */
export function resetMockData() {
  const config = getMockConfig()
  clearPrefixedStorage([MOCK_CONFIG_KEY])
  db.configure(config.dataset)
  db.reset()
  resetRequestCounters()
}

/** Restores data and scenario to the defaults. */
export function resetMockEnvironment() {
  clearPrefixedStorage()
  setMockConfig(DEFAULT_CONFIG)
  db.configure(DEFAULT_CONFIG.dataset)
  db.reset()
  resetRequestCounters()
}

/** Programmatic control used by Playwright tests and the browser console. */
export interface KurioMocksApi {
  getConfig: () => MockConfig
  updateConfig: (patch: Partial<MockConfig>) => MockConfig
  applyPreset: (id: PresetId) => MockConfig
  resetData: () => void
  resetAll: () => void
  snapshot: () => MockDatabase
  operations: () => OperationInfo[]
}

declare global {
  interface Window {
    __kurioMocks?: KurioMocksApi
  }
}

/** Starts the mock API; resolves once the service worker intercepts requests. */
export async function startMocks(overrides: MockUrlOverrides) {
  db.configure(getMockConfig().dataset)
  if (overrides.scenario !== null && isPresetId(overrides.scenario)) {
    applyPreset(overrides.scenario)
  }
  if (overrides.panel !== null) {
    setMockConfig({ ...getMockConfig(), panel: overrides.panel })
  }

  await worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    quiet: true,
    onUnhandledRequest(request, print) {
      // Only API calls are expected to be mocked; assets go to the network.
      if (new URL(request.url).pathname.startsWith(env.apiUrl)) print.warning()
    },
  })

  window.__kurioMocks = {
    getConfig: getMockConfig,
    updateConfig: updateMockConfig,
    applyPreset,
    resetData: resetMockData,
    resetAll: resetMockEnvironment,
    snapshot: () => structuredClone(db.read()),
    operations: listOperations,
  }

  void import('./panel/mount').then(({ mountMockPanel }) => {
    mountMockPanel()
  })
}
