# Server Actions do Agendamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar as Server Actions que calculam horários livres e criam agendamentos, reaproveitando o motor de disponibilidade e o schema do banco já prontos (Plano 1 — Fundação).

**Architecture:** Duas Server Actions finas (`getAvailableSlots`, `createBooking`) em `lib/actions/bookings.ts`, compondo funções puras e testáveis (`lib/actions/booking-mappers.ts`) com o motor de disponibilidade já existente (`lib/availability/calculate-slots.ts`). Toda entrada externa validada com Zod antes de tocar o banco. Nenhuma UI neste plano — as actions são verificadas via Vitest (lógica pura) e scripts temporários contra o Supabase real (I/O).

**Tech Stack:** Next.js Server Actions, Zod, Supabase (`lib/supabase/admin.ts`), date-fns-tz, Vitest.

**Spec:** [docs/superpowers/specs/2026-09-03-sistema-agendamento-design.md](../specs/2026-09-03-sistema-agendamento-design.md)

## Global Constraints

- TypeScript `strict: true`; `any` proibido, sem `@ts-ignore`
- Nomes em inglês no código; comentários e commits em português
- Sem `console.log` em código commitado (scripts de verificação temporários são a exceção — removidos antes do commit, mesmo padrão do Plano 1)
- Toda entrada externa validada com Zod antes de tocar o banco
- Fuso horário `America/Sao_Paulo` já é tratado num único lugar (`lib/availability/calculate-slots.ts`) — as Server Actions reaproveitam isso, nunca reimplementam lógica de fuso
- Preço sempre em `price_cents` (integer)
- `appointments`/`appointment_services` não têm nenhuma policy de RLS para `anon` nem `authenticated` — todo acesso passa pelo client de service role (`lib/supabase/admin.ts`)

---

## Task 1: Schemas de validação

**Files:**
- Create: `lib/validation/booking.ts`
- Test: `lib/validation/booking.test.ts`

**Interfaces:**
- Produces: `bookingInputSchema` (Zod schema), `type BookingInput`, `getAvailableSlotsInputSchema` (Zod schema) — consumidos pela Task 3 (`createBooking`) e Task 2 (`getAvailableSlots`)

- [ ] **Step 1: Escrever o arquivo de teste**

```ts
// lib/validation/booking.test.ts
import { describe, expect, it } from 'vitest'
import { bookingInputSchema, getAvailableSlotsInputSchema } from './booking'

const validInput = {
  serviceIds: ['550e8400-e29b-41d4-a716-446655440000'],
  clientName: 'Maria Silva',
  clientWhatsapp: '(11) 98888-7777',
  clientEmail: 'maria@example.com',
  startTime: new Date('2026-09-10T13:00:00Z'),
}

describe('bookingInputSchema', () => {
  it('aceita um input valido', () => {
    const result = bookingInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejeita quando nenhum servico foi selecionado', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, serviceIds: [] })
    expect(result.success).toBe(false)
  })

  it('rejeita nome muito curto', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, clientName: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejeita e-mail invalido', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, clientEmail: 'nao-e-email' })
    expect(result.success).toBe(false)
  })

  it('normaliza o whatsapp removendo formatacao', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, clientWhatsapp: '(11) 98888-7777' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientWhatsapp).toBe('11988887777')
    }
  })

  it('rejeita whatsapp com poucos digitos', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, clientWhatsapp: '123' })
    expect(result.success).toBe(false)
  })

  it('rejeita serviceId que nao e um uuid', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, serviceIds: ['nao-e-uuid'] })
    expect(result.success).toBe(false)
  })
})

describe('getAvailableSlotsInputSchema', () => {
  it('aceita serviceIds e uma data no formato YYYY-MM-DD', () => {
    const result = getAvailableSlotsInputSchema.safeParse({
      serviceIds: ['550e8400-e29b-41d4-a716-446655440000'],
      dateISO: '2026-09-10',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita data em formato invalido', () => {
    const result = getAvailableSlotsInputSchema.safeParse({
      serviceIds: ['550e8400-e29b-41d4-a716-446655440000'],
      dateISO: '10/09/2026',
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test`
Expected: FAIL — `Cannot find module './booking'`

- [ ] **Step 3: Escrever a implementação**

```ts
// lib/validation/booking.ts
import { z } from 'zod'

export const bookingInputSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um servico.'),
  clientName: z.string().trim().min(2, 'Digite seu nome completo.'),
  clientWhatsapp: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().min(10, 'Digite um WhatsApp valido com DDD.').max(11, 'Digite um WhatsApp valido com DDD.')),
  clientEmail: z.string().trim().email('Digite um e-mail valido.'),
  startTime: z.coerce.date(),
})

export type BookingInput = z.infer<typeof bookingInputSchema>

export const getAvailableSlotsInputSchema = z.object({
  serviceIds: z.array(z.string().uuid()),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida.'),
})

export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsInputSchema>
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: 9 novos testes passando (+ os 8 já existentes do motor de disponibilidade, 17 no total)

- [ ] **Step 5: Commit**

```bash
git add lib/validation
git commit -m "feat: adiciona schemas de validacao do agendamento

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Mappers e `getAvailableSlots`

**Files:**
- Create: `lib/actions/booking-mappers.ts`
- Test: `lib/actions/booking-mappers.test.ts`
- Create: `lib/actions/bookings.ts` (só `getAvailableSlots` nesta task — `createBooking` é a Task 3)

**Interfaces:**
- Consumes: `calculateAvailableSlots`, `type BusinessHours`, `type BusyInterval`, `type Slot` (de `lib/availability/calculate-slots.ts`, Plano 1); `createAdminClient` (de `lib/supabase/admin.ts`, Plano 1); `getAvailableSlotsInputSchema` (de `lib/validation/booking.ts`, Task 1)
- Produces: `mapBusinessHoursRows(rows): BusinessHours[]`, `mapAppointmentRows(rows): BusyInterval[]` (de `lib/actions/booking-mappers.ts`) — consumidos pela Task 3; `getAvailableSlots(input: { serviceIds: string[]; dateISO: string }): Promise<Slot[]>` (de `lib/actions/bookings.ts`) — consumido pelo Plano 3 (wizard de agendamento)

- [ ] **Step 1: Escrever o arquivo de teste dos mappers**

```ts
// lib/actions/booking-mappers.test.ts
import { describe, expect, it } from 'vitest'
import { mapBusinessHoursRows, mapAppointmentRows } from './booking-mappers'

describe('mapBusinessHoursRows', () => {
  it('mapeia colunas do banco (snake_case) para o formato do motor de disponibilidade', () => {
    const rows = [
      { day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', is_working: true },
      { day_of_week: 0, start_time: null, end_time: null, is_working: false },
    ]
    const result = mapBusinessHoursRows(rows)
    expect(result).toEqual([
      { dayOfWeek: 2, startTime: '09:00:00', endTime: '18:00:00', isWorking: true },
      { dayOfWeek: 0, startTime: null, endTime: null, isWorking: false },
    ])
  })
})

describe('mapAppointmentRows', () => {
  it('converte start_time/end_time em string para objetos Date', () => {
    const rows = [{ start_time: '2026-09-10T13:00:00+00:00', end_time: '2026-09-10T14:00:00+00:00' }]
    const result = mapAppointmentRows(rows)
    expect(result).toEqual([
      { start: new Date('2026-09-10T13:00:00+00:00'), end: new Date('2026-09-10T14:00:00+00:00') },
    ])
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `Cannot find module './booking-mappers'`

- [ ] **Step 3: Escrever a implementação dos mappers**

```ts
// lib/actions/booking-mappers.ts
import type { BusinessHours, BusyInterval } from '@/lib/availability/calculate-slots'

interface BusinessHoursRow {
  day_of_week: number
  start_time: string | null
  end_time: string | null
  is_working: boolean
}

export function mapBusinessHoursRows(rows: BusinessHoursRow[]): BusinessHours[] {
  return rows.map((row) => ({
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    isWorking: row.is_working,
  }))
}

interface AppointmentRow {
  start_time: string
  end_time: string
}

export function mapAppointmentRows(rows: AppointmentRow[]): BusyInterval[] {
  return rows.map((row) => ({
    start: new Date(row.start_time),
    end: new Date(row.end_time),
  }))
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test`
Expected: os 2 novos testes passando (19 no total)

- [ ] **Step 5: Escrever `getAvailableSlots`**

```ts
// lib/actions/bookings.ts
'use server'

import { fromZonedTime } from 'date-fns-tz'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateAvailableSlots, type Slot } from '@/lib/availability/calculate-slots'
import { getAvailableSlotsInputSchema } from '@/lib/validation/booking'
import { mapAppointmentRows, mapBusinessHoursRows } from './booking-mappers'

const SALON_TIMEZONE = 'America/Sao_Paulo'

export async function getAvailableSlots(input: { serviceIds: string[]; dateISO: string }): Promise<Slot[]> {
  const parsed = getAvailableSlotsInputSchema.safeParse(input)
  if (!parsed.success || parsed.data.serviceIds.length === 0) {
    return []
  }
  const { serviceIds, dateISO } = parsed.data

  const supabase = createAdminClient()

  const [{ data: businessHoursRows }, { data: serviceRows }] = await Promise.all([
    supabase.from('business_hours').select('day_of_week, start_time, end_time, is_working'),
    supabase.from('services').select('duration_minutes').in('id', serviceIds),
  ])

  const totalDurationMinutes = (serviceRows ?? []).reduce((sum, service) => sum + service.duration_minutes, 0)

  const dayStart = fromZonedTime(`${dateISO}T00:00:00`, SALON_TIMEZONE)
  const dayEnd = fromZonedTime(`${dateISO}T23:59:59`, SALON_TIMEZONE)

  const { data: appointmentRows } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .lt('start_time', dayEnd.toISOString())
    .gt('end_time', dayStart.toISOString())

  return calculateAvailableSlots({
    dateISO,
    totalDurationMinutes,
    businessHours: mapBusinessHoursRows(businessHoursRows ?? []),
    busyIntervals: mapAppointmentRows(appointmentRows ?? []),
  })
}
```

- [ ] **Step 6: Verificar contra o Supabase real**

Esta action faz I/O real (Supabase) e não tem teste unitário — a lógica pura já foi coberta nos Steps 1-4 e no motor de disponibilidade (Plano 1). Verificação: criar um serviço temporário, chamar a action, confirmar que devolve horários, apagar o serviço.

```ts
// scripts/verify-get-available-slots.ts (temporario, removido no Step 8)
import { getAvailableSlots } from '../lib/actions/bookings'
import { createAdminClient } from '../lib/supabase/admin'

async function main() {
  const supabase = createAdminClient()

  const { data: service, error } = await supabase
    .from('services')
    .insert({ name: 'Servico de teste', price_cents: 5000, duration_minutes: 60 })
    .select('id')
    .single()

  if (error || !service) {
    console.error('Falha ao criar servico de teste:', error?.message)
    process.exit(1)
  }

  const testDate = '2026-09-08' // terca-feira, dia de expediente segundo o seed do Plano 1
  const slots = await getAvailableSlots({ serviceIds: [service.id], dateISO: testDate })

  console.log(`Encontrados ${slots.length} horario(s) livre(s) em ${testDate}.`)
  if (slots.length > 0) {
    console.log(`Primeiro horario: ${slots[0].start.toISOString()} - ${slots[0].end.toISOString()}`)
  }

  await supabase.from('services').delete().eq('id', service.id)

  if (slots.length === 0) {
    console.error('Esperava pelo menos um horario livre, recebeu zero.')
    process.exit(1)
  }
  console.log('OK')
}

main()
```

- [ ] **Step 7: Rodar e confirmar**

Run: `npx tsx scripts/verify-get-available-slots.ts`
Expected: imprime uma contagem de horários maior que zero e termina com `OK`

- [ ] **Step 8: Remover o script temporário**

```bash
rm scripts/verify-get-available-slots.ts
```

- [ ] **Step 9: Commit**

```bash
git add lib/actions
git commit -m "feat: adiciona getAvailableSlots e mappers de dados do Supabase

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `createBooking`

**Files:**
- Modify: `lib/actions/booking-mappers.ts` (adicionar `buildServiceSnapshots`)
- Modify: `lib/actions/booking-mappers.test.ts` (adicionar teste de `buildServiceSnapshots`)
- Modify: `lib/actions/bookings.ts` (adicionar `createBooking`)

**Interfaces:**
- Consumes: `bookingInputSchema` (Task 1); `calculateAvailableSlots` (Plano 1); `createAdminClient` (Plano 1); `mapBusinessHoursRows`, `mapAppointmentRows` (Task 2)
- Produces: `buildServiceSnapshots(services, serviceIds): SnapshotRow[]` (de `lib/actions/booking-mappers.ts`); `createBooking(input: unknown): Promise<{ id: string } | { error: string }>` (de `lib/actions/bookings.ts`) — consumido pelo Plano 3 (formulário de confirmação)

- [ ] **Step 1: Escrever o teste de `buildServiceSnapshots`**

Adicione `buildServiceSnapshots` ao import já existente de `'./booking-mappers'` no topo de `lib/actions/booking-mappers.test.ts` (junto com `mapBusinessHoursRows`, `mapAppointmentRows`), e adicione este bloco ao final do arquivo:

```ts
describe('buildServiceSnapshots', () => {
  const services = [
    { id: 'a', name: 'Corte', price_cents: 8000, duration_minutes: 45 },
    { id: 'b', name: 'Coloracao', price_cents: 22000, duration_minutes: 120 },
  ]

  it('monta um snapshot por servico selecionado, na ordem pedida', () => {
    const result = buildServiceSnapshots(services, ['b', 'a'])
    expect(result).toEqual([
      { service_id: 'b', service_name_snapshot: 'Coloracao', price_cents_snapshot: 22000, duration_minutes_snapshot: 120 },
      { service_id: 'a', service_name_snapshot: 'Corte', price_cents_snapshot: 8000, duration_minutes_snapshot: 45 },
    ])
  })

  it('lanca erro se um serviceId nao existir na lista de servicos', () => {
    expect(() => buildServiceSnapshots(services, ['c'])).toThrow()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `buildServiceSnapshots is not exported`

- [ ] **Step 3: Implementar `buildServiceSnapshots`**

Adicionar ao final de `lib/actions/booking-mappers.ts`:

```ts
interface ServiceRow {
  id: string
  name: string
  price_cents: number
  duration_minutes: number
}

export interface ServiceSnapshot {
  service_id: string
  service_name_snapshot: string
  price_cents_snapshot: number
  duration_minutes_snapshot: number
}

export function buildServiceSnapshots(services: ServiceRow[], serviceIds: string[]): ServiceSnapshot[] {
  return serviceIds.map((id) => {
    const service = services.find((s) => s.id === id)
    if (!service) {
      throw new Error(`Servico ${id} nao encontrado entre os servicos carregados.`)
    }
    return {
      service_id: service.id,
      service_name_snapshot: service.name,
      price_cents_snapshot: service.price_cents,
      duration_minutes_snapshot: service.duration_minutes,
    }
  })
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test`
Expected: os 2 novos testes passando (21 no total)

- [ ] **Step 5: Implementar `createBooking`**

Primeiro, adicione estas três importações ao bloco de imports já existente no topo de `lib/actions/bookings.ts` (junto com `fromZonedTime`, `createAdminClient`, etc. que a Task 2 já deixou lá):

```ts
import { formatInTimeZone } from 'date-fns-tz'
import { bookingInputSchema } from '@/lib/validation/booking'
import { buildServiceSnapshots } from './booking-mappers'
```

Depois, adicione a função abaixo ao final do arquivo (`mapBusinessHoursRows`, `mapAppointmentRows`, `calculateAvailableSlots`, `createAdminClient`, `fromZonedTime` e `SALON_TIMEZONE` já estão disponíveis no arquivo desde a Task 2):

```ts
export async function createBooking(input: unknown): Promise<{ id: string } | { error: string }> {
  const parsed = bookingInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' }
  }
  const { serviceIds, clientName, clientWhatsapp, clientEmail, startTime } = parsed.data

  const supabase = createAdminClient()

  const { data: serviceRows } = await supabase
    .from('services')
    .select('id, name, price_cents, duration_minutes')
    .in('id', serviceIds)
    .eq('active', true)

  if (!serviceRows || serviceRows.length !== serviceIds.length) {
    return { error: 'Um ou mais servicos selecionados nao estao mais disponiveis.' }
  }

  const totalDurationMinutes = serviceRows.reduce((sum, service) => sum + service.duration_minutes, 0)
  const dateISO = formatInTimeZone(startTime, SALON_TIMEZONE, 'yyyy-MM-dd')

  const dayStart = fromZonedTime(`${dateISO}T00:00:00`, SALON_TIMEZONE)
  const dayEnd = fromZonedTime(`${dateISO}T23:59:59`, SALON_TIMEZONE)

  const [{ data: businessHoursRows }, { data: appointmentRows }] = await Promise.all([
    supabase.from('business_hours').select('day_of_week, start_time, end_time, is_working'),
    supabase
      .from('appointments')
      .select('start_time, end_time')
      .lt('start_time', dayEnd.toISOString())
      .gt('end_time', dayStart.toISOString()),
  ])

  // revalida a disponibilidade com dados frescos -- nao confia no que o
  // client mandou, mesmo que o client ja tenha feito essa checagem antes
  const availableSlots = calculateAvailableSlots({
    dateISO,
    totalDurationMinutes,
    businessHours: mapBusinessHoursRows(businessHoursRows ?? []),
    busyIntervals: mapAppointmentRows(appointmentRows ?? []),
  })

  const isStillAvailable = availableSlots.some((slot) => slot.start.getTime() === startTime.getTime())
  if (!isStillAvailable) {
    return { error: 'Esse horario acabou de ficar indisponivel. Escolha outro horario.' }
  }

  const endTime = new Date(startTime.getTime() + totalDurationMinutes * 60_000)

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      type: 'booking',
      client_name: clientName,
      client_whatsapp: clientWhatsapp,
      client_email: clientEmail,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    })
    .select('id')
    .single()

  if (appointmentError || !appointment) {
    // a exclusion constraint do banco (Plano 1) e a ultima linha de defesa
    // contra corrida -- se cair aqui, provavelmente foi ela que barrou
    return { error: 'Nao foi possivel confirmar o agendamento. Tente novamente.' }
  }

  const snapshots = buildServiceSnapshots(serviceRows, serviceIds)
  const { error: snapshotError } = await supabase
    .from('appointment_services')
    .insert(snapshots.map((snapshot) => ({ ...snapshot, appointment_id: appointment.id })))

  if (snapshotError) {
    // compensa a insercao parcial -- sem isso o agendamento fica "fantasma",
    // sem nenhum servico associado
    await supabase.from('appointments').delete().eq('id', appointment.id)
    return { error: 'Nao foi possivel confirmar o agendamento. Tente novamente.' }
  }

  return { id: appointment.id }
}
```

- [ ] **Step 6: Verificar contra o Supabase real**

```ts
// scripts/verify-create-booking.ts (temporario, removido no Step 8)
import { createBooking, getAvailableSlots } from '../lib/actions/bookings'
import { createAdminClient } from '../lib/supabase/admin'

async function main() {
  const supabase = createAdminClient()

  const { data: service, error } = await supabase
    .from('services')
    .insert({ name: 'Servico de teste', price_cents: 5000, duration_minutes: 60 })
    .select('id')
    .single()

  if (error || !service) {
    console.error('Falha ao criar servico de teste:', error?.message)
    process.exit(1)
  }

  const testDate = '2026-09-08'
  const slots = await getAvailableSlots({ serviceIds: [service.id], dateISO: testDate })
  if (slots.length === 0) {
    console.error('Nenhum horario livre para testar.')
    process.exit(1)
  }
  const slot = slots[0]

  const result = await createBooking({
    serviceIds: [service.id],
    clientName: 'Cliente de Teste',
    clientWhatsapp: '(11) 98888-7777',
    clientEmail: 'teste@example.com',
    startTime: slot.start,
  })

  console.log('Resultado do primeiro agendamento:', result)
  if (!('id' in result)) {
    console.error('Esperava sucesso no primeiro agendamento.')
    process.exit(1)
  }

  // tenta agendar o MESMO horario de novo -- deve falhar (camada 2 de defesa)
  const duplicate = await createBooking({
    serviceIds: [service.id],
    clientName: 'Outro Cliente',
    clientWhatsapp: '(11) 97777-6666',
    clientEmail: 'outro@example.com',
    startTime: slot.start,
  })

  console.log('Resultado do agendamento duplicado:', duplicate)
  if (!('error' in duplicate)) {
    console.error('Esperava erro no agendamento duplicado, mas foi aceito.')
    process.exit(1)
  }

  await supabase.from('appointments').delete().eq('id', result.id)
  await supabase.from('services').delete().eq('id', service.id)

  console.log('OK')
}

main()
```

- [ ] **Step 7: Rodar e confirmar**

Run: `npx tsx scripts/verify-create-booking.ts`
Expected: primeiro agendamento com `id`, segundo (mesmo horário) com `error`, termina com `OK`

- [ ] **Step 8: Remover o script temporário**

```bash
rm scripts/verify-create-booking.ts
```

- [ ] **Step 9: Rodar a suíte completa e o build antes de commitar**

```bash
npm test
npx tsc --noEmit
npm run build
npm run lint
```

Expected: tudo limpo (21 testes, build e lint sem erro)

- [ ] **Step 10: Commit**

```bash
git add lib/actions
git commit -m "feat: adiciona createBooking com revalidacao e snapshot de servicos

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
