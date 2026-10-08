/**
 * Catalog taxonomy. Kept free of schema code so routing (entry chunk) can
 * validate search params without loading the validation library.
 */
export const CATEGORIES = [
  { id: 'arte-digital', label: 'Arte digital' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'arte-3d', label: 'Arte 3D' },
  { id: 'colecionaveis', label: 'Colecionáveis' },
  { id: 'generativa', label: 'Generativa' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'utilidade', label: 'Utilidade' },
] as const

export const NETWORKS = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'solana', label: 'Solana' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']
export type NetworkId = (typeof NETWORKS)[number]['id']

/** Catalog tabs: "Todos os NFTs", "Novos lançamentos", "Em alta". */
export const NFT_TABS = ['all', 'new', 'trending'] as const
export type NftTab = (typeof NFT_TABS)[number]

export const NFT_SORTS = [
  'recent',
  'price-asc',
  'price-desc',
  'popular',
] as const
export type NftSort = (typeof NFT_SORTS)[number]

export const NFT_PAGE_SIZE = 9
