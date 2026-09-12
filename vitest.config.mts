import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // exclui worktrees aninhados do Claude Code (.claude/worktrees/**),
    // que ficam dentro do proprio repo e duplicariam a descoberta de testes.
    // exclui e2e/** porque os specs do Playwright usam test.describe() do
    // @playwright/test, que conflita com o test runner do Vitest.
    exclude: [...configDefaults.exclude, '.claude/**', 'e2e/**'],
  },
})
