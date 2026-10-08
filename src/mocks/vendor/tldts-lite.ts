/*
 * Minimal stand-in for `tldts`, aliased in vite.config.ts.
 *
 * MSW bundles tough-cookie, which imports tldts only to find a cookie's
 * registrable domain. The real package ships the whole Public Suffix List
 * (~110 KB gzip) and would sit on the critical path of the demo build.
 * The mock API never sets cookies (auth uses a bearer token), so a naive
 * "last two labels" answer is enough.
 */
export function getDomain(hostname: string): string | null {
  const labels = hostname.split('.').filter(Boolean)
  if (labels.length < 2) return null
  return labels.slice(-2).join('.')
}
