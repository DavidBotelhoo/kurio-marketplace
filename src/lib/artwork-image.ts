import type { Image } from '@/contracts/common'

/** Artworks shipped in public/images/nfts (one per Figma illustration). */
export type ArtworkId = 'emerald' | 'nomad' | 'ivory' | 'golden'

const IMAGE_WIDTHS = [128, 256, 384, 512, 768, 1024] as const

function srcSet(artwork: ArtworkId, format: 'avif' | 'webp') {
  return IMAGE_WIDTHS.map(
    (width) =>
      `/images/nfts/${artwork}-${String(width)}.${format} ${String(width)}w`,
  ).join(', ')
}

/** Responsive image descriptor (AVIF + WebP, 128–1024 px) for an artwork. */
export function artworkImage(artwork: ArtworkId, alt: string): Image {
  return {
    url: `/images/nfts/${artwork}-512.webp`,
    width: 1024,
    height: 1024,
    alt,
    sources: [
      { type: 'image/avif', srcSet: srcSet(artwork, 'avif') },
      { type: 'image/webp', srcSet: srcSet(artwork, 'webp') },
    ],
  }
}
