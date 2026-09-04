'use server'

import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateAvailableSlots, type Slot } from '@/lib/availability/calculate-slots'
import { getAvailableSlotsInputSchema, bookingInputSchema } from '@/lib/validation/booking'
import { mapAppointmentRows, mapBusinessHoursRows, buildServiceSnapshots } from './booking-mappers'

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
