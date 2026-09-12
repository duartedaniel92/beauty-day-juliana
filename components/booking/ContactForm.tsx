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

export function ContactForm({ selectedServices, slot, onBack }: ContactFormProps) {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const totalPriceCents = selectedServices.reduce(
    (sum, service) => sum + service.price_cents,
    0
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("submitting");

    let result: Awaited<ReturnType<typeof createBooking>>;
    try {
      result = await createBooking({
        serviceIds: selectedServices.map((service) => service.id),
        clientName,
        clientWhatsapp,
        clientEmail,
        startTime: new Date(slot.start),
      });
    } catch {
      // createBooking lanca em falha de infraestrutura (banco fora, etc.);
      // sem isso o botao ficaria preso em "Confirmando..." pra sempre
      setStatus("error");
      setErrorMessage("Não foi possível confirmar agora. Tente novamente em instantes.");
      return;
    }

    if ("error" in result) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }

    router.push(`/sucesso/${result.id}`);
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

      <label className="flex flex-col gap-2 font-sans text-sm text-ink">
        Nome completo
        <input
          type="text"
          required
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          className="rounded-sm border border-ink-soft/60 bg-cream px-3 py-2 text-ink outline-none focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40"
        />
      </label>

      <label className="flex flex-col gap-2 font-sans text-sm text-ink">
        WhatsApp
        <input
          type="tel"
          required
          placeholder="(11) 90000-0000"
          value={clientWhatsapp}
          onChange={(event) => setClientWhatsapp(event.target.value)}
          className="rounded-sm border border-ink-soft/60 bg-cream px-3 py-2 text-ink outline-none focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40"
        />
      </label>

      <label className="flex flex-col gap-2 font-sans text-sm text-ink">
        E-mail
        <input
          type="email"
          required
          value={clientEmail}
          onChange={(event) => setClientEmail(event.target.value)}
          className="rounded-sm border border-ink-soft/60 bg-cream px-3 py-2 text-ink outline-none focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40"
        />
      </label>

      {status === "error" && (
        <p className="font-sans text-sm text-clay">{errorMessage}</p>
      )}

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
          disabled={status === "submitting"}
          className="rounded-sm bg-clay px-6 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-clay-dark disabled:opacity-60"
        >
          {status === "submitting" ? "Confirmando..." : "Confirmar agendamento"}
        </button>
      </div>
    </form>
  );
}
