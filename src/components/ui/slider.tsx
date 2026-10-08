import { Slider as SliderPrimitive } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

interface SliderProps extends React.ComponentProps<
  typeof SliderPrimitive.Root
> {
  /** Accessible name of each thumb ("Preço mínimo", "Preço máximo"). */
  thumbLabels: readonly string[]
  /** Spoken value of each thumb (aria-valuetext). */
  formatValue?: (value: number) => string
}

/** Radix Slider styled as the Figma price range (keyboard and touch ready). */
function Slider({
  className,
  thumbLabels,
  formatValue,
  value,
  ...props
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      className={cn(
        'relative flex h-[1.125rem] w-full touch-none items-center select-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1 grow rounded-full bg-border-strong"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full rounded-full bg-primary"
        />
      </SliderPrimitive.Track>
      {thumbLabels.map((label, index) => (
        <SliderPrimitive.Thumb
          key={label}
          data-slot="slider-thumb"
          aria-label={label}
          aria-valuetext={
            formatValue && value?.[index] !== undefined
              ? formatValue(value[index])
              : undefined
          }
          className="block size-[1.125rem] cursor-grab rounded-full border-[3px] border-background bg-primary transition-[box-shadow] outline-none hover:ring-4 hover:ring-primary/30 focus-visible:ring-4 focus-visible:ring-ring active:cursor-grabbing"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
