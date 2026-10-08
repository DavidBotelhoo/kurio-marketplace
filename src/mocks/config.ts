import * as z from 'zod/mini'

import { DATASET_IDS } from './db/schema'
import { MOCK_CONFIG_KEY, readJson, writeJson } from './storage'

export const LATENCY_PROFILES = {
  none: { label: 'Sem latência', description: 'Respostas imediatas.' },
  fast: { label: 'Rápida', description: '80 ms fixos.' },
  realistic: { label: 'Realista', description: 'Entre 150 e 500 ms.' },
  slow: { label: 'Lenta', description: 'Entre 1,8 e 3,5 s.' },
  'out-of-order': {
    label: 'Fora de ordem',
    description:
      'Requisições ímpares da mesma operação levam 1,6 s e as pares 250 ms: a resposta mais antiga chega por último.',
  },
} as const

export type LatencyProfileId = keyof typeof LATENCY_PROFILES

export const FAILURE_KINDS = {
  'server-error': 'HTTP 500 (erro interno)',
  unavailable: 'HTTP 503 (indisponível)',
  'rate-limited': 'HTTP 429 (limite de requisições)',
  network: 'Falha de conexão',
  timeout: 'Sem resposta (timeout)',
} as const

export type FailureKind = keyof typeof FAILURE_KINDS

const latencySchema = z.enum(
  Object.keys(LATENCY_PROFILES) as [LatencyProfileId, ...LatencyProfileId[]],
)
const failureKindSchema = z.enum(
  Object.keys(FAILURE_KINDS) as [FailureKind, ...FailureKind[]],
)

export const failureRuleSchema = z.object({
  id: z.string(),
  /** Operation id (see mocks/operations.ts) or "*" for every operation. */
  operation: z.string(),
  kind: failureKindSchema,
  /**
   * "before": fail without touching data. "after": apply the operation and
   * then lose the response (used for idempotency recovery scenarios).
   */
  phase: z.enum(['before', 'after']),
  /** Remaining matching requests that fail; null fails until removed. */
  remaining: z.nullable(z.int().check(z.positive())),
})

export type FailureRule = z.infer<typeof failureRuleSchema>

export const mockConfigSchema = z.object({
  preset: z.string(),
  dataset: z.enum(DATASET_IDS),
  latency: latencySchema,
  offline: z.boolean(),
  failures: z.array(failureRuleSchema),
  /** Seed for every pseudo-random decision (latency jitter). */
  seed: z.int(),
  /** Lifetime of new sessions. */
  sessionTtlSeconds: z.int().check(z.positive()),
  /** Shows the floating control panel (hidden in visual regression tests). */
  panel: z.boolean(),
})

export type MockConfig = z.infer<typeof mockConfigSchema>

export const DEFAULT_CONFIG: MockConfig = {
  preset: 'default',
  dataset: 'default',
  latency: 'realistic',
  offline: false,
  failures: [],
  seed: 2026,
  sessionTtlSeconds: 8 * 60 * 60,
  panel: true,
}

interface ScenarioPreset {
  label: string
  description: string
  config: Partial<Omit<MockConfig, 'preset' | 'panel' | 'seed'>>
}

/** Named, reproducible scenarios (README and tests refer to these ids). */
export const SCENARIO_PRESETS = {
  default: {
    label: 'Padrão',
    description: 'Dados completos, latência realista e nenhuma falha.',
    config: {},
  },
  instant: {
    label: 'Sem latência',
    description: 'Respostas imediatas, útil para navegar rápido.',
    config: { latency: 'none' },
  },
  'slow-network': {
    label: 'Rede lenta',
    description:
      'Todas as respostas levam de 1,8 a 3,5 s (skeletons visíveis).',
    config: { latency: 'slow' },
  },
  'out-of-order': {
    label: 'Respostas fora de ordem',
    description:
      'Respostas antigas chegam depois das novas; a interface deve exibir só a mais recente.',
    config: { latency: 'out-of-order' },
  },
  offline: {
    label: 'Sem conexão',
    description: 'Todas as requisições falham por falta de conexão.',
    config: { offline: true },
  },
  'empty-catalog': {
    label: 'Catálogo vazio',
    description: 'Nenhum NFT cadastrado: buscas e destaques retornam vazio.',
    config: { dataset: 'empty-catalog' },
  },
  'catalog-error': {
    label: 'Falha no catálogo',
    description:
      'A listagem responde HTTP 500 nas 3 primeiras tentativas (vencendo os retries automáticos) e se recupera na nova tentativa do usuário.',
    config: {
      failures: [
        {
          id: 'preset-catalog-error',
          operation: 'nfts.list',
          kind: 'server-error',
          phase: 'before',
          remaining: 3,
        },
      ],
    },
  },
  'short-session': {
    label: 'Sessão curta',
    description:
      'Sessões expiram 60 s após o login: a próxima ação privada pede novo login e retoma o fluxo.',
    config: { sessionTtlSeconds: 60 },
  },
  'server-errors': {
    label: 'Erros no servidor',
    description: 'Todas as requisições respondem HTTP 500 até o cenário mudar.',
    config: {
      failures: [
        {
          id: 'preset-server-errors',
          operation: '*',
          kind: 'server-error',
          phase: 'before',
          remaining: null,
        },
      ],
    },
  },
} satisfies Record<string, ScenarioPreset>

export type PresetId = keyof typeof SCENARIO_PRESETS

export function isPresetId(value: string): value is PresetId {
  return value in SCENARIO_PRESETS
}

export function configFromPreset(
  id: PresetId,
  base: Pick<MockConfig, 'seed' | 'panel'> = DEFAULT_CONFIG,
): MockConfig {
  const preset: ScenarioPreset = SCENARIO_PRESETS[id]
  return {
    ...DEFAULT_CONFIG,
    ...preset.config,
    seed: base.seed,
    panel: base.panel,
    preset: id,
  }
}

type Listener = (config: MockConfig) => void

let current: MockConfig | null = null
const listeners = new Set<Listener>()

function load(): MockConfig {
  const parsed = mockConfigSchema.safeParse(readJson(MOCK_CONFIG_KEY))
  return parsed.success ? parsed.data : DEFAULT_CONFIG
}

export function getMockConfig(): MockConfig {
  current ??= load()
  return current
}

export function setMockConfig(next: MockConfig) {
  current = mockConfigSchema.parse(next)
  writeJson(MOCK_CONFIG_KEY, current)
  for (const listener of listeners) listener(current)
  return current
}

export function updateMockConfig(patch: Partial<MockConfig>) {
  return setMockConfig({ ...getMockConfig(), preset: 'custom', ...patch })
}

export function subscribeMockConfig(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Decrements (or removes) a consumed failure rule. */
export function consumeFailureRule(id: string) {
  const config = getMockConfig()
  const failures = config.failures.flatMap((rule) => {
    if (rule.id !== id || rule.remaining === null) return [rule]
    return rule.remaining > 1
      ? [{ ...rule, remaining: rule.remaining - 1 }]
      : []
  })
  setMockConfig({ ...config, failures })
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== MOCK_CONFIG_KEY) return
    current = null
    const config = getMockConfig()
    for (const listener of listeners) listener(config)
  })
}
