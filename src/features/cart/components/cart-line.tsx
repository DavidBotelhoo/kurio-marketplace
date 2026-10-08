import { Link } from '@tanstack/react-router'

import { DeleteIcon } from '@/components/icons'
import { QuantityStepper } from '@/components/quantity-stepper'
import type { CartItem } from '@/contracts/cart'
import { NftImage } from '@/features/catalog/components/nft-image'
import { formatEth } from '@/features/catalog/format'
import { cn } from '@/lib/utils'

import { useCartLine } from '../use-cart-line'

function DetailLink({
  item,
  className,
}: {
  item: CartItem
  className?: string
}) {
  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: item.nft.id }}
      search={{ edition: item.edition.id }}
      className={cn('hover:text-highlight', className)}
    >
      {item.nft.name}
    </Link>
  )
}

/** Availability problem of the line (from the API), or a price change. */
function LineNotice({ item }: { item: CartItem }) {
  if (item.issue === 'sold-out') {
    return (
      <p className="text-13 font-medium text-destructive">
        Esgotado. Remova para continuar.
      </p>
    )
  }
  if (item.issue === 'quantity-unavailable') {
    return (
      <p className="text-13 font-medium text-destructive">
        Restam {item.maxQuantity}. Ajuste a quantidade.
      </p>
    )
  }
  if (item.previousUnitPriceEth !== item.unitPriceEth) {
    return (
      <p className="text-13 text-highlight">
        Preço atualizado (era{' '}
        <s className="no-underline">{formatEth(item.previousUnitPriceEth)}</s>)
      </p>
    )
  }
  return null
}

function RemoveButton({
  name,
  onRemove,
  disabled,
  className,
}: {
  name: string
  onRemove: () => void
  disabled: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={`Remover ${name} do carrinho`}
      disabled={disabled}
      onClick={onRemove}
      className={cn(
        'grid size-9 cursor-pointer place-items-center rounded-md text-primary transition-colors hover:bg-muted hover:text-highlight disabled:cursor-wait disabled:opacity-50',
        className,
      )}
    >
      <DeleteIcon className="size-5" />
    </button>
  )
}

/** Desktop and tablet: table row (Figma 782×70). */
export function CartRow({ item }: { item: CartItem }) {
  const line = useCartLine(item)
  return (
    <tr
      aria-busy={line.busy}
      className={cn(
        'bg-card transition-opacity',
        line.removing && 'opacity-50',
      )}
    >
      <td className="py-0 pr-3">
        <div className="flex items-center gap-4">
          <NftImage
            image={item.nft.image}
            alt=""
            sizes="70px"
            className="size-[4.375rem] shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 py-2">
            <div className="flex items-center gap-2">
              <DetailLink
                item={item}
                className="truncate text-16 font-bold text-foreground"
              />
              <span className="shrink-0 rounded-full border border-border px-1.5 text-12 text-muted-foreground">
                <span className="sr-only">Edição </span>
                {item.edition.label}
              </span>
            </div>
            <p className="text-14 text-subtle-foreground">
              ID do token: {item.nft.tokenId}
            </p>
            <LineNotice item={item} />
          </div>
        </div>
      </td>
      <td className="text-16 font-bold text-muted-foreground">
        {formatEth(item.unitPriceEth)}
      </td>
      <td>
        <QuantityStepper
          size="sm"
          label={`Quantidade de ${line.name}`}
          value={line.quantity}
          max={line.max}
          onChange={line.setQuantity}
          disabled={line.removing || item.issue === 'sold-out'}
        />
      </td>
      <td className="text-16 font-bold text-highlight">
        {formatEth(line.lineTotalEth)}
      </td>
      <td className="pr-2 text-right">
        <RemoveButton
          name={line.name}
          onRemove={line.remove}
          disabled={line.removing}
          className="ml-auto"
        />
      </td>
    </tr>
  )
}

/** Mobile: 100px card with round stepper (Figma 414 frame). */
export function CartCard({ item }: { item: CartItem }) {
  const line = useCartLine(item)
  return (
    <li
      aria-busy={line.busy}
      className={cn(
        'relative flex min-h-[6.25rem] overflow-hidden rounded-[0.875rem] bg-card transition-opacity',
        line.removing && 'opacity-50',
      )}
    >
      <NftImage
        image={item.nft.image}
        alt=""
        sizes="100px"
        className="w-[6.25rem] shrink-0 self-stretch rounded-[0.875rem] object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-3 pl-2.5">
        <DetailLink
          item={item}
          className="truncate pr-7 text-15 font-bold text-foreground"
        />
        <p className="text-14 text-muted-foreground">
          Edição: {item.edition.label}
        </p>
        <LineNotice item={item} />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="text-18 font-bold text-highlight">
            {formatEth(line.lineTotalEth)}
          </p>
          <QuantityStepper
            size="round"
            label={`Quantidade de ${line.name}`}
            value={line.quantity}
            max={line.max}
            onChange={line.setQuantity}
            disabled={line.removing || item.issue === 'sold-out'}
          />
        </div>
      </div>
      <RemoveButton
        name={line.name}
        onRemove={line.remove}
        disabled={line.removing}
        className="absolute top-1 right-1 size-8 [&_svg]:size-4"
      />
    </li>
  )
}
