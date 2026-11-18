'use server'

import { fromZonedTime } from 'date-fns-tz'
import { addDays } from '../calendar'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateAvailableSlots, SALON_TIMEZONE, type Slot } from '@/lib/availability/calculate-slots'
import { getAvailableSlotsInputSchema, bookingInputSchema } from '@/lib/validation/booking'
import { mapAppointmentRows, mapBusinessHoursRows } from './booking-mappers'
import { bookingApprovalEnabled } from '../booking-feature'
import { cookies } from 'next/headers'
import { addBookingReceipt, BOOKING_RECEIPT_COOKIE, RECEIPT_TTL, securityHash } from '../security/booking-access'
import { sessionCookieOptions, BOOKING_CLIENT_COOKIE } from '../security/cookies'
import { enforceRateLimit, RateLimitError } from '../security/rate-limit'

export async function getAvailableSlots(input: { serviceIds: string[]; dateISO: string }): Promise<Slot[]> {
  const parsed = getAvailableSlotsInputSchema.safeParse(input)
  if (!parsed.success || parsed.data.serviceIds.length === 0) return []
  const { serviceIds, dateISO } = parsed.data
  await enforceRateLimit('slots')
  const supabase = createAdminClient()
  const { data: serviceRows, error: servicesError } = await supabase
    .from('services')
    .select('id, name, price_cents, duration_minutes')
    .in('id', serviceIds)
    .eq('active', true)

  if (servicesError) {
    throw new Error('Não foi possível consultar os serviços agora.')
  }
  if (!serviceRows || serviceRows.length !== serviceIds.length) {
    return []
  }

  const totalDurationMinutes = serviceRows.reduce((sum, service) => sum + service.duration_minutes, 0)

  const dayStart = fromZonedTime(`${dateISO}T00:00:00`, SALON_TIMEZONE)
  const dayEnd = fromZonedTime(`${addDays(dateISO, 1)}T00:00:00`, SALON_TIMEZONE)

  let busyQuery = supabase.from('appointments').select('start_time, end_time').lt('start_time', dayEnd.toISOString()).gt('end_time', dayStart.toISOString())
  if (bookingApprovalEnabled()) busyQuery = busyQuery.in('status', ['pending', 'confirmed']).or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
  const [{ data: businessHoursRows, error: hoursError }, { data: appointmentRows, error: appointmentsError }] =
    await Promise.all([
      supabase.from('business_hours').select('day_of_week, start_time, end_time, is_working'),
      busyQuery,
    ])

  if (hoursError) {
    throw new Error('Não foi possível consultar o expediente agora.')
  }
  if (appointmentsError) {
    throw new Error('Não foi possível consultar os horários agora.')
  }

  return calculateAvailableSlots({
    dateISO,
    totalDurationMinutes,
    businessHours: mapBusinessHoursRows(businessHoursRows ?? []),
    busyIntervals: mapAppointmentRows(appointmentRows ?? []),
  })

}

export async function createBooking(input: unknown): Promise<{ id: string } | { error: string; refreshServices?: boolean }> {
  const parsed = bookingInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const { serviceIds, clientName, clientWhatsapp, clientEmail, startTime, requestId, expectedServices } = parsed.data
  const store = await cookies()
  const browser = store.get(BOOKING_CLIENT_COOKIE)?.value
  if (!browser || !/^[a-f0-9]{64}$/.test(browser)) return { error:'Sua sessão de agendamento expirou. Atualize a página.', refreshServices:true }
  try { await enforceRateLimit('booking', clientWhatsapp) }
  catch (error) { return { error: error instanceof RateLimitError ? error.message : 'Não foi possível enviar o pedido agora. Tente novamente mais tarde.' } }

  // A RPC valida novamente sob lock e grava reserva + snapshots na mesma transação.
  const quote = [...expectedServices].sort((a,b) => a.id.localeCompare(b.id))
  const { data: id, error } = await createAdminClient().rpc('submit_appointment', {
    p_request_key: securityHash('request', `${browser}:${requestId}`),
    p_fingerprint: securityHash('request-content', JSON.stringify({ serviceIds:[...serviceIds].sort(), clientName, clientWhatsapp, clientEmail, startTime:startTime.toISOString(), quote })),
    p_expected_services: quote,
    p_pending: bookingApprovalEnabled(),
    p_service_ids: serviceIds,
    p_start_time: startTime.toISOString(),
    p_client_name: clientName,
    p_client_whatsapp: clientWhatsapp,
    p_client_email: clientEmail,
  })
  if (error) {
    if (error.code === 'BD001') return { error:'O preço ou a duração de um serviço mudou. Atualize a seleção antes de enviar.', refreshServices:true }
    if (error.code === '23P01') return { error: 'Esse horário acabou de ficar indisponível. Escolha outro horário.' }
    if (error.code === '22023') return { error: 'Serviço ou horário indisponível. Confira a seleção e tente novamente.' }
    throw new Error('Não foi possível confirmar o agendamento agora.')
  }
  if (!id) throw new Error('A reserva não retornou uma confirmação.')
  store.set(BOOKING_RECEIPT_COOKIE, addBookingReceipt(store.get(BOOKING_RECEIPT_COOKIE)?.value, id), {
    ...sessionCookieOptions(), maxAge: RECEIPT_TTL,
  })
  return { id }
}
