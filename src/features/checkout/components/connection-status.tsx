import { providerLabel } from '@/contracts/wallets'
import { shortAddress } from '@/lib/address'
import { cn } from '@/lib/utils'

import { networkLabel } from '../format'
import type { ConnectionState } from '../use-wallet-connection'

/** Simulated wallet connection: waiting, connected, refused or lost. */
export function ConnectionStatus({
  state,
  outdated,
  onDisconnect,
  className,
}: {
  state: ConnectionState
  /** Connected to another address, network or wallet type than the form's. */
  outdated: boolean
  onDisconnect: () => void
  className?: string
}) {
  let content: React.ReactNode = null
  if (state.status === 'connecting') {
    content = (
      <p className="flex items-center gap-2.5 text-14 text-foreground">
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none"
        />
        Aguardando aprovação na {providerLabel(state.provider)}…
      </p>
    )
  } else if (state.status === 'connected') {
    const { connection } = state
    content = (
      <div className="flex flex-wrap items-center justify-between gap-2 text-14">
        <p className={outdated ? 'text-muted-foreground' : 'text-foreground'}>
          <span
            aria-hidden="true"
            className="mr-2 inline-block size-2 rounded-full bg-primary"
          />
          {providerLabel(connection.provider)} conectada ·{' '}
          {shortAddress(connection.address, '…')} ·{' '}
          {networkLabel(connection.network)}
          {outdated ? (
            <span className="block text-13 text-highlight">
              Os dados mudaram: a carteira será conectada de novo ao confirmar.
            </span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={onDisconnect}
          className="cursor-pointer font-medium text-highlight underline-offset-4 hover:underline"
        >
          Desconectar
        </button>
      </div>
    )
  } else if (state.status === 'rejected') {
    content = <p className="text-14 text-destructive">{state.message}</p>
  } else if (state.notice) {
    content = <p className="text-14 text-highlight">{state.notice}</p>
  }

  return (
    <div
      role="status"
      className={cn(
        content && 'rounded-md border border-border bg-card px-3.5 py-3',
        className,
      )}
    >
      {content}
    </div>
  )
}
