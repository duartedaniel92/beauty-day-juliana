'use server'

import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateAvailableSlots, SALON_TIMEZONE, type Slot } from '@/lib/availability/calculate-slots'
import { getAvailableSlotsInputSchema, bookingInputSchema } from '@/lib/validation/booking'
import { mapAppointmentRows, mapBusinessHoursRows, buildServiceSnapshots } from './booking-mappers'

interface ComputeResult {
  slots: Slot[]
  services: { id: string; name: string; price_cents: number; duration_minutes: number }[]
}

// helper compartilhado pelas duas actions -- nao exportado de proposito:
// um arquivo 'use server' expoe cada export como endpoint HTTP publico
async function computeAvailableSlots(
  supabase: ReturnType<typeof createAdminClient>,
  serviceIds: string[],
  dateISO: string
): Promise<ComputeResult> {
  const { data: serviceRows, error: servicesError } = await supabase
    .from('services')
    .select('id, name, price_cents, duration_minutes')
    .in('id', serviceIds)
    .eq('active', true)

  if (servicesError) {
    throw new Error(`Falha ao buscar servicos: ${servicesError.message}`)
  }
  if (!serviceRows || serviceRows.length !== serviceIds.length) {
    return { slots: [], services: serviceRows ?? [] }
  }

  const totalDurationMinutes = serviceRows.reduce((sum, service) => sum + service.duration_minutes, 0)

  const dayStart = fromZonedTime(`${dateISO}T00:00:00`, SALON_TIMEZONE)
  const dayEnd = fromZonedTime(`${dateISO}T23:59:59`, SALON_TIMEZONE)

  const [{ data: businessHoursRows, error: hoursError }, { data: appointmentRows, error: appointmentsError }] =
    await Promise.all([
      supabase.from('business_hours').select('day_of_week, start_time, end_time, is_working'),
      supabase
        .from('appointments')
        .select('start_time, end_time')
        .lt('start_time', dayEnd.toISOString())
        .gt('end_time', dayStart.toISOString()),
    ])

  if (hoursError) {
    throw new Error(`Falha ao buscar expediente: ${hoursError.message}`)
  }
  if (appointmentsError) {
    throw new Error(`Falha ao buscar agendamentos: ${appointmentsError.message}`)
  }

  const slots = calculateAvailableSlots({
    dateISO,
    totalDurationMinutes,
    businessHours: mapBusinessHoursRows(businessHoursRows ?? []),
    busyIntervals: mapAppointmentRows(appointmentRows ?? []),
  })

  return { slots, services: serviceRows }
}

export async function getAvailableSlots(input: { serviceIds: string[]; dateISO: string }): Promise<Slot[]> {
  const parsed = getAvailableSlotsInputSchema.safeParse(input)
  if (!parsed.success || parsed.data.serviceIds.length === 0) {
    return []
  }
  const { slots } = await computeAvailableSlots(createAdminClient(), parsed.data.serviceIds, parsed.data.dateISO)
  return slots
}

export async function createBooking(input: unknown): Promise<{ id: string } | { error: string }> {
  const parsed = bookingInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const { serviceIds, clientName, clientWhatsapp, clientEmail, startTime } = parsed.data

  const supabase = createAdminClient()
  const dateISO = formatInTimeZone(startTime, SALON_TIMEZONE, 'yyyy-MM-dd')

  // revalida a disponibilidade com dados frescos -- nao confia no que o
  // client mandou, mesmo que o client ja tenha feito essa checagem antes
  const { slots: availableSlots, services: serviceRows } = await computeAvailableSlots(supabase, serviceIds, dateISO)

  if (serviceRows.length !== serviceIds.length) {
    return { error: 'Um ou mais serviços selecionados não estão mais disponíveis.' }
  }

  const isStillAvailable = availableSlots.some((slot) => slot.start.getTime() === startTime.getTime())
  if (!isStillAvailable) {
    return { error: 'Esse horário acabou de ficar indisponível. Escolha outro horário.' }
  }

  const totalDurationMinutes = serviceRows.reduce((sum, service) => sum + service.duration_minutes, 0)
  const endTime = new Date(startTime.getTime() + totalDurationMinutes * 60_000)

  // monta os snapshots ANTES de gravar o agendamento -- se algo aqui falhar
  // (servico nao encontrado na lista carregada), nao sobra registro parcial
  const snapshots = buildServiceSnapshots(serviceRows, serviceIds)

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
    return { error: 'Não foi possível confirmar o agendamento. Tente novamente.' }
  }

  const { error: snapshotError } = await supabase
    .from('appointment_services')
    .insert(snapshots.map((snapshot) => ({ ...snapshot, appointment_id: appointment.id })))

  if (snapshotError) {
    // compensa a insercao parcial -- sem isso o agendamento fica "fantasma"
    const { error: deleteError } = await supabase.from('appointments').delete().eq('id', appointment.id)
    if (deleteError) {
      throw new Error(
        `Falha ao limpar agendamento orfao ${appointment.id} apos erro de snapshot: ${deleteError.message}`
      )
    }
    return { error: 'Não foi possível confirmar o agendamento. Tente novamente.' }
  }

  return { id: appointment.id }
}
