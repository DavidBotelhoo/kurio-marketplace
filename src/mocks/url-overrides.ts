import { clearPrefixedStorage, MOCK_CONFIG_KEY } from './storage'

export interface MockUrlOverrides {
  /** ?mock-scenario=<preset id> */
  scenario: string | null
  /** ?mock-panel=0 hides the control panel; any other value shows it. */
  panel: boolean | null
}

/**
 * Reads the mock switches from the URL synchronously, before the router and
 * the app read anything, and removes them from the address bar.
 * ?mock-reset wipes the demo state right away (keeping the scenario), so no
 * stale session or cart is ever read by the app.
 */
export function captureMockUrlOverrides(): MockUrlOverrides {
  const url = new URL(window.location.href)
  const { searchParams } = url

  const reset = searchParams.has('mock-reset')
  const overrides: MockUrlOverrides = {
    scenario: searchParams.get('mock-scenario'),
    panel: searchParams.has('mock-panel')
      ? searchParams.get('mock-panel') !== '0'
      : null,
  }

  if (reset) clearPrefixedStorage([MOCK_CONFIG_KEY])

  if (reset || overrides.scenario !== null || overrides.panel !== null) {
    for (const key of ['mock-reset', 'mock-scenario', 'mock-panel']) {
      searchParams.delete(key)
    }
    window.history.replaceState(window.history.state, '', url)
  }

  return overrides
}
