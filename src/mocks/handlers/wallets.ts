import { delay, HttpResponse } from 'msw'

import {
  connectWalletRequestSchema,
  createWalletRequestSchema,
  updateWalletRequestSchema,
  type WalletsResponse,
} from '@/contracts/wallets'

import { requireSession } from '../auth'
import { getMockConfig } from '../config'
import {
  connectWallet,
  createWallet,
  disconnectWallet,
  getConnection,
  listWallets,
  updateWallet,
  WalletError,
} from '../domain/wallets'
import { readJsonBody, route } from '../http'
import { apiError } from '../responses'
import { validationError } from '../validation'

/** Time the collector "takes" to answer the extension prompt. */
const APPROVAL_DELAY_MS = 900

function walletErrorResponse(error: unknown) {
  if (!(error instanceof WalletError)) throw error
  switch (error.kind) {
    case 'not-found':
      return apiError(404, 'NOT_FOUND', { message: error.message })
    case 'slot-taken':
      return apiError(409, 'CONFLICT', { message: error.message })
    case 'rejected':
      return apiError(403, 'WALLET_REJECTED', { message: error.message })
  }
}

export const walletsHandlers = [
  route(
    'get',
    '/wallets',
    { operation: 'wallets.list', label: 'Carteiras (listagem)' },
    ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const body: WalletsResponse = { items: listWallets(check.user.id) }
      return HttpResponse.json(body)
    },
  ),

  route(
    'post',
    '/wallets',
    { operation: 'wallets.create', label: 'Carteiras (cadastrar)' },
    async ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const parsed = createWalletRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      try {
        return HttpResponse.json(createWallet(check.user.id, parsed.data), {
          status: 201,
        })
      } catch (error) {
        return walletErrorResponse(error)
      }
    },
  ),

  route<{ walletId: string }>(
    'patch',
    '/wallets/:walletId',
    { operation: 'wallets.update', label: 'Carteiras (atualizar)' },
    async ({ request, params }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const parsed = updateWalletRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      try {
        return HttpResponse.json(
          updateWallet(check.user.id, params.walletId, parsed.data),
        )
      } catch (error) {
        return walletErrorResponse(error)
      }
    },
  ),

  route(
    'post',
    '/wallet-connections',
    { operation: 'wallets.connect', label: 'Carteira (conectar)' },
    async ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const parsed = connectWalletRequestSchema.safeParse(
        await readJsonBody(request),
      )
      if (!parsed.success) return validationError(parsed.error.issues)
      if (getMockConfig().latency !== 'none') await delay(APPROVAL_DELAY_MS)
      try {
        return HttpResponse.json(connectWallet(check.user.id, parsed.data), {
          status: 201,
        })
      } catch (error) {
        return walletErrorResponse(error)
      }
    },
  ),

  route<{ connectionId: string }>(
    'get',
    '/wallet-connections/:connectionId',
    { operation: 'wallets.connection', label: 'Carteira (status da conexão)' },
    ({ request, params }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const connection = getConnection(check.user.id, params.connectionId)
      return connection
        ? HttpResponse.json(connection)
        : apiError(404, 'NOT_FOUND', {
            message: 'A carteira foi desconectada.',
          })
    },
  ),

  route<{ connectionId: string }>(
    'delete',
    '/wallet-connections/:connectionId',
    { operation: 'wallets.disconnect', label: 'Carteira (desconectar)' },
    ({ request, params }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      disconnectWallet(check.user.id, params.connectionId)
      return new HttpResponse(null, { status: 204 })
    },
  ),
]
