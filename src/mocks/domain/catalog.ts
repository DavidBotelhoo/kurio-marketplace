import type { NftUpdatedEvent } from '@/contracts/realtime'
import { topics } from '@/contracts/realtime'

import { db } from '../db/database'
import type { EditionRecord, NftRecord } from '../db/schema'
import { toEdition, toNftSummary } from '../mappers/catalog'
import { publish } from '../realtime/server'

type Change = NftUpdatedEvent['data']['changes'][number]

function eventId() {
  return crypto.randomUUID()
}

function findNft(nftId: string) {
  const record = db.read().nfts.find((nft) => nft.id === nftId)
  if (!record) throw new Error(`NFT "${nftId}" not found`)
  return record
}

function resolveEdition(record: NftRecord, editionId?: string) {
  const edition = record.editions.find(
    (item) => item.id === (editionId ?? record.defaultEditionId),
  )
  if (!edition) throw new Error(`Edition "${String(editionId)}" not found`)
  return edition
}

/** Publishes the current state of an NFT after a change. */
function publishNftUpdated(record: NftRecord, changes: Change[]) {
  const summary = toNftSummary(record)
  const event: NftUpdatedEvent = {
    id: eventId(),
    type: 'nft.updated',
    resource: { type: 'nft', id: record.id },
    version: record.version,
    occurredAt: record.updatedAt,
    data: {
      changes,
      priceEth: summary.priceEth,
      compareAtPriceEth: summary.compareAtPriceEth,
      availability: summary.availability,
      editions: record.editions.map(toEdition),
    },
  }
  publish(topics.nft(record.id), event)
  return event
}

/**
 * Domain mutations shared by the control panel, the test API and (later) the
 * order flow. They write through the database (REST reads the same state)
 * and publish the matching realtime event, bumping the resource version.
 */
function mutateNft(
  nftId: string,
  changes: Change[],
  apply: (record: NftRecord) => void,
) {
  findNft(nftId)
  const record = db.write((draft) => {
    const target = draft.nfts.find((nft) => nft.id === nftId)
    if (!target) throw new Error(`NFT "${nftId}" not found`)
    apply(target)
    target.version += 1
    target.updatedAt = new Date().toISOString()
    return target
  })
  return publishNftUpdated(record, changes)
}

export function changeNftPrice(
  nftId: string,
  priceEth: string,
  editionId?: string,
) {
  return mutateNft(nftId, ['price'], (record) => {
    resolveEdition(record, editionId).priceEth = priceEth
  })
}

export function setEditionAvailability(
  nftId: string,
  available: number,
  editionId?: string,
) {
  return mutateNft(nftId, ['availability'], (record) => {
    const edition: EditionRecord = resolveEdition(record, editionId)
    if (edition.kind === 'open') throw new Error('Open editions are unlimited')
    edition.available = available
    edition.maxPerOrder = Math.min(available, 10)
  })
}
