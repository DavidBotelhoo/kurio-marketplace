import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { applyNftUpdated } from '@/features/catalog/realtime'
import { realtime } from '@/lib/realtime/client'

const RESTORED_NOTICE_MS = 3_000

/**
 * Connects the realtime channel and keeps the query cache in sync:
 * events patch cached resources, and every reconnection refetches the active
 * queries from REST to recover anything missed while offline.
 */
export function RealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    realtime.connect(null)
    const offNftUpdated = realtime.on('nft.updated', (event) => {
      applyNftUpdated(queryClient, event)
    })
    const offReconnect = realtime.onReconnect(() => {
      void queryClient.invalidateQueries({ refetchType: 'active' })
    })
    return () => {
      offNftUpdated()
      offReconnect()
      realtime.disconnect()
    }
  }, [queryClient])

  return <RealtimeStatusNotice />
}

type Notice = 'reconnecting' | 'restored' | null

function RealtimeStatusNotice() {
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    let previous = realtime.getStatus()
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = realtime.subscribeStatus(() => {
      const status = realtime.getStatus()
      clearTimeout(timer)
      if (status === 'reconnecting') {
        setNotice('reconnecting')
      } else if (status === 'connected' && previous === 'reconnecting') {
        setNotice('restored')
        timer = setTimeout(() => {
          setNotice(null)
        }, RESTORED_NOTICE_MS)
      } else {
        setNotice(null)
      }
      previous = status
    })
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const message =
    notice === 'reconnecting'
      ? 'Conexão em tempo real interrompida. Reconectando…'
      : notice === 'restored'
        ? 'Conexão em tempo real restabelecida.'
        : ''

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4"
    >
      {message ? (
        <p className="rounded-full border border-border-strong bg-card px-4 py-2 text-13 text-foreground shadow-lg">
          <span
            aria-hidden="true"
            className={
              notice === 'reconnecting'
                ? 'mr-2 inline-block size-2 animate-pulse rounded-full bg-destructive'
                : 'mr-2 inline-block size-2 rounded-full bg-primary'
            }
          />
          {message}
        </p>
      ) : null}
    </div>
  )
}
