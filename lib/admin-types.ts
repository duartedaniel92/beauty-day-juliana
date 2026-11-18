import type { Tables } from './supabase/database.types'

export type ActionResult = { success: true } | { error: string }
export type Service = Pick<Tables<'services'>, 'id' | 'name' | 'description' | 'price_cents' | 'duration_minutes' | 'active'>
export type BusinessHour = Tables<'business_hours'>
export type AgendaEntry = Omit<Tables<'appointments'>, 'created_at' | 'type' | 'status' | 'version' | 'expires_at'> & {
  status?: import('./booking-status').BookingStatus
  version?: number
  expires_at?: string | null
  type: 'booking' | 'block'
  appointment_services: Pick<Tables<'appointment_services'>, 'service_name_snapshot' | 'price_cents_snapshot' | 'duration_minutes_snapshot'>[]
}
