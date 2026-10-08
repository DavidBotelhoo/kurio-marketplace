import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { ArrowRightIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '@/contracts/catalog'
import { topics } from '@/contracts/realtime-topics'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { NftImage } from '@/features/catalog/components/nft-image'
import { highlightsQueryOptions } from '@/features/catalog/queries'
import { useRealtimeTopics } from '@/lib/realtime/hooks'
import { cn } from '@/lib/utils'

function useHeroSlides() {
  const { data, isPending } = useQuery(highlightsQueryOptions())
  const slides = data?.hero ?? []
  useRealtimeTopics(slides.map((nft) => topics.nft(nft.id)))
  return { slides, isPending }
}

interface DotsProps {
  slides: readonly NftSummary[]
  active: number
  onSelect: (index: number) => void
  className?: string
  dotClassName: string
}

/** Manual carousel controls (no auto-rotation, so nothing moves on its own). */
function HeroDots({
  slides,
  active,
  onSelect,
  className,
  dotClassName,
}: DotsProps) {
  if (slides.length < 2) return null
  return (
    <div
      role="group"
      aria-label="Destaques"
      className={cn('flex justify-center', className)}
    >
      {slides.map((nft, index) => (
        <button
          key={nft.id}
          type="button"
          aria-label={`Destaque ${String(index + 1)} de ${String(slides.length)}: ${nft.name}`}
          aria-pressed={index === active}
          onClick={() => {
            onSelect(index)
          }}
          className="grid size-6 cursor-pointer place-items-center rounded-full"
        >
          <span
            className={cn(
              'rounded-full bg-primary transition-opacity',
              dotClassName,
              index === active ? 'opacity-100' : 'opacity-40 hover:opacity-70',
            )}
          />
        </button>
      ))}
    </div>
  )
}

/** Desktop/tablet hero (1440 frame): copy on the left, 450px artwork on the right. */
export function HeroDesktop() {
  const { slides, isPending } = useHeroSlides()
  const [active, setActive] = useState(0)
  const current = slides[Math.min(active, slides.length - 1)]

  return (
    <section
      aria-labelledby="hero-title"
      className="container-page mt-8 grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,28.125rem)] lg:mt-8"
    >
      <div className="md:pl-10">
        <p className="text-14 font-medium tracking-brand">Bem-vindo à Kurio</p>
        <h1
          id="hero-title"
          className="mt-[1.375rem] max-w-[32.5rem] text-32 leading-[1.4] font-bold lg:text-43 lg:leading-[4.375rem]"
        >
          SEJA DONO DO FUTURO DA ARTE DIGITAL
        </h1>
        <p className="mt-4 max-w-[24.5rem] text-14 leading-[1.57] text-muted-foreground">
          Descubra NFTs selecionados de criadores emergentes e consagrados.
          Colecione arte digital rara, apoie artistas e tenha uma parte da
          cultura da internet.
        </p>
        <Button asChild className="mt-[1.875rem] h-10 w-35 text-16">
          <Link to="/" hash={CATALOG_ANCHOR}>
            EXPLORAR
          </Link>
        </Button>
        <HeroDots
          slides={slides}
          active={active}
          onSelect={setActive}
          className="mt-5 gap-0 md:justify-end"
          dotClassName="size-2"
        />
      </div>
      <div className="aspect-square w-full">
        {current ? (
          <Link
            to="/nfts/$nftId"
            params={{ nftId: current.id }}
            aria-label={`Ver ${current.name}`}
            className="block size-full rounded-[1.5rem] outline-offset-4"
          >
            <NftImage
              image={current.image}
              sizes="(min-width: 1024px) 450px, 45vw"
              priority
              className="size-full rounded-[1.5rem] object-cover"
            />
          </Link>
        ) : (
          <Skeleton
            className={cn(
              'size-full rounded-[1.5rem]',
              !isPending && 'animate-none',
            )}
          />
        )}
      </div>
    </section>
  )
}

/** Mobile hero banner (414 frame): rounded card with two artworks. */
export function HeroMobile() {
  const { slides, isPending } = useHeroSlides()
  const [active, setActive] = useState(0)
  const current = slides[Math.min(active, slides.length - 1)]
  const next =
    slides.length > 1 ? slides[(active + 1) % slides.length] : undefined

  return (
    <section aria-labelledby="hero-title" className="container-page mt-4">
      <div className="relative overflow-hidden rounded-[1.875rem] bg-linear-to-br from-primary/20 to-primary/10 px-3.5 pt-[0.4375rem] pb-2">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 -left-20 size-[15.5rem] rounded-full bg-linear-to-b from-[#dd9a5f]/40 to-primary/5"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 left-[4.5rem] size-[15.5rem] rounded-full bg-linear-to-b from-[#dd9a5f]/35 to-transparent"
        />
        <div className="relative grid grid-cols-[minmax(0,1fr)_8.625rem] items-center gap-2 pt-2">
          <div>
            <p className="text-12 font-medium">Bem-vindo à Kurio</p>
            <h1
              id="hero-title"
              className="mt-2.5 text-18 leading-[1.4] font-bold"
            >
              SEJA DONO DA CULTURA DIGITAL
            </h1>
            <p className="mt-2.5 text-12 leading-[1.4] text-muted-foreground">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <Link
              to="/"
              hash={CATALOG_ANCHOR}
              className="mt-2 inline-flex items-center gap-2 text-12 font-bold text-highlight"
            >
              EXPLORAR
              <ArrowRightIcon aria-hidden="true" className="size-3" />
            </Link>
          </div>
          <div className="relative aspect-square w-full">
            {current ? (
              <Link
                to="/nfts/$nftId"
                params={{ nftId: current.id }}
                aria-label={`Ver ${current.name}`}
                className="block size-full rounded-[1rem]"
              >
                <NftImage
                  image={current.image}
                  sizes="138px"
                  priority
                  className="size-full rounded-[1rem] object-cover"
                />
              </Link>
            ) : (
              <Skeleton
                className={cn(
                  'size-full rounded-[1rem]',
                  !isPending && 'animate-none',
                )}
              />
            )}
            {next ? (
              <NftImage
                image={next.image}
                alt=""
                sizes="58px"
                className="absolute -bottom-2 left-3.5 aspect-square w-[42%] rounded-[1rem] border-2 border-card object-cover"
              />
            ) : null}
          </div>
        </div>
        <HeroDots
          slides={slides}
          active={active}
          onSelect={setActive}
          className="relative mt-1"
          dotClassName="size-[0.4375rem]"
        />
      </div>
    </section>
  )
}
