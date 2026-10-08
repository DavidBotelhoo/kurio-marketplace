import { HttpResponse } from 'msw'

import type { ApiErrorBody, ApiErrorCode } from '@/contracts/errors'

const MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: 'Confira os dados informados.',
  UNAUTHENTICATED: 'Entre na sua conta para continuar.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente para continuar.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  CONFLICT: 'Os dados mudaram desde a última consulta.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um instante e tente novamente.',
  SERVER_ERROR: 'Erro interno do servidor.',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível.',
}

/** Error response following the shared ApiErrorBody contract. */
export function apiError(
  status: number,
  code: ApiErrorCode,
  options: {
    message?: string
    fields?: Record<string, string>
    details?: unknown
  } = {},
) {
  const body: ApiErrorBody = {
    error: {
      code,
      message: options.message ?? MESSAGES[code],
      ...(options.fields ? { fields: options.fields } : {}),
      ...(options.details === undefined ? {} : { details: options.details }),
    },
  }
  return HttpResponse.json(body, { status })
}
