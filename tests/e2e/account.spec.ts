import { fileURLToPath } from 'node:url'

import { expect, test } from '../fixtures'

const asset = (name: string) =>
  fileURLToPath(new URL(`../assets/${name}`, import.meta.url))

test.describe('Perfil e carteiras', () => {
  test('dados do perfil com erros da API e persistência', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.login('nova', '/perfil')
    const form = page.locator('main form')
    const field = (label: string) => form.getByLabel(new RegExp(`^${label}`))

    await field('Nome de exibição').fill('')
    await field('Nome ENS').fill('Nome Inválido!')
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(field('Nome de exibição')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await expect(form.getByText('Informe o nome de exibição.')).toBeVisible()
    await expect(
      form.getByText('Use letras minúsculas, números, hífen ou ponto.'),
    ).toBeVisible()

    // Username of another account: 409 on the field.
    await field('Nome de exibição').fill('Nova R. Lima')
    await field('Nome ENS').fill('nova.kurio')
    await field('Nome de usuário').fill('david.dev')
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      form.getByText('Este nome de usuário já está em uso.'),
    ).toBeVisible()
    await expect(field('Nome de usuário')).toBeFocused()

    await field('Nome de usuário').fill('nova.ribeiro')
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(app.toast('Dados do perfil salvos.')).toBeVisible()
    await page.reload()
    await expect(field('Nome de exibição')).toHaveValue('Nova R. Lima')
    // The account name follows the change (header button or mobile summary).
    await expect(
      app.mobile
        ? page.getByText('Nova R. Lima', { exact: true }).first()
        : page
            .locator('header')
            .getByRole('button', { name: 'Conta de Nova R. Lima' }),
    ).toBeVisible()
  })

  test('avatar: arquivo inválido, envio e remoção', async ({ app, page }) => {
    await app.open('/')
    await app.login('nova', '/perfil')
    const input = page.locator('main form input[type=file]')

    await input.setInputFiles(asset('not-an-image.txt'))
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'Escolha uma imagem PNG, JPG ou WebP.' }),
    ).toBeVisible()

    await input.setInputFiles(asset('avatar.png'))
    await expect(app.toast('Avatar atualizado.')).toBeVisible()
    await expect
      .poll(
        async () =>
          (await app.db()).users.find((user) => user.id === 'usr_nova')
            ?.avatarUrl ?? '',
      )
      .toMatch(/^data:image\/(webp|png);base64,/)

    await page.getByRole('button', { name: 'Remover avatar' }).click()
    await expect(app.toast('Avatar removido.')).toBeVisible()
    expect(
      (await app.db()).users.find((user) => user.id === 'usr_nova')?.avatarUrl,
    ).toBeNull()
  })

  test('alteração de senha com validação e senha atual incorreta', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.login('nova', '/perfil')
    const form = page.locator('main form')
    const field = (label: string) => form.getByLabel(label, { exact: true })

    await field('Nova senha').fill('OutraSenha2026')
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(form.getByText('Informe sua senha atual.')).toBeVisible()
    await expect(form.getByText('As senhas não coincidem.')).toBeVisible()

    await field('Senha atual').fill('errada')
    await field('Confirmar nova senha').fill('OutraSenha2026')
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(form.getByText('Senha atual incorreta.')).toBeVisible()

    await field('Senha atual').fill('Kurio@2026')
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      app.toast('Senha alterada. As outras sessões foram encerradas.'),
    ).toBeVisible()
    await expect(field('Senha atual')).toHaveValue('')

    // The new password is the one that works now.
    const login = await page.evaluate(async () => {
      const attempt = (password: string) =>
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'nova@kurio.test', password }),
        }).then((response) => response.status)
      return [await attempt('Kurio@2026'), await attempt('OutraSenha2026')]
    })
    expect(login).toEqual([401, 200])
  })

  test('carteiras: validação, edição e cópia da principal', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.login('nova', '/perfil/carteiras')
    const primary = page.getByRole('form', { name: 'Carteira principal' })
    const secondary = page.getByRole('form', { name: 'Carteira secundária' })
    const field = (form: typeof primary, label: string) =>
      form.getByLabel(new RegExp(`^${label}`))

    await field(primary, 'Endereço da carteira').fill('0x123')
    await field(primary, 'Código de indicação').fill('x')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(
      primary.getByText(
        'Use um endereço 0x seguido de 40 caracteres hexadecimais.',
      ),
    ).toBeVisible()
    await expect(
      primary.getByText('Use de 4 a 20 letras, números ou hífen.'),
    ).toBeVisible()

    await field(primary, 'Endereço da carteira').fill(
      '0xa91f3c7d52b04e6a9d18f0c4b7e2a65d3c19e82c',
    )
    await field(primary, 'Código de indicação').fill('kurio-nova')
    await field(primary, 'Apelido da carteira').fill('Cofre')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(app.toast('Carteira principal salva.')).toBeVisible()

    await page.getByText('Igual à carteira principal').click()
    await expect(field(secondary, 'Rede')).toHaveValue('ethereum')
    await expect(field(secondary, 'Apelido da carteira')).toHaveValue('Reserva')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(app.toast('Carteira secundária salva.')).toBeVisible()

    await page.reload()
    await expect(field(primary, 'Apelido da carteira')).toHaveValue('Cofre')
    await expect(field(secondary, 'Rede')).toHaveValue('ethereum')
  })
})
