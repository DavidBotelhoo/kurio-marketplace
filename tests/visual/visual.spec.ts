import type { Page } from '@playwright/test'

import { expect, test } from '../fixtures'

/*
 * Visual regression of the Figma screens with seeded, deterministic data.
 * Baselines are versioned per project and platform (see README to update).
 */
test.use({ reducedMotion: 'reduce' })

/** Waits for fonts and every image (lazy ones included) and hides toasts. */
async function stabilize(page: Page) {
  await page.addStyleTag({
    content:
      '[data-sonner-toaster]{display:none!important}*{caret-color:transparent!important}',
  })
  await page.evaluate(async () => {
    for (const image of Array.from(document.images)) image.loading = 'eager'
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true })
              image.addEventListener('error', resolve, { once: true })
            }),
      ),
    )
  })
  await page.waitForLoadState('networkidle')
}

test.describe('Regressão visual', () => {
  test('início', async ({ app, page }) => {
    await app.open('/')
    await expect(page.locator('#mercado article').first()).toBeVisible()
    await stabilize(page)
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('detalhe do NFT', async ({ app, page }) => {
    await app.open('/nfts/emerald-ape-042')
    await expect(
      page.getByRole('heading', { name: 'Mais desta coleção' }),
    ).toBeVisible()
    await expect(
      page.locator('section[aria-labelledby="related-title"] article').first(),
    ).toBeVisible()
    await stabilize(page)
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('carrinho', async ({ app, page }) => {
    await app.open('/')
    await app.login('nova', '/carrinho')
    // The table also has a "Total" column: wait for the summary's own total.
    await expect(
      page
        .getByRole('region', { name: 'Resumo da carteira' })
        .getByText('Total', { exact: true }),
    ).toBeVisible()
    await stabilize(page)
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('pagamento', async ({ app, page }) => {
    await app.open('/')
    await app.login('nova', '/pagamento')
    await expect(
      page.getByRole('button', { name: 'Confirmar compra' }),
    ).toBeEnabled()
    await stabilize(page)
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
  })
})
