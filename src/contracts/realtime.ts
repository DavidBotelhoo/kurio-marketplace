import * as z from 'zod/mini'

import { availabilitySchema, editionSchema } from './catalog'
import { ethAmountSchema, isoDateTimeSchema } from './common'

/**
 * Realtime contract (Socket.IO, default namespace).
 *
 * Client → server:
 *   "subscribe"   (topics: string[])   start receiving events for topics
 *   "unsubscribe" (topics: string[])   stop receiving them
 * Server → client: one Socket.IO event per type, with a RealtimeEvent payload.
 *
 * Every event has a stable `id` (for de-duplication), the affected `resource`
 * and its `version` (the same counter returned by the REST API). Payloads
 * carry the resource's current state, not a delta, so applying an event twice
 * is harmless and an older version never overwrites a newer one.
 */

export { SUBSCRIBE, topics, UNSUBSCRIBE } from './realtime-topics'

const envelope = {
  id: z.string(),
  version: z.int(),
  occurredAt: isoDateTimeSchema,
}

export const nftUpdatedEventSchema = z.object({
  ...envelope,
  type: z.literal('nft.updated'),
  resource: z.object({ type: z.literal('nft'), id: z.string() }),
  data: z.object({
    /** Which aspects changed in this version (drives the user notice). */
    changes: z.array(z.enum(['price', 'availability'])),
    priceEth: ethAmountSchema,
    compareAtPriceEth: z.nullable(ethAmountSchema),
    availability: availabilitySchema,
    editions: z.array(editionSchema),
  }),
})

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const realtimeEventSchemas = {
  'nft.updated': nftUpdatedEventSchema,
} as const

export type RealtimeEventType = keyof typeof realtimeEventSchemas
export type RealtimeEventMap = {
  [Type in RealtimeEventType]: z.infer<(typeof realtimeEventSchemas)[Type]>
}
export type RealtimeEvent = RealtimeEventMap[RealtimeEventType]
