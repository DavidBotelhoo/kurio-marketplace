import {
  Link,
  useCanGoBack,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'

import { ChevronLeftIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CartResponse } from '@/contracts/cart'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { isApiError } from '@/lib/api/errors'

import { CartCard, CartRow } from './components/cart-line'
import { CartSummary } from './components/cart-summary'
import { Recommendations } from './components/recommendations'
import { useCart } from './queries'

const TITLE = 'Carrinho de NFTs'

function EmptyCart() {
  return (
    <div className="grid justify-items-center gap-4 rounded-md bg-card px-6 py-14 text-center">
      <p className="text-18 font-bold">Seu carrinho está vazio</p>
      <p className="max-w-sm text-14 text-muted-foreground">
        Explore o mercado e adicione as edições que quer colecionar.
      </p>
      <Button asChild className="mt-2">
        <Link to="/" hash={CATALOG_ANCHOR}>
          Explorar o mercado
        </Link>
      </Button>
    </div>
  )
}

function CartError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="grid justify-items-start gap-3 rounded-md bg-card p-6"
    >
      <p className="text-16 font-bold">Não foi possível carregar o carrinho</p>
      <p className="text-14 text-muted-foreground">
        {isApiError(error) ? error.message : 'Tente novamente em instantes.'}
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-3">
      <span className="sr-only">Carregando o carrinho…</span>
      <Skeleton className="h-6 w-full" />
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-[4.375rem] w-full rounded-none" />
      ))}
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-5 h-10 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

function CartTable({ cart }: { cart: CartResponse }) {
  return (
    <table className="w-full table-fixed border-separate border-spacing-y-3 text-left">
      <caption className="sr-only">Itens do carrinho</caption>
      <colgroup>
        <col className="w-[39.8%]" />
        <col className="w-[17.7%]" />
        <col className="w-[17.4%]" />
        <col className="w-[17.9%]" />
        <col />
      </colgroup>
      <thead>
        <tr className="text-16 font-bold">
          <th scope="col" className="border-b border-primary/30 pb-3">
            NFTs
          </th>
          <th scope="col" className="border-b border-primary/30 pb-3">
            Preço
          </th>
          <th scope="col" className="border-b border-primary/30 pb-3">
            Edições
          </th>
          <th scope="col" className="border-b border-primary/30 pb-3">
            Total
          </th>
          <th scope="col" className="border-b border-primary/30 pb-3">
            <span className="sr-only">Remover</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {cart.items.map((item) => (
          <CartRow key={item.id} item={item} />
        ))}
      </tbody>
    </table>
  )
}

function DesktopCart() {
  const query = useCart()
  const cart = query.data
  return (
    <div className="container-page pt-7 pb-6">
      <nav aria-label="Trilha de navegação">
        <ol className="flex flex-wrap gap-1.5 text-15 font-bold">
          <li>
            <Link to="/" className="hover:text-highlight">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash={CATALOG_ANCHOR} className="hover:text-highlight">
              Mercado
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Carrinho</li>
        </ol>
      </nav>
      <h1 className="sr-only">{TITLE}</h1>

      <div className="mt-2 grid gap-12 lg:grid-cols-[minmax(0,48.875rem)_minmax(17rem,20.75rem)] lg:justify-between lg:gap-10">
        <div className="min-w-0">
          {cart ? (
            cart.items.length ? (
              <CartTable cart={cart} />
            ) : (
              <div className="mt-3">
                <EmptyCart />
              </div>
            )
          ) : query.isError ? (
            <CartError
              error={query.error}
              onRetry={() => {
                void query.refetch()
              }}
            />
          ) : (
            <TableSkeleton />
          )}
        </div>
        <div className="lg:pt-3.5">
          {cart?.items.length ? (
            <CartSummary cart={cart} variant="desktop" />
          ) : cart ? null : (
            <SummarySkeleton />
          )}
        </div>
      </div>

      <Recommendations
        excludeIds={cart?.items.map((item) => item.nft.id) ?? []}
        className="mt-24"
      />
    </div>
  )
}

function MobileCart() {
  const query = useCart()
  const cart = query.data
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="relative flex items-center justify-center px-6 pt-8 pb-6">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => {
            if (canGoBack) router.history.back()
            else void navigate({ to: '/', hash: CATALOG_ANCHOR })
          }}
          className="absolute left-6 grid size-[2.125rem] cursor-pointer place-items-center rounded-full border border-border bg-muted text-primary transition-colors hover:text-highlight"
        >
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <h1 className="text-20 font-bold">{TITLE}</h1>
      </div>

      <div className="px-6 pb-8">
        {cart ? (
          cart.items.length ? (
            <ul aria-label="Itens do carrinho" className="grid gap-5">
              {cart.items.map((item) => (
                <CartCard key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <EmptyCart />
          )
        ) : query.isError ? (
          <CartError
            error={query.error}
            onRetry={() => {
              void query.refetch()
            }}
          />
        ) : (
          <div aria-busy="true" className="grid gap-5">
            <span className="sr-only">Carregando o carrinho…</span>
            {[0, 1, 2].map((row) => (
              <Skeleton
                key={row}
                className="h-[6.25rem] w-full rounded-[0.875rem]"
              />
            ))}
          </div>
        )}
      </div>

      {cart?.items.length ? (
        <div className="mt-auto">
          <CartSummary cart={cart} variant="mobile" />
        </div>
      ) : null}
    </div>
  )
}

/** Cart with quantities, removal, coupon and the API quote summary. */
export function CartPage() {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  return desktop ? <DesktopCart /> : <MobileCart />
}
