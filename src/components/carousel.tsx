import { type ReactNode, useEffect, useRef, useState } from 'react'

import { useDragScroll } from '@/hooks/use-drag-scroll'
import { cn } from '@/lib/utils'

interface CarouselProps {
  label: string
  items: readonly { key: string; node: ReactNode }[]
  /** Width of each item (flex-basis), per breakpoint. */
  itemClassName: string
  /** Gap between items; pages advance by the visible width plus this gap. */
  gapClassName: string
  className?: string
}

/**
 * Horizontal list with scroll snapping and the Figma page dots. Native
 * scrolling (touch, trackpad, keyboard) works, the mouse can drag it, and the
 * dots jump between pages.
 */
export function Carousel({
  label,
  items,
  itemClassName,
  gapClassName,
  className,
}: CarouselProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(0)
  const drag = useDragScroll(listRef)

  useEffect(() => {
    const list = listRef.current
    if (!list) return undefined
    const update = () => {
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0
      const step = list.clientWidth + gap
      const count = Math.max(
        1,
        Math.ceil((list.scrollWidth + gap) / step - 0.05),
      )
      setPages(count)
      setPage(Math.min(count - 1, Math.round(list.scrollLeft / step)))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(list)
    list.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      list.removeEventListener('scroll', update)
    }
  }, [items.length])

  const goTo = (target: number) => {
    const list = listRef.current
    if (!list) return
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({
      left: target * (list.clientWidth + gap),
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  return (
    <div className={className}>
      <ul
        ref={listRef}
        aria-label={label}
        {...drag.handlers}
        data-dragging={drag.dragging}
        className={cn(
          'flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto data-[dragging=true]:cursor-grabbing data-[dragging=true]:select-none [&::-webkit-scrollbar]:hidden',
          gapClassName,
        )}
      >
        {items.map((item) => (
          <li
            key={item.key}
            className={cn('shrink-0 snap-start', itemClassName)}
          >
            {item.node}
          </li>
        ))}
      </ul>
      {pages > 1 ? (
        // 12px dots 24px apart (center to center) with 24px hit areas:
        // WCAG 2.5.8 target size (Figma: 8px gaps).
        <div className="mt-8 flex justify-center gap-3">
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Página ${String(index + 1)} de ${String(pages)}`}
              aria-current={index === page ? 'true' : undefined}
              onClick={() => {
                goTo(index)
              }}
              className="relative size-3 cursor-pointer rounded-full border-[1.3px] border-primary transition-colors after:absolute after:-inset-1.5 aria-[current=true]:bg-primary"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
