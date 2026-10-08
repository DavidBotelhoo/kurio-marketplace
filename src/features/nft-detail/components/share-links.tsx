import { LinkedinIcon, MessageIcon, TwitterIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** Share intents of each network (open in a new tab; e-mail opens the client). */
export function ShareLinks({
  name,
  path,
  className,
}: {
  name: string
  path: string
  className?: string
}) {
  const url = `${window.location.origin}${path}`
  const text = `${name} na Kurio`
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      Icon: LinkedinIcon,
      external: true,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      Icon: MessageIcon,
      external: false,
    },
    {
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      Icon: TwitterIcon,
      external: true,
    },
  ]
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <p className="text-15 font-bold text-foreground">
        Compartilhar este NFT:
      </p>
      <ul className="flex items-center gap-2">
        {links.map(({ label, href, Icon, external }) => (
          <li key={label}>
            <a
              href={href}
              {...(external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="grid size-7 place-items-center rounded-sm text-foreground transition-colors hover:text-highlight"
            >
              <Icon aria-hidden="true" className="size-[1.0625rem]" />
              <span className="sr-only">
                Compartilhar por {label}
                {external ? ' (abre em nova aba)' : ''}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
