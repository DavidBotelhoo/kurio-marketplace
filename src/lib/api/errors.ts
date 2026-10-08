import { isAxiosError, isCancel } from 'axios'

import { type ApiErrorCode, isApiErrorBody } from '@/contracts/errors'

/** Errors produced on the client side, without a server response. */
export type TransportErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'CANCELED'

export type ClientErrorCode = ApiErrorCode | TransportErrorCode | 'UNKNOWN'

const DEFAULT_MESSAGES: Record<ClientErrorCode, string> = {
  VALIDATION_ERROR: 'Confira os dados informados.',
  UNAUTHENTICATED: 'Entre na sua conta para continuar.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente para continuar.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Não encontramos o que você procurava.',
  CONFLICT: 'Os dados mudaram desde a última consulta.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um instante e tente novamente.',
  SERVER_ERROR: 'Tivemos um problema no servidor. Tente novamente.',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível. Tente novamente.',
  NETWORK_ERROR: 'Sem conexão com o servidor. Verifique sua internet.',
  TIMEOUT: 'O servidor demorou para responder. Tente novamente.',
  CANCELED: 'A requisição foi cancelada.',
  UNKNOWN: 'Algo deu errado. Tente novamente.',
}

const CODE_BY_STATUS: Partial<Record<number, ApiErrorCode>> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  503: 'SERVICE_UNAVAILABLE',
}

const RETRYABLE_CODES: ReadonlySet<ClientErrorCode> = new Set([
  'NETWORK_ERROR',
  'TIMEOUT',
  'RATE_LIMITED',
  'SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
])

interface ApiErrorInit {
  code: ClientErrorCode
  message?: string
  status?: number | null
  fields?: Record<string, string>
  details?: unknown
  cause?: unknown
}

/** Normalized error for every request made through the API client. */
export class ApiError extends Error {
  override readonly name = 'ApiError'
  readonly code: ClientErrorCode
  readonly status: number | null
  readonly fields: Readonly<Record<string, string>>
  readonly details: unknown

  constructor({
    code,
    message,
    status = null,
    fields,
    details,
    cause,
  }: ApiErrorInit) {
    super(message ?? DEFAULT_MESSAGES[code], { cause })
    this.code = code
    this.status = status
    this.fields = fields ?? {}
    this.details = details
  }

  /** Transient failures that are safe to retry for idempotent requests. */
  get retryable(): boolean {
    return RETRYABLE_CODES.has(this.code)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function hasErrorCode(error: unknown, code: ClientErrorCode): boolean {
  return isApiError(error) && error.code === code
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (isCancel(error)) return new ApiError({ code: 'CANCELED', cause: error })

  if (!isAxiosError(error))
    return new ApiError({ code: 'UNKNOWN', cause: error })

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError({ code: 'TIMEOUT', cause: error })
  }

  const { response } = error
  if (!response) return new ApiError({ code: 'NETWORK_ERROR', cause: error })

  const { status } = response
  const data: unknown = response.data
  if (isApiErrorBody(data)) {
    return new ApiError({ ...data.error, status, cause: error })
  }

  const code =
    CODE_BY_STATUS[status] ?? (status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN')
  return new ApiError({ code, status, cause: error })
}
