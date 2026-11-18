"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { getAvailableSlots } from "@/lib/actions/bookings";
import { SALON_TIMEZONE } from "@/lib/availability/calculate-slots";

interface Slot {
  start: string;
  end: string;
}

interface SlotPickerProps {
  serviceIds: string[];
  totalDurationMinutes: number;
  onBack: () => void;
  onSelect: (slot: Slot) => void;
}

interface SlotsResult {
  key: string;
  slots: Slot[];
}

interface SlotsError {
  key: string;
  message: string;
}

function todayISO(): string {
  return formatInTimeZone(new Date(), SALON_TIMEZONE, "yyyy-MM-dd");
}

function requestKey(serviceIds: string[], dateISO: string): string {
  return `${serviceIds.join(",")}|${dateISO}`;
}

export function SlotPicker({
  serviceIds,
  totalDurationMinutes,
  onBack,
  onSelect,
}: SlotPickerProps) {
  const [dateISO, setDateISO] = useState(() => todayISO());
  const [result, setResult] = useState<SlotsResult | null>(null);
  const [error, setError] = useState<SlotsError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const key = `${requestKey(serviceIds, dateISO)}|${attempt}`;

  // O efeito so dispara a busca; todo setState acontece dentro da promise,
  // nunca de forma sincrona no corpo do efeito (regra react-hooks/set-state-in-effect).
  // O estado de carregamento e derivado no render comparando a chave da
  // resposta guardada com a chave atual.
  useEffect(() => {
    if (!dateISO) return;
    let cancelled = false;
    const currentKey = `${requestKey(serviceIds, dateISO)}|${attempt}`;

    getAvailableSlots({ serviceIds, dateISO })
      .then((slots) => {
        if (cancelled) return;
        setResult({
          key: currentKey,
          slots: slots.map((slot) => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
          })),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setError({
          key: currentKey,
          message: "Não foi possível buscar os horários agora. Tente novamente.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [serviceIds, dateISO, attempt]);

  const slots = result?.key === key ? result.slots : null;
  const errorMessage = slots === null && error?.key === key ? error.message : null;
  const isLoading = dateISO !== "" && slots === null && errorMessage === null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Escolha o horário</h1>
      <p className="font-sans text-sm text-ink-soft">
        Duração total: {totalDurationMinutes} min
      </p>

      <label className="flex w-fit flex-col gap-2 font-sans text-sm text-ink">
        Data
        <input
          type="date"
          min={todayISO()}
          value={dateISO}
          onChange={(event) => { setDateISO(event.target.value); setAttempt(current => current + 1); }}
          className="rounded-sm border border-ink-soft/60 bg-cream px-3 py-2 text-ink outline-none focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40"
        />
      </label>

      {isLoading && (
        <p className="font-sans text-sm text-ink-soft">Buscando horários...</p>
      )}

      {errorMessage && (
        <div role="alert"><p className="font-sans text-sm text-clay">{errorMessage}</p><button type="button" onClick={() => setAttempt(current => current + 1)} className="mt-3 min-h-11 underline">Tentar novamente</button></div>
      )}

      {slots !== null && slots.length === 0 && (
        <p className="font-sans text-sm text-ink-soft">
          Nenhum horário livre nesse dia. Escolha outra data.
        </p>
      )}

      {slots !== null && slots.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <li key={slot.start}>
              <button
                type="button"
                onClick={() => onSelect(slot)}
                className="min-h-11 w-full rounded-sm border border-ink-soft/60 px-3 py-2 font-sans text-sm text-ink transition-colors hover:border-clay hover:text-clay"
              >
                {formatInTimeZone(new Date(slot.start), SALON_TIMEZONE, "HH:mm")}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-fit font-sans text-sm text-ink-soft underline"
      >
        Voltar
      </button>
    </div>
  );
}
