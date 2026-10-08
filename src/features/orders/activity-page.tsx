import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Order } from '@/contracts/orders'
import { useSessionUserId } from '@/features/auth/queries'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { NftImage } from '@/features/catalog/components/nft-image'
import { formatEth } from '@/features/catalog/format'
import { cn } from '@/lib/utils'

import { formatReceiptDate, orderNumber } from './format'
import { pendingOrders } from './pending-orders'
import { useOrders } from './queries'

const STATUS: Record<
  Order['status'],
  { label: string; mark: string; className: string }
> = {
  pending: {
    label: 'Pendente',
    mark: '…',
    className: 'border-highlight/60 text-highlight',
  },
  confirmed: {
    label: 'Confirmado',
    mark: '✓',
    className: 'border-primary bg-primary/15 text-foreground',
  },
  rejected: {
    label: 'Recusado',
    mark: '!',
    className: 'border-destructive/70 text-destructive',
  },
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const { label, mark, className } = STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-12 font-bold',
        className,
      )}
    >
      <span aria-hidden="true">{mark}</span>
      {label}
    </span>
  )
}

function itemsSummary(order: Order) {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const [first] = order.items
  const others = order.items.length - 1
  const names = first
    ? `${first.name}${others > 0 ? ` e mais ${String(others)}` : ''}`
    : ''
  return `${names} · ${String(units)} ${units === 1 ? 'unidade' : 'unidades'}`
}

function OrderRow({ order }: { order: Order }) {
  return (
    <li className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-md bg-card p-4 sm:flex sm:gap-x-5">
      <div aria-hidden="true" className="flex -space-x-3">
        {order.items.slice(0, 3).map((item) => (
          <NftImage
            key={item.itemId}
            image={item.image}
            alt=""
            sizes="48px"
            className="size-12 rounded-[0.5rem] border-2 border-card object-cover"
          />
        ))}
      </div>
      <div className="min-w-0 sm:flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-15 font-bold">Pedido {orderNumber(order.id)}</p>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-13 text-muted-foreground sm:truncate">
          {formatReceiptDate(order.createdAt)} · {itemsSummary(order)}
        </p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-4 sm:contents">
        <p className="text-16 font-bold whitespace-nowrap text-highlight">
          {formatEth(order.totalEth)}
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link to="/pedidos/$orderId" params={{ orderId: order.id }}>
            {order.status === 'confirmed' ? 'Ver recibo' : 'Ver pedido'}
            <span className="sr-only"> {orderNumber(order.id)}</span>
          </Link>
        </Button>
      </div>
    </li>
  )
}

/** "Atividade": the collector's orders, with access to each receipt. */
export function ActivityPage() {
  const userId = useSessionUserId()
  const query = useOrders()
  const orders = query.data?.items ?? []

  // Pending orders in the list are followed in realtime until they settle.
  const { data } = query
  useEffect(() => {
    if (!userId || !data) return
    for (const order of data.items) {
      if (order.status === 'pending') pendingOrders.add(userId, order.id)
    }
  }, [data, userId])

  let content: React.ReactNode
  if (query.isPending) {
    content = (
      <div aria-busy="true" className="grid gap-3">
        <span className="sr-only">Carregando seus pedidos…</span>
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-20 w-full" />
        ))}
      </div>
    )
  } else if (query.isError && !query.data) {
    content = (
      <div role="alert" className="grid justify-items-start gap-3">
        <p className="text-15 text-muted-foreground">
          Não foi possível carregar seus pedidos.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            void query.refetch()
          }}
        >
          Tentar novamente
        </Button>
      </div>
    )
  } else if (orders.length === 0) {
    content = (
      <div className="grid justify-items-center gap-4 rounded-md bg-card px-6 py-14 text-center">
        <p className="text-18 font-bold">Nenhum pedido ainda</p>
        <p className="max-w-sm text-14 text-muted-foreground">
          Suas compras aparecem aqui, com o recibo de cada uma.
        </p>
        <Button asChild className="mt-2">
          <Link to="/" hash={CATALOG_ANCHOR}>
            Explorar o mercado
          </Link>
        </Button>
      </div>
    )
  } else {
    content = (
      <ul className="grid gap-3">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby="activity-title">
      <h1 id="activity-title" className="text-16 font-bold">
        Atividade
      </h1>
      <p className="mt-2 text-14 text-muted-foreground">
        Seus pedidos, do mais recente ao mais antigo.
      </p>
      <div className="mt-8">{content}</div>
    </section>
  )
}
