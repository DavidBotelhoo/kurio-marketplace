import { Dialog as SheetPrimitive } from 'radix-ui'
import type * as React from 'react'

import { CloseIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/*
 * Drawer built on Radix Dialog (focus trap, Escape, focus restore). Used for
 * the catalog filters on small screens.
 */

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close

interface SheetContentProps extends React.ComponentProps<
  typeof SheetPrimitive.Content
> {
  side?: 'bottom' | 'right'
  closeLabel?: string
}

function SheetContent({
  className,
  children,
  side = 'bottom',
  closeLabel = 'Fechar',
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-background/70 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 flex flex-col bg-card text-card-foreground shadow-2xl duration-200 outline-none data-open:animate-in data-closed:animate-out',
          side === 'bottom' &&
            'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[1.8rem] data-open:slide-in-from-bottom data-closed:slide-out-to-bottom',
          side === 'right' &&
            'inset-y-0 right-0 w-[min(24rem,90vw)] data-open:slide-in-from-right data-closed:slide-out-to-right',
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          aria-label={closeLabel}
          className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full text-primary transition-colors hover:bg-muted hover:text-highlight"
        >
          <CloseIcon className="size-3.5" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      className={cn('text-18 font-bold text-foreground', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn('text-13 text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
}
