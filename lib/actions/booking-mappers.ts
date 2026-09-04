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
