# Fluxo Público (UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a experiência pública do site — tela inicial, wizard de agendamento e tela de sucesso — usando as Server Actions já prontas (Plano 2) e uma direção visual própria, não genérica.

**Architecture:** Server Components para busca de dados (catálogo público via `lib/supabase/server.ts`), Client Components só onde há estado/interação (o wizard). Direção visual: fundo escuro quente (`ink`) como "momento de marca" na home, painel claro (`cream`) como superfície funcional no wizard — invertendo o padrão "fundo claro + serifada + terracota" que é o default genérico de IA. Serif (`Fraunces`) só para títulos, sans (`Manrope`) pro resto.

**Tech Stack:** Next.js App Router (Server + Client Components), Tailwind CSS v4 (tema via `@theme` em `globals.css`), `next/font/google`, Playwright.

**Spec:** [docs/superpowers/specs/2026-09-03-sistema-agendamento-design.md](../specs/2026-09-03-sistema-agendamento-design.md)

## Global Constraints

- TypeScript `strict: true`; `any` proibido, sem `@ts-ignore`
- Nomes em inglês no código; comentários e commits em português
- Sem `console.log` em código commitado
- Server Components por padrão; `"use client"` só quando precisar de estado/evento do browser, o mais fundo possível na árvore
- Estados de loading, erro e vazio são obrigatórios em toda tela que busca dado
- Sem `useEffect` pra derivar estado — só pra efeito real (buscar dado no servidor a partir de uma mudança)
- Responsivo de verdade, testar em 375px
- Evitar os defaults genéricos de IA: sem gradiente roxo/azul, sem card-com-sombra idêntico pra tudo, sem emoji como ícone, sem tudo centralizado, sem eyebrow em CAIXA ALTA, sem "→" decorativo em botão/link
- Copy em português, no tom da profissional — direto, sem "Build faster, ship smarter"
- Preço sempre formatado a partir de `price_cents` (nunca float)
- `appointments`/`appointment_services` continuam sem RLS pra `anon`/`authenticated` — a tela de sucesso usa `lib/supabase/admin.ts`, nunca o client anon, pra ler um agendamento específico

## Direção visual (tokens)

**Cor** — paleta quente ancorada nas fotos reais da profissional (editorial, pouco iluminada, tons terrosos), não no default cream+serifada+terracota:
- `--color-ink: #211c18` — fundo dominante da home (não é preto puro, é marrom bem escuro)
- `--color-ink-soft: #4a3f37` — texto secundário sobre `cream`
- `--color-cream: #f7f1e8` — superfície clara (wizard, cards, texto sobre `ink`)
- `--color-clay: #a6431f` — cor de ação (botões, links, foco)
- `--color-clay-dark: #7a3016` — hover do `clay`
- `--color-sand: #d8c3a5` — bordas, divisores, neutro secundário
- `--color-gold: #9c7a3c` — reservado pra detalhes finos (não usado nesta fase)

**Tipografia** — `Fraunces` (serifada, só títulos, peso 500/600) + `Manrope` (sans, todo o resto). Escala: título de hero ~40-48px, títulos de seção ~24px, corpo ~16px, texto pequeno ~14px.

**Layout** — assimétrico, alinhado à esquerda (não centralizado). Lista de serviços como lista dividida por linha (estilo cardápio), não cards com sombra. Indicador de passo do wizard é texto simples ("Passo 1 de 3"), não círculos numerados com conector — a única concessão a "sequência numerada" é justificada aqui porque o conteúdo é mesmo uma sequência de 3 passos.

---

## Task 1: Tokens de design e fontes

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: utilitários Tailwind `bg-ink`, `text-ink`, `bg-cream`, `text-cream`, `bg-clay`, `hover:bg-clay-dark`, `border-sand`, `text-ink-soft`, `font-display`, `font-sans` — consumidos por todas as tasks seguintes deste plano

- [ ] **Step 1: Substituir `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-ink: #211c18;
  --color-ink-soft: #4a3f37;
  --color-cream: #f7f1e8;
  --color-clay: #a6431f;
  --color-clay-dark: #7a3016;
  --color-sand: #d8c3a5;
  --color-gold: #9c7a3c;

  --font-display: var(--font-fraunces);
  --font-sans: var(--font-manrope);
}

body {
  background-color: var(--color-cream);
  color: var(--color-ink);
}
```

- [ ] **Step 2: Substituir `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beauty Day Juliana",
  description: "Agende seu horário com a Juliana — corte, coloração, escova e manicure.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verificar visualmente**

```bash
npm run dev
```

Abra `http://localhost:3000` num navegador (ou use uma ferramenta de browser), tire um screenshot. Confirme: fundo cor creme, texto com a fonte sans (Manrope — sem serifa), sem vestígio do tema escuro/claro automático do template antigo. Pare o servidor (Ctrl+C) depois.

- [ ] **Step 4: Rodar o build**

```bash
npm run build
npx tsc --noEmit
npm run lint
```

Expected: tudo limpo.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: adiciona tokens de design (paleta e tipografia) e fontes Fraunces/Manrope

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Tela inicial

**Files:**
- Create: `supabase/migrations/0002_seed_services.sql`
- Create: `lib/format.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `createClient` (server, de `lib/supabase/server.ts`, Plano 1) — leitura pública de `services` (RLS já permite `anon` ler `active = true`)
- Produces: `formatPrice(cents: number): string` (de `lib/format.ts`) — consumido pelas Tasks 3 e 4

- [ ] **Step 1: Escrever a migration de seed**

```sql
-- supabase/migrations/0002_seed_services.sql

insert into services (name, price_cents, duration_minutes) values
  ('Corte', 8000, 45),
  ('Escova', 6000, 40),
  ('Coloração', 22000, 150),
  ('Manicure', 4500, 50);
```

- [ ] **Step 2 [ação manual sua]: Aplicar a migration**

No SQL Editor do Supabase, cole e rode o conteúdo acima. São os 4 serviços de exemplo que você mesmo citou no pedido original — dá pra editar preço/nome depois pelo painel admin (Plano 4), ou direto no banco por enquanto.

- [ ] **Step 3: Criar `lib/format.ts`**

```ts
export function formatPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
```

- [ ] **Step 4: Substituir `app/page.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

interface ServiceTeaser {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price_cents, duration_minutes")
    .eq("active", true)
    .order("duration_minutes", { ascending: true });

  const featuredServices = (services ?? []) as ServiceTeaser[];

  return (
    <>
      <section className="bg-ink text-cream">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:py-24">
          <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-sm md:w-2/5">
            <Image
              src="/images/Juliana_2.jpg"
              alt="Juliana, profissional do Beauty Day"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 768px) 40vw, 90vw"
            />
          </div>
          <div className="flex flex-col gap-6 md:w-3/5">
            <p className="font-sans text-sm text-sand">Beauty Day Juliana</p>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Beleza é ter um horário guardado só pra você.
            </h1>
            <p className="max-w-md font-sans text-base leading-relaxed text-sand">
              Corte, coloração, escova. Escolha o serviço, veja o horário livre
              e confirme — sem trocar mensagem no WhatsApp.
            </p>
            <Link
              href="/agendar"
              className="w-fit rounded-sm bg-clay px-6 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-clay-dark"
            >
              Agendar meu horário
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-full">
            <Image
              src="/images/Juliana_1.jpg"
              alt="Juliana no dia a dia do salão"
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <p className="font-sans text-ink-soft">
            Sou a Juliana — atendo sozinha, com hora marcada, pra dar atenção
            de verdade a cada cliente.
          </p>
        </div>
      </section>

      {featuredServices.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <h2 className="font-display text-2xl text-ink">Serviços</h2>
          <ul className="mt-6 divide-y divide-sand/60 border-y border-sand/60">
            {featuredServices.map((service) => (
              <li
                key={service.id}
                className="flex items-baseline justify-between gap-4 py-4 font-sans"
              >
                <span className="text-ink">{service.name}</span>
                <span className="whitespace-nowrap text-sm text-ink-soft">
                  {formatPrice(service.price_cents)} · {service.duration_minutes} min
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-sand/60 px-6 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 font-sans text-sm text-ink-soft">
          <p className="text-ink">Beauty Day Juliana</p>
          <p>WhatsApp: (11) 90000-0000</p>
          <p>Instagram: @beautydayjuliana</p>
        </div>
      </footer>
    </>
  );
}
```

- [ ] **Step 5: Verificar visualmente**

```bash
npm run dev
```

Abra `http://localhost:3000`, confirme: hero escuro com a foto e o headline, seção "sobre" com a segunda foto, lista de serviços mostrando os 4 itens reais com preço em R$ e duração (prova de que a migration do Step 2 foi aplicada), rodapé. Redimensione pra 375px de largura e confirme que não quebra. Pare o servidor.

- [ ] **Step 6: Rodar o build**

```bash
npm run build
npx tsc --noEmit
npm run lint
```

Expected: tudo limpo.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations lib/format.ts app/page.tsx
git commit -m "feat: adiciona tela inicial com hero, sobre e lista de servicos

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Wizard de agendamento

**Files:**
- Create: `app/agendar/page.tsx`
- Create: `components/booking/BookingWizard.tsx`
- Create: `components/booking/ServiceSelector.tsx`
- Create: `components/booking/SlotPicker.tsx`
- Create: `components/booking/ContactForm.tsx`

**Interfaces:**
- Consumes: `getAvailableSlots`, `createBooking` (de `lib/actions/bookings.ts`, Plano 2); `createClient` (server, Plano 1); `formatPrice` (Task 2)
- Produces: rota `/agendar` — consumida pela Task 5 (e2e) e pelo link "Agendar meu horário" da home (Task 2, já criado)

- [ ] **Step 1: Criar `components/booking/ServiceSelector.tsx`**

```tsx
"use client";

import { formatPrice } from "@/lib/format";
import type { WizardService } from "./BookingWizard";

interface ServiceSelectorProps {
  services: WizardService[];
  selectedServiceIds: string[];
  onToggle: (serviceId: string) => void;
  onContinue: () => void;
}

export function ServiceSelector({
  services,
  selectedServiceIds,
  onToggle,
  onContinue,
}: ServiceSelectorProps) {
  const canContinue = selectedServiceIds.length > 0;
  const totalDurationMinutes = services
    .filter((service) => selectedServiceIds.includes(service.id))
    .reduce((sum, service) => sum + service.duration_minutes, 0);

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
```

- [ ] **Step 2: Criar `components/booking/SlotPicker.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { getAvailableSlots } from "@/lib/actions/bookings";

const SALON_TIMEZONE = "America/Sao_Paulo";

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

function todayISO(): string {
  return formatInTimeZone(new Date(), SALON_TIMEZONE, "yyyy-MM-dd");
}

export function SlotPicker({
  serviceIds,
  totalDurationMinutes,
  onBack,
  onSelect,
}: SlotPickerProps) {
  const [dateISO, setDateISO] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getAvailableSlots({ serviceIds, dateISO })
      .then((result) => {
        if (cancelled) return;
        setSlots(
          result.map((slot) => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
          }))
        );
        setStatus("idle");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [serviceIds, dateISO]);

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
          onChange={(event) => setDateISO(event.target.value)}
          className="rounded-sm border border-sand bg-cream px-3 py-2 text-ink"
        />
      </label>

      {status === "loading" && (
        <p className="font-sans text-sm text-ink-soft">Buscando horários...</p>
      )}

      {status === "error" && (
        <p className="font-sans text-sm text-clay">
          Não foi possível buscar os horários agora. Tente novamente.
        </p>
      )}

      {status === "idle" && slots !== null && slots.length === 0 && (
        <p className="font-sans text-sm text-ink-soft">
          Nenhum horário livre nesse dia. Escolha outra data.
        </p>
      )}

      {status === "idle" && slots !== null && slots.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <li key={slot.start}>
              <button
                type="button"
                onClick={() => onSelect(slot)}
                className="w-full rounded-sm border border-sand px-3 py-2 font-sans text-sm text-ink transition-colors hover:border-clay hover:text-clay"
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
```

- [ ] **Step 3: Criar `components/booking/ContactForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { createBooking } from "@/lib/actions/bookings";
import { formatPrice } from "@/lib/format";
import type { WizardService } from "./BookingWizard";

const SALON_TIMEZONE = "America/Sao_Paulo";

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

    const result = await createBooking({
      serviceIds: selectedServices.map((service) => service.id),
      clientName,
      clientWhatsapp,
      clientEmail,
      startTime: new Date(slot.start),
    });

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
          className="rounded-sm border border-sand bg-cream px-3 py-2 text-ink"
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
          className="rounded-sm border border-sand bg-cream px-3 py-2 text-ink"
        />
      </label>

      <label className="flex flex-col gap-2 font-sans text-sm text-ink">
        E-mail
        <input
          type="email"
          required
          value={clientEmail}
          onChange={(event) => setClientEmail(event.target.value)}
          className="rounded-sm border border-sand bg-cream px-3 py-2 text-ink"
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
```

- [ ] **Step 4: Criar `components/booking/BookingWizard.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ServiceSelector } from "./ServiceSelector";
import { SlotPicker } from "./SlotPicker";
import { ContactForm } from "./ContactForm";

export interface WizardService {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

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
```

- [ ] **Step 5: Criar `app/agendar/page.tsx`**

```tsx
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
```

- [ ] **Step 6: Rodar o build antes de testar no navegador**

```bash
npm run build
npx tsc --noEmit
npm run lint
```

Expected: tudo limpo (isso pega erro de tipo/import antes de gastar tempo clicando na UI).

- [ ] **Step 7: Testar o fluxo completo no navegador (o teste real desta task)**

```bash
npm run dev
```

Numa ferramenta de browser: abra `http://localhost:3000/agendar`, selecione 1 ou 2 serviços, clique "Continuar", escolha uma data (deve buscar horários — confira o estado de carregamento aparecendo e sumindo), clique num horário, preencha nome/WhatsApp/e-mail com dados de teste, clique "Confirmar agendamento". Confirme que é redirecionado pra `/sucesso/<algum-id>` (mesmo que essa página ainda não exista de verdade — ela é a Task 4; o Next mostra 404 aqui, o que já confirma que o redirecionamento e a criação do agendamento funcionaram). Redimensione pra 375px em algum ponto do fluxo e confirme que não quebra. Pare o servidor.

- [ ] **Step 8: Limpar o agendamento de teste criado no Step 7**

O `id` do agendamento de teste apareceu na URL `/sucesso/<id>` do Step 7. Rode no SQL Editor do Supabase (ou peça pro controlador rodar, se você não tiver acesso a partir daqui):

```sql
delete from appointments where id = '<id-copiado-da-url>';
```

- [ ] **Step 9: Commit**

```bash
git add app/agendar components/booking
git commit -m "feat: adiciona wizard de agendamento (servicos, horario, contato)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Tela de sucesso

**Files:**
- Create: `app/sucesso/[id]/page.tsx`
- Create: `components/booking/AddToGoogleCalendar.tsx`

**Interfaces:**
- Consumes: `createAdminClient` (Plano 1); `formatPrice` (Task 2)
- Produces: rota `/sucesso/[id]` — consumida pela Task 3 (redirecionamento do `ContactForm`) e pela Task 5 (e2e)

- [ ] **Step 1: Criar `components/booking/AddToGoogleCalendar.tsx`**

```tsx
function toGoogleCalendarDate(iso: string): string {
  const date = new Date(iso);
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

interface AddToGoogleCalendarProps {
  title: string;
  startISO: string;
  endISO: string;
}

export function AddToGoogleCalendar({
  title,
  startISO,
  endISO,
}: AddToGoogleCalendarProps) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleCalendarDate(startISO)}/${toGoogleCalendarDate(endISO)}`,
    location: "Beauty Day Juliana",
  });

  return (
    <a
      href={`https://calendar.google.com/calendar/render?${params.toString()}`}
      target="_blank"
      rel="noopener noreferrer"
      className="w-fit rounded-sm border border-clay px-6 py-3 font-sans text-sm font-medium text-clay transition-colors hover:bg-clay hover:text-cream"
    >
      Adicionar ao Google Calendar
    </a>
  );
}
```

- [ ] **Step 2: Criar `app/sucesso/[id]/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Rodar o build**

```bash
npm run build
npx tsc --noEmit
npm run lint
```

Expected: tudo limpo.

- [ ] **Step 4: Testar de ponta a ponta no navegador**

```bash
npm run dev
```

Repita o fluxo do Task 3 Step 7 (agendar de novo com dados de teste) e confirme que desta vez `/sucesso/<id>` mostra os dados reais do agendamento e o botão "Adicionar ao Google Calendar" (clique nele e confira que abre o Google Calendar com o evento pré-preenchido). Limpe o agendamento de teste no banco (mesmo passo do Task 3 Step 8). Pare o servidor.

- [ ] **Step 5: Commit**

```bash
git add app/sucesso components/booking/AddToGoogleCalendar.tsx
git commit -m "feat: adiciona tela de sucesso com resumo e link do Google Calendar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Teste e2e do fluxo crítico

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/booking-flow.spec.ts`
- Modify: `package.json` (script `test:e2e`)

**Interfaces:**
- Consumes: rotas `/`, `/agendar`, `/sucesso/[id]` (Tasks 2-4)

**Nota importante:** `lib/supabase/admin.ts` (Plano 1) começa com `import "server-only"` — um guard que só funciona dentro do build/runtime do Next.js (o Next substitui esse import por um módulo vazio no bundle de servidor; fora do Next, o pacote real sempre lança erro ao ser importado). O processo do Playwright roda em Node puro, fora do Next — importar `lib/supabase/admin.ts` diretamente no teste vai lançar esse erro. Por isso o teste cria seu próprio client mínimo (Step 4), sem o guard, em vez de importar o de produção.

- [ ] **Step 1: Instalar o Playwright e o dotenv**

```bash
npm install -D @playwright/test dotenv
npx playwright install chromium
```

(`dotenv` carrega o `.env.local` no processo do Playwright — o `next dev` que o Playwright sobe como `webServer` já carrega isso sozinho, mas o processo do teste em si, que precisa das credenciais só pra limpar o agendamento criado, não carrega automaticamente.)

- [ ] **Step 2: Criar `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Adicionar o script `test:e2e` no `package.json`**

Adicione `"test:e2e": "playwright test"` ao objeto `scripts`, sem remover os já existentes.

- [ ] **Step 4: Criar `e2e/booking-flow.spec.ts`**

```ts
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

  test.afterEach(async () => {
    if (createdAppointmentId) {
      const supabase = createTestCleanupClient();
      await supabase.from("appointments").delete().eq("id", createdAppointmentId);
      createdAppointmentId = undefined;
    }
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

    const uniqueEmail = `teste-e2e-${Date.now()}@example.com`;
    await page.getByLabel("Nome completo").fill("Cliente de Teste E2E");
    await page.getByLabel("WhatsApp").fill("(11) 98888-7777");
    await page.getByLabel("E-mail").fill(uniqueEmail);
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();

    await expect(page).toHaveURL(/\/sucesso\/.+/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Agendamento confirmado" })
    ).toBeVisible();
    await expect(page.getByText("Adicionar ao Google Calendar")).toBeVisible();

    createdAppointmentId = page.url().split("/sucesso/")[1];
  });
});
```

- [ ] **Step 5: Rodar o teste**

```bash
npm run test:e2e
```

Expected: 1 teste passando. O Playwright sobe o `npm run dev` sozinho (config do Step 2), roda o fluxo completo contra o Supabase real, e o `afterEach` apaga o agendamento criado — confira depois no Supabase que não sobrou nenhum agendamento de teste (`select * from appointments order by created_at desc limit 5`).

Se o teste falhar por timeout esperando o botão de horário: confira se a migration de seed (Task 2, Step 2) foi mesmo aplicada e se hoje é um dia de expediente (terça a sábado) — se não for, o teste vai rodar num dia sem horário livre. Ajuste a data manualmente no teste só se isso acontecer (ex: force uma data futura conhecida como dia de expediente em vez de usar "hoje").

- [ ] **Step 6: Rodar a suíte inteira (unit + e2e) e o gate de build**

```bash
npm test
npx tsc --noEmit
npm run build
npm run lint
npm run test:e2e
```

Expected: tudo limpo.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts e2e package.json package-lock.json
git commit -m "test: adiciona teste e2e do fluxo critico de agendamento

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
