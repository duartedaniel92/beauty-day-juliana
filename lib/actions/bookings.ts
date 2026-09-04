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
