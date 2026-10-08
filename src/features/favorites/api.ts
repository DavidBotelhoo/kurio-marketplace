import {
  type FavoriteResponse,
  favoriteResponseSchema,
  type FavoritesResponse,
  favoritesResponseSchema,
} from '@/contracts/favorites'
import { api } from '@/lib/api/client'
import { parseResponse } from '@/lib/api/parse'

const favoritePath = (nftId: string) =>
  `/favorites/${encodeURIComponent(nftId)}`

export async function fetchFavorites(
  signal?: AbortSignal,
): Promise<FavoritesResponse> {
  const { data } = await api.get<unknown>('/favorites', { signal })
  return parseResponse(favoritesResponseSchema, data)
}

export async function addFavorite(nftId: string): Promise<FavoriteResponse> {
  const { data } = await api.put<unknown>(favoritePath(nftId))
  return parseResponse(favoriteResponseSchema, data)
}

export async function removeFavorite(nftId: string): Promise<void> {
  await api.delete(favoritePath(nftId))
}
