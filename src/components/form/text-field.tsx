import { useId, useState } from 'react'

import { DangerTriangleIcon, HideIcon, ShowIcon } from '@/components/icons'
import { Input, type InputProps } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FieldProps extends InputProps {
  label: string
  /** Keeps the label for assistive technology when the layout shows only a placeholder. */
  hideLabel?: boolean
  error?: string | undefined
  description?: string
  required?: boolean
}

function describedBy(...ids: (string | false | undefined)[]) {
  const value = ids.filter(Boolean).join(' ')
  return value || undefined
}

export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-13 text-destructive">
      <DangerTriangleIcon
        aria-hidden="true"
        className="mt-0.5 size-3.5 shrink-0"
      />
      {children}
    </p>
  )
}

function FieldLabel({
  htmlFor,
  label,
  hideLabel,
  required,
}: {
  htmlFor: string
  label: string
  hideLabel?: boolean | undefined
  required?: boolean | undefined
}) {
  return (
    <Label htmlFor={htmlFor} className={cn(hideLabel && 'sr-only')}>
      {label}
      {required ? (
        <span
          aria-hidden="true"
          className="text-22 leading-none text-destructive"
        >
          *
        </span>
      ) : null}
    </Label>
  )
}

/** Labelled input with an associated error message. */
export function TextField({
  id,
  label,
  hideLabel,
  error,
  description,
  required,
  className,
  ...props
}: FieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const descriptionId = `${inputId}-description`

  return (
    <div className={cn('grid gap-1.5', className)}>
      <FieldLabel
        htmlFor={inputId}
        label={label}
        hideLabel={hideLabel}
        required={required}
      />
      <Input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-required={required ? true : undefined}
        aria-describedby={describedBy(
          description && descriptionId,
          error && errorId,
        )}
        {...props}
      />
      {description ? (
        <p id={descriptionId} className="text-12 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}

/** Password input with a show/hide toggle. */
export function PasswordField({
  id,
  label,
  hideLabel,
  error,
  description,
  required,
  className,
  size,
  ...props
}: Omit<FieldProps, 'type'>) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const descriptionId = `${inputId}-description`
  const [visible, setVisible] = useState(false)

  return (
    <div className={cn('grid gap-1.5', className)}>
      <FieldLabel
        htmlFor={inputId}
        label={label}
        hideLabel={hideLabel}
        required={required}
      />
      <div className="relative">
        <Input
          id={inputId}
          type={visible ? 'text' : 'password'}
          size={size}
          className={size === 'lg' ? 'pr-14' : 'pr-11'}
          aria-invalid={error ? true : undefined}
          aria-required={required ? true : undefined}
          aria-describedby={describedBy(
            description && descriptionId,
            error && errorId,
          )}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          aria-controls={inputId}
          onClick={() => {
            setVisible((value) => !value)
          }}
          className={cn(
            'absolute inset-y-0 grid w-10 cursor-pointer place-items-center text-subtle-foreground transition-colors hover:text-highlight',
            size === 'lg' ? 'right-2' : 'right-1',
          )}
        >
          {visible ? (
            <ShowIcon className="size-[1.1rem]" />
          ) : (
            <HideIcon className="size-[1.1rem]" />
          )}
        </button>
      </div>
      {description ? (
        <p id={descriptionId} className="text-12 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}
