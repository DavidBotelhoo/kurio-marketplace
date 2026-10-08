import { HttpResponse } from 'msw'

import {
  addCartItemRequestSchema,
  applyCouponRequestSchema,
  GUEST_CART_HEADER,
  updateCartItemRequestSchema,
} from '@/contracts/cart'

import { readBearerToken, requireSession } from '../auth'
import type { CartOwner } from '../db/schema'
import {
  addCartItem,
  applyCoupon,
  CartError,
  guestCart,
  mergeGuestCart,
  quoteCart,
  readCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
  userCart,
} from '../domain/cart'
import { readJsonBody, route } from '../http'
import { apiError } from '../responses'
import { validationError } from '../validation'

const GUEST_ID = /^[A-Za-z0-9-]{8,64}$/

function readGuestId(request: Request) {
  const value = request.headers.get(GUEST_CART_HEADER)
  return value && GUEST_ID.test(value) ? value : null
}

type OwnerCheck =
  { ok: true; owner: CartOwner | null } | { ok: false; response: Response }

/** Bearer token first (an invalid one is a 401), then the visitor id. */
function resolveOwner(request: Request): OwnerCheck {
  if (readBearerToken(request)) {
    const check = requireSession(request)
    return check.ok ? { ok: true, owner: userCart(check.user.id) } : check
  }
  const guestId = readGuestId(request)
  return { ok: true, owner: guestId ? guestCart(guestId) : null }
}

/** Writes need an identified cart (collector or visitor). */
function requireOwner(
  request: Request,
): { ok: true; owner: CartOwner } | { ok: false; response: Response } {
  const check = resolveOwner(request)
  if (!check.ok) return check
  if (!check.owner) {
    return {
      ok: false,
      response: apiError(401, 'UNAUTHENTICATED', {
        message: 'Carrinho não identificado.',
      }),
    }
  }
  return { ok: true, owner: check.owner }
}

function cartErrorResponse(error: unknown) {
  if (!(error instanceof CartError)) throw error
  const { failure } = error
  switch (failure.kind) {
    case 'not-found':
      return apiError(404, 'NOT_FOUND', { message: failure.message })
    case 'coupon':
      return apiError(422, 'VALIDATION_ERROR', {
        message: failure.message,
        fields: { code: failure.message },
      })
    case 'availability':
      return apiError(409, 'AVAILABILITY_CONFLICT', {
        message: failure.message,
        details: failure.details,
      })
  }
}

export const cartHandlers = [
  route(
    'get',
    '/cart',
    { operation: 'cart.get', label: 'Carrinho (consulta)' },
    ({ request }) => {
      const check = resolveOwner(request)
      if (!check.ok) return check.response
      return HttpResponse.json(readCart(check.owner))
    },
  ),

  route(
    'post',
    '/cart/items',
    { operation: 'cart.add', label: 'Carrinho (incluir)' },
    async ({ request }) => {
      const check = requireOwner(request)
      if (!check.ok) return check.response
      const parsed = addCartItemRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      try {
        return HttpResponse.json(addCartItem(check.owner, parsed.data))
      } catch (error) {
        return cartErrorResponse(error)
      }
    },
  ),

  route<{ itemId: string }>(
    'patch',
    '/cart/items/:itemId',
    { operation: 'cart.update', label: 'Carrinho (alterar quantidade)' },
    async ({ request, params }) => {
      const check = requireOwner(request)
      if (!check.ok) return check.response
      const parsed = updateCartItemRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      try {
        return HttpResponse.json(
          updateCartItem(check.owner, params.itemId, parsed.data.quantity),
        )
      } catch (error) {
        return cartErrorResponse(error)
      }
    },
  ),

  route<{ itemId: string }>(
    'delete',
    '/cart/items/:itemId',
    { operation: 'cart.remove', label: 'Carrinho (remover)' },
    ({ request, params }) => {
      const check = requireOwner(request)
      if (!check.ok) return check.response
      return HttpResponse.json(removeCartItem(check.owner, params.itemId))
    },
  ),

  route(
    'post',
    '/cart/merge',
    { operation: 'cart.merge', label: 'Carrinho (mesclar visitante)' },
    ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const guestId = readGuestId(request)
      return HttpResponse.json(
        guestId
          ? mergeGuestCart(check.user.id, guestId)
          : {
              cart: readCart(userCart(check.user.id)),
              mergedLines: 0,
              adjustments: [],
            },
      )
    },
  ),

  route(
    'put',
    '/cart/coupon',
    { operation: 'cart.coupon.apply', label: 'Cupom (aplicar)' },
    async ({ request }) => {
      const check = requireOwner(request)
      if (!check.ok) return check.response
      const parsed = applyCouponRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      try {
        return HttpResponse.json(applyCoupon(check.owner, parsed.data.code))
      } catch (error) {
        return cartErrorResponse(error)
      }
    },
  ),

  route(
    'delete',
    '/cart/coupon',
    { operation: 'cart.coupon.remove', label: 'Cupom (remover)' },
    ({ request }) => {
      const check = requireOwner(request)
      if (!check.ok) return check.response
      return HttpResponse.json(removeCoupon(check.owner))
    },
  ),

  route(
    'post',
    '/cart/quote',
    { operation: 'cart.quote', label: 'Cotação do carrinho' },
    ({ request }) => {
      const check = requireOwner(request)
      if (!check.ok) return check.response
      return HttpResponse.json(quoteCart(check.owner))
    },
  ),
]
