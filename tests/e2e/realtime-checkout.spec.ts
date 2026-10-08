import { expect, test } from '../fixtures'
import { openReview } from './checkout-support'

test.describe('Tempo real durante a compra', () => {
  test('preço muda navegando: aviso, carrinho e resumo atualizados', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.login('nova', '/')
    await app.realtimeReady('nft:golden-beat-207')
    await app.changePrice('golden-beat-207', '1.11', '1-50')
    await expect(
      app.toast(
        'O preço de Golden Beat #207 (edição 1/50) mudou de 0.99 ETH para 1.11 ETH.',
      ),
    ).toBeVisible()

    await page.goto('/carrinho')
    await expect(
      page.getByText(/Preço atualizado \(era\s+0\.99 ETH\)/),
    ).toBeVisible()
    await expect(
      page.locator('section[aria-labelledby="cart-summary-title"]'),
    ).toContainText('12.968 ETH')
  })

  test('preço muda com a revisão aberta: valores atualizados antes de confirmar', async ({
    app,
    page,
  }) => {
    await app.open('/', { scenario: 'slow-settlement' })
    const review = await openReview(app)
    await expect(review).toContainText('12.728 ETH')
    await app.realtimeReady('nft:emerald-ape-042')
    await app.changePrice('emerald-ape-042', '1.5', '1-50')
    await expect(
      review.getByText('Os valores foram atualizados enquanto você revisava.'),
    ).toBeVisible()
    await expect(review).toContainText('13.038 ETH')
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/pedidos\/ord_/)
    const [order] = (await app.db()).orders
    expect(
      order?.items.find((item) => item.nftId === 'emerald-ape-042')
        ?.unitPriceEth,
    ).toBe('1.5')
  })

  test('cotação desatualizada no envio exige nova confirmação', async ({
    app,
    page,
  }) => {
    await app.open('/', { scenario: 'slow-settlement' })
    const review = await openReview(app)
    // The change happens while the socket is down: only the API knows.
    await page.evaluate(() => {
      const mocks = window.__kurioMocks
      mocks?.realtime.disconnectAll()
      mocks?.realtime.changePrice('ivory-baron-088', '3.0', '1-10')
    })
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    const alert = review
      .getByRole('alert')
      .filter({ hasText: 'Os valores mudaram desde a última cotação' })
    await expect(alert).toContainText(
      'O preço de Ivory Baron #088 (edição 1/10) mudou de 2.685 ETH para 3.00 ETH.',
    )
    await expect(review).toContainText('13.358 ETH')
    expect((await app.db()).orders).toHaveLength(0)

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/pedidos\/ord_/)
    expect((await app.db()).orders[0]?.totalEth).toBe('13.358')
  })

  test('edição esgota durante o checkout e bloqueia a confirmação', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.login('nova', '/pagamento')
    await expect(
      page.getByRole('button', { name: 'Confirmar compra' }),
    ).toBeEnabled()
    await app.realtimeReady('nft:violet-nomad-314')
    await app.setAvailability('violet-nomad-314', 0, '1-1')
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'Violet Nomad #314 (edição 1/1) esgotou' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Confirmar compra' }),
    ).toBeDisabled()
    await page.getByRole('link', { name: 'Ajustar no carrinho' }).click()
    await page
      .getByRole('button', {
        name: 'Remover Violet Nomad #314 (edição 1/1) do carrinho',
      })
      .click()
    await expect(
      page.getByRole('link', { name: 'Conectar e finalizar' }),
    ).toBeVisible()
  })
})
