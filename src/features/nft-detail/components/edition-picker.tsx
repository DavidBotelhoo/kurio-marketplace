import { useId } from 'react'

import type { Edition } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

interface EditionPickerProps {
  editions: readonly Edition[]
  selectedId: string | undefined
  onSelect: (editionId: string) => void
  /** Id of the text describing the selected edition's availability. */
  describedBy?: string
  className?: string
}

/**
 * Native radio group styled as the Figma chips (arrow keys move between
 * editions). Sold-out editions stay selectable so their state can be seen.
 */
export function EditionPicker({
  editions,
  selectedId,
  onSelect,
  describedBy,
  className,
}: EditionPickerProps) {
  const name = useId()
  return (
    <fieldset className={className} aria-describedby={describedBy}>
      <legend className="text-15 font-bold text-foreground">Edição:</legend>
      <div className="mt-2.5 flex flex-wrap gap-2.5">
        {editions.map((edition) => {
          const soldOut = edition.status === 'sold-out'
          return (
            <label key={edition.id} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={edition.id}
                checked={edition.id === selectedId}
                onChange={() => {
                  onSelect(edition.id)
                }}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'grid h-[1.6875rem] min-w-[2.1875rem] place-items-center rounded-full border border-border px-1.5 text-14 text-muted-foreground transition-colors peer-checked:border-primary peer-checked:font-medium peer-checked:text-highlight peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:border-border-strong',
                  soldOut && 'text-subtle-foreground line-through',
                )}
              >
                {edition.label}
                {soldOut ? <span className="sr-only"> (esgotada)</span> : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

interface EditionStatusProps {
  edition: Edition | undefined
  /** Every edition of the NFT is sold out. */
  allSoldOut: boolean
  inCart: number
  remaining: number
  id?: string
  className?: string
}

/** Availability of the selected edition, its order limit and the cart. */
export function EditionStatus({
  edition,
  allSoldOut,
  inCart,
  remaining,
  id,
  className,
}: EditionStatusProps) {
  let message: string
  let warning = false
  if (allSoldOut) {
    message = 'Todas as edições deste NFT estão esgotadas.'
    warning = true
  } else if (!edition || edition.status === 'sold-out') {
    message = 'Edição esgotada. Escolha outra edição para comprar.'
    warning = true
  } else if (remaining === 0) {
    message = `Você já tem ${String(inCart)} ${inCart === 1 ? 'unidade' : 'unidades'} desta edição no carrinho, o máximo permitido.`
  } else {
    const stock =
      edition.available === null
        ? 'Edição aberta'
        : `Restam ${String(edition.available)} de ${String(edition.supply ?? edition.available)}`
    const parts = [stock, `até ${String(edition.maxPerOrder)} por pedido`]
    if (inCart > 0) parts.push(`${String(inCart)} no seu carrinho`)
    message = `${parts.join(' · ')}.`
  }
  return (
    <p
      id={id}
      className={cn(
        'text-13',
        warning ? 'text-destructive' : 'text-subtle-foreground',
        className,
      )}
    >
      {message}
    </p>
  )
}
