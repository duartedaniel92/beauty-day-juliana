"use client";

import { formatPrice } from "@/lib/format";
import type { WizardService } from "./BookingWizard";

interface ServiceSelectorProps {
  services: WizardService[];
  selectedServiceIds: string[];
  totalDurationMinutes: number;
  onToggle: (serviceId: string) => void;
  onContinue: () => void;
}

export function ServiceSelector({
  services,
  selectedServiceIds,
  totalDurationMinutes,
  onToggle,
  onContinue,
}: ServiceSelectorProps) {
  const canContinue = selectedServiceIds.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Escolha o serviço</h1>
      <ul className="flex flex-col divide-y divide-sand/60 border-y border-sand/60">
        {services.map((service) => {
          const checked = selectedServiceIds.includes(service.id);
          return (
            <li key={service.id}>
              <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(service.id)}
                    className="h-4 w-4 accent-clay"
                  />
                  <span className="font-sans text-ink">{service.name}</span>
                </span>
                <span className="whitespace-nowrap font-sans text-sm text-ink-soft">
                  {formatPrice(service.price_cents)} · {service.duration_minutes} min
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-4">
        <p className="font-sans text-sm text-ink-soft">
          {canContinue
            ? `Duração total: ${totalDurationMinutes} min`
            : "Selecione ao menos um serviço"}
        </p>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="rounded-sm bg-clay px-6 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-soft"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
