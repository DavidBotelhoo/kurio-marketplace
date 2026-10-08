import { useId } from 'react'
import { useFormContext } from 'react-hook-form'

import { FieldError } from '@/components/form/text-field'
import { WalletIcon } from '@/components/icons'
import { WALLET_PROVIDERS } from '@/contracts/wallet-providers'
import { cn } from '@/lib/utils'

import type { PaymentFormValues } from '../schemas'

/** Radio mark of the Figma rows (14.8px ring, filled dot when selected). */
function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-[0.9375rem] shrink-0 place-items-center rounded-full border-[1.2px]',
        checked ? 'border-primary' : 'border-border-strong',
      )}
    >
      {checked ? <span className="size-2 rounded-full bg-primary" /> : null}
    </span>
  )
}

const MOBILE_MARK: Record<string, React.ReactNode> = {
  walletconnect: 'W',
  metamask: 'M',
  coinbase: <WalletIcon className="size-5" />,
}

/**
 * "Carteira e rede": which wallet app connects. Bound to the same form field
 * as the "Tipo de carteira" select of the desktop form.
 */
export function ProviderPicker({ variant }: { variant: 'desktop' | 'mobile' }) {
  const {
    watch,
    setValue,
    formState: { isSubmitted, errors },
  } = useFormContext<PaymentFormValues>()
  const provider = watch('provider')
  const name = useId()
  const errorId = `${name}-error`
  const mobile = variant === 'mobile'
  const error = mobile ? errors.provider?.message : undefined

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend
        className={cn(
          'font-bold text-foreground',
          mobile ? 'text-16' : 'w-full text-center text-17',
        )}
      >
        Carteira e rede
      </legend>
      <div
        className={cn(
          'grid',
          mobile ? 'mt-[1.125rem] gap-4' : 'mt-[1.375rem] gap-4',
        )}
      >
        {WALLET_PROVIDERS.map((option) => {
          const checked = provider === option.id
          return (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                mobile
                  ? 'h-[4.0625rem] gap-3.5 rounded-[0.9375rem] bg-card pr-6 pl-3.5'
                  : 'h-11 gap-3 rounded-[0.1875rem] border px-3.5 hover:border-border-strong',
                !mobile && (checked ? 'border-primary' : 'border-border'),
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={checked}
                onChange={() => {
                  setValue('provider', option.id, {
                    shouldDirty: true,
                    shouldValidate: isSubmitted,
                  })
                }}
                className="sr-only"
              />
              {mobile ? (
                <>
                  <span
                    aria-hidden="true"
                    className="grid size-[2.4375rem] shrink-0 place-items-center rounded-full border border-border bg-muted text-14 font-bold text-highlight"
                  >
                    {MOBILE_MARK[option.id]}
                  </span>
                  <span className="flex-1 text-14 text-foreground">
                    {option.label}
                  </span>
                  <RadioMark checked={checked} />
                </>
              ) : (
                <>
                  <RadioMark checked={checked} />
                  {option.id === 'walletconnect' ? (
                    <>
                      <span className="sr-only">{option.label}</span>
                      {/* Figma badge: WalletConnect reaches these wallets. */}
                      <span
                        aria-hidden="true"
                        className="rounded-[0.34rem] border border-border-strong bg-band px-2 py-1 text-9 font-bold tracking-brand text-highlight"
                      >
                        METAMASK · WALLETCONNECT · COINBASE
                      </span>
                    </>
                  ) : (
                    <span className="text-15 text-foreground">
                      {option.label}
                    </span>
                  )}
                </>
              )}
            </label>
          )
        })}
      </div>
      {error ? (
        <div className="mt-2">
          <FieldError id={errorId}>{error}</FieldError>
        </div>
      ) : null}
    </fieldset>
  )
}
