import type * as React from 'react'

import { cn } from '@/lib/utils'

/*
 * Shimmer placeholder. Callers must reserve the final content size (width,
 * height or aspect ratio) to avoid layout shift, and mark the loading region
 * with aria-busy plus a text status; the skeleton itself is hidden from
 * assistive technology. The shimmer stops under prefers-reduced-motion.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-muted bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklab,var(--foreground)_7%,transparent)_50%,transparent_100%)] bg-size-[200%_100%] bg-no-repeat motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
