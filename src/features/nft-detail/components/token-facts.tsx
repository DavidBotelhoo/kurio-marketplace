import type { NftDetail } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

/** "ID do token", "Coleção" and "Atributos" lines. */
export function TokenFacts({
  nft,
  className,
}: {
  nft: NftDetail
  className?: string
}) {
  const facts = [
    ['ID do token', nft.tokenId],
    ['Coleção', nft.collection.name],
    ['Atributos', nft.attributes.join(', ')],
  ] as const
  return (
    <dl
      className={cn(
        'grid gap-2.5 text-15 leading-[1.4] text-subtle-foreground',
        className,
      )}
    >
      {facts.map(([term, value]) => (
        <div key={term}>
          <dt className="inline">{term}: </dt>
          <dd className="inline">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
