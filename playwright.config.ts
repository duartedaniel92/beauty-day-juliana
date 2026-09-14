import { defineConfig } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
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
