/*
 * Loaded lazily by the realtime client, after the request gate:
 * - engine.io captures the global WebSocket when evaluated, so it must load
 *   after the mock worker patched it;
 * - socket.io-client and the event schemas stay out of the entry chunk.
 */
import { io } from 'socket.io-client'

import {
  type RealtimeEvent,
  realtimeEventSchemas,
  type RealtimeEventType,
} from '@/contracts/realtime'

export { io }

export const realtimeEventTypes = Object.keys(
  realtimeEventSchemas,
) as RealtimeEventType[]

/** Validates a payload against the contract; null when it does not match. */
export function parseRealtimeEvent(
  type: RealtimeEventType,
  payload: unknown,
): RealtimeEvent | null {
  const parsed = realtimeEventSchemas[type].safeParse(payload)
  return parsed.success ? parsed.data : null
}
