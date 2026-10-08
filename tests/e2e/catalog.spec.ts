import type { Page } from '@playwright/test'

import { expect, test } from '../fixtures'

/** Names of the cards currently in the catalog grid. */
const names = (page: Page) =>
  page.locator('#mercado article h3').allTextContents()

/** Names the API returns for the same query (REST through MSW). */
const apiNames = (page: Page, query: string) =>
  page.evaluate(async (search) => {
    const response = await fetch(`/api/nfts?${search}`)
    const body = (await response.json()) as { items: { name: string }[] }
    return body.items.map((item) => item.name)
  }, query)

test.describe('Catálogo', () => {
  test('busca, filtros combinados, ordenação, paginação e histórico @desktop', async ({
    app,
    page,
  }) => {
    await app.open('/')
    const grid = page.locator('#mercado article')
    await expect(grid.first()).toBeVisible()

    // Search: debounced, kept in the URL, results match the API.
    await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill('nomad')
    await expect(page).toHaveURL(/q=nomad/)
    await expect
      .poll(() => names(page))
      .toEqual(await apiNames(page, 'q=nomad'))

    // Combined filters (category + network) compose the URL and the query.
    await page
      .getByRole('checkbox', { name: /^Arte digital/ })
      .check({ force: true })
    await expect(page).toHaveURL(/categories=arte-digital/)
    await page
      .getByRole('checkbox', { name: /^Ethereum/ })
      .check({ force: true })
    await expect(page).toHaveURL(/networks=ethereum/)
    await expect
      .poll(() => names(page))
      .toEqual(
        await apiNames(
          page,
          'q=nomad&categories=arte-digital&networks=ethereum',
        ),
      )
    await expect(
      page.getByRole('group', { name: 'Filtros ativos' }),
    ).toContainText('Arte digital')

    // Back restores the previous combination (controls and results).
    await page.goBack()
    await expect(page).not.toHaveURL(/networks=/)
    await expect(
      page.getByRole('checkbox', { name: /^Ethereum/ }),
    ).not.toBeChecked()
    await expect(
      page.getByRole('checkbox', { name: /^Arte digital/ }),
    ).toBeChecked()
    await expect
      .poll(() => names(page))
      .toEqual(await apiNames(page, 'q=nomad&categories=arte-digital'))

    // Sorting: lowest price first.
    await page.goto('/')
    await page.getByLabel('Ordenar por:').selectOption('price-asc')
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect
      .poll(() => names(page))
      .toEqual(await apiNames(page, 'sort=price-asc'))
    const prices = (
      await page.locator('#mercado article p').allTextContents()
    ).map((text) => Number.parseFloat(text))
    expect(prices).toEqual([...prices].sort((a, b) => a - b))

    // Pagination keeps the sort; a filter change restarts at page 1.
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect
      .poll(() => names(page))
      .toEqual(await apiNames(page, 'sort=price-asc&page=2'))
    await page.getByRole('checkbox', { name: /^Jogos/ }).check({ force: true })
    await expect(page).toHaveURL(/categories=jogos/)
    await expect(page).not.toHaveURL(/page=/)
    const filtered = await apiNames(page, 'sort=price-asc&categories=jogos')
    await expect.poll(() => names(page)).toEqual(filtered)

    // A refresh keeps the whole state.
    await page.reload()
    await expect(page.getByRole('checkbox', { name: /^Jogos/ })).toBeChecked()
    await expect.poll(() => names(page)).toEqual(filtered)
  })

  test('resultado vazio e limpeza dos filtros', async ({ app, page }) => {
    await app.open('/?q=zzzz')
    await expect(page.getByText('Nenhum NFT encontrado').first()).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
    await expect(page).not.toHaveURL(/q=/)
    await expect(page.locator('#mercado article').first()).toBeVisible()
  })

  test('filtros no mobile pelo painel', async ({ app, page }) => {
    test.skip(!app.mobile, 'Painel de filtros do layout mobile')
    await app.open('/')
    await page.getByRole('button', { name: 'Filtros', exact: true }).click()
    const sheet = page.getByRole('dialog', { name: 'Filtros' })
    await sheet
      .locator('label')
      .filter({ hasText: /^Música/ })
      .click()
    await expect(page).toHaveURL(/categories=musica/)
    await expect(sheet.getByRole('checkbox', { name: /^Música/ })).toBeChecked()
    await sheet.getByRole('button', { name: /^Ver \d+ NFTs?$/ }).click()
    await expect(sheet).toBeHidden()
    await expect(
      page.getByRole('button', { name: 'Filtros, 1 ativos' }),
    ).toBeVisible()
    await expect
      .poll(() => names(page))
      .toEqual(await apiNames(page, 'categories=musica'))
  })
})
