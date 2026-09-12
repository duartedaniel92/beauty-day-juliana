import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Cliente de service role só pra limpeza do agendamento criado pelo teste.
// Não reaproveita lib/supabase/admin.ts porque aquele arquivo importa
// "server-only", que lanca erro fora do runtime do Next (ver nota da Task 5).
function createTestCleanupClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

test.describe("fluxo de agendamento", () => {
  let createdAppointmentId: string | undefined;
  let testEmail: string | undefined;

  test.afterEach(async () => {
    const supabase = createTestCleanupClient();
    if (createdAppointmentId) {
      await supabase.from("appointments").delete().eq("id", createdAppointmentId);
    }
    if (testEmail) {
      await supabase.from("appointments").delete().eq("client_email", testEmail);
    }
    createdAppointmentId = undefined;
    testEmail = undefined;
  });

  test("cliente consegue escolher servico, horario e confirmar o agendamento", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Agendar meu horário" }).click();
    await expect(page).toHaveURL("/agendar");

    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Continuar" }).click();

    const firstSlotButton = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
    await expect(firstSlotButton).toBeVisible({ timeout: 10_000 });
    await firstSlotButton.click();

    testEmail = `teste-e2e-${Date.now()}@example.com`;
    await page.getByLabel("Nome completo").fill("Cliente de Teste E2E");
    await page.getByLabel("WhatsApp").fill("(11) 98888-7777");
    await page.getByLabel("E-mail").fill(testEmail);
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();

    await expect(page).toHaveURL(/\/sucesso\/.+/, { timeout: 10_000 });
    createdAppointmentId = page.url().split("/sucesso/")[1];

    await expect(
      page.getByRole("heading", { name: "Agendamento confirmado" })
    ).toBeVisible();
    await expect(page.getByText("Adicionar ao Google Calendar")).toBeVisible();
  });
});
