import { useEffect, useRef, useState } from 'react'

import type {
  ConnectWalletRequest,
  WalletConnection,
} from '@/contracts/wallets'
import { fetchConnection } from '@/features/wallets/api'
import {
  useConnectWallet,
  useDisconnectWallet,
} from '@/features/wallets/queries'
import { isApiError } from '@/lib/api/errors'

const STORAGE_KEY = 'kurio.checkout.connection'

export type ConnectionState =
  | { status: 'idle'; notice: string | null }
  | { status: 'connecting'; provider: ConnectWalletRequest['provider'] }
  | { status: 'connected'; connection: WalletConnection }
  | { status: 'rejected'; message: string }

function readStored(userId: string): WalletConnection | null {
  try {
    const parsed = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) ?? 'null',
    ) as {
      userId: string
      connection: WalletConnection
    } | null
    if (parsed?.userId !== userId) return null
    return Date.parse(parsed.connection.expiresAt) > Date.now()
      ? parsed.connection
      : null
  } catch {
    return null
  }
}

function store(userId: string, connection: WalletConnection | null) {
  try {
    if (connection) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userId, connection }),
      )
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // The connection then lasts until the page closes.
  }
}

export function sameTarget(
  connection: WalletConnection,
  target: Pick<ConnectWalletRequest, 'address' | 'network' | 'provider'>,
) {
  return (
    connection.address.toLowerCase() === target.address.toLowerCase() &&
    connection.network === target.network &&
    connection.provider === target.provider
  )
}

/**
 * Simulated wallet connection of the checkout: connect (the extension may
 * refuse), disconnect, and notice when the API ended it. Kept for the tab
 * so a reload does not ask for a new approval.
 */
export function useWalletConnection(userId: string) {
  const [state, setState] = useState<ConnectionState>(() => {
    const stored = readStored(userId)
    return stored
      ? { status: 'connected', connection: stored }
      : { status: 'idle', notice: null }
  })
  const { mutateAsync: requestConnection } = useConnectWallet()
  const { mutate: endConnection } = useDisconnectWallet()
  const verified = useRef(false)

  const lost = (notice: string) => {
    store(userId, null)
    setState({ status: 'idle', notice })
  }

  // A restored connection may have ended meanwhile (extension, other tab).
  useEffect(() => {
    if (verified.current || state.status !== 'connected') return
    verified.current = true
    fetchConnection(state.connection.id).catch((error: unknown) => {
      if (isApiError(error) && error.status === 404) {
        store(userId, null)
        setState({
          status: 'idle',
          notice:
            'A carteira foi desconectada. Conecte novamente ao confirmar.',
        })
      }
    })
  }, [state, userId])

  const connect = async (target: ConnectWalletRequest) => {
    if (state.status === 'connected') endConnection(state.connection.id)
    setState({ status: 'connecting', provider: target.provider })
    try {
      const connection = await requestConnection(target)
      store(userId, connection)
      setState({ status: 'connected', connection })
      return connection
    } catch (error) {
      store(userId, null)
      setState({
        status: 'rejected',
        message: isApiError(error)
          ? error.message
          : 'Não foi possível conectar a carteira. Tente novamente.',
      })
      return null
    }
  }

  const disconnect = () => {
    if (state.status === 'connected') endConnection(state.connection.id)
    store(userId, null)
    setState({ status: 'idle', notice: null })
  }

  return { state, connect, disconnect, lost }
}
