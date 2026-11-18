"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { createBooking } from "@/lib/actions/bookings";
import { formatPrice } from "@/lib/format";
import { SALON_TIMEZONE } from "@/lib/availability/calculate-slots";
import type { WizardService } from "./BookingWizard";

interface ContactFormProps {
  selectedServices: WizardService[];
  slot: { start: string; end: string };
  onBack: () => void;
}

const contactFields = [
  ['clientName', 'Nome completo', 'text', 'name', ''],
  ['clientWhatsapp', 'WhatsApp', 'tel', 'tel-national', '(11) 90000-0000'],
  ['clientEmail', 'E-mail', 'email', 'email', ''],
] as const;

export function ContactForm({ selectedServices, slot, onBack }: ContactFormProps) {
  const router = useRouter();
  const [requestId] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState({ pending: false, error: "", refreshServices:false });

  const totalPriceCents = selectedServices.reduce(
    (sum, service) => sum + service.price_cents,
    0
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (status.pending) return;
    const data = new FormData(event.currentTarget);
    setStatus({ pending: true, error: "", refreshServices:false });

    try {
      const result = await createBooking({
        requestId,
        expectedServices:selectedServices.map(service => ({ id:service.id, priceCents:service.price_cents, durationMinutes:service.duration_minutes })),
        serviceIds: selectedServices.map((service) => service.id),
        clientName: data.get('clientName'),
        clientWhatsapp: data.get('clientWhatsapp'),
        clientEmail: data.get('clientEmail'),
        startTime: new Date(slot.start),
      });
      if ("error" in result) {
        setStatus({ pending: false, error: result.error, refreshServices:result.refreshServices ?? false });
      } else {
        router.push(`/sucesso/${result.id}`);
      }
    } catch {
      setStatus({ pending: false, error: "Não foi possível confirmar agora. Tente novamente em instantes.", refreshServices:false });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Confirme seus dados</h1>

      <dl className="flex flex-col gap-1 font-sans text-sm text-ink-soft">
        <div className="flex justify-between gap-4">
          <dt>Serviços</dt>
          <dd className="text-right">
            {selectedServices.map((service) => service.name).join(", ")}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Horário</dt>
          <dd>
            {formatInTimeZone(
              new Date(slot.start),
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

      {contactFields.map(([name, label, type, autoComplete, placeholder]) => (
        <label key={name} className="flex flex-col gap-2 font-sans text-sm text-ink">
          {label}
          <input name={name} type={type} autoComplete={autoComplete} maxLength={name === 'clientName' ? 120 : name === 'clientEmail' ? 254 : 32} placeholder={placeholder || undefined} required
            className="rounded-sm border border-ink-soft/60 bg-cream px-3 py-2 text-ink outline-none focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40" />
        </label>
      ))}

      <p className="text-xs text-ink-soft">Seus dados serão usados para organizar esta reserva e entrar em contato. <a href="/privacidade" className="underline" target="_blank" rel="noopener">Saiba como são tratados</a>.</p>
      {status.error && (
        <p role="alert" className="font-sans text-sm text-clay">{status.error}</p>
      )}
      {status.refreshServices && <a href="/agendar" className="public-cta w-fit">Atualizar serviços e horários</a>}

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="font-sans text-sm text-ink-soft underline"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={status.pending}
          className="rounded-sm bg-clay px-6 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-clay-dark disabled:opacity-60"
        >
          {status.pending ? "Enviando..." : "Enviar agendamento"}
        </button>
      </div>
    </form>
  );
}
