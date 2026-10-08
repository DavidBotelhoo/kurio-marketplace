import { useEffect, useRef, useState } from 'react'

import { SearchIcon } from '@/components/icons'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { NftDetail } from '@/contracts/catalog'
import { NftImage } from '@/features/catalog/components/nft-image'
import { cn } from '@/lib/utils'

/**
 * Desktop and tablet: thumbnails column, main image and a zoom dialog
 * (Figma: 100px thumbnails, 444px panel with a 404px image).
 */
export function DesktopGallery({ nft }: { nft: NftDetail }) {
  const views = nft.gallery.length ? nft.gallery : [nft.image]
  const [index, setIndex] = useState(0)
  const image = views[index] ?? nft.image

  return (
    <div className="flex items-start gap-4 xl:gap-7">
      {views.length > 1 ? (
        <ul
          aria-label="Vistas do NFT"
          className="grid w-[4.5rem] shrink-0 gap-3 xl:w-[6.25rem] xl:gap-4"
        >
          {views.map((view, viewIndex) => (
            <li key={view.alt}>
              <button
                type="button"
                aria-label={`Mostrar vista ${String(viewIndex + 1)} de ${String(views.length)}`}
                aria-current={viewIndex === index ? 'true' : undefined}
                onClick={() => {
                  setIndex(viewIndex)
                }}
                className="block aspect-square w-full cursor-pointer overflow-hidden rounded-[0.5rem] border border-transparent bg-card transition-colors hover:border-border-strong aria-[current=true]:border-primary"
              >
                <NftImage
                  image={view}
                  alt=""
                  sizes="100px"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative min-w-0 flex-1 rounded-md bg-card p-[4.5%] xl:w-[27.75rem] xl:flex-none xl:p-5">
        <NftImage
          image={image}
          sizes="(min-width: 1280px) 404px, 40vw"
          priority
          className="aspect-square w-full rounded-[1.5rem] object-cover"
        />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute top-3 right-3 grid size-[1.8125rem] cursor-pointer place-items-center rounded-full border border-border bg-muted text-foreground transition-colors hover:border-border-strong hover:text-highlight"
            >
              <SearchIcon className="size-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent
            aria-describedby={undefined}
            closeLabel="Fechar imagem ampliada"
            className="w-[min(calc(100%-2rem),48rem)] max-w-none p-4 pt-12"
          >
            <DialogTitle className="sr-only">{image.alt}</DialogTitle>
            <NftImage
              image={image}
              sizes="(min-width: 768px) 736px, 90vw"
              className="aspect-square w-full rounded-[1rem] object-cover"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

/** Mobile: swipeable views with the Figma position indicator over the image. */
export function MobileGallery({ nft }: { nft: NftDetail }) {
  const views = nft.gallery.length ? nft.gallery : [nft.image]
  const listRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const list = listRef.current
    if (!list) return undefined
    const onScroll = () => {
      setIndex(Math.round(list.scrollLeft / Math.max(list.clientWidth, 1)))
    }
    list.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      list.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className="relative">
      {/* Scrollable region: focusable so the keyboard can scroll it. */}
      <div
        ref={listRef}
        role="region"
        aria-label="Vistas do NFT"
        tabIndex={0}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto rounded-[1.5rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-scrollbar]:hidden"
      >
        {/* Full width up front: the views must not wait for the images to
            get their size (layout shift). */}
        <ul className="flex w-full">
          {views.map((view, viewIndex) => (
            <li key={view.alt} className="w-full shrink-0 snap-center">
              <NftImage
                image={view}
                sizes="100vw"
                priority={viewIndex === 0}
                className="aspect-[361/356] w-full object-cover"
              />
            </li>
          ))}
        </ul>
      </div>
      {/* Position indicator only: 7px dots 7px apart are too small to be
          touch targets (WCAG 2.5.8). Views change by swipe or, with the
          region focused, the arrow keys. */}
      {views.length > 1 ? (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[3.125rem] flex items-center justify-center gap-[0.4375rem]"
        >
          {views.map((view, viewIndex) => (
            <span
              key={view.alt}
              className={cn(
                'h-[0.4375rem] rounded-full bg-primary transition-[width] motion-reduce:transition-none',
                viewIndex === index ? 'w-7' : 'w-[0.4375rem]',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
