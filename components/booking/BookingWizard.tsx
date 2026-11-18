"use client";

import { useState } from "react";
import { ServiceSelector } from "./ServiceSelector";
import { SlotPicker } from "./SlotPicker";
import { ContactForm } from "./ContactForm";
import type { PublicService } from "@/lib/public-services";

export type WizardService = PublicService;

interface Slot {
  start: string;
  end: string;
}

type Step = "servicos" | "horario" | "contato";

export function BookingWizard({ services }: { services: WizardService[] }) {
  const [step, setStep] = useState<Step>("servicos");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const selectedServices = services.filter((service) =>
    selectedServiceIds.includes(service.id)
  );
  const totalDurationMinutes = selectedServices.reduce(
    (sum, service) => sum + service.duration_minutes,
    0
  );

  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <p className="mb-6 font-sans text-sm text-ink-soft">
        {step === "servicos" && "Passo 1 de 3"}
        {step === "horario" && "Passo 2 de 3"}
        {step === "contato" && "Passo 3 de 3"}
      </p>

      {step === "servicos" && (
        <ServiceSelector
          services={services}
          selectedServiceIds={selectedServiceIds}
          totalDurationMinutes={totalDurationMinutes}
          onToggle={toggleService}
          onContinue={() => setStep("horario")}
        />
      )}

      {step === "horario" && (
        <SlotPicker
          serviceIds={selectedServiceIds}
          totalDurationMinutes={totalDurationMinutes}
          onBack={() => setStep("servicos")}
          onSelect={(slot) => {
            setSelectedSlot(slot);
            setStep("contato");
          }}
        />
      )}

      {step === "contato" && selectedSlot && (
        <ContactForm
          selectedServices={selectedServices}
          slot={selectedSlot}
          onBack={() => setStep("horario")}
        />
      )}
    </div>
  );
}
