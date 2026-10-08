import { MinusIcon, PlusIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const SIZES = {
  /** Desktop detail: 33×49.5 vertical pills. */
  lg: {
    button: 'h-[3.09375rem] w-[2.0625rem]',
    icon: 'size-4',
    value: 'min-w-9 text-20',
  },
  /** Mobile detail and desktop cart: 20×30 pills (larger hit area). */
  sm: {
    button:
      'relative h-[1.875rem] w-5 after:absolute after:-inset-x-2 after:-inset-y-1',
    icon: 'size-3',
    value: 'min-w-[2.125rem] text-18 font-medium',
  },
} as const

interface QuantityStepperProps {
  value: number
  max: number
  min?: number
  onChange: (value: number) => void
  /** Group label, e.g. "Quantidade de Emerald Ape #042". */
  label: string
  size?: keyof typeof SIZES
  disabled?: boolean
  /** Id of the text that explains the limits. */
  describedBy?: string
  className?: string
}

/** − value + control; the buttons stop at the limits the API allows. */
export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  label,
  size = 'lg',
  disabled = false,
  describedBy,
  className,
}: QuantityStepperProps) {
  const styles = SIZES[size]
  const buttonClass = cn(
    'grid shrink-0 cursor-pointer place-items-center rounded-full border border-background bg-primary text-primary-foreground transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-primary',
    styles.button,
  )

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className={cn('inline-flex items-center', className)}
    >
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= min}
        onClick={() => {
          onChange(value - 1)
        }}
        className={buttonClass}
      >
        <MinusIcon className={styles.icon} />
      </button>
      <output
        aria-live="polite"
        className={cn('text-center text-foreground tabular-nums', styles.value)}
      >
        {value}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        onClick={() => {
          onChange(value + 1)
        }}
        className={buttonClass}
      >
        <PlusIcon className={styles.icon} />
      </button>
    </div>
  )
}
