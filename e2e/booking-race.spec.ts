import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase/database.types'
import { calculateAvailableSlots } from '../lib/availability/calculate-slots'
import { mapAppointmentRows, mapBusinessHoursRows } from '../lib/actions/booking-mappers'
import { addDays, getCalendarRange, salonDate } from '../lib/calendar'
import { assertE2EEnvironment } from '../lib/security/e2e-environment'

assertE2EEnvironment()

test('duas reservas simultâneas produzem uma única confirmação completa', async () => {
  const client = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const email = `race-${crypto.randomUUID()}@example.test`
  const [{ data: services, error: servicesError }, { data: hours, error: hoursError }] = await Promise.all([
    client.from('services').select('*').eq('active', true).order('duration_minutes').limit(1),
    client.from('business_hours').select('*'),
  ])
  expect(servicesError).toBeNull()
  expect(hoursError).toBeNull()
  const service = services?.[0]
  expect(service, 'É necessário um serviço ativo no ambiente de homologação.').toBeDefined()
  if (!service || !hours) throw new Error('Dados de homologação indisponíveis.')
  let start: Date | undefined
  for (let offset = 2; offset <= 14 && !start; offset++) {
    const dateISO = addDays(salonDate(), offset)
    const range = getCalendarRange(dateISO, 'day')
    const { data: busy, error } = await client.from('appointments').select('start_time,end_time').lt('start_time', range.end).gt('end_time', range.start)
    expect(error).toBeNull()
    start = calculateAvailableSlots({ dateISO, totalDurationMinutes: service.duration_minutes, businessHours: mapBusinessHoursRows(hours), busyIntervals: mapAppointmentRows(busy ?? []) })[0]?.start
  }
  expect(start, 'Nenhum intervalo de teste disponível nos próximos 14 dias.').toBeDefined()
  if (!start) throw new Error('Agenda sem disponibilidade para o teste.')
  const input = { p_service_ids: [service.id], p_start_time: start.toISOString(), p_client_name: 'Teste de concorrência', p_client_whatsapp: '11999999999', p_client_email: email }
  try {
    // Duas chamadas HTTP independentes competem pela mesma janela no Postgres remoto.
    const results = await Promise.all([client.rpc('book_appointment', input), client.rpc('book_appointment', input)])
    expect(results.filter(result => !result.error)).toHaveLength(1)
    expect(results.filter(result => result.error?.code === '23P01')).toHaveLength(1)
    const { data, error } = await client.from('appointments').select('id,appointment_services(service_id)').eq('client_email', email)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data?.[0].appointment_services).toEqual([{ service_id: service.id }])
  } finally {
    const { error } = await client.from('appointments').delete().eq('client_email', email).eq('type', 'booking')
    expect(error, 'A limpeza deve remover somente a reserva desta execução.').toBeNull()
  }
})
