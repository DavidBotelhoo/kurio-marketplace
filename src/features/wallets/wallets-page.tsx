import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useEffect, useId, useRef, useState } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/contracts/auth'
import type { WalletSlot } from '@/contracts/wallet-providers'
import type { Wallet } from '@/contracts/wallets'
import { FormAlert } from '@/features/auth/components/form-alert'
import { useCurrentUser } from '@/features/auth/queries'
import { applyApiErrors } from '@/lib/forms'

import { WalletFields } from './components/wallet-fields'
import { useCreateWallet, useUpdateWallet, useWallets } from './queries'
import {
  newWalletValues,
  toWalletRequest,
  WALLET_FORM_FIELDS,
  type WalletFormValues,
  walletFormSchema,
  walletFormValues,
} from './schemas'

const SLOT_TITLE: Record<WalletSlot, string> = {
  primary: 'Carteira principal',
  secondary: 'Carteira secundária',
}

function NicknameField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WalletFormValues>()
  return (
    <TextField
      label="Apelido da carteira"
      required
      placeholder="Ex.: Principal, Reserva"
      error={errors.nickname?.message}
      {...register('nickname')}
    />
  )
}

interface WalletFormProps {
  slot: WalletSlot
  wallet: Wallet | undefined
  defaults: WalletFormValues
  /** "Igual à carteira principal": fields copied (as unsaved changes). */
  copyFrom: Wallet | null
  /** Changes whenever the copy option is toggled. */
  copyVersion: number
  onCancel?: () => void
}

/** Create or edit one wallet with the Figma fields ("Salvar carteira"). */
function WalletForm({
  slot,
  wallet,
  defaults,
  copyFrom,
  copyVersion,
  onCancel,
}: WalletFormProps) {
  const create = useCreateWallet()
  const update = useUpdateWallet()
  const form = useForm<WalletFormValues>({
    resolver: standardSchemaResolver(walletFormSchema),
    defaultValues: defaults,
  })
  const {
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form

  // Toggling the copy fills the fields from the primary (kept as unsaved
  // changes, the nickname stays) or brings back this wallet's values.
  // Opened by the copy option itself: apply it on mount as well.
  const appliedCopy = useRef(copyFrom ? copyVersion - 1 : copyVersion)
  useEffect(() => {
    if (appliedCopy.current === copyVersion) return
    appliedCopy.current = copyVersion
    if (!copyFrom) {
      reset(defaults)
      return
    }
    const copy = walletFormValues(copyFrom)
    for (const name of WALLET_FORM_FIELDS) {
      if (name !== 'nickname') setValue(name, copy[name], { shouldDirty: true })
    }
  }, [copyVersion, copyFrom, defaults, reset, setValue])

  const onSubmit = handleSubmit(async (values) => {
    if (wallet && !isDirty) {
      toast.info('Nenhuma alteração para salvar.')
      return
    }
    try {
      const body = toWalletRequest(values)
      if (wallet) await update.mutateAsync({ id: wallet.id, body })
      else await create.mutateAsync({ ...body, slot })
      toast.success(`${SLOT_TITLE[slot]} salva.`)
    } catch (error) {
      applyApiErrors(error, setError, WALLET_FORM_FIELDS)
    }
  })

  return (
    <FormProvider {...form}>
      <form
        noValidate
        aria-busy={isSubmitting}
        aria-label={SLOT_TITLE[slot]}
        className="mt-8"
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        <FormAlert message={errors.root?.server?.message} />
        <WalletFields second={<NicknameField />} />
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-[8.1875rem] rounded-[0.1875rem]"
          >
            {isSubmitting ? 'Salvando…' : 'Salvar carteira'}
          </Button>
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>
    </FormProvider>
  )
}

interface SlotSectionProps {
  slot: WalletSlot
  wallet: Wallet | undefined
  primary: Wallet | undefined
  user: User
}

function SlotSection({ slot, wallet, primary, user }: SlotSectionProps) {
  const [adding, setAdding] = useState(false)
  /** Bumped to restart the form from new defaults (copy of the primary). */
  const [copied, setCopied] = useState(0)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const titleId = useId()
  const open = Boolean(wallet) || adding

  const defaults = wallet
    ? walletFormValues(wallet)
    : newWalletValues(user, slot === 'primary' ? 'Principal' : 'Reserva')

  const description =
    slot === 'primary'
      ? 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.'
      : wallet
        ? 'Uma alternativa para pagar e receber NFTs, escolhida no pagamento.'
        : 'Você ainda não adicionou uma carteira secundária.'

  return (
    <section aria-labelledby={titleId}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 id={titleId} className="text-17 font-bold">
          {SLOT_TITLE[slot]}
        </h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {slot === 'secondary' && primary ? (
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-14 has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring">
              <input
                type="checkbox"
                checked={sameAsPrimary}
                onChange={(event) => {
                  setSameAsPrimary(event.target.checked)
                  setAdding(true)
                  setCopied((value) => value + 1)
                }}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="grid size-[0.9375rem] place-items-center rounded-full border-[1.5px] border-primary"
              >
                {sameAsPrimary ? (
                  <span className="size-1.5 rounded-full bg-primary" />
                ) : null}
              </span>
              Igual à carteira principal
            </label>
          ) : null}
          {open ? null : (
            <button
              type="button"
              onClick={() => {
                setAdding(true)
              }}
              className="cursor-pointer text-16 font-medium text-highlight underline-offset-4 hover:underline"
            >
              Adicionar
              <span className="sr-only"> {SLOT_TITLE[slot].toLowerCase()}</span>
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-14 text-muted-foreground">
        {slot === 'primary' && !open
          ? 'Você ainda não adicionou uma carteira principal.'
          : description}
      </p>
      {open ? (
        <WalletForm
          // A saved wallet restarts the form from the API values.
          key={wallet?.updatedAt ?? 'new'}
          slot={slot}
          wallet={wallet}
          defaults={defaults}
          copyFrom={sameAsPrimary ? (primary ?? null) : null}
          copyVersion={copied}
          onCancel={
            wallet
              ? undefined
              : () => {
                  setAdding(false)
                  setSameAsPrimary(false)
                }
          }
        />
      ) : null}
    </section>
  )
}

function WalletsSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-6">
      <span className="sr-only">Carregando carteiras…</span>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[4.25rem] w-full" />
        ))}
      </div>
    </div>
  )
}

/** "Carteiras": primary and secondary wallets used in checkout. */
export function WalletsPage() {
  const user = useCurrentUser()
  const query = useWallets()
  const wallets = query.data?.items ?? []
  const primary = wallets.find((wallet) => wallet.slot === 'primary')
  const secondary = wallets.find((wallet) => wallet.slot === 'secondary')

  return (
    <div>
      <h1 className="sr-only">Carteiras</h1>
      {!user || query.isPending ? (
        <WalletsSkeleton />
      ) : query.isError ? (
        <div role="alert" className="grid justify-items-start gap-3">
          <p className="text-15 text-muted-foreground">
            Não foi possível carregar suas carteiras.
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
      ) : (
        <div className="grid gap-14">
          <SlotSection
            slot="primary"
            wallet={primary}
            primary={primary}
            user={user}
          />
          <SlotSection
            slot="secondary"
            wallet={secondary}
            primary={primary}
            user={user}
          />
        </div>
      )}
    </div>
  )
}
