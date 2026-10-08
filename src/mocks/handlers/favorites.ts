import { HttpResponse } from 'msw'

import type { FavoriteResponse, FavoritesResponse } from '@/contracts/favorites'

import { requireSession } from '../auth'
import { db } from '../db/database'
import { route } from '../http'
import { toNftSummary } from '../mappers/catalog'
import { apiError } from '../responses'

export const favoritesHandlers = [
  route(
    'get',
    '/favorites',
    { operation: 'favorites.list', label: 'Favoritos (listagem)' },
    ({ request }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const { favorites, nfts } = db.read()
      const items = favorites
        .filter((favorite) => favorite.userId === check.user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .flatMap((favorite) => {
          const nft = nfts.find((item) => item.id === favorite.nftId)
          return nft
            ? [
                {
                  nftId: favorite.nftId,
                  createdAt: favorite.createdAt,
                  nft: toNftSummary(nft),
                },
              ]
            : []
        })
      const body: FavoritesResponse = { items }
      return HttpResponse.json(body)
    },
  ),

  route<{ nftId: string }>(
    'put',
    '/favorites/:nftId',
    { operation: 'favorites.add', label: 'Favoritos (incluir)' },
    ({ request, params }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      const nft = db.read().nfts.find((item) => item.id === params.nftId)
      if (!nft)
        return apiError(404, 'NOT_FOUND', { message: 'NFT não encontrado.' })

      const favorite = db.write((draft) => {
        const existing = draft.favorites.find(
          (item) => item.userId === check.user.id && item.nftId === nft.id,
        )
        if (existing) return existing
        const created = {
          userId: check.user.id,
          nftId: nft.id,
          createdAt: new Date().toISOString(),
        }
        draft.favorites.push(created)
        return created
      })
      const body: FavoriteResponse = {
        nftId: favorite.nftId,
        createdAt: favorite.createdAt,
        nft: toNftSummary(nft),
      }
      return HttpResponse.json(body)
    },
  ),

  route<{ nftId: string }>(
    'delete',
    '/favorites/:nftId',
    { operation: 'favorites.remove', label: 'Favoritos (remover)' },
    ({ request, params }) => {
      const check = requireSession(request)
      if (!check.ok) return check.response
      db.write((draft) => {
        draft.favorites = draft.favorites.filter(
          (item) =>
            !(item.userId === check.user.id && item.nftId === params.nftId),
        )
      })
      return new HttpResponse(null, { status: 204 })
    },
  ),
]
