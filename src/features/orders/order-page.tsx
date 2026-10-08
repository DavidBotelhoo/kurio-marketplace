import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { type ReactNode, useEffect } from 'react'

import { NotFound } from '@/components/layout/not-found'
import { CloseIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { Order } from '@/contracts/orders'
import { useSessionUserId } from '@/features/auth/queries'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { isApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

import {
  OrderPending,
  OrderReceipt,
  OrderRejected,
} from './components/order-states'
import { pendingOrders } from './pending-orders'
import { useOrder } from './queries'

const route = getRouteApi('/_authenticated/pedidos/$orderId')

function PageTitle({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <h1 className={className}>{children}</h1>
}

function DialogHeading({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    // The class goes to DialogTitle, which merges it with its defaults.
    <DialogTitle asChild className={className}>
      <h1>{children}</h1>
    </DialogTitle>
  )
}

const STATUS_MESSAGE: Record<Order['status'], string> = {
  pending: 'Pagamento em processamento.',
  confirmed: 'Pagamento confirmado. Seus NFTs estão na sua carteira.',
  rejected: 'Pagamento recusado. Nenhum valor foi cobrado.',
}

function OrderContent({
  order,
  Title,
}: {
  order: Order
  Title: typeof PageTitle
}) {
  switch (order.status) {
    case 'confirmed':
      return <OrderReceipt order={order} Title={Title} />
    case 'rejected':
      return <OrderRejected order={order} Title={Title} />
    case 'pending':
      return <OrderPending order={order} Title={Title} />
  }
}

function LoadingContent() {
  return (
    <div
      aria-busy="true"
      className="grid justify-items-center gap-4 px-6 py-10 sm:px-11"
    >
      <span className="sr-only">Carregando o pedido…</span>
      <Skeleton className="size-20 rounded-full" />
      <Skeleton className="h-5 w-64" />
      <Skeleton className="mt-4 h-14 w-full" />
      {[0, 1].map((row) => (
        <Skeleton key={row} className="h-[4.375rem] w-full" />
      ))}
    </div>
  )
}

/**
 * Order result (/pedidos/$orderId). Desktop: the Figma receipt dialog;
 * mobile: a full page. The receipt only appears for confirmed orders; a
 * pending order is followed in realtime (and after reloads).
 */
export function OrderPage() {
  const { orderId } = route.useParams()
  const navigate = useNavigate()
  const userId = useSessionUserId()
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const query = useOrder(orderId)
  const order = query.data

  // Opened directly (reload, link, another tab): follow it until it settles.
  useEffect(() => {
    if (userId && order?.status === 'pending')
      pendingOrders.add(userId, order.id)
  }, [userId, order?.status, order?.id])

  if (
    query.isError &&
    isApiError(query.error) &&
    query.error.code === 'NOT_FOUND'
  ) {
    return (
      <NotFound
        title="Pedido não encontrado"
        description="Este pedido não existe ou pertence a outra conta."
      />
    )
  }

  const close = () => {
    void navigate({ to: '/' })
  }

  const body = (Title: typeof PageTitle) =>
    order ? (
      <OrderContent order={order} Title={Title} />
    ) : query.isError ? (
      <div
        role="alert"
        className="grid justify-items-center gap-3 px-6 py-10 text-center"
      >
        <Title className="text-18 font-bold">
          Não foi possível carregar o pedido
        </Title>
        <Button
          variant="secondary"
          onClick={() => {
            void query.refetch()
          }}
        >
          Tentar novamente
        </Button>
      </div>
    ) : (
      <>
        <Title className="sr-only">Pedido</Title>
        <LoadingContent />
      </>
    )

  const announcement = (
    <p role="status" className="sr-only">
      {order ? STATUS_MESSAGE[order.status] : ''}
    </p>
  )

  if (desktop) {
    return (
      <div className="min-h-[60vh]">
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) close()
          }}
        >
          <DialogContent
            accent
            aria-describedby={undefined}
            closeLabel="Fechar e voltar ao início"
            className="max-w-[36.125rem] pb-10 [&_[data-slot=dialog-close]]:top-5"
          >
            {body(DialogHeading)}
            {announcement}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Fechar e voltar ao início"
          onClick={close}
          className="grid size-9 cursor-pointer place-items-center rounded-full text-primary transition-colors hover:text-highlight"
        >
          <CloseIcon className="size-3.5" />
        </button>
      </div>
      <article
        className={cn(
          'mt-2 overflow-hidden rounded-lg border-b-[0.625rem] border-b-primary bg-card pb-8',
        )}
      >
        {body(PageTitle)}
      </article>
      {announcement}
    </div>
  )
}
