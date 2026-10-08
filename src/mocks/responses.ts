import { HttpResponse } from 'msw'

import type { ApiErrorBody, ApiErrorCode } from '@/contracts/errors'

const MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: 'Confira os dados informados.',
  UNAUTHENTICATED: 'Entre na sua conta para continuar.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente para continuar.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  CONFLICT: 'Os dados mudaram desde a última consulta.',
  AVAILABILITY_CONFLICT: 'Quantidade indisponível para esta edição.',
  WALLET_REJECTED: 'A conexão foi recusada na carteira.',
  WALLET_DISCONNECTED:
    'Sua carteira foi desconectada. Conecte novamente para continuar.',
  QUOTE_OUTDATED: 'Os valores do pedido mudaram. Revise antes de confirmar.',
  IDEMPOTENCY_CONFLICT:
    'Esta tentativa de compra já foi usada com outros dados.',
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
