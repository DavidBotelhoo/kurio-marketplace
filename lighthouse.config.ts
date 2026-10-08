import { type Config, desktopConfig } from 'lighthouse'

/*
 * Lighthouse audit of the production build (`pnpm audit:lighthouse`).
 *
 * Pages × profiles × runs are audited one at a time, each in a new Chrome
 * profile (no cache, storage or service worker from a previous run), against
 * `vite preview` serving dist/ with the default mock scenario: the same
 * bundle, images, fonts, MSW worker, Socket.IO mock and control panel as the
 * published demo. Profiles are Lighthouse's own presets, unchanged.
 */

export interface AuditPage {
  id: string
  label: string
  path: string
}

export interface AuditProfile {
  id: 'mobile' | 'desktop'
  label: string
  config: Config
}

export const lighthouseAudit = {
  /** Port of the `vite preview` server started for the audit. */
  port: 4174,
  runsPerPage: 3,
  /** Reports, medians and run conditions (versioned). */
  outputDir: 'docs/lighthouse',
  pages: [
    { id: 'home', label: 'Início', path: '/' },
    {
      id: 'nft-detail',
      label: 'Detalhe do NFT',
      path: '/nfts/emerald-ape-042',
    },
  ] satisfies AuditPage[],
  profiles: [
    {
      id: 'mobile',
      label: 'Mobile',
      config: { extends: 'lighthouse:default' },
    },
    {
      id: 'desktop',
      label: 'Desktop',
      config: desktopConfig,
    },
  ] satisfies AuditProfile[],
  chromeFlags: [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
  ],
  /** Targets from the challenge (median score per category, 0–100). */
  targets: {
    performance: 90,
    accessibility: 95,
    'best-practices': 95,
    seo: 90,
  },
}
