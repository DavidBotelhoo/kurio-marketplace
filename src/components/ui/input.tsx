import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

/*
 * Desktop fields are 40px tall with a 4px radius; mobile auth fields are
 * 49px tall with a 10px radius. Focus and filled states use the primary border
 * (as in the Figma password field); errors use the destructive token.
 */
const inputVariants = cva(
  'w-full min-w-0 border border-input bg-transparent text-15 text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-subtle-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary read-only:focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive',
  {
    variants: {
      size: {
        md: 'h-10 rounded-sm px-3.5',
        lg: 'h-12 rounded-[10px] px-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants>

function Input({ className, size, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input, type InputProps }
