let gate: Promise<unknown> = Promise.resolve()

/**
 * Holds API requests until the transport is ready (the mock service worker in
 * the demo build), so the first render does not have to wait for it.
 * Kept free of dependencies so the entry chunk does not pull the HTTP client.
 */
export function setRequestGate(next: Promise<unknown>) {
  gate = next
}

export function waitForRequestGate() {
  return gate
}
