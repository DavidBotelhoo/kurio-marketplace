import { useId, useState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'

import { getMockConfig, subscribeMockConfig, updateMockConfig } from '../config'
import { db } from '../db/database'
import { settleDueOrders } from '../domain/orders'

const SETTLEMENT_OPTIONS = [3, 10, 30, 120] as const

export function OrdersSection() {
  const config = useSyncExternalStore(subscribeMockConfig, getMockConfig)
  useSyncExternalStore(
    (listener) => db.subscribe(listener),
    () => db.revision(),
  )
  const [message, setMessage] = useState('')
  const outcomeId = useId()
  const timeId = useId()
  const pending = db
    .read()
    .orders.filter((order) => order.status === 'pending').length
  const selectClass =
    'h-9 w-full rounded-sm border border-input bg-background px-2 text-13 text-foreground focus-visible:border-primary focus-visible:outline-none'

  return (
    <div className="grid gap-2">
      <p className="text-12 text-muted-foreground">
        Pedidos pendentes: {pending}.
      </p>
      <label htmlFor={outcomeId} className="text-12 text-muted-foreground">
        Resultado dos próximos pagamentos
      </label>
      <select
        id={outcomeId}
        className={selectClass}
        value={config.paymentOutcome}
        onChange={(event) => {
          updateMockConfig({
            paymentOutcome:
              event.target.value === 'decline' ? 'decline' : 'confirm',
          })
        }}
      >
        <option value="confirm">Confirmar</option>
        <option value="decline">Recusar</option>
      </select>
      <label htmlFor={timeId} className="text-12 text-muted-foreground">
        Tempo pendente
      </label>
      <select
        id={timeId}
        className={selectClass}
        value={config.settlementSeconds}
        onChange={(event) => {
          updateMockConfig({ settlementSeconds: Number(event.target.value) })
        }}
      >
        {SETTLEMENT_OPTIONS.map((seconds) => (
          <option key={seconds} value={seconds}>
            {seconds} s
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending === 0}
        onClick={() => {
          void settleDueOrders({ force: true }).then(() => {
            setMessage('Pedidos pendentes liquidados.')
          })
        }}
      >
        Liquidar pendentes agora
      </Button>
      <p role="status" className="min-h-4 text-12 text-highlight">
        {message}
      </p>
    </div>
  )
}
