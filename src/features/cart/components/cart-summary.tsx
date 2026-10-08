import { useIsMutating } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CartResponse } from '@/contracts/cart'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { formatEth } from '@/features/catalog/format'
import { isApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

import { useQuote } from '../queries'
import { cartKeys } from '../query-keys'
import { CouponForm } from './coupon-form'

interface CartSummaryProps {
  cart: CartResponse
  variant: 'desktop' | 'mobile'
}

function SummaryRow({
  label,
  value,
  note,
  total = false,
  small = false,
  mobile,
}: {
  label: string
  value: string
  note?: string
  total?: boolean
  /** Figma discount value: 15px (fits next to its long label). */
  small?: boolean
  mobile: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className={total ? 'text-16 font-bold' : 'text-15'}>{label}</dt>
      <dd className="text-right">
        <span
          className={cn(
            'whitespace-nowrap tabular-nums',
            small ? 'text-15' : mobile && !total ? 'text-16' : 'text-18',
            total && 'font-bold text-highlight',
          )}
        >
          {value}
        </span>
        {note ? (
          <span className="block text-12 text-highlight">{note}</span>
        ) : null}
      </dd>
    </div>
  )
}

/**
 * "Resumo da carteira": every value comes from the API quote, which is
 * priced again after each cart change or realtime update.
 */
export function CartSummary({ cart, variant }: CartSummaryProps) {
  const mobile = variant === 'mobile'
  const quoteQuery = useQuote(cart.items.length > 0)
  const quote = quoteQuery.data
  const cartWrites = useIsMutating({ mutationKey: cartKeys.mutation() })
  const busy = cartWrites > 0 || quoteQuery.isFetching
  const canCheckout = Boolean(quote?.purchasable) && !busy

  let values: React.ReactNode
  if (quote) {
    values = (
      <dl
        aria-busy={busy}
        className={cn('grid gap-3.5 transition-opacity', busy && 'opacity-60')}
      >
        <SummaryRow
          mobile={mobile}
          label="Subtotal"
          value={formatEth(quote.subtotalEth)}
        />
        <SummaryRow
          mobile={mobile}
          label={
            quote.coupon?.status === 'applied'
              ? quote.coupon.label
              : 'Desconto do lançamento'
          }
          value={`(-) ${formatEth(quote.discountEth)}`}
          small
        />
        <SummaryRow
          mobile={mobile}
          label="Taxa de rede"
          value={formatEth(quote.networkFeeEth)}
          note="Taxa estimada"
        />
        <div className="mt-2.5">
          <SummaryRow
            mobile={mobile}
            total
            label="Total"
            value={formatEth(quote.totalEth)}
          />
        </div>
      </dl>
    )
  } else if (quoteQuery.isError) {
    values = (
      <div role="alert" className="grid gap-3 text-14 text-muted-foreground">
        <p>
          Não foi possível calcular o total agora.
          {isApiError(quoteQuery.error) && quoteQuery.error.retryable
            ? ' Tente novamente em instantes.'
            : ''}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="justify-self-start"
          disabled={quoteQuery.isFetching}
          onClick={() => {
            void quoteQuery.refetch()
          }}
        >
          Calcular novamente
        </Button>
      </div>
    )
  } else {
    values = (
      <div aria-busy="true" className="grid gap-3.5">
        <span className="sr-only">Calculando o total…</span>
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
        <div className="mt-2.5 flex justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
    )
  }

  const issues = quote && !busy ? quote.issues : []

  return (
    <section
      aria-labelledby="cart-summary-title"
      className={cn(
        mobile &&
          'rounded-t-[2.5rem] bg-card px-6 pt-6 pb-[calc(2.25rem+env(safe-area-inset-bottom))]',
      )}
    >
      <h2
        id="cart-summary-title"
        className={
          mobile
            ? 'sr-only'
            : 'border-b border-primary/30 pb-3 text-18 font-bold'
        }
      >
        Resumo da carteira
      </h2>
      <div className={mobile ? '' : 'mt-9'}>
        <CouponForm
          coupon={cart.coupon}
          expired={quote?.coupon?.status === 'expired'}
          variant={variant}
        />
      </div>
      <div className={mobile ? 'mt-6' : 'mt-8'}>{values}</div>
      <p role="status" className="sr-only">
        {busy && quote ? 'Atualizando valores…' : ''}
      </p>
      {issues.length ? (
        <ul
          id="cart-issues"
          className="mt-5 grid gap-1.5 rounded-md border border-destructive/50 px-3 py-2.5 text-13 text-destructive"
        >
          {issues.map((issue) => (
            <li key={`${issue.code}-${issue.itemId ?? ''}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
      <div className={mobile ? 'mt-8' : 'mt-6'}>
        {canCheckout ? (
          <Button
            asChild
            variant={mobile ? 'cta' : 'primary'}
            shape={mobile ? 'pill' : 'default'}
            className={cn(
              'w-full',
              mobile ? 'h-15 text-16' : 'h-10 rounded-[0.1875rem] text-15',
            )}
          >
            <Link to="/pagamento">Conectar e finalizar</Link>
          </Button>
        ) : (
          <Button
            disabled
            variant={mobile ? 'cta' : 'primary'}
            shape={mobile ? 'pill' : 'default'}
            aria-describedby={issues.length ? 'cart-issues' : undefined}
            className={cn(
              'w-full',
              mobile ? 'h-15 text-16' : 'h-10 rounded-[0.1875rem] text-15',
            )}
          >
            {busy ? 'Atualizando valores…' : 'Conectar e finalizar'}
          </Button>
        )}
      </div>
      {mobile ? null : (
        <p className="mt-6 text-center">
          <Link
            to="/"
            hash={CATALOG_ANCHOR}
            className="text-15 text-highlight underline-offset-4 hover:underline"
          >
            Continuar explorando
          </Link>
        </p>
      )}
    </section>
  )
}
