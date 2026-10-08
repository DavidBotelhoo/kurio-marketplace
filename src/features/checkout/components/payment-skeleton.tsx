import { Skeleton } from '@/components/ui/skeleton'

export function PaymentSkeleton() {
  return (
    <div aria-busy="true" className="container-page pt-7 pb-24">
      <p role="status" className="sr-only">
        Carregando o pagamento…
      </p>
      <Skeleton className="hidden h-5 w-56 md:block" />
      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,47.625rem)_minmax(0,25.3125rem)] lg:justify-between">
        <div className="grid content-start gap-5">
          <Skeleton className="h-6 w-56" />
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="grid gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-3">
          <Skeleton className="h-6 w-32" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-[4.375rem] w-full rounded-none" />
          ))}
          <Skeleton className="mt-4 h-36 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  )
}
