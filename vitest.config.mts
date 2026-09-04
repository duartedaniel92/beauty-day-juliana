import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // exclui worktrees aninhados do Claude Code (.claude/worktrees/**),
    // que ficam dentro do proprio repo e duplicariam a descoberta de testes
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
})
