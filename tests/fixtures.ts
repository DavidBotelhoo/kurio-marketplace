import { expect, type Locator, type Page, test as base } from '@playwright/test'

import type { FailureKind, MockConfig, PresetId } from '../src/mocks/config'
// Brings the window.__kurioMocks typing (global augmentation).
import type {} from '../src/mocks/browser'

/** Fictitious accounts seeded by the mock API (see README). */
export const USERS = {
  nova: {
    email: 'nova@kurio.test',
    password: 'Kurio@2026',
    name: 'Nova Ribeiro',
  },
  david: {
    email: 'david@kurio.test',
    password: 'Kurio@2026',
    name: 'David Dev',
  },
} as const

export type UserKey = keyof typeof USERS

/**
 * Test driver: opens screens in a known mock scenario and controls the
 * mock API (latency, failures, realtime events, orders) through
 * window.__kurioMocks. REST still goes through the MSW handlers and events
 * through the Socket.IO client: nothing here touches the app's state.
 */
export class App {
  readonly page: Page
  readonly mobile: boolean

  constructor(page: Page, mobile: boolean) {
    this.page = page
    this.mobile = mobile
  }

  /** Opens `path` with fresh seed data in `scenario` (panel hidden). */
  async open(
    path = '/',
    {
      scenario = 'instant',
      reset = true,
    }: { scenario?: PresetId; reset?: boolean } = {},
  ) {
    const url = new URL(path, 'http://app')
    url.searchParams.set('mock-scenario', scenario)
    if (reset) url.searchParams.set('mock-reset', '1')
    url.searchParams.set('mock-panel', '0')
    await this.page.goto(`${url.pathname}${url.search}${url.hash}`)
    await this.page.waitForFunction(() => window.__kurioMocks !== undefined)
  }

  /** Form of the login and sign-up screens (dialog on desktop, page on mobile). */
  authForm(): Locator {
    return this.mobile
      ? this.page.getByRole('main')
      : this.page.getByRole('dialog')
  }

  /** Signs in through the login screen and waits for the redirect. */
  async login(user: UserKey = 'nova', redirect = '/') {
    await this.page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
    const form = this.authForm()
    await form
      .getByRole('textbox', { name: 'E-mail', exact: true })
      .fill(USERS[user].email)
    await form.getByLabel('Senha', { exact: true }).fill(USERS[user].password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    const target = new URL(redirect, 'http://app').pathname
    await this.page.waitForURL((url) => url.pathname === target)
  }

  async logout() {
    if (this.mobile) {
      await this.page.goto('/perfil')
      await this.page
        .getByRole('navigation', { name: 'Seções do perfil' })
        .getByRole('button', { name: 'Sair' })
        .click()
    } else {
      await this.page
        .getByRole('banner')
        .getByRole('button', { name: /^Conta de/ })
        .click()
      await this.page.getByRole('menuitem', { name: 'Sair' }).click()
    }
    await expect(this.toast('Você saiu da sua conta.')).toBeVisible()
  }

  toast(text: string | RegExp): Locator {
    return this.page
      .locator('[data-sonner-toast]')
      .filter({ hasText: text })
      .last()
  }

  /**
   * Cart link of the header. Mobile screens hide the header (and some hide
   * the tab bar too), but its accessible name still reflects the count.
   */
  cartLink(): Locator {
    return this.page.locator('header a[href="/carrinho"]')
  }

  /* ---------------------------------------------------------------------
   * Mock API controls
   * ------------------------------------------------------------------- */

  async config(patch: Partial<MockConfig>) {
    await this.page.evaluate((value) => {
      window.__kurioMocks?.updateConfig(value)
    }, patch)
  }

  /** Makes the next `remaining` requests of `operation` fail. */
  async fail(
    operation: string,
    {
      kind = 'server-error',
      phase = 'before',
      remaining = 1,
    }: {
      kind?: FailureKind
      phase?: 'before' | 'after'
      remaining?: number | null
    } = {},
  ) {
    await this.config({
      failures: [
        { id: `test-${operation}`, operation, kind, phase, remaining },
      ],
    })
  }

  async changePrice(nftId: string, priceEth: string, editionId?: string) {
    await this.page.evaluate(
      ([id, price, edition]) => {
        window.__kurioMocks?.realtime.changePrice(id, price, edition)
      },
      [nftId, priceEth, editionId] as const,
    )
  }

  async setAvailability(nftId: string, available: number, editionId?: string) {
    await this.page.evaluate(
      ([id, units, edition]) => {
        window.__kurioMocks?.realtime.setAvailability(id, units, edition)
      },
      [nftId, available, editionId] as const,
    )
  }

  /** Waits until the realtime client is connected (and subscribed). */
  async realtimeReady(topic?: string) {
    await this.page.waitForFunction((name) => {
      const realtime = window.__kurioMocks?.realtime
      if (!realtime || realtime.connections() === 0) return false
      return name ? realtime.connectionTopics().flat().includes(name) : true
    }, topic)
  }

  async settleOrders() {
    await this.page.evaluate(() => window.__kurioMocks?.orders.settleNow())
  }

  /** Current mock database (read-only copy); waits for the mock API after reloads. */
  async db() {
    await this.page.waitForFunction(() => window.__kurioMocks !== undefined)
    return this.page.evaluate(() => {
      const api = window.__kurioMocks
      if (!api) throw new Error('Mock API not started')
      return api.snapshot()
    })
  }
}

export const test = base.extend<{ app: App }>({
  app: async ({ page, isMobile }, provide) => {
    await provide(new App(page, isMobile))
  },
})

export { expect }
