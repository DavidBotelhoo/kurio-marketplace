import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'

import { ChevronLeftIcon, ShopIcon } from '@/components/icons'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Button } from '@/components/ui/button'
import type { Edition, NftDetail } from '@/contracts/catalog'
import { formatEth } from '@/features/catalog/format'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { multiplyEth } from '@/lib/eth'

import type { Purchase } from '../use-purchase'

interface PurchaseProps {
  nft: NftDetail
  edition: Edition | undefined
  purchase: Purchase
  /** Id of the edition status text (limits). */
  statusId: string
}

function buyLabel(purchase: Purchase, mobile: boolean) {
  if (purchase.pending) return 'Adicionando…'
  if (purchase.soldOut) return 'Esgotado'
  if (purchase.remaining === 0) return 'Ver no carrinho'
  return mobile ? 'Comprar NFT' : 'Comprar'
}

/** Desktop: quantity, "COMPRAR" (adds and opens the cart) and "Favoritar". */
export function PurchaseActions({ nft, purchase, statusId }: PurchaseProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <QuantityStepper
        label={`Quantidade de ${nft.name}`}
        value={purchase.quantity}
        max={purchase.remaining}
        onChange={purchase.setQuantity}
        disabled={purchase.remaining === 0 || purchase.pending}
        describedBy={statusId}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          className="w-[8.125rem] uppercase"
          disabled={purchase.soldOut || purchase.pending}
          onClick={purchase.buy}
        >
          {buyLabel(purchase, false)}
        </Button>
        <FavoriteButton
          nft={nft}
          className="flex h-10 w-[8.125rem] items-center justify-center gap-2 rounded-md border border-primary text-14 font-medium text-highlight transition-colors hover:bg-primary/10"
          iconClassName="size-[1.125rem]"
        >
          Favoritar
        </FavoriteButton>
      </div>
    </div>
  )
}

/** Mobile: fixed bottom bar from the Figma frame (quantity, total, buy, add). */
export function PurchaseBar({
  nft,
  edition,
  purchase,
  statusId,
}: PurchaseProps) {
  const total = edition
    ? multiplyEth(edition.priceEth, purchase.quantity)
    : nft.priceEth
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[2.5rem] bg-card px-6 pt-5 pb-[calc(2.125rem+env(safe-area-inset-bottom))] shadow-[0_-10px_25px_rgb(10_6_4/0.55)]">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="text-15 font-medium text-muted-foreground"
        >
          Qtd.
        </span>
        <QuantityStepper
          size="sm"
          label={`Quantidade de ${nft.name}`}
          value={purchase.quantity}
          max={purchase.remaining}
          onChange={purchase.setQuantity}
          disabled={purchase.remaining === 0 || purchase.pending}
          describedBy={statusId}
        />
        <p className="ml-auto text-20 font-bold text-highlight">
          <span className="sr-only">
            Total de {purchase.quantity}{' '}
            {purchase.quantity === 1 ? 'unidade' : 'unidades'}:{' '}
          </span>
          {formatEth(total)}
        </p>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button
          variant="cta"
          shape="pill"
          className="h-15 w-[12.25rem] text-16"
          disabled={purchase.soldOut || purchase.pending}
          onClick={purchase.buy}
        >
          {buyLabel(purchase, true)}
        </Button>
        <button
          type="button"
          aria-label={`Adicionar ${nft.name} ao carrinho`}
          disabled={
            purchase.soldOut || purchase.remaining === 0 || purchase.pending
          }
          onClick={purchase.add}
          className="grid size-[3.6875rem] shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-muted text-subtle-foreground transition-colors hover:border-border-strong hover:text-highlight disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShopIcon className="size-[1.125rem]" />
        </button>
      </div>
    </div>
  )
}

/** Mobile top bar: back and favorite (the site header is desktop-only). */
export function MobileTopBar({ nft }: { nft: NftDetail }) {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const circle =
    'grid size-[2.125rem] cursor-pointer place-items-center rounded-full border border-border bg-muted text-primary transition-colors hover:border-border-strong hover:text-highlight'
  return (
    <div className="flex items-center justify-between px-7 pt-6 pb-2">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => {
          if (canGoBack) router.history.back()
          else void navigate({ to: '/', hash: 'mercado' })
        }}
        className={circle}
      >
        <ChevronLeftIcon className="size-3.5" />
      </button>
      <FavoriteButton
        nft={nft}
        className={circle}
        iconClassName="size-[1.0625rem]"
      />
    </div>
  )
}
