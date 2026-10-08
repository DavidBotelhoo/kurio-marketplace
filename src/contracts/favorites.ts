import * as z from 'zod/mini'

import { nftSummarySchema } from './catalog'
import { isoDateTimeSchema } from './common'

/*
 * Favorites of the signed-in collector (Bearer token required).
 *
 * GET    /favorites          → 200 FavoritesResponse
 * PUT    /favorites/:nftId   → 200 FavoriteResponse  (idempotent add)
 * DELETE /favorites/:nftId   → 204                   (idempotent remove)
 *
 * 401 UNAUTHENTICATED / SESSION_EXPIRED without a valid session,
 * 404 NOT_FOUND for an unknown NFT.
 */

export const favoriteItemSchema = z.object({
  nftId: z.string(),
  createdAt: isoDateTimeSchema,
  nft: nftSummarySchema,
})

export type FavoriteItem = z.infer<typeof favoriteItemSchema>

export const favoritesResponseSchema = z.object({
  items: z.array(favoriteItemSchema),
})

export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>

export const favoriteResponseSchema = favoriteItemSchema

export type FavoriteResponse = z.infer<typeof favoriteResponseSchema>
