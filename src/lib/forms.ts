import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { isApiError } from '@/lib/api/errors'

/** Key of the form-level error set from API failures. */
export const SERVER_ERROR = 'root.server' as const

/**
 * Maps an API failure onto a react-hook-form form: field errors returned by
 * the server go to their inputs (the first one gets focus); anything else
 * becomes a form-level message.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  if (!isApiError(error)) {
    setError(SERVER_ERROR, { message: 'Algo deu errado. Tente novamente.' })
    return
  }
  const known = Object.entries(error.fields).filter(([name]) =>
    (fields as readonly string[]).includes(name),
  )
  known.forEach(([name, message], index) => {
    setError(
      name as Path<T>,
      { type: 'server', message },
      { shouldFocus: index === 0 },
    )
  })
  if (known.length === 0) {
    setError(SERVER_ERROR, { type: error.code, message: error.message })
  }
}
