import { Link } from '@tanstack/react-router'

import { ThankYouIllustration } from '@/components/icons'
import { Button } from '@/components/ui/button'
import type { Order } from '@/contracts/orders'
import { providerLabel } from '@/contracts/wallets'
import { NftImage } from '@/features/catalog/components/nft-image'
import { formatEth } from '@/features/catalog/format'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { networkLabel } from '@/features/checkout/format'
import { shortAddress } from '@/lib/address'
import { compareEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

import { formatReceiptDate, orderNumber } from '../format'

interface StateProps {
  order: Order
  /** Heading element (the dialog title on desktop). */
  Title: React.ComponentType<{ className?: string; children: React.ReactNode }>
}

/** Items and values of the order snapshot (never re-read from the catalog). */
function OrderLines({ order }: { order: Order }) {
  const discounted = compareEth(order.discountEth, '0') > 0
  return (
    <section aria-labelledby={`details-${order.id}`} className="mt-8">
      <h2 id={`details-${order.id}`} className="text-15 font-bold">
        Detalhes da transação
      </h2>
      <table className="mt-3 w-full border-separate border-spacing-y-3 text-left">
        <thead>
          <tr className="text-16">
            <th
              scope="col"
              className="border-b border-primary/30 pb-3 font-bold"
            >
              NFTs
            </th>
            <th
              scope="col"
              className="hidden border-b border-primary/30 pb-3 text-center font-bold sm:table-cell"
            >
              Edições
            </th>
            <th
              scope="col"
              className="border-b border-primary/30 pb-3 text-right font-medium"
            >
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.itemId}>
              <td className="py-0">
                <div className="flex items-center gap-3">
                  <NftImage
                    image={item.image}
                    alt=""
                    sizes="70px"
                    className="size-14 shrink-0 rounded-[0.5rem] object-cover sm:size-[4.375rem]"
                  />
                  <div className="min-w-0">
                    <p className="text-15 font-bold sm:text-16">{item.name}</p>
                    <p className="text-14 text-subtle-foreground">
                      ID do token: {item.tokenId}
                      <span className="sr-only">
                        , edição {item.editionLabel}
                      </span>
                    </p>
                    <p className="text-14 text-muted-foreground sm:hidden">
                      <span aria-hidden="true">(x {item.quantity})</span>
                      <span className="sr-only">
                        Quantidade: {item.quantity}
                      </span>
                    </p>
                  </div>
                </div>
              </td>
              <td className="hidden text-center text-14 whitespace-nowrap text-muted-foreground sm:table-cell">
                <span aria-hidden="true">(x {item.quantity})</span>
                <span className="sr-only">{item.quantity}</span>
              </td>
              <td className="pl-2 text-right text-16 font-bold whitespace-nowrap text-highlight sm:text-18">
                {formatEth(item.lineTotalEth)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-1 ml-auto grid max-w-[20rem] gap-2">
        {discounted ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-15">Subtotal</dt>
              <dd className="text-18">{formatEth(order.subtotalEth)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-15">{order.coupon?.label ?? 'Desconto'}</dt>
              <dd className="text-15">(-) {formatEth(order.discountEth)}</dd>
            </div>
          </>
        ) : null}
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-15">Taxa de rede</dt>
          <dd className="text-18">{formatEth(order.networkFeeEth)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-16 font-bold">Total</dt>
          <dd className="text-18 font-bold text-highlight">
            {formatEth(order.totalEth)}
          </dd>
        </div>
      </dl>
    </section>
  )
}

function InfoRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-y-4 border-y border-primary px-4 py-4 text-muted-foreground sm:flex sm:justify-center sm:divide-x sm:divide-primary sm:px-0">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-4 sm:px-[1.0625rem]">
          <dt className="text-14 font-bold">{item.label}</dt>
          <dd className="text-15 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Confirmed order: the Figma receipt. */
export function OrderReceipt({ order, Title }: StateProps) {
  const { transaction } = order
  return (
    <>
      <div className="grid justify-items-center gap-5 pt-7 pb-6 text-center">
        <ThankYouIllustration
          aria-hidden="true"
          className="size-20 text-primary"
        />
        <Title className="text-16 font-bold text-muted-foreground">
          Seus NFTs agora estão na sua carteira
        </Title>
      </div>
      <InfoRow
        items={[
          {
            label: 'ID da transação',
            value: transaction ? shortAddress(transaction.hash, '…') : '—',
          },
          {
            label: 'Data',
            value: formatReceiptDate(order.settledAt ?? order.createdAt),
          },
          { label: 'Total', value: formatEth(order.totalEth) },
          { label: 'Carteira', value: providerLabel(order.wallet.provider) },
        ]}
      />
      <div className="px-6 sm:px-11">
        <OrderLines order={order} />
        <p className="mt-5 border-t border-primary/30 pt-4 text-center text-14 leading-[1.7] text-muted-foreground">
          Transação confirmada na {networkLabel(order.wallet.network)}. A
          propriedade foi transferida para sua carteira conectada e registrada
          na rede.
        </p>
        {transaction ? (
          <div className="mt-6 flex justify-center">
            <Button asChild size="lg" className="h-12 rounded-[0.3125rem] px-5">
              <a
                href={transaction.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver no {transaction.explorerName}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </>
  )
}

/** Payment still processing: no receipt until the simulation confirms it. */
export function OrderPending({ order, Title }: StateProps) {
  return (
    <>
      <div className="grid justify-items-center gap-4 px-6 pt-8 pb-6 text-center sm:px-11">
        <span
          aria-hidden="true"
          className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none"
        />
        <Title className="text-18 font-bold text-foreground">
          Processando seu pagamento
        </Title>
        <p className="max-w-sm text-14 leading-[1.6] text-muted-foreground">
          Aguardando a confirmação na {networkLabel(order.wallet.network)}. Você
          pode continuar navegando: avisaremos quando o pedido for confirmado.
        </p>
      </div>
      <InfoRow
        items={[
          {
            label: 'Pedido',
            value: orderNumber(order.id),
          },
          { label: 'Data', value: formatReceiptDate(order.createdAt) },
          { label: 'Total', value: formatEth(order.totalEth) },
          { label: 'Carteira', value: providerLabel(order.wallet.provider) },
        ]}
      />
      <div className="px-6 pb-2 sm:px-11">
        <OrderLines order={order} />
        <p className="mt-6 text-center">
          <Button asChild variant="secondary">
            <Link to="/" hash={CATALOG_ANCHOR}>
              Continuar explorando
            </Link>
          </Button>
        </p>
      </div>
    </>
  )
}

/** Payment refused or stock ran out: nothing charged, the cart is kept. */
export function OrderRejected({ order, Title }: StateProps) {
  return (
    <div
      className={cn(
        'grid justify-items-center gap-4 px-6 pt-8 pb-4 text-center sm:px-11',
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-full border-2 border-destructive text-28 font-bold text-destructive"
      >
        !
      </span>
      <Title className="text-18 font-bold text-foreground">
        Pagamento recusado
      </Title>
      <p className="max-w-md text-14 leading-[1.6] text-muted-foreground">
        {order.failure?.message ??
          'O pagamento não foi concluído. Nenhum valor foi cobrado.'}
      </p>
      <p className="text-14 text-foreground">
        Seus itens continuam no carrinho para uma nova tentativa.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/" hash={CATALOG_ANCHOR}>
            Explorar o mercado
          </Link>
        </Button>
      </div>
    </div>
  )
}
