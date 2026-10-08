import { Link } from '@tanstack/react-router'

import { NotFound } from '@/components/layout/not-found'
import { Button } from '@/components/ui/button'

/** Unknown NFT id (direct access to a removed or mistyped address). */
export function NftNotFound() {
  return (
    <NotFound
      title="NFT não encontrado"
      description="Este NFT não existe ou foi removido do mercado. Confira o endereço ou explore outras obras."
      actions={
        <>
          <Button asChild>
            <Link to="/" hash="mercado">
              Explorar o mercado
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </>
      }
    />
  )
}
