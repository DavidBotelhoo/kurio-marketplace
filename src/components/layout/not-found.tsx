import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

interface NotFoundProps {
  title?: string
  description?: string
}

export function NotFound({
  title = 'Página não encontrada',
  description = 'O endereço acessado não existe ou foi removido.',
}: NotFoundProps) {
  return (
    <section className="container-page grid min-h-[60vh] place-content-center justify-items-center gap-4 py-16 text-center">
      <p className="text-14 font-bold tracking-brand text-highlight">
        ERRO 404
      </p>
      <h1 className="text-28 font-bold">{title}</h1>
      <p className="max-w-md text-15 text-muted-foreground">{description}</p>
      <Button asChild className="mt-2">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
