import { expect, test } from '../fixtures'
import { openReview, orderIdFromUrl } from './checkout-support'

test.describe('Tempo real: robustez', () => {
  test('eventos duplicados ou antigos não regridem o estado', async ({
    app,
    page,
  }) => {
    await app.open('/nfts/emerald-ape-042')
    await app.realtimeReady('nft:emerald-ape-042')
    await app.changePrice('emerald-ape-042', '1.30', '1-50')
    await app.changePrice('emerald-ape-042', '1.40', '1-50')
    const price = app.mobile
      ? page.getByText(/Total de 1 unidade/).locator('..')
      : page.locator('main p').filter({ hasText: /ETH$/ }).first()
    await expect(price).toContainText('1.40 ETH')

    // Same event again (same id) and an older version (new id).
    await page.evaluate(() => {
      window.__kurioMocks?.realtime.resendLast()
      window.__kurioMocks?.realtime.sendStale()
    })
    await page.waitForTimeout(500)
    await expect(price).toContainText('1.40 ETH')
    await expect(price).not.toContainText('1.30')
  })

  test('desconexão: aviso, reconexão e reconciliação com a API', async ({
    app,
    page,
  }) => {
    await app.open('/nfts/emerald-ape-042')
    await app.realtimeReady('nft:emerald-ape-042')
    // The event of this change is lost while the socket is down.
    await page.evaluate(() => {
      window.__kurioMocks?.realtime.disconnectAll()
      window.__kurioMocks?.realtime.changePrice(
        'emerald-ape-042',
        '2.22',
        '1-50',
      )
    })
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Conexão em tempo real interrompida' }),
    ).toBeVisible()
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Conexão em tempo real restabelecida.' }),
    ).toBeVisible({ timeout: 15_000 })
    // After reconnecting, active queries are read again from REST.
    await expect(page.locator('main')).toContainText('2.22 ETH')
  })

  test('pedido pendente retomado após recarregar e reconectar, sem nova compra', async ({
    app,
    page,
  }) => {
    await app.open('/', { scenario: 'slow-settlement' })
    const review = await openReview(app)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(
      page.getByRole('heading', { name: 'Processando seu pagamento' }),
    ).toBeVisible()
    const orderId = orderIdFromUrl(page.url())

    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Processando seu pagamento' }),
    ).toBeVisible()
    await app.realtimeReady(`order:${orderId}`)
    // Settles while disconnected: the client recovers it from REST.
    await page.evaluate(async () => {
      window.__kurioMocks?.realtime.disconnectAll()
      await window.__kurioMocks?.orders.settleNow()
    })
    await expect(
      page.getByRole('heading', {
        name: 'Seus NFTs agora estão na sua carteira',
      }),
    ).toBeVisible({ timeout: 15_000 })
    expect((await app.db()).orders).toHaveLength(1)

    // Terminal: a later event cannot change it.
    await page.evaluate(() => window.__kurioMocks?.realtime.resendLast())
    await expect(
      page.getByRole('heading', {
        name: 'Seus NFTs agora estão na sua carteira',
      }),
    ).toBeVisible()
  })
})
