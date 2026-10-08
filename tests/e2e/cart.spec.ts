import type { Page } from '@playwright/test'

import { expect, test } from '../fixtures'

const summary = (page: Page) =>
  page.locator('section[aria-labelledby="cart-summary-title"] dl')

/** Quote computed by the API for the signed-in collector right now. */
const apiTotal = (page: Page) =>
  page.evaluate(async () => {
    const session = JSON.parse(
      localStorage.getItem('kurio.session') ?? 'null',
    ) as {
      token: string
    } | null
    const response = await fetch('/api/cart/quote', {
      method: 'POST',
      headers: session ? { Authorization: `Bearer ${session.token}` } : {},
    })
    const quote = (await response.json()) as { totalEth: string }
    return quote.totalEth
  })

test.describe('Carrinho', () => {
  test('quantidades, remoção com desfazer e resumo da API', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.login('nova', '/carrinho')
    const emerald = page.getByRole('group', {
      name: 'Quantidade de Emerald Ape #042 (edição 1/50)',
    })
    await expect(emerald.locator('output')).toHaveText('1')

    // Two quick clicks send one request with the last value.
    await emerald.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await emerald.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(emerald.locator('output')).toHaveText('3')
    await expect
      .poll(
        async () =>
          (await app.db()).carts[0]?.lines.find(
            (line) => line.nftId === 'emerald-ape-042',
          )?.quantity,
      )
      .toBe(3)
    await expect(summary(page)).toContainText(`${await apiTotal(page)} ETH`)

    // Removal with undo.
    await page
      .getByRole('button', {
        name: 'Remover Golden Beat #207 (edição 1/50) do carrinho',
      })
      .click()
    const removed = app.toast(
      'Golden Beat #207 (edição 1/50) foi removido do carrinho.',
    )
    await expect(removed).toBeVisible()
    await expect(
      page.getByRole('group', { name: /Quantidade de Golden Beat/ }),
    ).toHaveCount(0)
    await removed.getByRole('button', { name: 'Desfazer' }).click()
    await expect(
      page.getByRole('group', { name: /Quantidade de Golden Beat/ }),
    ).toHaveCount(1)
    await expect(app.cartLink()).toHaveAttribute(
      'aria-label',
      'Carrinho, 8 itens',
    )
  })

  test('cupom inválido, expirado e válido, mantido após refresh', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.login('nova', '/carrinho')
    const coupon = page.getByLabel('Código promocional')
    const apply = page.getByRole('button', { name: 'Aplicar' })

    await coupon.fill('NAOEXISTE')
    await apply.click()
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'Código promocional inválido' }),
    ).toBeVisible()
    await expect(coupon).toHaveAttribute('aria-invalid', 'true')
    await expect(coupon).toBeFocused()

    await coupon.fill('blackfriday25')
    await apply.click()
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'O código BLACKFRIDAY25 expirou' }),
    ).toBeVisible()

    await coupon.fill('lancamento10')
    await apply.click()
    await expect(
      page.getByText('LANCAMENTO10 aplicado: Desconto do lançamento.'),
    ).toBeVisible()
    await expect(summary(page)).toContainText(`${await apiTotal(page)} ETH`)
    await expect(summary(page)).toContainText('(-) 1.271 ETH')

    await page.reload()
    await expect(
      page.getByText('LANCAMENTO10 aplicado: Desconto do lançamento.'),
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Remover cupom LANCAMENTO10' })
      .click()
    await expect(page.getByLabel('Código promocional')).toBeFocused()
  })

  test('carrinho do visitante persiste após refresh e é mantido ao entrar', async ({
    app,
    page,
  }) => {
    await app.open('/nfts/sage-nomad-009')
    if (app.mobile) {
      await page
        .getByRole('button', { name: 'Adicionar Sage Nomad #009 ao carrinho' })
        .click()
    } else {
      await page.getByRole('button', { name: 'Comprar', exact: true }).click()
      await expect(page).toHaveURL('/carrinho')
    }
    await expect(app.cartLink()).toHaveAttribute(
      'aria-label',
      'Carrinho, 1 item',
    )
    await page.reload()
    await expect(app.cartLink()).toHaveAttribute(
      'aria-label',
      'Carrinho, 1 item',
    )

    await app.login('nova', '/carrinho')
    await expect(
      app.toast(
        'Os itens que você escolheu antes de entrar estão no seu carrinho.',
      ),
    ).toBeVisible()
    await expect(
      page.getByRole('group', { name: /Quantidade de Sage Nomad #009/ }),
    ).toBeVisible()
    await expect(app.cartLink()).toHaveAttribute(
      'aria-label',
      'Carrinho, 7 itens',
    )
  })
})
