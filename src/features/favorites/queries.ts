import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'

import type { NftSummary } from '@/contracts/catalog'
import type { FavoriteItem, FavoritesResponse } from '@/contracts/favorites'
import { useSessionUserId } from '@/features/auth/queries'
import { isApiError } from '@/lib/api/errors'

import { addFavorite, fetchFavorites, removeFavorite } from './api'
import { favoritesKeys } from './query-keys'

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: favoritesKeys.list(userId),
    queryFn: ({ signal }) => fetchFavorites(signal),
  })
}

/** Favorites of the signed-in user; idle (no request) for visitors. */
export function useFavorites() {
  const userId = useSessionUserId()
  return useQuery({
    ...favoritesQueryOptions(userId ?? ''),
    enabled: userId !== null,
  })
}

function withFavorite(
  data: FavoritesResponse,
  nftId: string,
  item: FavoriteItem | null,
): FavoritesResponse {
  const rest = data.items.filter((favorite) => favorite.nftId !== nftId)
  return { items: item ? [item, ...rest] : rest }
}

interface ToggleContext {
  userId: string
  /** Entry before this toggle (null when it was not a favorite). */
  previous: FavoriteItem | null
}

/**
 * Favorite state of one NFT and its toggle.
 *
 * The cache is updated before the request (optimistic) and, on failure, only
 * this NFT is restored, so concurrent toggles on other NFTs are kept. Toggles
 * of the same NFT share a mutation scope and reach the API in click order.
 */
export function useFavorite(nft: NftSummary) {
  const queryClient = useQueryClient()
  const userId = useSessionUserId()

  const { data: cached = false } = useQuery({
    ...favoritesQueryOptions(userId ?? ''),
    enabled: userId !== null,
    select: (data) => data.items.some((item) => item.nftId === nft.id),
  })

  const mutation = useMutation({
    mutationKey: favoritesKeys.toggle(),
    scope: { id: `favorite:${nft.id}` },
    mutationFn: async (favorite: boolean) => {
      if (favorite) await addFavorite(nft.id)
      else await removeFavorite(nft.id)
    },
    onMutate: async (favorite): Promise<ToggleContext | undefined> => {
      if (!userId) return undefined
      const { queryKey } = favoritesQueryOptions(userId)
      // A refetch in flight would overwrite the optimistic entry.
      await queryClient.cancelQueries({ queryKey })
      const data = queryClient.getQueryData(queryKey)
      const previous = data?.items.find((item) => item.nftId === nft.id) ?? null
      queryClient.setQueryData(
        queryKey,
        (current) =>
          current &&
          withFavorite(
            current,
            nft.id,
            favorite
              ? { nftId: nft.id, createdAt: new Date().toISOString(), nft }
              : null,
          ),
      )
      return { userId, previous }
    },
    onError: (error, favorite, context) => {
      if (context) {
        queryClient.setQueryData(
          favoritesQueryOptions(context.userId).queryKey,
          (current) =>
            current && withFavorite(current, nft.id, context.previous),
        )
      }
      // An ended session has its own notice (see session-lifecycle).
      if (isApiError(error) && error.status === 401) return
      toast.error(
        favorite
          ? `Não foi possível favoritar “${nft.name}”. Tente novamente.`
          : `Não foi possível remover “${nft.name}” dos favoritos. Tente novamente.`,
      )
    },
    onSettled: (_data, _error, _favorite, context) => {
      // Refetch once the last concurrent toggle settles; an earlier refetch
      // would bring back the server state before the pending ones.
      if (
        context &&
        queryClient.isMutating({ mutationKey: favoritesKeys.toggle() }) === 1
      ) {
        void queryClient.invalidateQueries({
          queryKey: favoritesKeys.list(context.userId),
        })
      }
    },
  })

  // Until the list arrives the pending choice is what the user expects to see.
  const isFavorite = mutation.isPending ? mutation.variables : cached

  return {
    signedIn: userId !== null,
    isFavorite,
    toggle: () => {
      mutation.mutate(!isFavorite)
    },
  }
}
