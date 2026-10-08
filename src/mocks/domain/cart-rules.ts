import type { EditionRecord } from '../db/schema'

/** One line per NFT edition. */
export const cartLineId = (nftId: string, editionId: string) =>
  `${nftId}~${editionId}`

/** Largest quantity an order can take now (0 when sold out). */
export function maxQuantity(edition: EditionRecord) {
  return edition.available === null
    ? edition.maxPerOrder
    : Math.max(0, Math.min(edition.available, edition.maxPerOrder))
}
