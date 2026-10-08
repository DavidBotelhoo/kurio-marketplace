import { Link } from '@tanstack/react-router'
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Wallet } from '@/contracts/wallets'
import { cn } from '@/lib/utils'

import { networkLine, walletAlias } from '../format'

interface WalletCardsProps {
  wallets: readonly Wallet[]
  selectedId: string | null
  onSelect: (wallet: Wallet) => void
}

/** Mobile "Carteira conectada": the registered wallets as radio cards. */
export function WalletCards({
  wallets,
  selectedId,
  onSelect,
}: WalletCardsProps) {
  const name = useId()
  return (
    <fieldset className="mt-4 grid gap-5">
      <legend className="sr-only">Carteira para o pagamento</legend>
      {wallets.map((wallet) => {
        const checked = wallet.id === selectedId
        return (
          <div key={wallet.id} className="relative">
            <label className="flex min-h-[5.8125rem] cursor-pointer items-center gap-[1.0625rem] rounded-[0.875rem] bg-card py-3.5 pr-12 pl-5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => {
                  onSelect(wallet)
                }}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-[0.9375rem] shrink-0 place-items-center rounded-full border-[1.2px]',
                  checked ? 'border-primary' : 'border-border-strong',
                )}
              >
                {checked ? (
                  <span className="size-2 rounded-full bg-primary" />
                ) : null}
              </span>
              <span className="grid gap-1">
                <span className="text-16 font-bold text-foreground">
                  {wallet.nickname}
                </span>
                <span className="text-14 break-all text-muted-foreground">
                  {walletAlias(wallet)}
                </span>
                <span className="text-14 text-muted-foreground">
                  {networkLine(wallet.network)}
                </span>
              </span>
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Opções da carteira ${wallet.nickname}`}
                  className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-subtle-foreground transition-colors hover:text-highlight"
                >
                  <span aria-hidden="true" className="grid gap-1">
                    <span className="size-[0.1875rem] rounded-full bg-current" />
                    <span className="size-[0.1875rem] rounded-full bg-current" />
                    <span className="size-[0.1875rem] rounded-full bg-current" />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/perfil/carteiras">Editar carteira</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </fieldset>
  )
}

interface OtherWalletProps {
  wallets: readonly Wallet[]
  primaryId: string
  selectedId: string | null
  onSelectWallet: (wallet: Wallet) => void
  onManual: () => void
}

/**
 * Desktop "Usar outra carteira?": the form starts from the primary wallet;
 * checking it offers the other registered wallets or typing another one.
 */
export function OtherWalletToggle({
  wallets,
  primaryId,
  selectedId,
  onSelectWallet,
  onManual,
}: OtherWalletProps) {
  const name = useId()
  const primary = wallets.find((wallet) => wallet.id === primaryId)
  const others = wallets.filter((wallet) => wallet.id !== primaryId)
  const usingOther = selectedId !== primaryId
  return (
    <div className="mt-7">
      <label className="inline-flex cursor-pointer items-center gap-2.5 text-15 text-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring">
        <input
          type="checkbox"
          checked={usingOther}
          onChange={(event) => {
            if (!event.target.checked && primary) onSelectWallet(primary)
            else if (others[0]) onSelectWallet(others[0])
            else onManual()
          }}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="grid size-[0.9375rem] place-items-center rounded-full border-2 border-primary"
        >
          {usingOther ? (
            <span className="size-1.5 rounded-full bg-primary" />
          ) : null}
        </span>
        Usar outra carteira?
      </label>
      {usingOther ? (
        <fieldset className="mt-3 grid gap-2 pl-6">
          <legend className="sr-only">Outra carteira</legend>
          {others.map((wallet) => (
            <label
              key={wallet.id}
              className="flex cursor-pointer items-center gap-2.5 text-14"
            >
              <input
                type="radio"
                name={name}
                checked={selectedId === wallet.id}
                onChange={() => {
                  onSelectWallet(wallet)
                }}
                className="accent-primary"
              />
              <span>
                <span className="font-bold">{wallet.nickname}</span>{' '}
                <span className="text-muted-foreground">
                  {walletAlias(wallet)} · {networkLine(wallet.network)}
                </span>
              </span>
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2.5 text-14">
            <input
              type="radio"
              name={name}
              checked={selectedId === null}
              onChange={onManual}
              className="accent-primary"
            />
            Outra carteira (preencher os dados)
          </label>
        </fieldset>
      ) : null}
    </div>
  )
}

/** No registered wallet yet: the form is filled by hand. */
export function RegisterWalletHint() {
  return (
    <p className="mt-6 text-14 text-muted-foreground">
      Cadastre suas carteiras para preencher o pagamento automaticamente.{' '}
      <Button asChild variant="link" size="inline">
        <Link to="/perfil/carteiras">Cadastrar carteira</Link>
      </Button>
    </p>
  )
}
