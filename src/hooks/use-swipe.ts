import { type PointerEvent, type SyntheticEvent, useRef, useState } from 'react'

/** Horizontal distance that changes the slide when the pointer is released. */
const SWIPE_THRESHOLD_PX = 40
/** Movement below this is still a tap or click. */
const DRAG_SLOP_PX = 6
/** The content follows the pointer up to this distance. */
const MAX_OFFSET_PX = 120

interface SwipeOptions {
  onNext: () => void
  onPrevious: () => void
  enabled?: boolean
}

interface Gesture {
  pointerId: number
  x: number
  y: number
}

/**
 * Horizontal swipe and drag (touch, pen and mouse) for carousels that swap
 * their content instead of scrolling it. Spread `handlers` on the gesture
 * area and move the content by `offset` while `dragging`. Vertical page
 * scrolling keeps working (the area needs `touch-action: pan-y`), and a drag
 * never activates a link or button inside it.
 */
export function useSwipe({ onNext, onPrevious, enabled = true }: SwipeOptions) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<Gesture | null>(null)
  const dragged = useRef(false)

  const end = () => {
    gesture.current = null
    setDragging(false)
    setOffset(0)
  }

  const handlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!enabled || !event.isPrimary) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      gesture.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      }
      dragged.current = false
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const start = gesture.current
      if (start?.pointerId !== event.pointerId) return
      const dx = event.clientX - start.x
      if (!dragged.current) {
        if (Math.abs(dx) < DRAG_SLOP_PX) return
        // Mostly vertical: the page is being scrolled, not the carousel.
        if (Math.abs(event.clientY - start.y) > Math.abs(dx)) {
          gesture.current = null
          return
        }
        dragged.current = true
        setDragging(true)
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      setOffset(Math.max(-MAX_OFFSET_PX, Math.min(MAX_OFFSET_PX, dx)))
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const start = gesture.current
      if (start?.pointerId !== event.pointerId) return
      const dx = event.clientX - start.x
      if (dragged.current && Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
        if (dx < 0) onNext()
        else onPrevious()
      }
      end()
    },
    onPointerCancel: end,
    // The click that follows a drag must not follow the link being dragged.
    onClickCapture: (event: SyntheticEvent) => {
      if (!dragged.current) return
      dragged.current = false
      event.preventDefault()
      event.stopPropagation()
    },
    // Native image and link dragging would cancel the pointer events.
    onDragStart: (event: SyntheticEvent) => {
      event.preventDefault()
    },
  }

  return { offset, dragging, handlers }
}
