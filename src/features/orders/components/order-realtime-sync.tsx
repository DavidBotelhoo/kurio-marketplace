import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import type { Order } from '@/contracts/orders'
import { topics } from '@/contracts/realtime-topics'
import { useSessionUserId } from '@/features/auth/queries'
import { realtime } from '@/lib/realtime/client'
import { useRealtimeEvent, useRealtimeTopics } from '@/lib/realtime/hooks'

import { pendingOrders } from '../pending-orders'
import { storeOrder } from '../queries'

/**
 * Follows the collector's pending orders on any page: "order.updated"
 * events update the cache, and after a reload or a reconnection the orders
 * are read again from REST, since events may have been missed meanwhile.
 * A final status outside the order page is announced with a toast.
 */
export function OrderRealtimeSync() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const userId = useSessionUserId()
  const tracked = useSyncExternalStore(
    pendingOrders.subscribe,
    pendingOrders.list,
  )
  const orderIds = useMemo(
    () =>
      tracked
        .filter((item) => item.userId === userId)
        .map((item) => item.orderId),
    [tracked, userId],
  )
  useRealtimeTopics(orderIds.map(topics.order))

  const handle = (order: Order) => {
    if (!userId) return
    const changed = storeOrder(queryClient, userId, order)
    if (order.status === 'pending') return
    pendingOrders.remove(order.id)
    if (!changed) return
    if (router.state.location.pathname === `/pedidos/${order.id}`) return
    const open = () => {
      void router.navigate({
        to: '/pedidos/$orderId',
        params: { orderId: order.id },
      })
    }
    if (order.status === 'confirmed') {
      toast.success('Pedido confirmado. Seus NFTs já estão na sua carteira.', {
        id: `order-${order.id}`,
        action: { label: 'Ver recibo', onClick: open },
      })
    } else {
      toast.error(
        order.failure?.message ??
          'O pagamento foi recusado. Seus itens continuam no carrinho.',
        {
          id: `order-${order.id}`,
          action: { label: 'Ver pedido', onClick: open },
        },
      )
    }
  }
  const handleRef = useRef(handle)
  useEffect(() => {
    handleRef.current = handle
  })

  useRealtimeEvent('order.updated', (event) => {
    if (orderIds.includes(event.resource.id)) handleRef.current(event.data)
  })

  useEffect(() => {
    if (!userId) return undefined
    const reconcile = () => {
      const ids = pendingOrders.forUser(userId)
      if (ids.length === 0) return
      void import('../api').then(({ fetchOrder }) => {
        for (const id of ids) {
          fetchOrder(id)
            .then((order) => {
              handleRef.current(order)
            })
            .catch(() => undefined)
        }
      })
    }
    reconcile()
    return realtime.onReconnect(reconcile)
  }, [userId])

  return null
}
