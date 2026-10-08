import { apiError } from './responses'

interface Issue {
  path: readonly PropertyKey[]
  message: string
}

/** First message per field, keyed by dotted path ("items.0.quantity"). */
export function fieldErrors(issues: readonly Issue[]) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_'
    fields[key] ??= issue.message
  }
  return fields
}

export function validationError(issues: readonly Issue[]) {
  return apiError(422, 'VALIDATION_ERROR', { fields: fieldErrors(issues) })
}
