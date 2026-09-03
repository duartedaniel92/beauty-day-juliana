# Fundação — Sistema de Agendamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar a base do projeto — scaffold Next.js, banco Supabase com schema e proteção anti-overbooking, e o motor de disponibilidade totalmente testado — antes de construir o fluxo do cliente e o painel admin (planos seguintes).

**Architecture:** Next.js App Router + TypeScript strict + Tailwind CSS. Supabase (Postgres + Auth) como único backend, sem servidor separado. Motor de disponibilidade como função pura, sem I/O, testável isoladamente de banco e UI.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Zod, date-fns / date-fns-tz, Vitest.

**Spec:** [docs/superpowers/specs/2026-09-03-sistema-agendamento-design.md](../specs/2026-09-03-sistema-agendamento-design.md)

## Global Constraints

- TypeScript `strict: true`; `any` proibido, sem `@ts-ignore` (spec seção 3 / CLAUDE.md seção 5)
- Nomes em inglês no código; comentários e commits em português (CLAUDE.md seção 5)
- Sem `console.log` em código commitado
- Fuso horário do salão é `America/Sao_Paulo`, tratado num único lugar: o motor de disponibilidade (spec seção 4)
- Nenhum segredo (chave, senha, token) commitado — `.env.local` fica fora do git
- Preço sempre em `price_cents` (integer), nunca float

---

## Task 1: Inicializar projeto Next.js

**Files:**
- Create: projeto inteiro via `create-next-app` (`package.json`, `tsconfig.json`, `next.config.ts`, `app/`, `.gitignore`, etc.)
- Move: `Juliana_1.jpg`, `Juliana_2.jpg` → `public/images/`

**Interfaces:**
- Produces: scaffold do projeto com scripts npm (`dev`, `build`, `start`, `lint`); dependências `zod`, `date-fns`, `date-fns-tz`, `@supabase/supabase-js`, `@supabase/ssr` instaladas; `vitest` e `tsx` como dev dependencies

- [ ] **Step 1: Mover as imagens existentes pra fora temporariamente**

`create-next-app` recusa rodar num diretório que tenha arquivos fora de uma lista pequena de "seguros" (`.git`, `README.md`, etc.) — `.jpg` não está nela.

```bash
mkdir ../beauty-day-juliana-tmp-assets
mv Juliana_1.jpg Juliana_2.jpg ../beauty-day-juliana-tmp-assets/
```

- [ ] **Step 2: Rodar o scaffold do Next.js**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --no-turbopack --use-npm
```

- [ ] **Step 3: Verificar que o build funciona**

Run: `npm run build`
Expected: build completa sem erro nem warning de TypeScript.

- [ ] **Step 4: Mover as imagens pra dentro de `public/images/`**

```bash
mkdir public/images
mv ../beauty-day-juliana-tmp-assets/Juliana_1.jpg public/images/
mv ../beauty-day-juliana-tmp-assets/Juliana_2.jpg public/images/
rmdir ../beauty-day-juliana-tmp-assets
```

- [ ] **Step 5: Instalar as dependências usadas pelo restante do plano**

```bash
npm install zod date-fns date-fns-tz @supabase/supabase-js @supabase/ssr
npm install -D vitest tsx
```

- [ ] **Step 6: Confirmar que `.env*.local` está no `.gitignore`**

Abra `.gitignore` (gerado pelo template) e confirme que a linha `.env*.local` está presente. Se não estiver, adicione.

- [ ] **Step 7: git init e primeiro commit**

```bash
git init
git add .
git commit -m "chore: inicializa projeto Next.js com TypeScript, Tailwind e dependencias base"
```

---

## Task 2: Motor de disponibilidade (TDD)

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/availability/calculate-slots.ts`
- Create: `lib/availability/calculate-slots.test.ts`
- Modify: `package.json` (adicionar script `test`)

**Interfaces:**
- Consumes: nenhuma — função pura, sem banco nem rede
- Produces: `calculateAvailableSlots(params): Slot[]`, tipos `BusinessHours`, `BusyInterval`, `Slot` (de `lib/availability/calculate-slots.ts`) — consumidos pelas Server Actions no Plano 2

- [ ] **Step 1: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 2: Adicionar o script `test` no `package.json`**

Adicione `"test": "vitest run"` ao objeto `scripts` já gerado pelo `create-next-app`, sem remover `dev`/`build`/`start`/`lint`.

- [ ] **Step 3: Escrever o arquivo de teste**

```ts
// lib/availability/calculate-slots.test.ts
import { describe, expect, it } from 'vitest'
import { calculateAvailableSlots, type BusinessHours } from './calculate-slots'

const WEEKLY_HOURS: BusinessHours[] = [
  { dayOfWeek: 0, startTime: null, endTime: null, isWorking: false },
  { dayOfWeek: 1, startTime: null, endTime: null, isWorking: false },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isWorking: true },
]

// 2026-09-08 e uma terca-feira; 2026-09-07 e segunda (folga)
const EARLY_MORNING = new Date('2026-09-08T06:00:00-03:00')

describe('calculateAvailableSlots', () => {
  it('retorna vazio se o dia e de folga', () => {
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-07',
      totalDurationMinutes: 60,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now: EARLY_MORNING,
    })
    expect(slots).toEqual([])
  })

  it('gera o primeiro slot no inicio do expediente', () => {
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 60,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now: EARLY_MORNING,
    })
    expect(slots[0].start.toISOString()).toBe(new Date('2026-09-08T09:00:00-03:00').toISOString())
  })

  it('nao gera slot cuja duracao total ultrapasse o fim do expediente', () => {
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 540, // 9h — exatamente o expediente inteiro (09h-18h)
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now: EARLY_MORNING,
    })
    expect(slots).toHaveLength(1)
    expect(slots[0].start.toISOString()).toBe(new Date('2026-09-08T09:00:00-03:00').toISOString())
  })

  it('exclui slots que colidem com um horario ocupado', () => {
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 60,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [
        { start: new Date('2026-09-08T10:00:00-03:00'), end: new Date('2026-09-08T11:00:00-03:00') },
      ],
      now: EARLY_MORNING,
    })
    const overlapping = slots.filter(
      (s) =>
        s.start.getTime() < new Date('2026-09-08T11:00:00-03:00').getTime() &&
        s.end.getTime() > new Date('2026-09-08T10:00:00-03:00').getTime()
    )
    expect(overlapping).toEqual([])
  })

  it('respeita a antecedencia minima de 2 horas a partir de "agora"', () => {
    const now = new Date('2026-09-08T09:30:00-03:00')
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 30,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now,
    })
    expect(slots[0].start.getTime()).toBeGreaterThanOrEqual(now.getTime() + 120 * 60_000)
  })

  it('soma corretamente a duracao de multiplos servicos selecionados', () => {
    // corte (30min) + coloracao (90min) = 120min
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 120,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [
        { start: new Date('2026-09-08T10:30:00-03:00'), end: new Date('2026-09-08T11:00:00-03:00') },
      ],
      now: EARLY_MORNING,
    })
    const forbidden = slots.some(
      (s) => s.start.getTime() === new Date('2026-09-08T09:30:00-03:00').getTime()
    )
    expect(forbidden).toBe(false)
  })
})
```

- [ ] **Step 4: Rodar os testes e confirmar que falham**

Run: `npm test`
Expected: FAIL — `Cannot find module './calculate-slots'`

- [ ] **Step 5: Escrever a implementação**

```ts
// lib/availability/calculate-slots.ts
import { fromZonedTime } from 'date-fns-tz'

const SALON_TIMEZONE = 'America/Sao_Paulo'
const MINIMUM_NOTICE_MINUTES = 120
const SLOT_STEP_MINUTES = 15

export interface BusinessHours {
  dayOfWeek: number // 0 (domingo) a 6 (sabado)
  startTime: string | null // "HH:mm", null se nao trabalha
  endTime: string | null
  isWorking: boolean
}

export interface BusyInterval {
  start: Date
  end: Date
}

export interface Slot {
  start: Date
  end: Date
}

export function calculateAvailableSlots(params: {
  dateISO: string // "YYYY-MM-DD", data no calendario local do salao
  totalDurationMinutes: number
  businessHours: BusinessHours[]
  busyIntervals: BusyInterval[]
  now?: Date
}): Slot[] {
  const { dateISO, totalDurationMinutes, businessHours, busyIntervals } = params
  const now = params.now ?? new Date()

  // dia da semana calculado em UTC pra ser independente do fuso do servidor
  const dayOfWeek = new Date(`${dateISO}T00:00:00Z`).getUTCDay()
  const hours = businessHours.find((h) => h.dayOfWeek === dayOfWeek)

  if (!hours || !hours.isWorking || !hours.startTime || !hours.endTime) {
    return []
  }

  const dayStart = fromZonedTime(`${dateISO}T${hours.startTime}:00`, SALON_TIMEZONE)
  const dayEnd = fromZonedTime(`${dateISO}T${hours.endTime}:00`, SALON_TIMEZONE)
  const earliestBookable = new Date(now.getTime() + MINIMUM_NOTICE_MINUTES * 60_000)

  const slots: Slot[] = []
  let cursor = dayStart

  while (cursor.getTime() + totalDurationMinutes * 60_000 <= dayEnd.getTime()) {
    const slotStart = cursor
    const slotEnd = new Date(cursor.getTime() + totalDurationMinutes * 60_000)

    const isPastMinimumNotice = slotStart.getTime() >= earliestBookable.getTime()
    const overlapsBusy = busyIntervals.some(
      (busy) => slotStart.getTime() < busy.end.getTime() && slotEnd.getTime() > busy.start.getTime()
    )

    if (isPastMinimumNotice && !overlapsBusy) {
      slots.push({ start: slotStart, end: slotEnd })
    }

    cursor = new Date(cursor.getTime() + SLOT_STEP_MINUTES * 60_000)
  }

  return slots
}
```

- [ ] **Step 6: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: 6 passed

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts package.json lib/availability
git commit -m "feat: motor de disponibilidade com antecedencia minima e bloqueio de horarios"
```

---

## Task 3: Configurar Supabase

**Files:**
- Create: `.env.example`
- Create: `.env.local` (não commitado)
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create (temporário, removido no final): `scripts/verify-supabase-connection.ts`

**Interfaces:**
- Consumes: nenhuma
- Produces: `createClient(): SupabaseClient` (browser, de `lib/supabase/client.ts`); `createClient(): Promise<SupabaseClient>` (server, de `lib/supabase/server.ts`); `createAdminClient(): SupabaseClient` (service role, de `lib/supabase/admin.ts`) — consumidos pelas Server Actions e páginas no Plano 2

- [ ] **Step 1 [ação manual sua]: Criar o projeto no Supabase**

Acesse app.supabase.com → New Project → nome `beauty-day-juliana`, região São Paulo se disponível, defina e anote a senha do banco. Aguarde provisionar (~2 min).

- [ ] **Step 2 [ação manual sua]: Copiar as credenciais**

Em Project Settings → API, copie: `Project URL`, `anon public` key, `service_role` key (secreta — nunca compartilhar nem commitar).

- [ ] **Step 3: Criar `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 4: Criar `.env.local`**

Mesmas três variáveis do Step 3, preenchidas com os valores reais copiados no Step 2. Este arquivo não é commitado (já garantido no `.gitignore` na Task 1).

- [ ] **Step 5: Criar `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 6: Criar `lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // chamado de um Server Component sem permissao de escrever cookie;
            // seguro ignorar quando o middleware ja atualiza a sessao
          }
        },
      },
    }
  )
}
```

- [ ] **Step 7: Criar `lib/supabase/admin.ts`**

```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente com service role — ignora RLS. So pode ser importado em codigo
// que roda exclusivamente no servidor (Server Actions). Nunca importar
// este arquivo em um Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

- [ ] **Step 8 [ação manual sua]: Criar o usuário único da profissional**

No dashboard: Authentication → Users → Add user. E-mail e senha que ela vai usar pra logar no painel admin.

- [ ] **Step 9: Criar um script temporário pra verificar a conexão**

```ts
// scripts/verify-supabase-connection.ts
import { createAdminClient } from '../lib/supabase/admin'

async function main() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Falha ao conectar:', error.message)
    process.exit(1)
  }
  console.log(`Conectado. ${data.users.length} usuario(s) encontrado(s).`)
}

main()
```

- [ ] **Step 10: Rodar e confirmar a conexão**

Run: `npx tsx scripts/verify-supabase-connection.ts`
Expected: `Conectado. 1 usuario(s) encontrado(s).`

- [ ] **Step 11: Remover o script temporário**

```bash
rm scripts/verify-supabase-connection.ts
```

- [ ] **Step 12: Commit**

```bash
git add .env.example lib/supabase
git commit -m "feat: configura clientes Supabase (browser, server, admin)"
```

---

## Task 4: Migrations do banco

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`

**Interfaces:**
- Consumes: projeto Supabase da Task 3
- Produces: tabelas `services`, `business_hours`, `appointments`, `appointment_services` com RLS — consumidas pelas Server Actions no Plano 2

- [ ] **Step 1: Escrever o arquivo de migration**

```sql
-- supabase/migrations/0001_initial_schema.sql

create extension if not exists btree_gist;

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table business_hours (
  day_of_week smallint primary key check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  is_working boolean not null default true
);

-- 0=domingo, 1=segunda: fechado. 2=terca a 6=sabado: 09h-18h.
-- Editavel depois pelo painel de configuracoes (Plano 3).
insert into business_hours (day_of_week, start_time, end_time, is_working) values
  (0, null, null, false),
  (1, null, null, false),
  (2, '09:00', '18:00', true),
  (3, '09:00', '18:00', true),
  (4, '09:00', '18:00', true),
  (5, '09:00', '18:00', true),
  (6, '09:00', '18:00', true);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('booking', 'block')),
  client_name text,
  client_whatsapp text,
  client_email text,
  start_time timestamptz not null,
  end_time timestamptz not null check (end_time > start_time),
  notes text,
  created_at timestamptz not null default now(),
  constraint client_data_required_for_booking
    check (
      type = 'block'
      or (client_name is not null and client_whatsapp is not null and client_email is not null)
    ),
  constraint no_overlap
    exclude using gist (tsrange(start_time, end_time) with &&)
);

create table appointment_services (
  appointment_id uuid not null references appointments(id) on delete cascade,
  service_id uuid not null references services(id),
  service_name_snapshot text not null,
  price_cents_snapshot integer not null,
  duration_minutes_snapshot integer not null,
  primary key (appointment_id, service_id)
);

alter table services enable row level security;
alter table business_hours enable row level security;
alter table appointments enable row level security;
alter table appointment_services enable row level security;

create policy "services are publicly readable"
  on services for select
  to anon, authenticated
  using (true);

create policy "services are writable by authenticated users"
  on services for all
  to authenticated
  using (true)
  with check (true);

create policy "business_hours are publicly readable"
  on business_hours for select
  to anon, authenticated
  using (true);

create policy "business_hours are writable by authenticated users"
  on business_hours for update
  to authenticated
  using (true)
  with check (true);

-- appointments e appointment_services: nenhuma policy pra anon.
-- Leitura/escrita publica passa pela service role key em Server Actions (Plano 2).
create policy "appointments are readable by authenticated users"
  on appointments for select
  to authenticated
  using (true);

create policy "appointment_services are readable by authenticated users"
  on appointment_services for select
  to authenticated
  using (true);
```

- [ ] **Step 2 [ação manual sua]: Aplicar a migration**

No dashboard do Supabase: SQL Editor → colar o conteúdo do arquivo acima → Run.

- [ ] **Step 3: Verificar as tabelas**

No Table Editor, confirme: `services` (vazia), `business_hours` (7 linhas), `appointments` (vazia), `appointment_services` (vazia).

- [ ] **Step 4: Verificar a exclusion constraint (o teste real da parte mais importante do banco)**

No SQL Editor, rode:

```sql
insert into appointments (type, client_name, client_whatsapp, client_email, start_time, end_time)
values ('booking', 'Teste A', '11999999999', 'a@teste.com', '2026-09-10 10:00:00-03', '2026-09-10 11:00:00-03');

-- este segundo insert DEVE falhar com "conflicting key value violates exclusion constraint"
insert into appointments (type, client_name, client_whatsapp, client_email, start_time, end_time)
values ('booking', 'Teste B', '11888888888', 'b@teste.com', '2026-09-10 10:30:00-03', '2026-09-10 11:30:00-03');
```

Expected: o primeiro `insert` funciona; o segundo falha com erro de exclusion constraint.

- [ ] **Step 5: Limpar os dados de teste**

```sql
delete from appointments where client_name in ('Teste A', 'Teste B');
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations
git commit -m "feat: schema inicial do banco com protecao anti-overbooking"
```
