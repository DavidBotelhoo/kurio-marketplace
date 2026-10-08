import { expect, test } from '../fixtures'
import { openReview, orderIdFromUrl } from './checkout-support'

test.describe('Pagamento: falhas e recuperação', () => {
  test('pagamento recusado preserva o carrinho', async ({ app, page }) => {
    await app.open('/', { scenario: 'payment-declined' })
    const before = (await app.db()).carts.find(
      (cart) => cart.owner === 'user:usr_nova',
    )?.lines
    const review = await openReview(app)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(
      page.getByRole('heading', { name: 'Processando seu pagamento' }),
    ).toBeVisible()
    await app.realtimeReady(`order:${orderIdFromUrl(page.url())}`)
    await app.settleOrders()

    await expect(
      page.getByRole('heading', { name: 'Pagamento recusado' }),
    ).toBeVisible()
    await expect(
      page.getByText('Seus NFTs agora estão na sua carteira'),
    ).toHaveCount(0)
    const after = (await app.db()).carts.find(
      (cart) => cart.owner === 'user:usr_nova',
    )?.lines
    expect(after).toEqual(before)
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(app.cartLink()).toHaveAttribute(
      'aria-label',
      'Carrinho, 6 itens',
    )
  })

  test('clique repetido cria um único pedido', async ({ app, page }) => {
    await app.open('/', { scenario: 'slow-settlement' })
    await app.config({ latency: 'fast' })
    const review = await openReview(app)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).dblclick()
    await review
      .getByRole('button', { name: /Enviando|Confirmar e pagar/ })
      .click({ force: true })
      .catch(() => undefined)
    await expect(page).toHaveURL(/\/pedidos\/ord_/)
    expect((await app.db()).orders).toHaveLength(1)
  })

  test('timeout após criar o pedido recupera o mesmo pedido @desktop', async ({
    app,
    page,
  }) => {
    test.slow()
    await app.open('/', { scenario: 'order-timeout' })
    await app.config({ settlementSeconds: 120 })
    const review = await openReview(app)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(review.getByText(/Enviando o pedido/)).toBeVisible()

    // The first answer is lost (timeout); the retry reuses the idempotency key.
    await expect(page).toHaveURL(/\/pedidos\/ord_/, { timeout: 40_000 })
    const db = await app.db()
    expect(db.orders).toHaveLength(1)
    expect(db.orders[0]?.id).toBe(orderIdFromUrl(page.url()))
  })
})
