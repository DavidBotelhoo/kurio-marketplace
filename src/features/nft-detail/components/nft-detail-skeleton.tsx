import { Skeleton } from '@/components/ui/skeleton'

/** Pending state of /nfts/$nftId, with the final layout's dimensions. */
export function NftDetailSkeleton() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Carregando NFT…
      </p>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="bg-linear-135 from-card to-muted">
          <div className="flex justify-between px-7 pt-6 pb-2">
            <Skeleton className="size-[2.125rem] rounded-full" />
            <Skeleton className="size-[2.125rem] rounded-full" />
          </div>
          <div className="px-[1.625rem]">
            <Skeleton className="aspect-[361/356] w-full rounded-[1.5rem]" />
          </div>
        </div>
        <div className="relative -mt-[1.875rem] grid gap-4 rounded-t-[1.9375rem] bg-card px-6 pt-9 pb-12">
          <div className="flex justify-between gap-4">
            <Skeleton className="h-7 w-3/5" />
            <Skeleton className="h-[1.625rem] w-20 rounded-full" />
          </div>
          <Skeleton className="h-[4.5rem] w-full" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-[1.6875rem] w-4/5 rounded-full" />
          <Skeleton className="h-20 w-3/4" />
        </div>
      </div>

      {/* Tablet and desktop */}
      <div className="container-page hidden pt-7 pb-24 md:block">
        <Skeleton className="h-5 w-36" />
        <div className="mt-3 grid gap-8 md:grid-cols-2 xl:grid-cols-[35.75rem_minmax(0,1fr)] xl:gap-[2.0625rem]">
          <div className="flex gap-4 xl:gap-7">
            <div className="grid w-[4.5rem] shrink-0 content-start gap-3 xl:w-[6.25rem] xl:gap-4">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton
                  key={item}
                  className="aspect-square w-full rounded-[0.5rem]"
                />
              ))}
            </div>
            <Skeleton className="aspect-square min-w-0 flex-1 xl:w-[27.75rem] xl:flex-none" />
          </div>
          <div className="grid content-start gap-4">
            <Skeleton className="h-9 w-3/5" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-[1.6875rem] w-64 rounded-full" />
            <Skeleton className="h-[3.1rem] w-full" />
            <Skeleton className="h-24 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}
