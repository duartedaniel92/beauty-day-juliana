import { createClient } from "@/lib/supabase/server";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default async function AgendarPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price_cents, duration_minutes")
    .eq("active", true)
    .order("duration_minutes", { ascending: true });

  if (!services || services.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="font-sans text-ink-soft">
          Nenhum serviço disponível no momento. Volte mais tarde.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <BookingWizard services={services} />
    </main>
  );
}
