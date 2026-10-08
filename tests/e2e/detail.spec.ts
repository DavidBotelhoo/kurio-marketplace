import { expect, test } from '../fixtures'

test.describe('Detalhe do NFT', () => {
  test('acesso direto, edição esgotada e limite de quantidade', async ({
    app,
    page,
  }) => {
    await app.open('/nfts/emerald-ape-042')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' }),
    ).toBeVisible()
    await expect(page).toHaveTitle('Emerald Ape #042 | Kurio')
    await expect(page.getByRole('radio', { name: '1/50' })).toBeChecked()

    // Edition 1/10: 2 per order (API limits); the stepper stops there.
    await page
      .locator('label')
      .filter({ hasText: /^1\/10$/ })
      .click()
    await expect(page).toHaveURL(/edition=1-10/)
    await expect(
      page.getByText('Restam 2 de 10 · até 2 por pedido.'),
    ).toBeVisible()
    const plus = page.getByRole('button', { name: 'Aumentar quantidade' })
    await plus.click()
    await expect(page.locator('output').first()).toHaveText('2')
    await expect(plus).toBeDisabled()

    // The edition sells out while the page is open (Socket.IO event).
    await app.realtimeReady('nft:emerald-ape-042')
    await app.setAvailability('emerald-ape-042', 0, '1-10')
    await expect(
      page.getByText('Edição esgotada. Escolha outra edição para comprar.'),
    ).toBeVisible()
    await expect(
      page.getByRole('radio', { name: '1/10 (esgotada)' }),
    ).toBeChecked()
    await expect(page.getByRole('button', { name: /Esgotado/ })).toBeDisabled()

    // A direct link to that edition shows the same state after a reload.
    await page.reload()
    await expect(
      page.getByRole('radio', { name: '1/10 (esgotada)' }),
    ).toBeChecked()
  })

  test('NFT inexistente', async ({ app, page }) => {
    await app.open('/nfts/nao-existe')
    await expect(
      page.getByRole('heading', { name: 'NFT não encontrado' }),
    ).toBeVisible()
    await expect(page).toHaveTitle('NFT não encontrado | Kurio')
    await page.getByRole('link', { name: 'Explorar o mercado' }).click()
    await expect(page).toHaveURL(/#mercado/)
  })
})
