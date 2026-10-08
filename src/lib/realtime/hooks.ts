import { useEffect, useRef, useSyncExternalStore } from 'react'

import type { RealtimeEventMap, RealtimeEventType } from '@/contracts/realtime'

import { realtime } from './client'

export function useRealtimeStatus() {
  return useSyncExternalStore(realtime.subscribeStatus, realtime.getStatus)
}

/** Keeps the given topics subscribed while the component is mounted. */
export function useRealtimeTopics(topics: readonly string[]) {
  const key = [...new Set(topics)].sort().join('|')
  useEffect(() => {
    if (!key) return undefined
    return realtime.subscribe(key.split('|'))
  }, [key])
}

/** Listens to a realtime event type while the component is mounted. */
export function useRealtimeEvent<Type extends RealtimeEventType>(
  type: Type,
  handler: (event: RealtimeEventMap[Type]) => void,
) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })
  useEffect(
    () =>
      realtime.on(type, (event) => {
        handlerRef.current(event)
      }),
    [type],
  )
}
