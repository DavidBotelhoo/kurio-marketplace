import { Tabs } from 'radix-ui'

import { NETWORKS, type NftDetail } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

import { shortAddress } from '@/lib/address'

import { formatRating, reviewsLabel } from '../format'
import { Stars } from './rating'

const triggerClass =
  'relative cursor-pointer pb-3 text-left text-15 text-foreground transition-colors hover:text-highlight data-[state=active]:font-bold data-[state=active]:text-highlight data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-[3px] data-[state=active]:after:bg-primary md:text-17'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' })

/** "Detalhes do NFT" and "Avaliações de colecionadores" tabs. */
export function InfoTabs({
  nft,
  className,
}: {
  nft: NftDetail
  className?: string
}) {
  const network =
    NETWORKS.find((item) => item.id === nft.network)?.label ?? nft.network

  return (
    <Tabs.Root defaultValue="details" className={className}>
      <Tabs.List
        aria-label="Informações do NFT"
        // Horizontal scrolling only where the labels do not fit; the active
        // underline overlaps the border by 1px, which must not scroll.
        className="flex [scrollbar-width:none] gap-6 overflow-x-auto overflow-y-hidden border-b border-primary/30 md:gap-8 md:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        <Tabs.Trigger value="details" className={triggerClass}>
          Detalhes do NFT
        </Tabs.Trigger>
        <Tabs.Trigger value="reviews" className={triggerClass}>
          Avaliações de colecionadores ({nft.rating.count})
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content
        value="details"
        className="mt-5 grid gap-5 text-14 leading-[1.55] text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {nft.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <dl className="grid gap-3">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>
              Cunhado na {network} com procedência imutável e metadados
              armazenados no {nft.contract.storage}.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>
              <span title={nft.contract.address}>
                {shortAddress(nft.contract.address)}
              </span>{' '}
              • Contrato inteligente {nft.contract.standard} verificado.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              {nft.creator.name} recebe {nft.creator.royaltyPercent}% nas vendas
              secundárias, pagos automaticamente pelos mercados compatíveis.
            </dd>
          </div>
        </dl>
      </Tabs.Content>

      <Tabs.Content
        value="reviews"
        className="mt-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-15 text-foreground">
          <span className="text-22 font-bold text-highlight">
            {formatRating(nft.rating.average)}
          </span>
          <Stars value={nft.rating.average} />
          <span className="text-muted-foreground">
            <span className="sr-only">de 5, </span>
            {reviewsLabel(nft.rating.count)}
          </span>
        </p>
        {nft.reviews.length ? (
          <ul className="mt-5 grid gap-4">
            {nft.reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-md border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-15 font-bold text-foreground">
                    {review.author}
                  </p>
                  <Stars value={review.rating} />
                  <span className="sr-only">Nota {review.rating} de 5.</span>
                  <time
                    dateTime={review.createdAt}
                    className="text-13 text-subtle-foreground"
                  >
                    {dateFormat.format(new Date(review.createdAt))}
                  </time>
                </div>
                <p className="mt-2 text-14 leading-[1.55] text-muted-foreground">
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-14 text-muted-foreground">
            Este NFT ainda não recebeu avaliações.
          </p>
        )}
        {nft.reviews.length < nft.rating.count ? (
          <p className={cn('mt-4 text-13 text-subtle-foreground')}>
            Mostrando as {nft.reviews.length} avaliações mais recentes de{' '}
            {nft.rating.count}.
          </p>
        ) : null}
      </Tabs.Content>
    </Tabs.Root>
  )
}
