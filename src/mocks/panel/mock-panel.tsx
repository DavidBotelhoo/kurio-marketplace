import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { applyPreset, resetMockData, resetMockEnvironment } from '../browser'
import {
  FAILURE_KINDS,
  type FailureKind,
  type FailureRule,
  getMockConfig,
  isPresetId,
  LATENCY_PROFILES,
  type LatencyProfileId,
  SCENARIO_PRESETS,
  subscribeMockConfig,
  updateMockConfig,
} from '../config'
import { DEMO_CREDENTIALS } from '../demo-credentials'
import { listOperations } from '../operations'
import { RealtimeSection } from './realtime-section'
import { SessionSection } from './session-section'
import { WalletSection } from './wallet-section'

const selectClass =
  'h-9 w-full rounded-sm border border-input bg-background px-2 text-13 text-foreground focus-visible:border-primary focus-visible:outline-none'

const REMAINING_OPTIONS = [
  { value: '1', label: 'Próxima requisição' },
  { value: '3', label: 'Próximas 3 (vence os retries)' },
  { value: 'always', label: 'Até remover' },
] as const

function useMockConfig() {
  return useSyncExternalStore(subscribeMockConfig, getMockConfig)
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-2 border-t border-border pt-3">
      <h3 className="text-12 font-bold tracking-brand text-highlight uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function FailureForm() {
  const ids = {
    operation: useId(),
    kind: useId(),
    phase: useId(),
    remaining: useId(),
  }
  const [operation, setOperation] = useState('*')
  const [kind, setKind] = useState<FailureKind>('server-error')
  const [phase, setPhase] = useState<FailureRule['phase']>('before')
  const [remaining, setRemaining] = useState<string>('1')

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const rule: FailureRule = {
          id: `rule-${String(Date.now())}`,
          operation,
          kind,
          phase,
          remaining: remaining === 'always' ? null : Number(remaining),
        }
        updateMockConfig({ failures: [...getMockConfig().failures, rule] })
      }}
    >
      <label htmlFor={ids.operation} className="text-12 text-muted-foreground">
        Operação
      </label>
      <select
        id={ids.operation}
        className={selectClass}
        value={operation}
        onChange={(event) => {
          setOperation(event.target.value)
        }}
      >
        <option value="*">Todas as operações</option>
        {listOperations().map((op) => (
          <option key={op.id} value={op.id}>
            {op.label} ({op.method} {op.path})
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <label htmlFor={ids.kind} className="text-12 text-muted-foreground">
            Tipo
          </label>
          <select
            id={ids.kind}
            className={selectClass}
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as FailureKind)
            }}
          >
            {Object.entries(FAILURE_KINDS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor={ids.phase} className="text-12 text-muted-foreground">
            Momento
          </label>
          <select
            id={ids.phase}
            className={selectClass}
            value={phase}
            onChange={(event) => {
              setPhase(event.target.value as FailureRule['phase'])
            }}
          >
            <option value="before">Antes de processar</option>
            <option value="after">Após processar (resposta perdida)</option>
          </select>
        </div>
      </div>
      <label htmlFor={ids.remaining} className="text-12 text-muted-foreground">
        Duração
      </label>
      <select
        id={ids.remaining}
        className={selectClass}
        value={remaining}
        onChange={(event) => {
          setRemaining(event.target.value)
        }}
      >
        {REMAINING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="secondary">
        Adicionar falha
      </Button>
    </form>
  )
}

export function MockPanel() {
  const config = useMockConfig()
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState(
    isPresetId(config.preset) ? config.preset : 'default',
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const panelId = useId()
  const latencyId = useId()
  const presetId = useId()

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!config.panel) return null

  const presetLabel = isPresetId(config.preset)
    ? SCENARIO_PRESETS[config.preset].label
    : 'Personalizado'
  const operations = new Map(listOperations().map((op) => [op.id, op.label]))

  return (
    <div className="fixed bottom-[6.75rem] left-3 z-50 font-sans text-13 text-foreground md:bottom-4 md:left-4">
      {open ? (
        <section
          ref={panelRef}
          id={panelId}
          tabIndex={-1}
          aria-label="Controle da API simulada"
          className="mb-2 grid max-h-[min(36rem,calc(100dvh-9rem))] w-[min(22rem,calc(100vw-1.5rem))] gap-3 overflow-y-auto rounded-md border border-border-strong bg-card p-4 shadow-2xl outline-none"
        >
          <header className="grid gap-1">
            <h2 className="text-15 font-bold">API simulada (MSW)</h2>
            <p className="text-12 text-muted-foreground">
              Cenários reproduzíveis de dados, rede e falhas. Alterações de rede
              valem para as próximas requisições.
            </p>
          </header>

          <Section title="Cenário">
            <label htmlFor={presetId} className="sr-only">
              Cenário
            </label>
            <select
              id={presetId}
              className={selectClass}
              value={preset}
              onChange={(event) => {
                if (isPresetId(event.target.value))
                  setPreset(event.target.value)
              }}
            >
              {Object.entries(SCENARIO_PRESETS).map(([id, item]) => (
                <option key={id} value={id}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="text-12 text-muted-foreground">
              {SCENARIO_PRESETS[preset].description}
            </p>
            <Button
              size="sm"
              onClick={() => {
                applyPreset(preset)
                window.location.reload()
              }}
            >
              Aplicar e recarregar
            </Button>
          </Section>

          <Section title="Rede">
            <label
              htmlFor={latencyId}
              className="text-12 text-muted-foreground"
            >
              Latência
            </label>
            <select
              id={latencyId}
              className={selectClass}
              value={config.latency}
              onChange={(event) => {
                updateMockConfig({
                  latency: event.target.value as LatencyProfileId,
                })
              }}
            >
              {Object.entries(LATENCY_PROFILES).map(([id, item]) => (
                <option key={id} value={id}>
                  {item.label}: {item.description}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={config.offline}
                onChange={(event) => {
                  updateMockConfig({ offline: event.target.checked })
                }}
              />
              Simular sem conexão
            </label>
          </Section>

          <Section title="Falhas injetadas">
            {config.failures.length === 0 ? (
              <p className="text-12 text-muted-foreground">
                Nenhuma falha ativa.
              </p>
            ) : (
              <ul className="grid gap-2">
                {config.failures.map((rule) => (
                  <li
                    key={rule.id}
                    className="flex items-start justify-between gap-2 rounded-sm border border-border p-2 text-12"
                  >
                    <span>
                      <strong className="font-bold">
                        {rule.operation === '*'
                          ? 'Todas'
                          : (operations.get(rule.operation) ?? rule.operation)}
                      </strong>
                      <br />
                      {FAILURE_KINDS[rule.kind]} ·{' '}
                      {rule.phase === 'after' ? 'após processar' : 'antes'} ·{' '}
                      {rule.remaining === null
                        ? 'até remover'
                        : `restam ${String(rule.remaining)}`}
                    </span>
                    <Button
                      size="inline"
                      variant="link"
                      className="text-12"
                      onClick={() => {
                        updateMockConfig({
                          failures: getMockConfig().failures.filter(
                            (item) => item.id !== rule.id,
                          ),
                        })
                      }}
                    >
                      Remover
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <FailureForm />
          </Section>

          <Section title="Sessões">
            <SessionSection />
          </Section>

          <Section title="Tempo real">
            <RealtimeSection />
          </Section>

          <Section title="Carteira">
            <WalletSection />
          </Section>

          <Section title="Usuários de teste">
            <ul className="grid gap-1 text-12">
              {DEMO_CREDENTIALS.map((user) => (
                <li key={user.email}>
                  <strong className="font-bold">{user.name}</strong>:{' '}
                  {user.email} / {user.password}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Dados">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  resetMockData()
                  window.location.reload()
                }}
              >
                Restaurar dados
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  resetMockEnvironment()
                  window.location.reload()
                }}
              >
                Restaurar tudo
              </Button>
            </div>
            <p className="text-12 text-muted-foreground">
              Restaurar dados recria o banco simulado e encerra a sessão;
              restaurar tudo também volta ao cenário padrão.
            </p>
          </Section>
        </section>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((value) => !value)
        }}
        className={cn(
          'flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-card px-3 text-12 text-foreground shadow-lg transition-colors hover:border-primary',
          config.failures.length > 0 || config.offline
            ? 'border-destructive'
            : '',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'size-2 rounded-full',
            config.failures.length > 0 || config.offline
              ? 'bg-destructive'
              : 'bg-primary',
          )}
        />
        API simulada: {presetLabel}
      </button>
    </div>
  )
}
