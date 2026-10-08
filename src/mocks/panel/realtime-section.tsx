import { useId, useState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { isEthAmount } from '@/lib/eth'

import { db } from '../db/database'
import { changeNftPrice, setEditionAvailability } from '../domain/catalog'
import { defaultEdition } from '../mappers/catalog'
import {
  connectionCount,
  disconnectAll,
  resendLastEvent,
  sendStaleEvent,
  subscribeConnections,
} from '../realtime/server'

const fieldClass =
  'h-9 w-full rounded-sm border border-input bg-background px-2 text-13 text-foreground focus-visible:border-primary focus-visible:outline-none'

function useNfts() {
  // db.write mutates in place: subscribe to the revision, then read.
  useSyncExternalStore(
    (listener) => db.subscribe(listener),
    () => db.revision(),
  )
  return db.read().nfts
}

/** Panel controls that change data on the server and emit realtime events. */
export function RealtimeSection() {
  const nfts = useNfts()
  const connections = useSyncExternalStore(
    subscribeConnections,
    connectionCount,
  )
  const [nftId, setNftId] = useState(nfts[0]?.id ?? '')
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')
  const ids = { nft: useId(), price: useId() }

  const selected = nfts.find((nft) => nft.id === nftId)
  const edition = selected ? defaultEdition(selected) : undefined

  function run(action: () => unknown, done: string) {
    try {
      action()
      setMessage(done)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao executar.')
    }
  }

  return (
    <div className="grid gap-2">
      <p className="text-12 text-muted-foreground">
        Conexões ativas: {connections}. Os eventos chegam ao app pelo
        socket.io-client.
      </p>
      <label htmlFor={ids.nft} className="text-12 text-muted-foreground">
        NFT
      </label>
      <select
        id={ids.nft}
        className={fieldClass}
        value={nftId}
        onChange={(event) => {
          setNftId(event.target.value)
        }}
      >
        {nfts.map((nft) => (
          <option key={nft.id} value={nft.id}>
            {nft.name}
          </option>
        ))}
      </select>
      {selected && edition ? (
        <p className="text-12 text-muted-foreground">
          Edição {edition.label}: {edition.priceEth} ETH ·{' '}
          {edition.available === null
            ? 'ilimitada'
            : `${String(edition.available)} disponíveis`}{' '}
          · versão {selected.version}
        </p>
      ) : null}
      <label htmlFor={ids.price} className="text-12 text-muted-foreground">
        Novo preço (ETH)
      </label>
      <div className="flex gap-2">
        <input
          id={ids.price}
          inputMode="decimal"
          placeholder={edition?.priceEth ?? '1.00'}
          className={fieldClass}
          value={price}
          onChange={(event) => {
            setPrice(event.target.value.replace(',', '.'))
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!selected || !isEthAmount(price)}
          onClick={() => {
            run(
              () => changeNftPrice(nftId, price),
              `Preço alterado para ${price} ETH.`,
            )
          }}
        >
          Alterar
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!selected || edition?.kind === 'open'}
          onClick={() => {
            run(() => setEditionAvailability(nftId, 0), 'Edição esgotada.')
          }}
        >
          Esgotar edição
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!selected || edition?.kind === 'open'}
          onClick={() => {
            run(
              () => setEditionAvailability(nftId, 10),
              'Estoque reposto (10).',
            )
          }}
        >
          Repor estoque
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            run(() => {
              if (!resendLastEvent())
                throw new Error('Nenhum evento enviado ainda.')
            }, 'Último evento reenviado (duplicado).')
          }}
        >
          Reenviar último
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            run(() => {
              if (!sendStaleEvent()) {
                throw new Error('É preciso ao menos duas versões do mesmo NFT.')
              }
            }, 'Evento antigo enviado.')
          }}
        >
          Enviar antigo
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            run(() => {
              disconnectAll()
            }, 'Conexões encerradas; o cliente vai reconectar.')
          }}
        >
          Derrubar conexão
        </Button>
      </div>
      <p role="status" className="min-h-4 text-12 text-highlight">
        {message}
      </p>
    </div>
  )
}
