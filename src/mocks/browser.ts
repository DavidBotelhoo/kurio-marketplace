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
import { activeSessionCount, expireAllSessions } from './auth'
import { db } from './db/database'
import { expireCoupon } from './domain/cart'
import { changeNftPrice, setEditionAvailability } from './domain/catalog'
import type { MockDatabase } from './db/schema'
import { handlers } from './handlers'
import { resetRequestCounters } from './network'
import {
  clearEventLog,
  connectionCount,
  connectionTokens,
  disconnectAll,
  resendLastEvent,
  sendStaleEvent,
} from './realtime/server'
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
  clearEventLog()
}

/** Restores data and scenario to the defaults. */
export function resetMockEnvironment() {
  clearPrefixedStorage()
  setMockConfig(DEFAULT_CONFIG)
  db.configure(DEFAULT_CONFIG.dataset)
  db.reset()
  resetRequestCounters()
  clearEventLog()
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
  auth: {
    expireSessions: () => void
    activeSessions: () => number
  }
  coupons: {
    /** Makes a coupon expire now (applied coupons stop discounting). */
    expire: typeof expireCoupon
  }
  /** Server-side realtime controls; events reach the app via socket.io-client. */
  realtime: {
    changePrice: typeof changeNftPrice
    setAvailability: typeof setEditionAvailability
    resendLast: typeof resendLastEvent
    sendStale: typeof sendStaleEvent
    disconnectAll: () => void
    connections: () => number
    /** Session token sent by each open connection (null for visitors). */
    connectionTokens: () => (string | null)[]
  }
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
    auth: {
      expireSessions: expireAllSessions,
      activeSessions: activeSessionCount,
    },
    coupons: { expire: expireCoupon },
    realtime: {
      changePrice: changeNftPrice,
      setAvailability: setEditionAvailability,
      resendLast: resendLastEvent,
      sendStale: sendStaleEvent,
      disconnectAll: () => {
        disconnectAll()
      },
      connections: connectionCount,
      connectionTokens,
    },
  }

  void import('./panel/mount').then(({ mountMockPanel }) => {
    mountMockPanel()
  })
}
