import { StarIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

import { formatRating, reviewsLabel } from '../format'

interface RatingProps {
  average: number
  count: number
  className?: string
}

/** Five stars filled up to `value` (fractions fill part of a star). */
export function Stars({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <span aria-hidden="true" className={cn('flex gap-[0.3125rem]', className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(1, Math.max(0, value - (star - 1)))
        return (
          <span key={star} className="relative size-3.5">
            <StarIcon className="size-3.5 text-muted-foreground" />
            {fill > 0 ? (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${String(fill * 100)}%` }}
              >
                <StarIcon className="size-3.5 max-w-none text-primary" />
              </span>
            ) : null}
          </span>
        )
      })}
    </span>
  )
}

/** Desktop: five stars and the review count. */
export function RatingSummary({ average, count, className }: RatingProps) {
  return (
    <p className={cn('flex items-center gap-2 text-15', className)}>
      <Stars value={average} />
      <span className="sr-only">Nota {formatRating(average)} de 5,</span>
      <span>{reviewsLabel(count)} de colecionadores</span>
    </p>
  )
}

/** Mobile: "★ 4.8 (19)" chip. */
export function RatingChip({ average, count, className }: RatingProps) {
  return (
    <p
      className={cn(
        'inline-flex h-[1.625rem] shrink-0 items-center gap-1 rounded-full border border-primary px-2.5 text-14',
        className,
      )}
    >
      <StarIcon aria-hidden="true" className="size-3 text-primary" />
      <span className="sr-only">Nota</span>
      <span className="font-medium text-foreground">
        {formatRating(average)}
      </span>
      <span className="text-muted-foreground">
        <span aria-hidden="true">({count})</span>
        <span className="sr-only">de 5, {reviewsLabel(count)}</span>
      </span>
    </p>
  )
}
