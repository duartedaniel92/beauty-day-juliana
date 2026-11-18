import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktrees aninhados do Claude Code (.claude/worktrees/**) ficam
    // dentro do proprio repo e nao devem ser lintados por daqui.
    ".claude/**",
    ".claude-flow/**",
    ".vercel/**",
  ]),
]);

export default eslintConfig;
