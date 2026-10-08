import { useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { HeartFilledIcon, HeartIcon } from '@/components/icons'
import type { NftSummary } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

import { useFavorite } from '../queries'

interface FavoriteButtonProps {
  nft: NftSummary
  className?: string
  iconClassName?: string
  /** Visible text next to the icon (the accessible name stays the same). */
  children?: ReactNode
}

/**
 * Toggle button (aria-pressed). Visitors are sent to the login and come back
 * to the same place afterwards.
 */
export function FavoriteButton({
  nft,
  className,
  iconClassName,
  children,
}: FavoriteButtonProps) {
  const router = useRouter()
  const { signedIn, isFavorite, toggle } = useFavorite(nft)
  const Icon = isFavorite ? HeartFilledIcon : HeartIcon

  return (
    <button
      type="button"
      aria-label={`Favoritar ${nft.name}`}
      aria-pressed={isFavorite}
      data-favorite={isFavorite}
      onClick={() => {
        if (signedIn) {
          toggle()
          return
        }
        void router.navigate({
          to: '/login',
          search: {
            redirect: router.state.location.href,
            reason: 'required',
          },
        })
      }}
      className={cn('grid cursor-pointer place-items-center', className)}
    >
      <Icon className={iconClassName} />
      {children}
    </button>
  )
}
