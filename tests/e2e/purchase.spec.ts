import { expect, test } from '../fixtures'

test.describe('Compra completa', () => {
  test('do catálogo ao recibo confirmado', async ({ app, page }) => {
    await app.open('/')

    // Catalog → detail → buy (visitor cart).
    await page
      .locator('#mercado article')
      .filter({ hasText: 'Sage Nomad #009' })
      .getByRole('link')
      .first()
      .click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Sage Nomad #009' }),
    ).toBeVisible()
    await page
      .getByRole('button', {
        name: app.mobile ? 'Comprar NFT' : 'Comprar',
        exact: true,
      })
      .click()
    await expect(page).toHaveURL('/carrinho')

    // Checkout needs a session: the login brings the visitor back.
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
    const form = app.authForm()
    await form
      .getByRole('textbox', { name: 'E-mail', exact: true })
      .fill('david@kurio.test')
    await form.getByLabel('Senha', { exact: true }).fill('Kurio@2026')
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL('/pagamento')

    // David has no wallet: collector data typed by hand.
    const field = (label: string) =>
      page.locator('main form').getByLabel(new RegExp(`^${label}`))
    await field('Rede').selectOption('ethereum')
    await field('Nome do perfil').fill('Coleção do David')
    await field('Endereço da carteira').fill(`0x${'ab'.repeat(20)}`)
    await field('Tipo de carteira').selectOption('metamask')
    await field('Código de indicação').fill('KURIO-DEV')
    await field('Nome ENS').fill('david.dev')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    // Wallet connection, then the review with the API quote.
    const review = page.getByRole('dialog', { name: 'Revise sua compra' })
    await expect(review).toBeVisible()
    await expect(review).toContainText('Sage Nomad #009 (edição 1/50) × 1')
    await expect(review).toContainText('MetaMask · 0xABAB…ABAB')
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Pending until the simulated payment settles; the receipt only then.
    await expect(page).toHaveURL(/\/pedidos\/ord_/)
    await expect(
      page.getByRole('heading', { name: 'Processando seu pagamento' }),
    ).toBeVisible()
    const orderId = new URL(page.url()).pathname.split('/').pop() ?? ''
    await app.realtimeReady(`order:${orderId}`)
    await app.settleOrders()
    await expect(
      page.getByRole('heading', {
        name: 'Seus NFTs agora estão na sua carteira',
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Ver no Etherscan/ }),
    ).toHaveAttribute('href', /^https:\/\/etherscan\.io\/tx\/0x[0-9a-f]{64}$/)

    // The API removed the purchased units: stock and cart.
    const db = await app.db()
    expect(db.orders.find((order) => order.id === orderId)?.status).toBe(
      'confirmed',
    )
    expect(
      db.carts.find((cart) => cart.owner === 'user:usr_david')?.lines,
    ).toEqual([])
    await expect(app.cartLink()).toHaveAttribute('aria-label', 'Carrinho')
  })
})
