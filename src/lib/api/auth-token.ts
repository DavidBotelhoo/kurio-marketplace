/**
 * Bridge between the HTTP client and the session feature, so the client does
 * not depend on it: the session registers how to read the current token and
 * what to do when an authenticated request is rejected.
 */
type TokenProvider = () => string | null
type UnauthorizedHandler = (rejectedToken: string, code: string) => void

let provider: TokenProvider = () => null
let onUnauthorized: UnauthorizedHandler = () => undefined

export function setAuthTokenProvider(next: TokenProvider) {
  provider = next
}

export function getAuthToken() {
  return provider()
}

export function setUnauthorizedHandler(next: UnauthorizedHandler) {
  onUnauthorized = next
}

export function notifyUnauthorized(rejectedToken: string, code: string) {
  onUnauthorized(rejectedToken, code)
}
