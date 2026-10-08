import { useId, useState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'

import { activeSessionCount, expireAllSessions } from '../auth'
import { getMockConfig, subscribeMockConfig, updateMockConfig } from '../config'
import { db } from '../db/database'

const TTL_OPTIONS = [
  { seconds: 8 * 60 * 60, label: '8 horas (padrão)' },
  { seconds: 5 * 60, label: '5 minutos' },
  { seconds: 60, label: '60 segundos' },
  { seconds: 20, label: '20 segundos' },
] as const

export function SessionSection() {
  const config = useSyncExternalStore(subscribeMockConfig, getMockConfig)
  useSyncExternalStore(
    (listener) => db.subscribe(listener),
    () => db.revision(),
  )
  const [message, setMessage] = useState('')
  const ttlId = useId()

  return (
    <div className="grid gap-2">
      <p className="text-12 text-muted-foreground">
        Sessões ativas: {activeSessionCount()}. Expirar faz a próxima requisição
        privada responder 401 SESSION_EXPIRED.
      </p>
      <label htmlFor={ttlId} className="text-12 text-muted-foreground">
        Duração de novas sessões
      </label>
      <select
        id={ttlId}
        className="h-9 w-full rounded-sm border border-input bg-background px-2 text-13 text-foreground focus-visible:border-primary focus-visible:outline-none"
        value={config.sessionTtlSeconds}
        onChange={(event) => {
          updateMockConfig({ sessionTtlSeconds: Number(event.target.value) })
        }}
      >
        {TTL_OPTIONS.map((option) => (
          <option key={option.seconds} value={option.seconds}>
            {option.label}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          expireAllSessions()
          setMessage('Sessões expiradas.')
        }}
      >
        Expirar sessões agora
      </Button>
      <p role="status" className="min-h-4 text-12 text-highlight">
        {message}
      </p>
    </div>
  )
}
