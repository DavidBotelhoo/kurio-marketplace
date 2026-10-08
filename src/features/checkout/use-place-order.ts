import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import {
  type CreateOrderRequest,
  quoteOutdatedDetailsSchema,
} from '@/contracts/orders'
import { quoteQueryOptions } from '@/features/cart/queries'
import {
  type CheckoutAttempt,
  checkoutAttempt,
} from '@/features/orders/checkout-attempt'
import { pendingOrders } from '@/features/orders/pending-orders'
import { useCreateOrder } from '@/features/orders/queries'
import { type ApiError, isApiError } from '@/lib/api/errors'

import { checkoutDraft } from './checkout-draft'

interface PlaceOrderHandlers {
  /** Prices changed: the new quote is cached; the collector must confirm again. */
  onQuoteOutdated: (changes: string[]) => void
  onWalletLost: (message: string) => void
  onFieldErrors: (error: ApiError) => void
}

export interface PlaceOrderFailure {
  message: string
  /** Sending the same attempt again is safe (same idempotency key). */
  canRetry: boolean
}

/**
 * Sends the order. Each confirmation is one attempt with its own idempotency
 * key, stored until the API answers: retries (automatic or by the
 * collector) and a reload resend that same attempt, so they recover the
 * order instead of buying twice.
 */
export function usePlaceOrder(userId: string, handlers: PlaceOrderHandlers) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createOrder = useCreateOrder()
  const [failure, setFailure] = useState<PlaceOrderFailure | null>(null)

  const send = (attempt: CheckoutAttempt) => {
    setFailure(null)
    createOrder.mutate(
      { body: attempt.body, idempotencyKey: attempt.idempotencyKey },
      {
        onSuccess: (order) => {
          checkoutAttempt.clear()
          checkoutDraft.clear()
          pendingOrders.add(userId, order.id)
          void navigate({
            to: '/pedidos/$orderId',
            params: { orderId: order.id },
            replace: true,
          })
        },
        onError: (error) => {
          if (!isApiError(error) || error.retryable) {
            // The order may exist already: keep the attempt to resend it.
            setFailure({
              message:
                'Não conseguimos confirmar o envio do pedido. Tente novamente: se ele já foi criado, você verá o mesmo pedido, sem cobrança em dobro.',
              canRetry: true,
            })
            return
          }
          checkoutAttempt.clear()
          switch (error.code) {
            case 'QUOTE_OUTDATED': {
              const details = quoteOutdatedDetailsSchema.safeParse(
                error.details,
              )
              if (details.success) {
                queryClient.setQueryData(
                  quoteQueryOptions({ kind: 'user', userId }).queryKey,
                  details.data.quote,
                )
                handlers.onQuoteOutdated(details.data.changes)
              } else {
                void queryClient.invalidateQueries({
                  queryKey: quoteQueryOptions({ kind: 'user', userId })
                    .queryKey,
                })
                handlers.onQuoteOutdated([])
              }
              return
            }
            case 'WALLET_DISCONNECTED':
              handlers.onWalletLost(error.message)
              return
            case 'CONFLICT': {
              // The quote already created an order (e.g. another tab).
              const orderId =
                typeof error.details === 'object' &&
                error.details !== null &&
                'orderId' in error.details &&
                typeof error.details.orderId === 'string'
                  ? error.details.orderId
                  : null
              if (orderId) {
                pendingOrders.add(userId, orderId)
                void navigate({ to: '/pedidos/$orderId', params: { orderId } })
                return
              }
              break
            }
            case 'VALIDATION_ERROR':
              handlers.onFieldErrors(error)
              return
            case 'UNAUTHENTICATED':
            case 'SESSION_EXPIRED':
              // The session lifecycle sends the collector to the login; the
              // draft brings the form back afterwards.
              return
            default:
              break
          }
          setFailure({ message: error.message, canRetry: false })
        },
      },
    )
  }

  return {
    /** New confirmation: a new attempt (new key) for these values. */
    place: (body: CreateOrderRequest) => {
      send(checkoutAttempt.start(userId, body))
    },
    /** Same attempt again (after a timeout or a reload). */
    resend: (attempt: CheckoutAttempt) => {
      send(attempt)
    },
    retry: () => {
      const attempt = checkoutAttempt.get(userId)
      if (attempt) send(attempt)
    },
    pending: createOrder.isPending,
    failure,
    clearFailure: () => {
      setFailure(null)
    },
  }
}
