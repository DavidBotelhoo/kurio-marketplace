import { HttpResponse } from 'msw'

import {
  createOrderRequestSchema,
  IDEMPOTENCY_HEADER,
  type OrdersResponse,
} from '@/contracts/orders'

import { requireSession } from '../auth'
import {
  createOrder,
  getOrder,
  listOrders,
  OrderError,
  settleDueOrders,
} from '../domain/orders'
import { readJsonBody, route } from '../http'
import { apiError } from '../responses'
import { validationError } from '../validation'

const KEY_PATTERN = /^[A-Za-z0-9-]{8,100}$/

function orderErrorResponse(error: unknown) {
  if (!(error instanceof OrderError)) throw error
  const { failure } = error
  switch (failure.kind) {
    case 'idempotency-conflict':
      return apiError(409, 'IDEMPOTENCY_CONFLICT')
    case 'wallet-disconnected':
      return apiError(409, 'WALLET_DISCONNECTED', { message: failure.message })
    case 'quote-used':
      return apiError(409, 'CONFLICT', {
        message: 'Esta cotação já gerou um pedido.',
        details: { orderId: failure.orderId },
      })
    case 'quote-outdated':
      return apiError(409, 'QUOTE_OUTDATED', { details: failure.details })
  }
}

export const ordersHandlers = [
  route(
    'post',
    '/orders',
    { operation: 'orders.create', label: 'Pedidos (criar)' },
    async ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const key = request.headers.get(IDEMPOTENCY_HEADER) ?? ''
      if (!KEY_PATTERN.test(key)) {
        return apiError(422, 'VALIDATION_ERROR', {
          message: 'Envie uma chave de idempotência válida.',
          fields: {
            idempotencyKey: 'Chave de idempotência ausente ou inválida.',
          },
        })
      }
      const parsed = createOrderRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      try {
        const { order, replayed } = createOrder(check.user.id, key, parsed.data)
        return HttpResponse.json(order, {
          status: replayed ? 200 : 201,
          headers: replayed ? { 'Idempotent-Replayed': 'true' } : {},
        })
      } catch (error) {
        return orderErrorResponse(error)
      }
    },
  ),

  route(
    'get',
    '/orders',
    { operation: 'orders.list', label: 'Pedidos (histórico)' },
    async ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      await settleDueOrders()
      const body: OrdersResponse = { items: listOrders(check.user.id) }
      return HttpResponse.json(body)
    },
  ),

  route<{ orderId: string }>(
    'get',
    '/orders/:orderId',
    { operation: 'orders.get', label: 'Pedidos (consulta)' },
    async ({ request, params }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      // A due payment is settled before answering (refresh or reconnection).
      await settleDueOrders()
      const order = getOrder(check.user.id, params.orderId)
      return order
        ? HttpResponse.json(order)
        : apiError(404, 'NOT_FOUND', { message: 'Pedido não encontrado.' })
    },
  ),
]
