import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { formatInTimeZone } from "date-fns-tz";
import { AddToGoogleCalendar } from "@/components/booking/AddToGoogleCalendar";
import { SALON_TIMEZONE } from "@/lib/availability/calculate-slots";
import { z } from "zod";
import { PublicHeader } from "@/components/public/PublicHeader";
import { bookingApprovalEnabled } from '@/lib/booking-feature';
import { bookingStatusLabels, effectiveBookingStatus, type BookingStatus } from '@/lib/booking-status';
import { cookies } from 'next/headers';
import { BOOKING_RECEIPT_COOKIE, readBookingReceipts } from '@/lib/security/booking-access';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function SucessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const store = await cookies();
  if (!readBookingReceipts(store.get(BOOKING_RECEIPT_COOKIE)?.value).some(entry => entry.id === id)) notFound();
  const supabase = createAdminClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(
      "id, start_time, end_time, appointment_services(service_name_snapshot, price_cents_snapshot)"
    )
    .eq("id", id)
    .eq("type", "booking")
    .single();

  // PGRST116 = .single() nao encontrou linha: e um 404 legitimo.
  // Qualquer outro erro e falha de infraestrutura e deve subir pro error boundary.
  if (error && error.code !== "PGRST116") {
    throw new Error('Não foi possível carregar a reserva. Tente novamente.');
  }

  if (!appointment) {
    notFound();
  }

  let status: BookingStatus = 'confirmed';
  if (bookingApprovalEnabled()) {
    const result = await supabase.from('appointments').select('status,expires_at').eq('id', id).single();
    if (result.error || !result.data) throw new Error('Não foi possível consultar a situação da reserva.');
    status = effectiveBookingStatus(result.data.status as BookingStatus, result.data.expires_at);
  }

  const totalPriceCents = appointment.appointment_services.reduce(
    (sum, service) => sum + service.price_cents_snapshot,
    0
  );
  const serviceNames = appointment.appointment_services
    .map((service) => service.service_name_snapshot)
    .join(", ");

  return (
    <div className="booking-surface"><PublicHeader /><main className="mx-auto flex min-h-[75vh] max-w-xl flex-col gap-6 px-6 py-16">
      <h1 className="font-display text-2xl text-ink">{status === 'confirmed' ? 'Agendamento confirmado' : bookingStatusLabels[status]}</h1>
      {status === 'pending' && <p>Recebemos seu pedido. Aguarde a autorização da Juliana antes de considerar o horário confirmado.</p>}
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
      {status === 'confirmed' && <AddToGoogleCalendar
        title={`Beauty Day Juliana — ${serviceNames}`}
        startISO={appointment.start_time}
        endISO={appointment.end_time}
      />}
      <Link href="/" className="w-fit font-sans text-sm text-ink-soft underline">
        Voltar ao início
      </Link>
    </main></div>
  );
}
