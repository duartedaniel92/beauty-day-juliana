import { test, expect } from '@playwright/test'

test('home responsiva mantém o agendamento acessível e não transborda', async ({ page }, testInfo) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 740 })
    await page.goto('/')
    const cta = page.getByRole('link', { name: 'Agendar horário', exact: true })
    await expect(cta).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const bounds = await cta.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(740)
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true })
  }
})

test('rotas administrativas recusam visitante sem sessão', async ({ page }) => {
  for (const path of ['/painel', '/painel/servicos', '/painel/configuracoes']) {
    await page.goto(path)
    await expect(page).toHaveURL('/login')
    await expect(page.getByLabel('Senha')).toBeVisible()
  }
})

test('link de confirmação inválido mostra página não encontrada', async ({ page }) => {
  const response = await page.goto('/sucesso/invalido')
  expect(response?.status()).toBe(404)
})
