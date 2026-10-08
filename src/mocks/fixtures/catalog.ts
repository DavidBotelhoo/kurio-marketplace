import {
  CATEGORIES,
  type CategoryId,
  NETWORKS,
  type NetworkId,
} from '@/contracts/catalog'
import { scaleEth } from '@/lib/eth'

import type { ArtworkId, EditionRecord, NftRecord } from '../db/schema'
import { createRandom, hashString, randomInt } from '../random'
import { SEED_DATE } from './users'

/* ---------------------------------------------------------------------------
 * Collections: one per artwork available in the Figma file.
 * ------------------------------------------------------------------------- */

export const COLLECTIONS = {
  'kurio-apes': { name: 'Kurio Apes', creator: 'Nova Sato' },
  'nomad-society': { name: 'Nomad Society', creator: 'Iris Monteiro' },
  'ivory-court': { name: 'Ivory Court', creator: 'Theo Vance' },
  'golden-frequencies': { name: 'Golden Frequencies', creator: 'Luna Okafor' },
} as const

export type CollectionId = keyof typeof COLLECTIONS

export const ARTWORKS: Record<
  ArtworkId,
  { collectionId: CollectionId; attributes: readonly string[]; alt: string }
> = {
  emerald: {
    collectionId: 'kurio-apes',
    attributes: ['Óculos', 'Esmeralda'],
    alt: 'Macaco de pelo castanho com óculos redondos de lentes verdes, jaqueta college verde e colar com pingente de esmeralda',
  },
  nomad: {
    collectionId: 'nomad-society',
    attributes: ['Chapéu bucket', 'Moletom'],
    alt: 'Gorila grisalho sorrindo, com chapéu bucket verde-claro e moletom lilás',
  },
  ivory: {
    collectionId: 'ivory-court',
    attributes: ['Blazer', 'Gola alta'],
    alt: 'Macaco de pelo preto com brinco dourado, blazer creme e blusa de gola alta verde',
  },
  golden: {
    collectionId: 'golden-frequencies',
    attributes: ['Fones', 'Jaqueta bomber'],
    alt: 'Macaco de pelo dourado com fones de ouvido verdes e jaqueta bomber creme',
  },
}

/* ---------------------------------------------------------------------------
 * NFT specs. The first nine reproduce the Figma catalog page, in order.
 * ------------------------------------------------------------------------- */

interface NftSpec {
  name: string
  number: number
  artwork: ArtworkId
  category: CategoryId
  network: NetworkId
  /** Price of the 1/50 edition (the default one). */
  price: string
  compareAt?: string
  rarity?: NftRecord['rarity']
  isNew?: boolean
  isTrending?: boolean
  rating?: [average: number, count: number]
  /** Every edition sold out (no open edition). */
  soldOut?: boolean
  /** A single unit left in the default edition. */
  lastUnit?: boolean
}

const FIGMA_SPECS: NftSpec[] = [
  {
    name: 'Emerald Ape',
    number: 42,
    artwork: 'emerald',
    category: 'arte-digital',
    network: 'ethereum',
    price: '1.19',
    rarity: 'raro',
    isNew: true,
    isTrending: true,
    rating: [4.8, 19],
  },
  {
    name: 'Sage Nomad',
    number: 9,
    artwork: 'nomad',
    category: 'colecionaveis',
    network: 'polygon',
    price: '1.69',
    isNew: true,
  },
  {
    name: 'Neon Vessel',
    number: 552,
    artwork: 'ivory',
    category: 'arte-3d',
    network: 'ethereum',
    price: '1.99',
    compareAt: '2.29',
    rarity: 'raro',
    isTrending: true,
  },
  {
    name: 'Cosmic Bloom',
    number: 118,
    artwork: 'nomad',
    category: 'generativa',
    network: 'solana',
    price: '1.29',
    isNew: true,
  },
  {
    name: 'Violet Nomad',
    number: 314,
    artwork: 'nomad',
    category: 'fotografia',
    network: 'ethereum',
    price: '1.39',
    isTrending: true,
  },
  {
    name: 'Ivory Baron',
    number: 88,
    artwork: 'ivory',
    category: 'assinaturas',
    network: 'polygon',
    price: '1.79',
  },
  {
    name: 'Golden Beat',
    number: 207,
    artwork: 'golden',
    category: 'musica',
    network: 'ethereum',
    price: '0.99',
    isNew: true,
    isTrending: true,
  },
  {
    name: 'Golden Frequency',
    number: 71,
    artwork: 'golden',
    category: 'musica',
    network: 'solana',
    price: '0.59',
  },
  {
    name: 'Golden Signal',
    number: 160,
    artwork: 'golden',
    category: 'jogos',
    network: 'polygon',
    price: '0.39',
    isNew: true,
  },
]

const GENERATED_NAMES: Record<ArtworkId, readonly string[]> = {
  emerald: [
    'Jade Monarch',
    'Verdant Chief',
    'Mint Prophet',
    'Forest Crown',
    'Clover Regent',
    'Malachite Ace',
    'Fern Captain',
  ],
  nomad: [
    'Lavender Drift',
    'Dusk Wanderer',
    'Plum Pilgrim',
    'Amethyst Roamer',
    'Mauve Hermit',
    'Iris Voyager',
    'Lilac Scout',
  ],
  ivory: [
    'Onyx Diplomat',
    'Velvet Consul',
    'Midnight Envoy',
    'Pearl Chancellor',
    'Obsidian Duke',
    'Cream Marquis',
  ],
  golden: [
    'Amber Echo',
    'Solar Tempo',
    'Honey Groove',
    'Saffron Bass',
    'Copper Chorus',
    'Sunlit Rhythm',
    'Topaz Treble',
  ],
}

/** Spread from 0.02 to 12.30 ETH (the Figma price range). */
const GENERATED_PRICES = [
  '0.02',
  '0.08',
  '0.15',
  '0.24',
  '0.45',
  '0.72',
  '0.85',
  '1.05',
  '1.45',
  '1.88',
  '2.10',
  '2.45',
  '2.99',
  '3.20',
  '3.75',
  '4.40',
  '5.15',
  '5.90',
  '6.60',
  '7.25',
  '8.10',
  '8.90',
  '9.40',
  '10.25',
  '11.10',
  '11.80',
  '12.30',
]

const SPECIAL: Record<string, Partial<NftSpec>> = {
  'Lavender Drift': {
    price: '2.45',
    compareAt: '3.10',
    rarity: 'lendario',
    isTrending: true,
  },
  'Obsidian Duke': { soldOut: true },
  'Clover Regent': { lastUnit: true },
  'Pearl Chancellor': { price: '5.90', compareAt: '6.40', rarity: 'raro' },
  'Saffron Bass': { isNew: true },
  'Velvet Consul': { isTrending: true, rarity: 'raro' },
}

function generatedSpecs(): NftSpec[] {
  const random = createRandom(42)
  const artworks: ArtworkId[] = ['emerald', 'nomad', 'ivory', 'golden']
  const names = artworks.flatMap((artwork) =>
    GENERATED_NAMES[artwork].map((name) => ({ name, artwork })),
  )
  // Deterministic shuffle of prices so price does not follow the artwork.
  const prices = [...GENERATED_PRICES]
  for (let i = prices.length - 1; i > 0; i--) {
    const j = randomInt(random, 0, i)
    ;[prices[i], prices[j]] = [prices[j] ?? '1', prices[i] ?? '1']
  }
  return names.map(({ name, artwork }, index) => ({
    name,
    artwork,
    number: randomInt(random, 1, 999),
    category: CATEGORIES[index % CATEGORIES.length]?.id ?? 'arte-digital',
    network: NETWORKS[(index + 1) % NETWORKS.length]?.id ?? 'ethereum',
    price: prices[index] ?? '1',
    ...SPECIAL[name],
  }))
}

/* ---------------------------------------------------------------------------
 * Records
 * ------------------------------------------------------------------------- */

const EDITION_TEMPLATES = [
  { id: '1-1', label: '1/1', kind: 'limited', supply: 1, priceBps: 30_000 },
  { id: '1-10', label: '1/10', kind: 'limited', supply: 10, priceBps: 15_000 },
  { id: '1-50', label: '1/50', kind: 'limited', supply: 50, priceBps: 10_000 },
  { id: 'open', label: 'ABERTA', kind: 'open', supply: null, priceBps: 6_000 },
] as const

const OPEN_EDITION_MAX_PER_ORDER = 10
const LIMITED_MAX_PER_ORDER = 10

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function contractAddress(seed: string) {
  let hex = ''
  for (let i = 0; hex.length < 40; i++) {
    hex += hashString(`${seed}:${String(i)}`)
      .toString(16)
      .padStart(8, '0')
  }
  return `0x${hex.slice(0, 40)}`
}

function buildEditions(spec: NftSpec, random: () => number): EditionRecord[] {
  return EDITION_TEMPLATES.filter(
    (t) => !(spec.soldOut && t.kind === 'open'),
  ).map((template) => {
    let available: number | null
    if (template.kind === 'open') available = null
    else if (spec.soldOut) available = 0
    else if (template.id === '1-1') available = random() < 0.35 ? 0 : 1
    else if (template.id === '1-10') available = randomInt(random, 0, 10)
    else available = spec.lastUnit ? 1 : randomInt(random, 4, 50)

    return {
      id: template.id,
      label: template.label,
      kind: template.kind,
      supply: template.supply,
      available,
      maxPerOrder:
        available === null
          ? OPEN_EDITION_MAX_PER_ORDER
          : Math.min(available, LIMITED_MAX_PER_ORDER),
      priceEth: scaleEth(spec.price, template.priceBps),
    }
  })
}

function toRecord(spec: NftSpec, index: number): NftRecord {
  const random = createRandom(hashString(`${spec.name}:${String(spec.number)}`))
  const editions = buildEditions(spec, random)
  const defaultEdition =
    editions.find((e) => e.id === '1-50' && e.available !== 0) ??
    editions.find((e) => e.available !== 0) ??
    editions.find((e) => e.id === '1-50')
  const rarity = spec.rarity ?? 'comum'
  const [average, count] = spec.rating ?? [
    Math.round((4 + random()) * 10) / 10,
    randomInt(random, 3, 48),
  ]
  const id = `${slugify(spec.name)}-${String(spec.number).padStart(3, '0')}`

  return {
    id,
    name: `${spec.name} #${String(spec.number).padStart(3, '0')}`,
    tokenId: `#${String(spec.number).padStart(4, '0')}`,
    artwork: spec.artwork,
    collectionId: ARTWORKS[spec.artwork].collectionId,
    category: spec.category,
    network: spec.network,
    compareAtPriceEth: spec.compareAt ?? null,
    rarity,
    isNew: spec.isNew ?? false,
    isTrending: spec.isTrending ?? false,
    popularity: (spec.isTrending ? 1000 : 0) + randomInt(random, 10, 900),
    // Most recent first: the Figma page order is the "recent" sort order.
    listedAt: new Date(
      Date.parse(SEED_DATE) - index * 7 * 3_600_000,
    ).toISOString(),
    rating: { average, count },
    attributes: [
      ...ARTWORKS[spec.artwork].attributes,
      ...(rarity === 'comum' ? [] : [rarity === 'raro' ? 'Raro' : 'Lendário']),
    ],
    // Emerald Ape #042 keeps the address shown in the Figma detail page.
    contractAddress:
      id === 'emerald-ape-042'
        ? '0x7a42c3f1d9e0b8a6f5e4d3c2b1a09f8e7d6c19e8'
        : contractAddress(id),
    editions,
    defaultEditionId: defaultEdition?.id ?? '1-50',
    version: 1,
    updatedAt: SEED_DATE,
  }
}

export function createCatalogFixtures(): NftRecord[] {
  return [...FIGMA_SPECS, ...generatedSpecs()].map(toRecord)
}

/** Hero carousel ids and the name of the "NFT em destaque". */
export const HIGHLIGHTS = {
  hero: ['emerald-ape-042', 'golden-beat-207', 'ivory-baron-088'],
  featuredName: 'Lavender Drift',
} as const
