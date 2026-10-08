/*
 * Runs the Lighthouse audit set up in lighthouse.config.ts and writes the
 * HTML/JSON reports, the median of each category and metric, and the run
 * conditions to docs/lighthouse. Expects a fresh build in dist/
 * (`pnpm audit:lighthouse` builds first).
 *
 * Browser: CHROME_PATH when set, otherwise Playwright's Chrome for Testing
 * (`pnpm exec playwright install chromium`).
 */
import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse, { type Result } from 'lighthouse'

import {
  type AuditPage,
  type AuditProfile,
  lighthouseAudit,
} from '../lighthouse.config.ts'

type CategoryId = keyof typeof lighthouseAudit.targets

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'performance', label: 'Performance' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'seo', label: 'SEO' },
]

const METRICS = [
  { id: 'largest-contentful-paint', label: 'LCP', kind: 'seconds' },
  { id: 'cumulative-layout-shift', label: 'CLS', kind: 'unitless' },
  { id: 'total-blocking-time', label: 'TBT', kind: 'ms' },
  { id: 'first-contentful-paint', label: 'FCP', kind: 'seconds' },
  { id: 'speed-index', label: 'Speed Index', kind: 'seconds' },
] as const

type MetricId = (typeof METRICS)[number]['id']

interface RunSummary {
  run: number
  scores: Record<CategoryId, number>
  metrics: Record<MetricId, number>
  benchmarkIndex: number
  reports: { html: string; json: string }
}

interface Measurement {
  page: AuditPage
  profile: AuditProfile
  runs: RunSummary[]
  median: Pick<RunSummary, 'scores' | 'metrics'>
  /** Run whose performance score is the median (its report is linked). */
  representativeRun: number
  conditions: Pick<
    Result['configSettings'],
    'formFactor' | 'screenEmulation' | 'throttlingMethod' | 'throttling'
  >
}

const { port, runsPerPage, outputDir, pages, profiles, chromeFlags, targets } =
  lighthouseAudit
const baseUrl = `http://localhost:${String(port)}`
const lighthouseVersion = (
  createRequire(import.meta.url)('lighthouse/package.json') as {
    version: string
  }
).version

function median(values: number[]) {
  const sorted = values.toSorted((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const upper = sorted[middle] ?? Number.NaN
  if (sorted.length % 2 === 1) return upper
  return ((sorted[middle - 1] ?? Number.NaN) + upper) / 2
}

function command(file: string, args: string[]) {
  try {
    return execFileSync(file, args, { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function resolveChromePath() {
  const chromePath = process.env.CHROME_PATH ?? chromium.executablePath()
  if (!existsSync(chromePath)) {
    throw new Error(
      `Chrome not found at ${chromePath}. Run "pnpm exec playwright install chromium" or set CHROME_PATH.`,
    )
  }
  return chromePath
}

async function startPreviewServer() {
  if (!existsSync('dist/index.html')) {
    throw new Error('dist/ not found. Run "pnpm build" first.')
  }
  const server = spawn(
    process.execPath,
    [
      path.resolve('node_modules/vite/bin/vite.js'),
      'preview',
      '--port',
      String(port),
      '--strictPort',
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  )
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) break
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return server
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  server.kill()
  throw new Error(`vite preview did not start on ${baseUrl}`)
}

function readRun(lhr: Result, run: number, reports: RunSummary['reports']) {
  if (lhr.runtimeError) {
    throw new Error(
      `Lighthouse failed on ${lhr.finalDisplayedUrl}: ${lhr.runtimeError.message}`,
    )
  }
  const scores = {} as Record<CategoryId, number>
  for (const { id } of CATEGORIES) {
    const score = lhr.categories[id]?.score
    if (score == null) throw new Error(`Category "${id}" has no score`)
    scores[id] = Math.round(score * 100)
  }
  const metrics = {} as Record<MetricId, number>
  for (const { id } of METRICS) {
    const value = lhr.audits[id]?.numericValue
    if (value === undefined) throw new Error(`Metric "${id}" has no value`)
    metrics[id] = value
  }
  return {
    run,
    scores,
    metrics,
    benchmarkIndex: lhr.environment.benchmarkIndex,
    reports,
  } satisfies RunSummary
}

async function audit(
  chromePath: string,
  page: AuditPage,
  profile: AuditProfile,
  run: number,
) {
  const chrome = await launch({ chromePath, chromeFlags, logLevel: 'silent' })
  try {
    const result = await lighthouse(
      `${baseUrl}${page.path}`,
      { port: chrome.port, output: ['html', 'json'], logLevel: 'error' },
      profile.config,
    )
    if (!result || !Array.isArray(result.report)) {
      throw new Error(`Lighthouse returned no report for ${page.path}`)
    }
    const [html = '', json = ''] = result.report
    const name = `${profile.id}/${page.id}-${String(run)}.report`
    const reports = { html: `${name}.html`, json: `${name}.json` }
    await writeFile(path.join(outputDir, reports.html), html)
    await writeFile(path.join(outputDir, reports.json), json)
    return { summary: readRun(result.lhr, run, reports), lhr: result.lhr }
  } finally {
    chrome.kill()
  }
}

async function measure(
  chromePath: string,
  page: AuditPage,
  profile: AuditProfile,
) {
  const runs: RunSummary[] = []
  let conditions: Measurement['conditions'] | undefined
  for (let run = 1; run <= runsPerPage; run += 1) {
    const { summary, lhr } = await audit(chromePath, page, profile, run)
    runs.push(summary)
    const { formFactor, screenEmulation, throttlingMethod, throttling } =
      lhr.configSettings
    conditions = { formFactor, screenEmulation, throttlingMethod, throttling }
    console.log(
      `[${profile.id}] ${page.label} ${String(run)}/${String(runsPerPage)}: ` +
        CATEGORIES.map(({ id }) => `${id} ${String(summary.scores[id])}`).join(
          ' · ',
        ),
    )
  }
  if (!conditions) throw new Error('No runs configured')

  const medianScores = {} as Record<CategoryId, number>
  for (const { id } of CATEGORIES) {
    medianScores[id] = median(runs.map((run) => run.scores[id]))
  }
  const medianMetrics = {} as Record<MetricId, number>
  for (const { id } of METRICS) {
    medianMetrics[id] = median(runs.map((run) => run.metrics[id]))
  }
  const representative =
    runs.find((run) => run.scores.performance === medianScores.performance) ??
    runs[0]

  return {
    page,
    profile,
    runs,
    median: { scores: medianScores, metrics: medianMetrics },
    representativeRun: representative?.run ?? 1,
    conditions,
  } satisfies Measurement
}

const number = (digits: number) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

function formatMetric(id: MetricId, value: number) {
  const kind = METRICS.find((metric) => metric.id === id)?.kind
  if (kind === 'seconds') return `${number(1).format(value / 1000)} s`
  if (kind === 'ms') return `${number(0).format(value)} ms`
  return number(3).format(value)
}

function formatScore(id: CategoryId, score: number) {
  return score >= targets[id] ? String(score) : `**${String(score)}** ⚠️`
}

function formatConditions({
  formFactor,
  screenEmulation,
  throttlingMethod,
  throttling,
}: Measurement['conditions']) {
  const screen = `${String(screenEmulation.width)}×${String(screenEmulation.height)} @${String(screenEmulation.deviceScaleFactor)}x`
  return [
    formFactor,
    screen,
    throttlingMethod,
    `${String(throttling.rttMs)} ms`,
    `${number(1).format(throttling.throughputKbps / 1024)} Mbps`,
    `${String(throttling.cpuSlowdownMultiplier)}×`,
  ]
}

function table(header: string[], rows: string[][]) {
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}

function environment(chromePath: string, measurements: Measurement[]) {
  const cpus = os.cpus()
  const macOs =
    process.platform === 'darwin'
      ? command('sw_vers', ['-productVersion'])
      : null
  const commit = command('git', ['rev-parse', '--short', 'HEAD'])
  const dirty = Boolean(command('git', ['status', '--porcelain']))
  const allRuns = measurements.flatMap((measurement) => measurement.runs)
  return {
    date: new Date().toISOString(),
    commit: commit
      ? `${commit}${dirty ? ' (com alterações locais)' : ''}`
      : '—',
    lighthouse: `${lighthouseVersion} (API Node, chrome-launcher)`,
    browser: `${command(chromePath, ['--version']) ?? chromePath} (--headless=new)`,
    browserSource: process.env.CHROME_PATH
      ? 'CHROME_PATH'
      : 'Playwright (Chrome for Testing)',
    node: process.version,
    os: macOs
      ? `macOS ${macOs} (${os.arch()})`
      : `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: `${cpus[0]?.model ?? '?'} (${String(cpus.length)} núcleos)`,
    memory: `${String(Math.round(os.totalmem() / 2 ** 30))} GB`,
    benchmarkIndex: Math.round(
      median(allRuns.map((run) => run.benchmarkIndex)),
    ),
  }
}

function renderMarkdown(
  env: ReturnType<typeof environment>,
  measurements: Measurement[],
) {
  const reportLinks = (reports: RunSummary['reports']) =>
    `[HTML](${reports.html}) · [JSON](${reports.json})`

  const medians = table(
    [
      'Página',
      'Perfil',
      ...CATEGORIES.map((category) => category.label),
      'LCP',
      'CLS',
      'TBT',
      'Relatório (execução mediana)',
    ],
    measurements.map(({ page, profile, median, runs, representativeRun }) => {
      const representative = runs.find((run) => run.run === representativeRun)
      return [
        page.label,
        profile.label,
        ...CATEGORIES.map(({ id }) => formatScore(id, median.scores[id])),
        ...(
          [
            'largest-contentful-paint',
            'cumulative-layout-shift',
            'total-blocking-time',
          ] as const
        ).map((id) => formatMetric(id, median.metrics[id])),
        representative ? reportLinks(representative.reports) : '—',
      ]
    }),
  )

  const runs = measurements
    .map(({ page, profile, runs: pageRuns }) =>
      [
        `### ${page.label} · ${profile.label}`,
        '',
        table(
          [
            'Execução',
            ...CATEGORIES.map((category) => category.label),
            ...METRICS.map((metric) => metric.label),
            'Relatórios',
          ],
          pageRuns.map((run) => [
            String(run.run),
            ...CATEGORIES.map(({ id }) => String(run.scores[id])),
            ...METRICS.map(({ id }) => formatMetric(id, run.metrics[id])),
            reportLinks(run.reports),
          ]),
        ),
      ].join('\n'),
    )
    .join('\n\n')

  const conditions = table(
    [
      'Perfil',
      'Form factor',
      'Tela emulada',
      'Throttling',
      'RTT',
      'Download',
      'CPU',
    ],
    profiles.map((profile) => {
      const measurement = measurements.find(
        (item) => item.profile.id === profile.id,
      )
      return [
        profile.label,
        ...(measurement ? formatConditions(measurement.conditions) : []),
      ]
    }),
  )

  const pageList = pages
    .map((page) => `- ${page.label}: \`${page.path}\``)
    .join('\n')
  const targetList = CATEGORIES.map(
    ({ id, label }) => `${label} ≥ ${String(targets[id])}`,
  ).join(' · ')

  return `# Auditoria Lighthouse

> Gerado por \`pnpm audit:lighthouse\` (configuração em [lighthouse.config.ts](../../lighthouse.config.ts)). Não edite à mão: a próxima execução sobrescreve esta pasta.

Mediana de ${String(runsPerPage)} execuções por página e perfil. Metas: ${targetList}. Valores abaixo da meta aparecem em **negrito** com ⚠️.

${medians}

Os relatórios HTML abrem direto no navegador; os JSON podem ser carregados no [Lighthouse Viewer](https://googlechrome.github.io/lighthouse/viewer/).

## Ambiente

- Data: ${env.date}
- Commit: ${env.commit}
- Lighthouse: ${env.lighthouse}
- Navegador: ${env.browser}, via ${env.browserSource}
- Node.js: ${env.node}
- Sistema: ${env.os}
- CPU: ${env.cpu}, memória ${env.memory}
- BenchmarkIndex do Lighthouse (mediana): ${String(env.benchmarkIndex)}

## Condições de execução

- Build de produção (\`vite build\`) servido por \`vite preview\` (gzip) em \`${baseUrl}\`, com o fallback de SPA.
- API simulada com o cenário padrão: MSW (service worker), Socket.IO simulado e painel de controle dos mocks, como na versão publicada.
- Execuções sequenciais, cada uma em um perfil novo do Chrome: sem cache, storage ou service worker de execuções anteriores.
- Presets do próprio Lighthouse, sem ajustes:

${conditions}

Páginas auditadas:

${pageList}

## Execuções

${runs}

## Como reproduzir

\`\`\`sh
pnpm exec playwright install chromium   # Chrome for Testing usado pelo Playwright
pnpm audit:lighthouse                   # build + ${String(runsPerPage * pages.length * profiles.length)} execuções (alguns minutos)
\`\`\`

Para outro navegador baseado em Chromium, defina \`CHROME_PATH\`. Os números variam com a máquina (veja o BenchmarkIndex): compare execuções feitas no mesmo ambiente.
`
}

async function main() {
  const chromePath = resolveChromePath()
  await rm(outputDir, { recursive: true, force: true })
  for (const profile of profiles) {
    await mkdir(path.join(outputDir, profile.id), { recursive: true })
  }

  let server: ChildProcess | undefined
  const measurements: Measurement[] = []
  try {
    server = await startPreviewServer()
    for (const profile of profiles) {
      for (const page of pages) {
        measurements.push(await measure(chromePath, page, profile))
      }
    }
  } finally {
    server?.kill()
  }

  const env = environment(chromePath, measurements)
  await writeFile(
    path.join(outputDir, 'summary.json'),
    `${JSON.stringify(
      {
        environment: env,
        targets,
        measurements: measurements.map(({ page, profile, ...rest }) => ({
          page,
          profile: { id: profile.id, label: profile.label },
          ...rest,
        })),
      },
      null,
      2,
    )}\n`,
  )
  await writeFile(
    path.join(outputDir, 'README.md'),
    renderMarkdown(env, measurements),
  )

  console.table(
    measurements.map(({ page, profile, median }) => ({
      page: page.label,
      profile: profile.label,
      ...median.scores,
      LCP: formatMetric(
        'largest-contentful-paint',
        median.metrics['largest-contentful-paint'],
      ),
      CLS: formatMetric(
        'cumulative-layout-shift',
        median.metrics['cumulative-layout-shift'],
      ),
      TBT: formatMetric(
        'total-blocking-time',
        median.metrics['total-blocking-time'],
      ),
    })),
  )
  console.log(`Reports: ${path.join(outputDir, 'README.md')}`)
}

await main()
