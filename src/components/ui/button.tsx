import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

/*
 * Variants follow the Figma buttons:
 * - primary:   filled orange (Entrar, Explorar, Comprar, Salvar…)
 * - cta:       mobile gradient call to action (Comprar NFT, Confirmar compra)
 * - outline:   orange border (Favoritar)
 * - secondary: subtle border (social login, pagination, chips)
 * - ghost / link: text actions (Remover, Continuar explorando, Adicionar)
 * Hover states are not designed; they lighten toward the highlight token.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-bold whitespace-nowrap transition-[color,background-color,border-color,opacity] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15em]",
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-highlight active:bg-primary',
        cta: 'bg-linear-to-r from-primary to-primary/80 text-primary-foreground hover:from-highlight hover:to-highlight/85',
        outline:
          'border border-primary font-medium text-highlight hover:bg-primary/10',
        secondary:
          'border border-border font-medium text-muted-foreground hover:border-border-strong hover:bg-muted hover:text-foreground aria-pressed:border-primary aria-pressed:text-highlight aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:font-bold aria-[current=page]:text-primary-foreground',
        ghost:
          'font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
        link: 'font-medium text-highlight underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-md px-4 text-14',
        md: 'h-10 rounded-md px-5 text-14',
        lg: 'h-11 rounded-md px-6 text-16',
        xl: 'h-15 rounded-[10px] px-8 text-16',
        icon: 'size-[2.125rem] rounded-sm text-18',
        'icon-round': 'size-9 rounded-full',
        inline: 'h-auto p-0',
      },
      shape: {
        default: '',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({
  className,
  variant,
  size,
  shape,
  asChild = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? 'primary'}
      className={cn(buttonVariants({ variant, size, shape }), className)}
      {...(asChild ? {} : { type })}
      {...props}
    />
  )
}

export { Button, type ButtonProps }
