import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { formatInTimeZone } from "date-fns-tz";
import { AddToGoogleCalendar } from "@/components/booking/AddToGoogleCalendar";

const SALON_TIMEZONE = "America/Sao_Paulo";

export default async function SucessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, start_time, end_time, appointment_services(service_name_snapshot, price_cents_snapshot)"
    )
    .eq("id", id)
    .eq("type", "booking")
    .single();

  if (!appointment) {
    notFound();
  }

  const totalPriceCents = appointment.appointment_services.reduce(
    (sum, service) => sum + service.price_cents_snapshot,
    0
  );
  const serviceNames = appointment.appointment_services
    .map((service) => service.service_name_snapshot)
    .join(", ");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-16">
      <h1 className="font-display text-2xl text-ink">Agendamento confirmado</h1>
      <dl className="flex flex-col gap-1 font-sans text-sm text-ink-soft">
        <div className="flex justify-between gap-4">
          <dt>Serviços</dt>
          <dd className="text-right">{serviceNames}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Horário</dt>
          <dd>
            {formatInTimeZone(
              new Date(appointment.start_time),
              SALON_TIMEZONE,
              "dd/MM/yyyy 'às' HH:mm"
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Total</dt>
          <dd>{formatPrice(totalPriceCents)}</dd>
        </div>
      </dl>
      <AddToGoogleCalendar
        title={`Beauty Day Juliana — ${serviceNames}`}
        startISO={appointment.start_time}
        endISO={appointment.end_time}
      />
    </main>
  );
}
