/**
 * Only same-origin paths are accepted as post-login destinations, so a
 * crafted link cannot send users to another site (open redirect).
 */
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return undefined
  }
  if (value.startsWith('/login') || value.startsWith('/cadastro'))
    return undefined
  return value
}

export interface AuthSearch {
  redirect?: string
  reason?: 'expired' | 'required'
}

/**
 * validateSearch of /login and /cadastro. A plain function (no schema
 * library) because route options are part of the entry chunk.
 */
export function validateAuthSearch(
  search: Record<string, unknown>,
): AuthSearch {
  const redirect = safeRedirect(search.redirect)
  const reason =
    search.reason === 'expired' || search.reason === 'required'
      ? search.reason
      : undefined
  return {
    ...(redirect ? { redirect } : {}),
    ...(reason ? { reason } : {}),
  }
}
