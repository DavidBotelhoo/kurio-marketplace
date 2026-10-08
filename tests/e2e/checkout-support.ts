import { type App, expect } from '../fixtures'

/** Nova (with wallets) on the payment page, review dialog open. */
export async function openReview(app: App, options: { login?: boolean } = {}) {
  const { page } = app
  if (options.login ?? true) await app.login('nova', '/pagamento')
  // Enabled once the quote is loaded and purchasable (desktop and mobile).
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirm).toBeEnabled()
  await confirm.click()
  const review = page.getByRole('dialog', { name: 'Revise sua compra' })
  await expect(review).toBeVisible()
  return review
}

export function orderIdFromUrl(url: string) {
  return new URL(url).pathname.split('/').pop() ?? ''
}
