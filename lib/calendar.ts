import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { z } from 'zod'

export const SALON_TIME_ZONE = 'America/Sao_Paulo'
export type CalendarView = 'day' | 'week' | 'month'
const dateSchema = z.iso.date().refine(value => value >= '1900-01-01' && value <= '2100-12-31')
const viewSchema = z.enum(['day', 'week', 'month'])

export function salonDate(date: Date | string = new Date()): string {
  return formatInTimeZone(date, SALON_TIME_ZONE, 'yyyy-MM-dd')
}
export function salonTime(date: string): string {
  return formatInTimeZone(date, SALON_TIME_ZONE, 'HH:mm')
}
export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
}
export function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}
export function shiftDate(date: string, view: CalendarView, direction: number): string {
  if (view !== 'month') return addDays(date, direction * (view === 'week' ? 7 : 1))
  const value = new Date(`${date}T12:00:00Z`)
  const day = value.getUTCDate()
  value.setUTCDate(1)
  value.setUTCMonth(value.getUTCMonth() + direction)
  const last = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate()
  value.setUTCDate(Math.min(day, last))
  return value.toISOString().slice(0, 10)
}
export function parseCalendarQuery(query: Record<string, string | string[] | undefined>, today = salonDate()): { date: string; view: CalendarView } {
  return { date: dateSchema.safeParse(query.date).data ?? today, view: viewSchema.safeParse(query.view).data ?? 'day' }
}
export function calendarDays(dateISO: string, view: CalendarView): string[] {
  const date = dateSchema.parse(dateISO)
  if (view === 'day') return [date]
  const anchor = view === 'month' ? `${date.slice(0, 7)}-01` : date
  const weekday = new Date(`${anchor}T12:00:00Z`).getUTCDay()
  const start = addDays(anchor, -((weekday + 6) % 7))
  const nextMonth = shiftDate(anchor, 'month', 1)
  const days: string[] = []
  for (let i = 0; i < 42; i++) {
    const current = addDays(start, i)
    if (i > 0 && i % 7 === 0 && (view === 'week' || current >= nextMonth)) break
    days.push(current)
  }
  return days
}
/** Half-open UTC range covering the visible Monday-first grid, including month spillover. */
export function getCalendarRange(dateISO: string, view: CalendarView): { start: string; end: string } {
  const days = calendarDays(dateISO, view)
  return { start: fromZonedTime(`${days[0]}T00:00:00`, SALON_TIME_ZONE).toISOString(), end: fromZonedTime(`${addDays(days[days.length - 1], 1)}T00:00:00`, SALON_TIME_ZONE).toISOString() }
}
export function localDateTimeToISO(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Informe data e horário válidos.')
  dateSchema.parse(value.slice(0, 10))
  const result = fromZonedTime(value, SALON_TIME_ZONE)
  if (formatInTimeZone(result, SALON_TIME_ZONE, "yyyy-MM-dd'T'HH:mm") !== value) throw new Error('Horário inexistente no fuso do salão.')
  return result.toISOString()
}
export function parsePriceCents(input: string): number {
  const value = input.trim()
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) throw new Error('Use um preço como 120,00.')
  const [reais, decimal = ''] = value.replaceAll('.', '').split(',')
  const cents = Number(`${reais}${decimal.padEnd(2, '0')}`)
  if (!Number.isSafeInteger(cents)) throw new Error('Preço acima do limite permitido.')
  return cents
}
export { formatPrice as money } from './format'
