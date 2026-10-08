import {
  NETWORKS,
  type Edition,
  type NftDetail,
  type NftSummary,
} from '@/contracts/catalog'
import type { Image } from '@/contracts/common'
import { artworkImage as createArtworkImage } from '@/lib/artwork-image'

import type { ArtworkId, EditionRecord, NftRecord } from '../db/schema'
import { ARTWORKS, COLLECTIONS } from '../fixtures/catalog'
import { createRandom, hashString, pick } from '../random'

const ROYALTY_PERCENT = 5

const REVIEW_AUTHORS = [
  'Ana Prado',
  'Caio Mendes',
  'Bia Tavares',
  'Rui Matsuda',
  'Lia Fontes',
  'Téo Brandão',
  'Maya Duarte',
] as const

const REVIEW_COMMENTS = [
  'A arte em alta resolução é ainda mais bonita do que na prévia. Entrega e verificação sem complicação.',
  'Acompanho a coleção desde o primeiro lançamento e esta peça é uma das mais bem acabadas.',
  'Os lançamentos exclusivos para colecionadores já valeram a compra.',
  'Procedência clara e metadados completos. Recomendo para quem está começando.',
  'Detalhes de luz e textura impecáveis. Combina com o restante da minha coleção.',
  'Curadoria excelente. Fiquei de olho na próxima edição.',
] as const

/** A few recent reviews, deterministic per NFT, around its average rating. */
function createReviews(record: NftRecord) {
  const random = createRandom(hashString(`reviews:${record.id}`))
  const count = Math.min(3, record.rating.count)
  return Array.from({ length: count }, (_, index) => {
    const rating = Math.min(
      5,
      Math.max(1, Math.round(record.rating.average) - (index === 2 ? 1 : 0)),
    )
    return {
      id: `${record.id}-review-${String(index + 1)}`,
      author: pick(random, REVIEW_AUTHORS),
      rating,
      comment: pick(random, REVIEW_COMMENTS),
      createdAt: new Date(
        Date.parse(record.listedAt) + (index + 1) * 2 * 86_400_000,
      ).toISOString(),
    }
  }).reverse()
}

export function artworkImage(
  artwork: ArtworkId,
  alt = ARTWORKS[artwork].alt,
): Image {
  return createArtworkImage(artwork, alt)
}

export function isAvailable(edition: EditionRecord) {
  return edition.available === null || edition.available > 0
}

export function defaultEdition(record: NftRecord) {
  return (
    record.editions.find((edition) => edition.id === record.defaultEditionId) ??
    record.editions[0]
  )
}

/** Card price: the default edition price. */
export function displayPrice(record: NftRecord) {
  return defaultEdition(record)?.priceEth ?? '0'
}

export function networkLabel(record: NftRecord) {
  return NETWORKS.find((network) => network.id === record.network)?.label ?? ''
}

export function toNftSummary(record: NftRecord): NftSummary {
  return {
    id: record.id,
    name: record.name,
    tokenId: record.tokenId,
    collection: {
      id: record.collectionId,
      name: COLLECTIONS[record.collectionId as keyof typeof COLLECTIONS].name,
    },
    category: record.category,
    network: record.network,
    image: artworkImage(record.artwork),
    defaultEditionId: record.defaultEditionId,
    priceEth: displayPrice(record),
    compareAtPriceEth: record.compareAtPriceEth,
    rarity: record.rarity,
    availability: record.editions.some(isAvailable) ? 'available' : 'sold-out',
    listedAt: record.listedAt,
    version: record.version,
  }
}

export function toEdition(edition: EditionRecord): Edition {
  return {
    id: edition.id,
    label: edition.label,
    kind: edition.kind,
    supply: edition.supply,
    available: edition.available,
    maxPerOrder: edition.maxPerOrder,
    priceEth: edition.priceEth,
    status: isAvailable(edition) ? 'available' : 'sold-out',
  }
}

export function toNftDetail(record: NftRecord): NftDetail {
  const summary = toNftSummary(record)
  const collection =
    COLLECTIONS[record.collectionId as keyof typeof COLLECTIONS]
  const network = networkLabel(record)
  const edition = defaultEdition(record)?.label ?? '1/50'

  return {
    ...summary,
    description: `Um colecionável digital finalizado à mão da coleção ${collection.name}, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${record.name} é uma obra digital ${edition} finalizada à mão da coleção ${collection.name}. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${collection.creator} recebe ${String(ROYALTY_PERCENT)}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    attributes: record.attributes,
    rating: record.rating,
    reviews: createReviews(record),
    // The file has a single artwork per NFT; the gallery repeats it as in Figma.
    gallery: [1, 2, 3, 4].map((view) =>
      artworkImage(
        record.artwork,
        `${ARTWORKS[record.artwork].alt}, vista ${String(view)}`,
      ),
    ),
    editions: record.editions.map(toEdition),
    creator: { name: collection.creator, royaltyPercent: ROYALTY_PERCENT },
    contract: {
      address: record.contractAddress,
      standard: 'ERC-721',
      storage: 'IPFS',
    },
  }
}
