import type * as React from 'react'

import { notifyUnavailable } from '@/lib/unavailable'

interface UnavailableActionProps extends Omit<
  React.ComponentProps<'button'>,
  'onClick' | 'type'
> {
  /** Name of the feature, used in the notice ("Central de ajuda"). */
  feature: string
}

/** Link-like control for out-of-scope destinations; explains instead of navigating. */
export function UnavailableAction({
  feature,
  children,
  ...props
}: UnavailableActionProps) {
  return (
    <button
      type="button"
      onClick={() => {
        notifyUnavailable(feature)
      }}
      {...props}
    >
      {children ?? feature}
    </button>
  )
}
