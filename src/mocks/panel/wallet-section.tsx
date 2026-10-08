import { useId, useState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'

import { getMockConfig, subscribeMockConfig, updateMockConfig } from '../config'
import { disconnectAllWallets } from '../domain/wallets'

export function WalletSection() {
  const config = useSyncExternalStore(subscribeMockConfig, getMockConfig)
  const [message, setMessage] = useState('')
  const approvalId = useId()

  return (
    <div className="grid gap-2">
      <label htmlFor={approvalId} className="text-12 text-muted-foreground">
        Resposta da extensão à conexão
      </label>
      <select
        id={approvalId}
        className="h-9 w-full rounded-sm border border-input bg-background px-2 text-13 text-foreground focus-visible:border-primary focus-visible:outline-none"
        value={config.walletApproval}
        onChange={(event) => {
          updateMockConfig({
            walletApproval:
              event.target.value === 'reject' ? 'reject' : 'approve',
          })
        }}
      >
        <option value="approve">Aprovar</option>
        <option value="reject">Recusar</option>
      </select>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          disconnectAllWallets()
          setMessage('Carteiras desconectadas.')
        }}
      >
        Desconectar carteiras
      </Button>
      <p role="status" className="min-h-4 text-12 text-highlight">
        {message}
      </p>
    </div>
  )
}
