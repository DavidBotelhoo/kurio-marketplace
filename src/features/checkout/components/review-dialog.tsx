import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CartResponse, QuoteResponse } from '@/contracts/cart'
import { providerLabel, type WalletConnection } from '@/contracts/wallets'
import { formatEth } from '@/features/catalog/format'
import { shortAddress } from '@/lib/address'

import { networkLabel } from '../format'
import type { PaymentFormValues } from '../schemas'
import type { PlaceOrderFailure } from '../use-place-order'
import { QuoteTotals } from './order-summary'

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartResponse
  quote: QuoteResponse | undefined
  quoteFetching: boolean
  values: PaymentFormValues | null
  connection: WalletConnection | null
  /** Changes reported by the API when the quote was outdated. */
  changes: string[] | null
  /** The quote was re-priced while this dialog was open (realtime). */
  repriced: boolean
  pending: boolean
  failure: PlaceOrderFailure | null
  onConfirm: () => void
  onRetry: () => void
}

/**
 * Review before sending: the latest quote, the wallet and the collector.
 * Any price change makes the collector confirm again with the new values.
 */
export function ReviewDialog({
  open,
  onOpenChange,
  cart,
  quote,
  quoteFetching,
  values,
  connection,
  changes,
  repriced,
  pending,
  failure,
  onConfirm,
  onRetry,
}: ReviewDialogProps) {
  const lines = (quote?.items ?? []).flatMap((line) => {
    const item = cart.items.find((entry) => entry.id === line.itemId)
    return item ? [{ line, item }] : []
  })
  const canConfirm =
    Boolean(quote?.purchasable) &&
    !quoteFetching &&
    !pending &&
    connection !== null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing while the order is being sent would hide its outcome.
        if (!pending) onOpenChange(next)
      }}
    >
      <DialogContent
        accent
        closeLabel="Voltar e editar"
        className="max-w-[34rem] px-6 pt-10 pb-8 sm:px-9"
      >
        <DialogTitle className="text-20 font-bold">
          Revise sua compra
        </DialogTitle>
        <DialogDescription className="mt-2 text-14 text-muted-foreground">
          Confira os itens, os valores e a carteira antes de confirmar.
        </DialogDescription>

        {changes ? (
          <div
            role="alert"
            className="mt-5 rounded-md border border-highlight/60 bg-primary/10 px-4 py-3 text-14"
          >
            <p className="font-bold text-highlight">
              Os valores mudaram desde a última cotação:
            </p>
            {changes.length ? (
              <ul className="mt-1.5 grid list-disc gap-1 pl-5 text-foreground">
                {changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-1.5 text-muted-foreground">
              Confira os novos valores e confirme novamente.
            </p>
          </div>
        ) : repriced ? (
          <p role="status" className="mt-5 text-14 text-highlight">
            Os valores foram atualizados enquanto você revisava. Confira antes
            de confirmar.
          </p>
        ) : null}

        <ul
          aria-label="Itens"
          className="mt-5 grid gap-2 border-b border-primary/30 pb-4"
        >
          {lines.map(({ line, item }) => (
            <li
              key={line.itemId}
              className="flex justify-between gap-4 text-14"
            >
              <span>
                {item.nft.name}{' '}
                <span className="text-muted-foreground">
                  (edição {item.edition.label}) × {line.quantity}
                </span>
              </span>
              <span className="font-bold whitespace-nowrap text-highlight">
                {formatEth(line.lineTotalEth)}
              </span>
            </li>
          ))}
        </ul>

        {quote ? (
          <QuoteTotals quote={quote} busy={quoteFetching} className="mt-4" />
        ) : null}

        {quote && !quote.purchasable ? (
          <ul role="alert" className="mt-4 grid gap-1 text-13 text-destructive">
            {quote.issues.map((issue) => (
              <li key={`${issue.code}-${issue.itemId ?? ''}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        ) : null}

        {values && connection ? (
          <dl className="mt-5 grid gap-1.5 rounded-md bg-muted px-4 py-3 text-14">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Carteira</dt>
              <dd>
                {providerLabel(connection.provider)} ·{' '}
                {shortAddress(connection.address, '…')}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Rede</dt>
              <dd>{networkLabel(connection.network)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Colecionador</dt>
              <dd className="text-right">
                {values.displayName} · {values.email}
              </dd>
            </div>
          </dl>
        ) : null}

        {failure ? (
          <div
            role="alert"
            className="mt-5 grid gap-3 rounded-md border border-destructive/50 px-4 py-3 text-14 text-destructive"
          >
            <p>{failure.message}</p>
            {failure.canRetry ? (
              <Button
                variant="secondary"
                size="sm"
                className="justify-self-start"
                onClick={onRetry}
              >
                Tentar novamente
              </Button>
            ) : null}
          </div>
        ) : null}

        <p role="status" className="mt-4 min-h-5 text-13 text-muted-foreground">
          {pending
            ? 'Enviando o pedido… isso pode levar alguns segundos. Não feche a página.'
            : ''}
        </p>

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Voltar e editar
          </Button>
          <Button disabled={!canConfirm} onClick={onConfirm}>
            {pending ? 'Enviando…' : 'Confirmar e pagar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
