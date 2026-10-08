import * as z from 'zod/mini'

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

/** Search params of /login and /cadastro. */
export const authSearchSchema = z.object({
  redirect: z.optional(z.pipe(z.unknown(), z.transform(safeRedirect))),
  reason: z.optional(
    z.pipe(
      z.unknown(),
      z.transform((value) =>
        value === 'expired' || value === 'required' ? value : undefined,
      ),
    ),
  ),
})

export type AuthSearch = z.output<typeof authSearchSchema>
