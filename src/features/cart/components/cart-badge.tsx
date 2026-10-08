import { cn } from '@/lib/utils'

/** Count bubble over the cart icon (Figma header badge). */
export function CartBadge({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  if (count === 0) return null
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute -top-0.5 -right-2 grid h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-10 leading-none font-medium text-background tabular-nums',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
