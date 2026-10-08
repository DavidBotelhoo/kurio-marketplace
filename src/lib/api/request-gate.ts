type RequestGate = () => Promise<unknown>

let gate: RequestGate = () => Promise.resolve()

/**
 * Holds API requests until the transport is ready (in the demo build, until
 * the mock service worker intercepts this tab), so the first render does not
 * have to wait for it. Evaluated before every request.
 * Kept free of dependencies so the entry chunk does not pull the HTTP client.
 */
export function setRequestGate(next: RequestGate) {
  gate = next
}

export function waitForRequestGate() {
  return gate()
}
