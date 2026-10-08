import type { ReactNode } from 'react'
import { useId } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  FieldError,
  FieldLabel,
  SelectField,
  TextField,
} from '@/components/form/text-field'
import { Input } from '@/components/ui/input'
import { NETWORKS } from '@/contracts/catalog-taxonomy'
import { ENS_SUFFIXES, WALLET_PROVIDERS } from '@/contracts/wallet-providers'
import type { WalletFields as WalletFieldValues } from '@/contracts/wallets'

/** Form values shared by every wallet form (wallet screen and checkout). */
export type SharedWalletValues = Omit<WalletFieldValues, 'nickname'> & {
  network: string
  provider: string
}

const NETWORK_OPTIONS = NETWORKS.map(({ id, label }) => ({ value: id, label }))
const PROVIDER_OPTIONS = WALLET_PROVIDERS.map(({ id, label }) => ({
  value: id,
  label,
}))

/** "Nome ENS": suffix select and name, as in the Figma field. */
export function EnsNameField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SharedWalletValues>()
  const inputId = useId()
  const errorId = `${inputId}-error`
  const error = errors.ensName?.message
  return (
    <div className="grid gap-1.5">
      <FieldLabel htmlFor={inputId} label="Nome ENS" required />
      <div className="flex gap-3.5">
        <select
          aria-label="Domínio ENS"
          defaultValue={ENS_SUFFIXES[0]}
          className="h-10 w-[4.8125rem] shrink-0 cursor-pointer rounded-sm border border-input bg-transparent px-2.5 text-15 text-foreground outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
        >
          {ENS_SUFFIXES.map((suffix) => (
            <option key={suffix} value={suffix}>
              {suffix}
            </option>
          ))}
        </select>
        <Input
          id={inputId}
          placeholder="seu-nome"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...register('ensName')}
        />
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}

/**
 * The ten fields of the Figma wallet form, in its two-column order. The
 * second field differs per screen ("Nome de usuário" in checkout, "Apelido
 * da carteira" on the wallets screen) and is passed in.
 */
export function WalletFields({ second }: { second: ReactNode }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<SharedWalletValues>()
  return (
    <div className="grid gap-x-6 gap-y-[1.0625rem] md:grid-cols-2">
      <TextField
        label="Nome de exibição"
        required
        autoComplete="name"
        error={errors.displayName?.message}
        {...register('displayName')}
      />
      {second}
      <SelectField
        label="Rede"
        required
        placeholder="Selecione uma rede"
        options={NETWORK_OPTIONS}
        error={errors.network?.message}
        {...register('network')}
      />
      <TextField
        label="Nome do perfil"
        required
        error={errors.profileName?.message}
        {...register('profileName')}
      />
      <TextField
        label="Endereço da carteira"
        required
        placeholder="Endereço 0x da carteira"
        autoComplete="off"
        spellCheck={false}
        error={errors.address?.message}
        {...register('address')}
      />
      <TextField
        label="ENS ou carteira secundária (opcional)"
        hideLabel
        placeholder="ENS ou carteira secundária (opcional)"
        autoComplete="off"
        spellCheck={false}
        className="md:self-end"
        error={errors.secondaryAddress?.message}
        {...register('secondaryAddress')}
      />
      <SelectField
        label="Tipo de carteira"
        required
        placeholder="Selecione uma carteira"
        options={PROVIDER_OPTIONS}
        error={errors.provider?.message}
        {...register('provider')}
      />
      <TextField
        label="Código de indicação"
        required
        autoCapitalize="characters"
        autoComplete="off"
        error={errors.referralCode?.message}
        {...register('referralCode')}
      />
      <TextField
        label="E-mail"
        required
        type="email"
        inputMode="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <EnsNameField />
    </div>
  )
}
