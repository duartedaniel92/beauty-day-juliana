import { test, expect } from '@playwright/test'

// Public checks never request an email or change the owner's password.
test('recovery is accessible on mobile and invalid links fail safely', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/login')
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByRole('heading', { name: 'Recuperar sua senha' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar link de recuperação' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/recovery-mobile.png', fullPage: true })

  const response = await page.goto('/auth/confirm?token_hash=invalid&type=recovery')
  expect(response?.headers()['referrer-policy']).toBe('no-referrer')
  await expect(page.getByRole('main').getByRole('alert')).toContainText('incompleto')
  await expect(page.getByRole('button', { name: 'Continuar para nova senha' })).toHaveCount(0)

  await page.goto('/nova-senha')
  await expect(page).toHaveURL(/\/login$/)
})
