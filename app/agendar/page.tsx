import { getPublicServices } from "@/lib/public-services";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { PublicHeader } from "@/components/public/PublicHeader";

export default async function AgendarPage() {
  const services = await getPublicServices();

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
    <div className="booking-surface"><PublicHeader /><main className="min-h-[75vh]">
      <BookingWizard services={services} />
    </main></div>
  );
}
