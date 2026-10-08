import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FieldError } from '@/components/form/text-field'
import type { AppliedCoupon } from '@/contracts/cart'
import { isApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

import { notifyCartError } from '../notices'
import { useApplyCoupon, useRemoveCoupon } from '../queries'

interface CouponFormProps {
  coupon: AppliedCoupon | null
  /** The applied coupon stopped being valid (reported by the quote). */
  expired: boolean
  variant: 'desktop' | 'mobile'
}

/**
 * Promo code field. The API validates the code (unknown or expired codes
 * come back as a field error) and keeps it in the cart across refreshes.
 */
export function CouponForm({ coupon, expired, variant }: CouponFormProps) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  const errorId = useId()
  const appliedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // After applying or removing, focus follows the element that replaced the
  // control the user was on.
  const focusNext = useRef<'applied' | 'input' | null>(null)

  useEffect(() => {
    if (focusNext.current === 'applied' && coupon) appliedRef.current?.focus()
    if (focusNext.current === 'input' && !coupon) inputRef.current?.focus()
    focusNext.current = null
  }, [coupon])

  const mobile = variant === 'mobile'

  if (coupon) {
    return (
      <div
        ref={appliedRef}
        tabIndex={-1}
        className={cn(
          'flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-14 outline-none focus-visible:outline-2 focus-visible:outline-ring',
          expired ? 'border-destructive/60' : 'border-primary',
          mobile && 'rounded-full px-5',
        )}
      >
        <p className={expired ? 'text-destructive' : 'text-foreground'}>
          <span className="font-bold">{coupon.code}</span>{' '}
          {expired
            ? 'expirou e não está mais sendo aplicado.'
            : `aplicado: ${coupon.label}.`}
        </p>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() => {
            remove.mutate(undefined, {
              onSuccess: () => {
                focusNext.current = 'input'
              },
              onError: notifyCartError,
            })
          }}
          className="shrink-0 cursor-pointer font-medium text-highlight underline-offset-4 hover:underline disabled:opacity-50"
        >
          {remove.isPending ? 'Removendo…' : 'Remover'}
          <span className="sr-only"> cupom {coupon.code}</span>
        </button>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const value = code.trim()
        if (!value) {
          setError('Informe o código promocional.')
          inputRef.current?.focus()
          return
        }
        apply.mutate(value, {
          onSuccess: ({ cart }) => {
            setCode('')
            setError(null)
            focusNext.current = 'applied'
            if (cart.coupon)
              toast.success(`Cupom ${cart.coupon.code} aplicado.`)
          },
          onError: (failure) => {
            const message = isApiError(failure)
              ? failure.fields.code
              : undefined
            if (message) {
              setError(message)
              inputRef.current?.focus()
            } else {
              notifyCartError(failure)
            }
          },
        })
      }}
    >
      <label
        htmlFor={inputId}
        className={mobile ? 'sr-only' : 'text-14 font-bold text-foreground'}
      >
        Código promocional
      </label>
      <div
        className={cn(
          'flex overflow-hidden',
          mobile
            ? 'mt-0 h-[3.125rem] rounded-full border border-border bg-card'
            : 'mt-2.5 h-10 rounded-[0.1875rem] border border-primary',
          error && 'border-destructive',
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            if (error) setError(null)
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-foreground uppercase outline-none placeholder:text-subtle-foreground placeholder:normal-case focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset',
            mobile ? 'pl-4 text-13' : 'pl-2 text-12',
          )}
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className={cn(
            'shrink-0 cursor-pointer text-15 font-bold transition-colors disabled:cursor-wait disabled:opacity-70',
            mobile
              ? 'w-[6.0625rem] rounded-full bg-linear-to-r from-primary/55 to-primary text-foreground hover:to-highlight'
              : 'w-[6.3rem] bg-primary text-primary-foreground hover:bg-highlight',
          )}
        >
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      <div role="alert" className="mt-2 empty:hidden">
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      </div>
    </form>
  )
}
