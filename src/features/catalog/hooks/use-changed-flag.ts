import { useEffect, useRef, useState } from 'react'

const FLASH_MS = 1_600

/**
 * true for a moment after `value` changes (not on mount): used to highlight
 * prices updated in real time. The visual effect itself honors
 * prefers-reduced-motion in CSS.
 */
export function useChangedFlag(value: unknown) {
  const previous = useRef(value)
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    if (Object.is(previous.current, value)) return undefined
    previous.current = value
    const start = setTimeout(() => {
      setChanged(true)
    }, 0)
    const stop = setTimeout(() => {
      setChanged(false)
    }, FLASH_MS)
    return () => {
      clearTimeout(start)
      clearTimeout(stop)
    }
  }, [value])

  return changed
}
