import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CartResponse, QuoteResponse } from '@/contracts/cart'
import { CouponForm } from '@/features/cart/components/coupon-form'
import { NftImage } from '@/features/catalog/components/nft-image'
import { formatEth } from '@/features/catalog/format'
import { cn } from '@/lib/utils'

/** Subtotal, discount, network fee and total of a quote (API values). */
export function QuoteTotals({
  quote,
  busy = false,
  className,
}: {
  quote: QuoteResponse
  busy?: boolean
  className?: string
}) {
  return (
    <dl
      aria-busy={busy}
      className={cn(
        'grid gap-3 transition-opacity',
        busy && 'opacity-60',
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-15">Subtotal</dt>
        <dd className="text-18 tabular-nums">{formatEth(quote.subtotalEth)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-15">
          {quote.coupon?.status === 'applied'
            ? quote.coupon.label
            : 'Desconto do lançamento'}
        </dt>
        <dd className="text-15 whitespace-nowrap tabular-nums">
          (-) {formatEth(quote.discountEth)}
        </dd>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1">
        <dt className="text-15">Taxa de rede</dt>
        <dd className="text-18 tabular-nums">
          {formatEth(quote.networkFeeEth)}
        </dd>
        <dd className="col-span-2 text-center text-12 text-highlight">
          Taxa estimada
        </dd>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-primary/30 px-[2.625rem] pt-5">
        <dt className="text-16 font-bold">Total</dt>
        <dd className="text-18 font-bold text-highlight tabular-nums">
          {formatEth(quote.totalEth)}
        </dd>
      </div>
    </dl>
  )
}

function TotalsSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-3.5">
      <span className="sr-only">Calculando o total…</span>
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  )
}

/** Desktop "Seus NFTs": lines, promo code and the quote totals. */
export function OrderSummary({
  cart,
  quoteQuery,
}: {
  cart: CartResponse
  quoteQuery: UseQueryResult<QuoteResponse>
}) {
  const [couponOpen, setCouponOpen] = useState(false)
  const quote = quoteQuery.data

  return (
    <section aria-labelledby="order-summary-title">
      <h2 id="order-summary-title" className="text-17 font-bold">
        Seus NFTs
      </h2>
      <div
        aria-hidden="true"
        className="mt-3 flex justify-between border-b border-primary/30 pb-3 text-16 font-bold"
      >
        <span>NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>
      <ul className="mt-3 grid gap-3">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className="flex min-h-[4.375rem] items-center gap-2 bg-card pr-2.5"
          >
            <NftImage
              image={item.nft.image}
              alt=""
              sizes="70px"
              className="size-[4.375rem] shrink-0 object-cover"
            />
            <div className="ml-1 min-w-0 flex-1">
              <p className="truncate text-16 font-bold">{item.nft.name}</p>
              <p className="truncate text-14 text-subtle-foreground">
                ID do token: {item.nft.tokenId}
                <span className="sr-only">, edição {item.edition.label}</span>
              </p>
            </div>
            <p className="text-14 text-muted-foreground">
              <span className="sr-only">Quantidade: </span>
              <span aria-hidden="true">(x {item.quantity})</span>
              <span className="sr-only">{item.quantity}</span>
            </p>
            <p className="text-right text-18 font-bold whitespace-nowrap text-highlight">
              {formatEth(item.lineTotalEth)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {couponOpen || cart.coupon ? (
          <CouponForm
            coupon={cart.coupon}
            expired={quote?.coupon?.status === 'expired'}
            variant="desktop"
          />
        ) : (
          <p className="text-center text-14">
            Tem um código promocional?{' '}
            <button
              type="button"
              aria-expanded={couponOpen}
              onClick={() => {
                setCouponOpen(true)
              }}
              className="cursor-pointer text-highlight underline-offset-4 hover:underline"
            >
              Aplique aqui
            </button>
          </p>
        )}
      </div>

      <div className="mt-5">
        {quote ? (
          <QuoteTotals quote={quote} busy={quoteQuery.isFetching} />
        ) : quoteQuery.isError ? (
          <div
            role="alert"
            className="grid justify-items-start gap-2 text-14 text-muted-foreground"
          >
            <p>Não foi possível calcular o total agora.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void quoteQuery.refetch()
              }}
            >
              Calcular novamente
            </Button>
          </div>
        ) : (
          <TotalsSkeleton />
        )}
      </div>
    </section>
  )
}

/** Why checkout is blocked (sold out, fewer units), with a way to fix it. */
export function QuoteIssues({ quote }: { quote: QuoteResponse | undefined }) {
  if (!quote || quote.purchasable) return null
  return (
    <div
      id="checkout-issues"
      role="alert"
      className="grid gap-2 rounded-md border border-destructive/50 px-3 py-2.5 text-13 text-destructive"
    >
      <ul className="grid gap-1">
        {quote.issues.map((issue) => (
          <li key={`${issue.code}-${issue.itemId ?? ''}`}>{issue.message}</li>
        ))}
      </ul>
      <Link
        to="/carrinho"
        className="font-medium text-highlight underline-offset-4 hover:underline"
      >
        Ajustar no carrinho
      </Link>
    </div>
  )
}
