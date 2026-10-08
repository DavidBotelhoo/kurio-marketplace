import {
  type PointerEvent,
  type RefObject,
  type SyntheticEvent,
  useRef,
  useState,
} from 'react'

/** Movement below this is still a click. */
const DRAG_SLOP_PX = 6
/** A drag this long moves at least one item in its direction. */
const STEP_THRESHOLD_PX = 40

interface Drag {
  pointerId: number
  x: number
  scrollLeft: number
}

/** Snap positions of the list: where each item starts. */
function snapPositions(list: HTMLElement) {
  const listLeft = list.getBoundingClientRect().left - list.scrollLeft
  const items = [
    ...list.querySelectorAll<HTMLElement>(':scope > *, :scope > ul > *'),
  ]
  const max = list.scrollWidth - list.clientWidth
  return [
    ...new Set(
      items.map((item) =>
        Math.min(max, Math.round(item.getBoundingClientRect().left - listLeft)),
      ),
    ),
  ].sort((a, b) => a - b)
}

/**
 * Mouse dragging for horizontally scrolling, snapping lists (touch and
 * trackpads already scroll them natively). Snapping is suspended while the
 * list follows the pointer and, on release, it settles on the nearest item,
 * one step at least in the drag's direction. A drag never activates the link
 * or button it started on.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  const [dragging, setDragging] = useState(false)
  const drag = useRef<Drag | null>(null)
  const dragged = useRef(false)

  const release = (dx: number) => {
    const list = ref.current
    drag.current = null
    setDragging(false)
    if (!list || !dragged.current) return
    const start = list.scrollLeft + dx
    const positions = snapPositions(list)
    let target = positions.reduce(
      (best, position) =>
        Math.abs(position - list.scrollLeft) < Math.abs(best - list.scrollLeft)
          ? position
          : best,
      start,
    )
    if (Math.abs(dx) >= STEP_THRESHOLD_PX && Math.abs(target - start) < 1) {
      target =
        dx < 0
          ? (positions.find((position) => position > start + 1) ?? target)
          : (positions.findLast((position) => position < start - 1) ?? target)
    }
    list.style.scrollSnapType = ''
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' })
  }

  const handlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      const list = ref.current
      if (!list) return
      drag.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        scrollLeft: list.scrollLeft,
      }
      dragged.current = false
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const start = drag.current
      const list = ref.current
      if (start?.pointerId !== event.pointerId || !list) return
      const dx = event.clientX - start.x
      if (!dragged.current) {
        if (Math.abs(dx) < DRAG_SLOP_PX) return
        dragged.current = true
        setDragging(true)
        event.currentTarget.setPointerCapture(event.pointerId)
        window.getSelection()?.removeAllRanges()
        list.style.scrollSnapType = 'none'
      }
      list.scrollLeft = start.scrollLeft - dx
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const start = drag.current
      if (start?.pointerId !== event.pointerId) return
      release(event.clientX - start.x)
    },
    onPointerCancel: () => {
      release(0)
    },
    // The click that ends a drag must not follow the link being dragged.
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

  return { dragging, handlers }
}
