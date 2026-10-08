import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import {
  type ErrorComponentProps,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api/errors'

/** Route-level error boundary: explains the failure and offers a retry. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  const message = isApiError(error)
    ? error.message
    : 'Não foi possível carregar esta página.'

  return (
    <section
      role="alert"
      className="container-page grid min-h-[60vh] place-content-center justify-items-center gap-4 py-16 text-center"
    >
      <h1 className="text-28 font-bold">Algo deu errado</h1>
      <p className="max-w-md text-15 text-muted-foreground">{message}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => {
            reset()
            void router.invalidate()
          }}
        >
          Tentar novamente
        </Button>
        <Button asChild variant="secondary">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </section>
  )
}
