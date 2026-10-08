import { cn } from '@/lib/utils'

import { formatEth } from '../format'

interface EthPriceProps {
  amount: string
  previous?: string | null
  className?: string
  previousClassName?: string
}

/** Current price, with the previous one struck through (and announced). */
export function EthPrice({
  amount,
  previous,
  className,
  previousClassName,
}: EthPriceProps) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-3">
      <span className={cn('font-bold text-highlight', className)}>
        {previous ? <span className="sr-only">Preço atual: </span> : null}
        {formatEth(amount)}
      </span>
      {previous ? (
        <s
          className={cn(
            'font-normal text-subtle-foreground no-underline',
            previousClassName,
          )}
        >
          <span className="sr-only">Preço anterior: </span>
          {formatEth(previous)}
        </s>
      ) : null}
    </span>
  )
}
