/*
 * URL search serialization for the router: plain, readable query strings
 * (?q=ape&categories=musica&categories=jogos&page=2) instead of JSON-encoded
 * values. Arrays use repeated keys; every value is a string in the URL and
 * route validators coerce it.
 */

export function parseSearchParams(search: string): Record<string, unknown> {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  )
  const result: Record<string, unknown> = {}
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    result[key] = values.length > 1 ? values : values[0]
  }
  return result
}

export function stringifySearchParams(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue
    const values: unknown[] = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
      ) {
        params.append(key, String(item))
      }
    }
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}
