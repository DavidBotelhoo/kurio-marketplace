import { ImageIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** Round avatar, or the Figma placeholder when the collector has none. */
export function UserAvatar({
  src,
  className,
  iconClassName,
}: {
  src: string | null
  className?: string
  iconClassName?: string
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted',
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <ImageIcon
          aria-hidden="true"
          className={cn('size-6 text-primary', iconClassName)}
        />
      )}
    </span>
  )
}
