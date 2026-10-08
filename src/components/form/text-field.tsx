import { type ComponentProps, useId, useState } from 'react'

import {
  ChevronDownIcon,
  DangerTriangleIcon,
  HideIcon,
  ShowIcon,
} from '@/components/icons'
import { Input, type InputProps } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FieldProps extends InputProps {
  label: string
  /** Keeps the label for assistive technology when the layout shows only a placeholder. */
  hideLabel?: boolean
  error?: string | undefined
  description?: string
  /** Description announced by assistive technology but not shown. */
  hideDescription?: boolean
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

export function FieldLabel({
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
  hideDescription,
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
        <p
          id={descriptionId}
          className={cn(
            'text-12 text-muted-foreground',
            hideDescription && 'sr-only',
          )}
        >
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
  hideDescription,
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
        <p
          id={descriptionId}
          className={cn(
            'text-12 text-muted-foreground',
            hideDescription && 'sr-only',
          )}
        >
          {description}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}

const controlClass =
  'w-full min-w-0 rounded-sm border border-input bg-transparent text-15 text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-subtle-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive'

interface BaseFieldProps {
  label: string
  hideLabel?: boolean
  error?: string | undefined
  required?: boolean
  className?: string
}

interface SelectFieldProps
  extends
    BaseFieldProps,
    Omit<ComponentProps<'select'>, 'className' | 'children' | 'required'> {
  options: readonly { value: string; label: string }[]
  /** First, empty option ("Selecione uma rede"). */
  placeholder?: string
}

/** Native select styled as the Figma dropdown fields (keyboard and mobile friendly). */
export function SelectField({
  id,
  label,
  hideLabel,
  error,
  required,
  className,
  options,
  placeholder,
  ...props
}: SelectFieldProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const errorId = `${selectId}-error`
  return (
    <div className={cn('grid gap-1.5', className)}>
      <FieldLabel
        htmlFor={selectId}
        label={label}
        hideLabel={hideLabel}
        required={required}
      />
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-required={required ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            controlClass,
            'h-10 cursor-pointer appearance-none pr-10 pl-3 text-14 invalid:text-subtle-foreground',
          )}
          required={required}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3.5 size-3 -translate-y-1/2 text-foreground"
        />
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}

interface TextareaFieldProps
  extends
    BaseFieldProps,
    Omit<ComponentProps<'textarea'>, 'className' | 'required'> {}

export function TextareaField({
  id,
  label,
  hideLabel,
  error,
  required,
  className,
  ...props
}: TextareaFieldProps) {
  const autoId = useId()
  const textareaId = id ?? autoId
  const errorId = `${textareaId}-error`
  return (
    <div className={cn('grid gap-1.5', className)}>
      <FieldLabel
        htmlFor={textareaId}
        label={label}
        hideLabel={hideLabel}
        required={required}
      />
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(controlClass, 'min-h-[9.5rem] resize-y px-3 py-2.5')}
        {...props}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}
