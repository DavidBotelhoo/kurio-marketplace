import * as z from 'zod/mini'

import { isEthAmount } from '@/lib/eth'

/** ETH amounts travel as non-negative decimal strings with up to 18 digits. */
export const ethAmountSchema = z
  .string()
  .check(z.refine(isEthAmount, 'Valor em ETH inválido.'))

export const isoDateTimeSchema = z.iso.datetime()

/** Responsive image: the server owns asset URLs; clients render <picture>. */
export const imageSchema = z.object({
  /** Fallback source (WebP). */
  url: z.string(),
  /** Intrinsic size, used to reserve space and avoid layout shift. */
  width: z.int(),
  height: z.int(),
  alt: z.string(),
  sources: z.array(
    z.object({
      type: z.enum(['image/avif', 'image/webp']),
      srcSet: z.string(),
    }),
  ),
})

export type Image = z.infer<typeof imageSchema>

export const pageMetaSchema = z.object({
  page: z.int(),
  pageSize: z.int(),
  totalItems: z.int(),
  totalPages: z.int(),
})

export type PageMeta = z.infer<typeof pageMetaSchema>
