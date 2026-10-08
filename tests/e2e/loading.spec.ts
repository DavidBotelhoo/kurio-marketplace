import type { Page } from '@playwright/test'

import { expect, test } from '../fixtures'

const names = (page: Page) =>
  page.locator('#mercado article h3').allTextContents()

test.describe('Carregamento, falha e nova tentativa', () => {
  test('skeletons durante a rede lenta (catálogo, detalhe e resumo do carrinho)', async ({
    app,
    page,
  }) => {
    await app.open('/', { scenario: 'slow-network' })
    // Catalog: shimmer placeholders keep the grid size until data arrives.
    await expect(
      page
        .locator('#mercado ul[aria-hidden="true"] [data-slot="skeleton"]')
        .first(),
    ).toBeVisible()
    await expect(page.locator('#mercado article').first()).toBeVisible({
      timeout: 15_000,
    })

    // Detail: the route shows its skeleton while the loader waits.
    await page.locator('#mercado article a').first().click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Carregando NFT…' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    })

    // Cart summary: skeleton while the quote is priced.
    await app.login('nova', '/carrinho')
    await expect(page.getByText('Calculando o total…')).toBeAttached({
      timeout: 15_000,
    })
    await expect(page.getByText('Total', { exact: true })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('falha no catálogo após os retries e recuperação na nova tentativa', async ({
    app,
    page,
  }) => {
    await app.open('/', { scenario: 'catalog-error' })
    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar o catálogo' })
    await expect(alert).toBeVisible({ timeout: 20_000 })
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.locator('#mercado article').first()).toBeVisible()
  })

  test('falha da cotação no carrinho e recálculo', async ({ app, page }) => {
    await app.open('/')
    await app.fail('cart.quote', { remaining: 4 })
    await app.login('nova', '/carrinho')
    const recalc = page.getByRole('button', { name: 'Calcular novamente' })
    await expect(recalc).toBeVisible({ timeout: 20_000 })
    await recalc.click()
    await expect(page.getByText('Total', { exact: true })).toBeVisible()
  })

  test('respostas fora de ordem: só os parâmetros atuais aparecem @desktop', async ({
    app,
    page,
  }) => {
    await app.open('/', { scenario: 'out-of-order' })
    await expect(page.locator('#mercado article').first()).toBeVisible()
    // The first (slow) answer arrives after the second (fast) one.
    await page
      .getByRole('checkbox', { name: /^Fotografia/ })
      .check({ force: true })
    await page.getByRole('checkbox', { name: /^Música/ }).check({ force: true })
    await expect(page).toHaveURL(/categories=fotografia&categories=musica/)
    const expected = await page.evaluate(async () => {
      const response = await fetch(
        '/api/nfts?categories=fotografia&categories=musica',
      )
      const body = (await response.json()) as { items: { name: string }[] }
      return body.items.map((item) => item.name)
    })
    await page.waitForTimeout(2_000)
    expect(await names(page)).toEqual(expected)
  })
})
