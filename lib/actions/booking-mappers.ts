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
