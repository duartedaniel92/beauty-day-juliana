import { fromZonedTime } from 'date-fns-tz'

export const SALON_TIMEZONE = 'America/Sao_Paulo'
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

  if (totalDurationMinutes <= 0) {
    return []
  }

  // dia da semana calculado em UTC pra ser independente do fuso do servidor
  const dayOfWeek = new Date(`${dateISO}T00:00:00Z`).getUTCDay()
  const hours = businessHours.find((h) => h.dayOfWeek === dayOfWeek)

  if (!hours || !hours.isWorking || !hours.startTime || !hours.endTime) {
    return []
  }

  const dayStart = fromZonedTime(`${dateISO}T${normalizeTime(hours.startTime)}`, SALON_TIMEZONE)
  const dayEnd = fromZonedTime(`${dateISO}T${normalizeTime(hours.endTime)}`, SALON_TIMEZONE)
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

// Postgres `time` retorna "HH:mm:ss"; o formato "HH:mm" tambem e aceito
// (ex: valor digitado direto num teste ou formulario).
function normalizeTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time
}
