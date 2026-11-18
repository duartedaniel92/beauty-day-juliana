import { defineConfig } from "@playwright/test";
import { config } from "dotenv";
import { assertE2EEnvironment } from "./lib/security/e2e-environment";

config({ path: ".env.local" });
assertE2EEnvironment();

export default defineConfig({
  testDir: "./e2e",
  // O padrao de 30s por teste e curto demais num servidor a frio, onde cada
  // rota compila sob demanda na primeira visita (ver comentario do webServer).
  timeout: 90_000,
  // Cada navegacao num servidor a frio pode incluir a compilacao sob demanda
  // da rota destino (~15s pra /agendar, ~6s pra /sucesso nesta maquina), entao
  // o padrao de 5s por expect nao serve; 30s cobre com folga sem mascarar bug.
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    // A primeira compilacao de "/" pelo Turbopack a frio passou de 40s nesta
    // maquina; 60s estourou no merge. 120s da folga sem mascarar um travamento.
    timeout: 120_000,
  },
});
