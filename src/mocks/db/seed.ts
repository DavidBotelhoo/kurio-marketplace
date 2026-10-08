import { cartLineId, maxQuantity } from '../domain/cart-rules'
import { createCatalogFixtures } from '../fixtures/catalog'
import { COUPONS } from '../fixtures/coupons'
import { WALLETS } from '../fixtures/wallets'
import { SEED_DATE, USERS } from '../fixtures/users'
import {
  type CartRecord,
  type DatasetId,
  DB_VERSION,
  type MockDatabase,
  type NftRecord,
} from './schema'

/** Lines of the Figma cart, as [NFT, preferred edition, quantity]. */
const FIGMA_CART = [
  ['emerald-ape-042', '1-50', 1],
  ['violet-nomad-314', '1-1', 1],
  ['ivory-baron-088', '1-10', 2],
  ['golden-beat-207', '1-50', 2],
] as const

/** Nova's cart: the Figma lines, adapted to what each edition allows. */
function seedCart(nfts: readonly NftRecord[]): CartRecord {
  const lines = FIGMA_CART.flatMap(([nftId, editionId, quantity]) => {
    const nft = nfts.find((item) => item.id === nftId)
    const edition =
      nft?.editions.find(
        (item) => item.id === editionId && maxQuantity(item) > 0,
      ) ?? nft?.editions.find((item) => item.id === nft.defaultEditionId)
    if (!nft || !edition) return []
    return [
      {
        id: cartLineId(nft.id, edition.id),
        nftId: nft.id,
        editionId: edition.id,
        quantity: Math.max(1, Math.min(quantity, maxQuantity(edition))),
        unitPriceEth: edition.priceEth,
        addedAt: SEED_DATE,
        updatedAt: SEED_DATE,
      },
    ]
  })
  return {
    owner: 'user:usr_nova',
    lines,
    couponCode: null,
    updatedAt: SEED_DATE,
  }
}

/** Builds a fresh, deterministic snapshot for a dataset. */
export function createSeed(dataset: DatasetId): MockDatabase {
  const nfts = dataset === 'empty-catalog' ? [] : createCatalogFixtures()
  return {
    version: DB_VERSION,
    dataset,
    seededAt: SEED_DATE,
    users: structuredClone([...USERS]),
    sessions: [],
    nfts,
    // Nova starts with one favorite (shown as a filled heart in Figma).
    favorites:
      dataset === 'empty-catalog'
        ? []
        : [
            {
              userId: 'usr_nova',
              nftId: 'emerald-ape-042',
              createdAt: SEED_DATE,
            },
          ],
    carts: nfts.length ? [seedCart(nfts)] : [],
    coupons: structuredClone([...COUPONS]),
    quotes: [],
    wallets: structuredClone([...WALLETS]),
    walletConnections: [],
    orders: [],
  }
}
