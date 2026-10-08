import { Link } from '@tanstack/react-router'

import { ArrowRightIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { NftImage } from '@/features/catalog/components/nft-image'
import type { CatalogSearch } from '@/features/catalog/search'
import { type ArtworkId, artworkImage } from '@/lib/artwork-image'

interface Promo {
  title: string
  text: string
  artwork: ArtworkId
  alt: string
  search: CatalogSearch
}

const PROMOS: readonly Promo[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    artwork: 'emerald',
    alt: 'Macaco de óculos redondos e jaqueta college verde',
    search: { tab: 'new' },
  },
  {
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    artwork: 'ivory',
    alt: 'Macaco de blazer creme e gola alta verde',
    search: { categories: ['arte-digital'] },
  },
]

/** Two editorial banners; "Explorar" opens the catalog with matching filters. */
export function Promos() {
  return (
    <section
      aria-label="Coleções em destaque"
      className="container-page mt-20 lg:mt-[8.25rem]"
    >
      <ul className="grid gap-7 lg:grid-cols-2">
        {PROMOS.map((promo) => (
          <li
            key={promo.title}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.03fr)] overflow-hidden bg-card max-sm:grid-cols-1"
          >
            <div className="relative h-full min-h-[11rem] overflow-hidden rounded-[1.125rem] max-sm:aspect-[4/3]">
              <NftImage
                image={artworkImage(promo.artwork, promo.alt)}
                sizes="(min-width: 1024px) 292px, (min-width: 640px) 48vw, 100vw"
                className="size-full object-cover"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[8.4rem] -left-[11.2rem] size-[15.875rem] rounded-full border-2 border-primary"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[8.9rem] -left-[11.8rem] size-[15.9rem] rounded-full border border-primary/80"
              />
            </div>
            <div className="flex flex-col items-end justify-center px-6 py-8 text-right sm:pr-[1.875rem]">
              <h3 className="max-w-[15rem] text-18 leading-[1.3] font-bold">
                {promo.title}
              </h3>
              <p className="mt-4 max-w-[14.5rem] text-14 leading-[1.55] text-muted-foreground">
                {promo.text}
              </p>
              <Button asChild size="md" className="mt-4 w-35 gap-1 font-medium">
                <Link to="/" search={promo.search} hash={CATALOG_ANCHOR}>
                  Explorar
                  <ArrowRightIcon aria-hidden="true" className="size-3" />
                  <span className="sr-only">: {promo.title}</span>
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
