import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import {
  Link,
  useCanGoBack,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import { toast } from 'sonner'

import {
  SelectField,
  TextareaField,
  TextField,
} from '@/components/form/text-field'
import { ChevronLeftIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import type { User } from '@/contracts/auth'
import type { CartResponse } from '@/contracts/cart'
import { NETWORKS } from '@/contracts/catalog-taxonomy'
import type { Wallet } from '@/contracts/wallets'
import { useCurrentUser } from '@/features/auth/queries'
import { useCart, useQuote } from '@/features/cart/queries'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { formatEth } from '@/features/catalog/format'
import { checkoutAttempt } from '@/features/orders/checkout-attempt'
import { WalletFields } from '@/features/wallets/components/wallet-fields'
import { useWallets } from '@/features/wallets/queries'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import type { ApiError } from '@/lib/api/errors'

import { checkoutDraft } from './checkout-draft'
import { ConnectionStatus } from './components/connection-status'
import { OrderSummary, QuoteIssues } from './components/order-summary'
import { PaymentSkeleton } from './components/payment-skeleton'
import { ProviderPicker } from './components/provider-picker'
import { ReviewDialog } from './components/review-dialog'
import {
  OtherWalletToggle,
  RegisterWalletHint,
  WalletCards,
} from './components/wallet-picker'
import {
  connectionTarget,
  EMPTY_WALLET_VALUES,
  formFieldOf,
  manualValues,
  type PaymentFormValues,
  paymentFormSchema,
  toOrderBody,
  valuesFromWallet,
} from './schemas'
import { usePlaceOrder } from './use-place-order'
import { sameTarget, useWalletConnection } from './use-wallet-connection'

const NETWORK_OPTIONS = NETWORKS.map(({ id, label }) => ({ value: id, label }))

function UsernameField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<PaymentFormValues>()
  return (
    <TextField
      label="Nome de usuário"
      required
      autoComplete="username"
      error={errors.username?.message}
      {...register('username')}
    />
  )
}

function NoteField({ className }: { className?: string }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<PaymentFormValues>()
  return (
    <TextareaField
      label="Observação do colecionador (opcional)"
      maxLength={280}
      className={className}
      error={errors.note?.message}
      {...register('note')}
    />
  )
}

interface CheckoutViewProps {
  cart: CartResponse
  wallets: readonly Wallet[]
  primary: Wallet | undefined
  quoteQuery: ReturnType<typeof useQuote>
  connection: ReturnType<typeof useWalletConnection>
  connectionOutdated: boolean
  selectWallet: (wallet: Wallet) => void
  useManualWallet: () => void
  submitting: boolean
  submitLabel: string
}

function DesktopCheckout({
  cart,
  wallets,
  primary,
  quoteQuery,
  connection,
  connectionOutdated,
  selectWallet,
  useManualWallet,
  submitting,
  submitLabel,
}: CheckoutViewProps) {
  const { watch } = useFormContext<PaymentFormValues>()
  const walletId = watch('walletId')
  const quote = quoteQuery.data
  return (
    <div className="container-page pt-7 pb-24">
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
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      <h1 className="sr-only">Pagamento</h1>

      <div className="mt-9 grid gap-12 lg:grid-cols-[minmax(0,47.625rem)_minmax(0,25.3125rem)] lg:justify-between">
        <section aria-labelledby="collector-title">
          <h2 id="collector-title" className="text-17 font-bold">
            Perfil do colecionador
          </h2>
          <div className="mt-4">
            <WalletFields second={<UsernameField />} />
          </div>
          {primary ? (
            <OtherWalletToggle
              wallets={wallets}
              primaryId={primary.id}
              selectedId={walletId}
              onSelectWallet={selectWallet}
              onManual={useManualWallet}
            />
          ) : (
            <RegisterWalletHint />
          )}
          <NoteField className="mt-6 max-w-[23rem]" />
        </section>

        <div className="grid content-start gap-7">
          <OrderSummary cart={cart} quoteQuery={quoteQuery} />
          <ProviderPicker variant="desktop" />
          <QuoteIssues quote={quote} />
          <ConnectionStatus
            state={connection.state}
            outdated={connectionOutdated}
            onDisconnect={connection.disconnect}
          />
          <Button
            type="submit"
            disabled={submitting || !quote?.purchasable}
            aria-describedby={
              quote && !quote.purchasable ? 'checkout-issues' : undefined
            }
            className="h-[2.8125rem] w-full rounded-lg text-15"
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MobileCheckout({
  wallets,
  quoteQuery,
  connection,
  connectionOutdated,
  selectWallet,
  submitting,
  submitLabel,
}: CheckoutViewProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<PaymentFormValues>()
  const walletId = watch('walletId')
  const quote = quoteQuery.data
  return (
    <div className="flex min-h-dvh flex-col px-7 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-6 pt-8 pb-7">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => {
            if (canGoBack) router.history.back()
            else void navigate({ to: '/carrinho' })
          }}
          className="grid size-[2.125rem] shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-muted text-primary transition-colors hover:text-highlight"
        >
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <h1 className="text-20 font-bold">Pagamento com carteira</h1>
      </div>

      {wallets.length ? (
        <section aria-labelledby="connected-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="connected-title" className="text-16 font-bold">
              Carteira conectada
            </h2>
            <Link
              to="/perfil/carteiras"
              className="text-14 font-bold text-highlight underline-offset-4 hover:underline"
            >
              Trocar carteira
            </Link>
          </div>
          <WalletCards
            wallets={wallets}
            selectedId={walletId}
            onSelect={selectWallet}
          />
        </section>
      ) : (
        <section aria-labelledby="collector-title" className="grid gap-4">
          <h2 id="collector-title" className="text-16 font-bold">
            Perfil do colecionador
          </h2>
          <WalletFields second={<UsernameField />} />
          <RegisterWalletHint />
          <NoteField />
        </section>
      )}

      <div className="mt-7 grid gap-5">
        {wallets.length ? (
          <SelectField
            label="Rede"
            required
            placeholder="Selecione uma rede"
            options={NETWORK_OPTIONS}
            error={errors.network?.message}
            {...register('network')}
          />
        ) : null}
        <ProviderPicker variant="mobile" />
      </div>

      <p className="mt-6 flex items-baseline justify-end gap-6 text-16 font-bold">
        Total:
        <span className="text-18 text-highlight">
          {quote ? formatEth(quote.totalEth) : '…'}
        </span>
      </p>
      <div className="mt-4 grid gap-4">
        <QuoteIssues quote={quote} />
        <ConnectionStatus
          state={connection.state}
          outdated={connectionOutdated}
          onDisconnect={connection.disconnect}
        />
      </div>
      <Button
        type="submit"
        variant="cta"
        shape="pill"
        disabled={submitting || !quote?.purchasable}
        aria-describedby={
          quote && !quote.purchasable ? 'checkout-issues' : undefined
        }
        className="mt-auto h-15 w-full text-15"
      >
        {submitLabel}
      </Button>
    </div>
  )
}

function Checkout({
  user,
  cart,
  wallets,
}: {
  user: User
  cart: CartResponse
  wallets: readonly Wallet[]
}) {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const primary =
    wallets.find((wallet) => wallet.slot === 'primary') ?? wallets[0]
  const form = useForm<PaymentFormValues>({
    resolver: standardSchemaResolver(paymentFormSchema),
    defaultValues:
      checkoutDraft.read(user.id) ??
      (primary ? valuesFromWallet(primary, user) : manualValues(user)),
  })
  const quoteQuery = useQuote(true)
  const connection = useWalletConnection(user.id)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewValues, setReviewValues] = useState<PaymentFormValues | null>(
    null,
  )
  const [reviewedQuoteId, setReviewedQuoteId] = useState<string | null>(null)
  const [changes, setChanges] = useState<string[] | null>(null)
  const [preparing, setPreparing] = useState(false)

  // Keep what the collector typed (session expiry, reload).
  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values }) => {
          checkoutDraft.save(user.id, values)
        },
      }),
    [form, user.id],
  )

  const applyFieldErrors = (error: ApiError) => {
    setReviewOpen(false)
    let focused = false
    for (const [path, message] of Object.entries(error.fields)) {
      const field = formFieldOf(path)
      if (!field) continue
      form.setError(
        field,
        { type: 'server', message },
        { shouldFocus: !focused },
      )
      focused = true
    }
    if (!focused) toast.error(error.message)
  }

  const order = usePlaceOrder(user.id, {
    onQuoteOutdated: (list) => {
      setChanges(list)
      setReviewOpen(true)
    },
    onWalletLost: (message) => {
      connection.lost(message)
      setReviewOpen(false)
    },
    onFieldErrors: applyFieldErrors,
  })

  // A reload interrupted the sending: resend the same attempt (same key).
  const resumed = useRef(false)
  const [hadAttempt] = useState(() => checkoutAttempt.get(user.id) !== null)
  useEffect(() => {
    if (resumed.current) return
    resumed.current = true
    const attempt = checkoutAttempt.get(user.id)
    if (attempt) order.resend(attempt)
  }, [order, user.id])
  const resuming = hadAttempt && order.pending

  const values = useWatch({ control: form.control })
  const target = connectionTarget({ ...manualValues(user), ...values })
  const connected =
    connection.state.status === 'connected' ? connection.state.connection : null
  const connectionOutdated = Boolean(
    connected && target && !sameTarget(connected, target),
  )

  const shouldValidate = form.formState.isSubmitted
  const setValues = (next: Partial<PaymentFormValues>) => {
    for (const [name, value] of Object.entries(next) as [
      keyof PaymentFormValues,
      PaymentFormValues[keyof PaymentFormValues],
    ][]) {
      form.setValue(name, value, { shouldDirty: true, shouldValidate })
    }
  }
  const selectWallet = (wallet: Wallet) => {
    const { username, note } = form.getValues()
    setValues({ ...valuesFromWallet(wallet, user), username, note })
  }
  const useManualWallet = () => {
    setValues(EMPTY_WALLET_VALUES)
  }

  const onSubmit = form.handleSubmit(async (validated) => {
    const nextTarget = connectionTarget(validated)
    if (!nextTarget) return
    setPreparing(true)
    try {
      const current =
        connected && sameTarget(connected, nextTarget)
          ? connected
          : await connection.connect(nextTarget)
      if (!current) return
      // Review the quote as priced right now.
      const { data: fresh } = await quoteQuery.refetch()
      setChanges(null)
      order.clearFailure()
      setReviewValues(validated)
      setReviewedQuoteId(fresh?.id ?? null)
      setReviewOpen(true)
    } finally {
      setPreparing(false)
    }
  })

  const confirm = () => {
    const quote = quoteQuery.data
    if (!quote || !reviewValues || !connected) return
    setChanges(null)
    setReviewedQuoteId(quote.id)
    order.place(toOrderBody(reviewValues, quote.id, connected.id))
  }

  const submitting =
    preparing || order.pending || connection.state.status === 'connecting'
  const submitLabel = resuming
    ? 'Retomando sua compra…'
    : connection.state.status === 'connecting'
      ? 'Aguardando a carteira…'
      : preparing
        ? 'Preparando revisão…'
        : 'Confirmar compra'

  const viewProps: CheckoutViewProps = {
    cart,
    wallets,
    primary,
    quoteQuery,
    connection,
    connectionOutdated,
    selectWallet,
    useManualWallet,
    submitting,
    submitLabel,
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        aria-busy={submitting}
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        {resuming ? (
          <p role="status" className="sr-only">
            Retomando a compra que estava sendo enviada…
          </p>
        ) : null}
        {desktop ? (
          <DesktopCheckout {...viewProps} />
        ) : (
          <MobileCheckout {...viewProps} />
        )}
      </form>
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        cart={cart}
        quote={quoteQuery.data}
        quoteFetching={quoteQuery.isFetching}
        values={reviewValues}
        connection={connected}
        changes={changes}
        repriced={
          reviewedQuoteId !== null &&
          quoteQuery.data !== undefined &&
          quoteQuery.data.id !== reviewedQuoteId &&
          changes === null
        }
        pending={order.pending}
        failure={order.failure}
        onConfirm={confirm}
        onRetry={order.retry}
      />
    </FormProvider>
  )
}

function EmptyCheckout() {
  return (
    <section className="container-page grid min-h-[50vh] place-content-center justify-items-center gap-4 py-16 text-center">
      <h1 className="text-24 font-bold">Seu carrinho está vazio</h1>
      <p className="max-w-sm text-15 text-muted-foreground">
        Adicione NFTs ao carrinho para seguir com o pagamento.
      </p>
      <Button asChild>
        <Link to="/" hash={CATALOG_ANCHOR}>
          Explorar o mercado
        </Link>
      </Button>
    </section>
  )
}

/** Checkout: collector data, wallet and network, review and order. */
export function PaymentPage() {
  const user = useCurrentUser()
  const cartQuery = useCart()
  const walletsQuery = useWallets()

  if (!user || cartQuery.isPending || walletsQuery.isPending) {
    return <PaymentSkeleton />
  }
  if (cartQuery.isError || walletsQuery.isError) {
    return (
      <section
        role="alert"
        className="container-page grid justify-items-start gap-3 py-16"
      >
        <h1 className="text-20 font-bold">
          Não foi possível carregar o pagamento
        </h1>
        <Button
          variant="secondary"
          onClick={() => {
            void cartQuery.refetch()
            void walletsQuery.refetch()
          }}
        >
          Tentar novamente
        </Button>
      </section>
    )
  }
  // A pending attempt is resumed even if the cart already changed.
  if (cartQuery.data.items.length === 0 && !checkoutAttempt.get(user.id)) {
    return <EmptyCheckout />
  }
  return (
    <Checkout
      key={user.id}
      user={user}
      cart={cartQuery.data}
      wallets={walletsQuery.data.items}
    />
  )
}
