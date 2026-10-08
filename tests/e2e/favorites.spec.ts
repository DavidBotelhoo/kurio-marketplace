import { expect, test } from '../fixtures'

test.describe('Favoritos', () => {
  test('visitante é levado ao login e volta ao mesmo lugar', async ({
    app,
    page,
  }) => {
    await app.open('/nfts/sage-nomad-009')
    await page
      .getByRole('button', { name: 'Favoritar Sage Nomad #009' })
      .first()
      .click()
    await expect(page).toHaveURL(
      /\/login\?redirect=%2Fnfts%2Fsage-nomad-009&reason=required/,
    )
  })

  test('favoritar é otimista, falha faz rollback e o estado persiste', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.login('nova', '/nfts/sage-nomad-009')
    const heart = page
      .getByRole('button', { name: 'Favoritar Sage Nomad #009' })
      .first()
    await expect(heart).toHaveAttribute('aria-pressed', 'false')

    // Failure: the heart flips at once, then returns with a notice.
    await app.config({ latency: 'slow' })
    await app.fail('favorites.add')
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    await expect(
      app.toast('Não foi possível favoritar “Sage Nomad #009”'),
    ).toBeVisible({ timeout: 8000 })
    await expect(heart).toHaveAttribute('aria-pressed', 'false')

    // Retrying works and the favorite is kept by the API.
    await app.config({ latency: 'none', failures: [] })
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    await expect
      .poll(async () =>
        (await app.db()).favorites.some(
          (item) => item.nftId === 'sage-nomad-009',
        ),
      )
      .toBe(true)
    await page.reload()
    await expect(
      page.getByRole('button', { name: 'Favoritar Sage Nomad #009' }).first(),
    ).toHaveAttribute('aria-pressed', 'true')

    // It is listed in "Lista de interesse".
    await page.goto('/perfil/favoritos')
    await expect(
      page.getByRole('heading', { name: 'Sage Nomad #009' }),
    ).toBeVisible()
  })
})
