import AxeBuilder from '@axe-core/playwright'

import { expect, test } from '../fixtures'

const focusInside = (selector: string) =>
  `document.querySelector('${selector}')?.contains(document.activeElement) ?? false`

test.describe('Acessibilidade', () => {
  test('teclado: pular para o conteúdo e foco visível @desktop', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('#conteudo')).toBeFocused()

    // The next stop shows a visible focus indicator.
    await page.keyboard.press('Tab')
    const outline = await page.evaluate(() => {
      const element = document.activeElement
      return element ? getComputedStyle(element).outlineStyle : 'none'
    })
    expect(outline).not.toBe('none')
  })

  test('diálogo de login: foco inicial, foco preso e Escape @desktop', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('textbox', { name: 'E-mail', exact: true }),
    ).toBeFocused()
    for (let step = 0; step < 14; step++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(focusInside('[role="dialog"]'))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL('/')
  })

  test('diálogo de imagem devolve o foco ao botão @desktop', async ({
    app,
    page,
  }) => {
    await app.open('/nfts/emerald-ape-042')
    const zoom = page.getByRole('button', { name: 'Ampliar imagem' })
    await zoom.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Fechar imagem ampliada' }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(zoom).toBeFocused()
  })

  test('painel de filtros prende e devolve o foco', async ({ app, page }) => {
    test.skip(!app.mobile, 'Painel do layout mobile')
    await app.open('/')
    const trigger = page.getByRole('button', { name: 'Filtros', exact: true })
    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeVisible()
    for (let step = 0; step < 8; step++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(focusInside('[role="dialog"]'))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('erros de formulário associados aos campos', async ({ app, page }) => {
    await app.open('/login')
    const form = app.authForm()
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    const email = form.getByRole('textbox', { name: 'E-mail', exact: true })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toBeFocused()
    const describedBy = (await email.getAttribute('aria-describedby')) ?? ''
    expect(describedBy).not.toBe('')
    await expect(
      page.locator(`[id="${describedBy.split(' ').at(-1) ?? ''}"]`),
    ).toHaveText('Informe seu e-mail.')
  })

  for (const { path, signedIn } of [
    { path: '/', signedIn: false },
    { path: '/nfts/emerald-ape-042', signedIn: false },
    { path: '/carrinho', signedIn: true },
    { path: '/pagamento', signedIn: true },
    { path: '/perfil', signedIn: true },
    { path: '/perfil/carteiras', signedIn: true },
  ]) {
    test(`sem violações WCAG A/AA (axe) em ${path}`, async ({ app, page }) => {
      await app.open(signedIn ? '/' : path)
      if (signedIn) await app.login('nova', path)
      await expect(page.locator('main')).not.toHaveAttribute(
        'aria-busy',
        'true',
      )
      await page.waitForLoadState('networkidle')
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Toasts are transient and outside the page content.
        .exclude('[data-sonner-toaster]')
        .analyze()
      expect(
        violations.map(
          (violation) =>
            `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([])
    })
  }
})
