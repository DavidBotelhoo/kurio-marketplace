import { expect, test, USERS } from '../fixtures'

test.describe('Conta e sessão', () => {
  test('cadastro com validação e conflito, sessão mantida após refresh', async ({
    app,
    page,
  }) => {
    await app.open('/cadastro')
    const form = app.authForm()
    await form.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
    await expect(form.getByText('Informe um nome de usuário.')).toBeVisible()

    // E-mail of another account: the API answers 409 on the field.
    await form.getByLabel(/^Nome de usuário/).fill('nova.ribeiro')
    await form
      .getByRole('textbox', { name: 'E-mail', exact: true })
      .fill(USERS.nova.email)
    await form.getByLabel('Senha', { exact: true }).fill('Senha2026x')
    await form.getByLabel('Confirmar senha', { exact: true }).fill('Senha2026x')
    await form.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
    await expect(
      form.getByText('Este e-mail já está cadastrado. Entre ou use outro.'),
    ).toBeVisible()

    await form.getByLabel(/^Nome de usuário/).fill('lia.teste')
    await form
      .getByRole('textbox', { name: 'E-mail', exact: true })
      .fill('lia@kurio.test')
    await form.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
    await expect(page).toHaveURL('/')
    // The session survives a refresh: the API still recognizes the token.
    await page.reload()
    // Requests made before the mock worker starts would reach the static server.
    await page.waitForFunction(() => window.__kurioMocks !== undefined)
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const stored = JSON.parse(
            localStorage.getItem('kurio.session') ?? 'null',
          ) as {
            token: string
          } | null
          if (!stored) return null
          const response = await fetch('/api/auth/session', {
            headers: { Authorization: `Bearer ${stored.token}` },
          })
          const body = (await response.json()) as {
            user?: { username: string }
          }
          return body.user?.username ?? null
        }),
      )
      .toBe('lia.teste')
    const db = await app.db()
    expect(db.users.some((user) => user.email === 'lia@kurio.test')).toBe(true)
    // Only hashes are stored.
    expect(JSON.stringify(db.users)).not.toContain('Senha2026x')
  })

  test('login inválido e válido, logout limpa os dados privados', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await page.goto('/login')
    const form = app.authForm()
    await form
      .getByRole('textbox', { name: 'E-mail', exact: true })
      .fill(USERS.nova.email)
    await form.getByLabel('Senha', { exact: true }).fill('errada123')
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(form.getByRole('alert')).toContainText(
      'E-mail ou senha incorretos.',
    )

    await app.login('nova', '/perfil')
    await expect(
      page.getByRole('heading', { name: 'Perfil do colecionador' }),
    ).toBeVisible()
    await expect(app.cartLink()).toHaveAttribute(
      'aria-label',
      'Carrinho, 6 itens',
    )

    await app.logout()
    await expect(app.cartLink()).toHaveAttribute('aria-label', 'Carrinho')
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil&reason=required/)
  })

  test('troca de usuário não mostra dados da conta anterior', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.login('nova', '/perfil/favoritos')
    await expect(
      page.getByRole('heading', { name: 'Emerald Ape #042' }),
    ).toBeVisible()
    await app.logout()
    await app.login('david', '/perfil/favoritos')
    await expect(page.getByText('Sua lista está vazia')).toBeVisible()
    await expect(app.cartLink()).toHaveAttribute('aria-label', 'Carrinho')
    await page.goto('/perfil')
    await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue('David Dev')
  })

  test('sessão expira com o tempo e o fluxo retoma após novo login', async ({
    app,
    page,
  }) => {
    // Fake clock: the mock API runs in the page, so its expiry follows it.
    await page.clock.install()
    await app.open('/', { scenario: 'short-session' })
    await app.login('nova', '/perfil/carteiras')
    await expect(
      page.getByRole('heading', { name: 'Carteira principal' }),
    ).toBeVisible()

    await page.clock.fastForward('01:05')
    await page
      .getByRole('navigation', { name: 'Seções do perfil' })
      .first()
      .getByRole('link', { name: 'Dados do perfil' })
      .click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil&reason=expired/)
    await expect(app.authForm().getByRole('status')).toContainText(
      'Sua sessão expirou',
    )

    const form = app.authForm()
    await form
      .getByRole('textbox', { name: 'E-mail', exact: true })
      .fill(USERS.nova.email)
    await form.getByLabel('Senha', { exact: true }).fill(USERS.nova.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL('/perfil')
    await expect(
      page.getByRole('heading', { name: 'Perfil do colecionador' }),
    ).toBeVisible()
  })
})
