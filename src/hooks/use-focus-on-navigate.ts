import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

/**
 * After a client-side navigation to another path, move focus to the page
 * heading (or the main landmark) so screen reader and keyboard users start at
 * the new content instead of the link they activated. Search-param and hash
 * changes (filters, pagination, anchors) keep the current focus.
 */
export function useFocusOnNavigate(mainId: string) {
  const router = useRouter()

  useEffect(
    () =>
      router.subscribe('onRendered', ({ fromLocation, pathChanged }) => {
        if (!fromLocation || !pathChanged) return
        // An open dialog manages its own focus (and traps it).
        if (document.querySelector('[role="dialog"][data-state="open"]')) return
        const main = document.getElementById(mainId)
        const target = main?.querySelector<HTMLElement>('h1') ?? main
        if (!target) return
        if (!target.hasAttribute('tabindex'))
          target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
      }),
    [router, mainId],
  )
}
