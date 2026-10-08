import type { Image } from '@/contracts/common'

interface NftImageProps {
  image: Image
  /** CSS `sizes` for the responsive sources. */
  sizes: string
  /** Above-the-fold images load eagerly and with high priority. */
  priority?: boolean
  className?: string
  alt?: string
}

/** <picture> with AVIF/WebP sources; intrinsic size reserves the space. */
export function NftImage({
  image,
  sizes,
  priority = false,
  className,
  alt,
}: NftImageProps) {
  return (
    <picture>
      {image.sources.map((source) => (
        <source
          key={source.type}
          type={source.type}
          srcSet={source.srcSet}
          sizes={sizes}
        />
      ))}
      <img
        src={image.url}
        alt={alt ?? image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={className}
      />
    </picture>
  )
}
