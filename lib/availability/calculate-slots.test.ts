import { describe, expect, it } from 'vitest'
import { calculateAvailableSlots, type BusinessHours } from './calculate-slots'

const WEEKLY_HOURS: BusinessHours[] = [
  { dayOfWeek: 0, startTime: null, endTime: null, isWorking: false },
  { dayOfWeek: 1, startTime: null, endTime: null, isWorking: false },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isWorking: true },
]

// 2026-09-08 e uma terca-feira; 2026-09-07 e segunda (folga)
const EARLY_MORNING = new Date('2026-09-08T06:00:00-03:00')

describe('calculateAvailableSlots', () => {
  it('retorna vazio se o dia e de folga', () => {
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-07',
      totalDurationMinutes: 60,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now: EARLY_MORNING,
    })
    expect(slots).toEqual([])
  })

  it('gera o primeiro slot no inicio do expediente', () => {
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 60,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now: EARLY_MORNING,
    })
    expect(slots[0].start.toISOString()).toBe(new Date('2026-09-08T09:00:00-03:00').toISOString())
  })

  it('nao gera slot cuja duracao total ultrapasse o fim do expediente', () => {
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 540, // 9h — exatamente o expediente inteiro (09h-18h)
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now: EARLY_MORNING,
    })
    expect(slots).toHaveLength(1)
    expect(slots[0].start.toISOString()).toBe(new Date('2026-09-08T09:00:00-03:00').toISOString())
  })

  it('exclui slots que colidem com um horario ocupado', () => {
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 60,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [
        { start: new Date('2026-09-08T10:00:00-03:00'), end: new Date('2026-09-08T11:00:00-03:00') },
      ],
      now: EARLY_MORNING,
    })
    const overlapping = slots.filter(
      (s) =>
        s.start.getTime() < new Date('2026-09-08T11:00:00-03:00').getTime() &&
        s.end.getTime() > new Date('2026-09-08T10:00:00-03:00').getTime()
    )
    expect(overlapping).toEqual([])
  })

  it('respeita a antecedencia minima de 2 horas a partir de "agora"', () => {
    const now = new Date('2026-09-08T09:30:00-03:00')
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 30,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now,
    })
    expect(slots[0].start.getTime()).toBeGreaterThanOrEqual(now.getTime() + 120 * 60_000)
  })

  it('soma corretamente a duracao de multiplos servicos selecionados', () => {
    // corte (30min) + coloracao (90min) = 120min
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 120,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [
        { start: new Date('2026-09-08T10:30:00-03:00'), end: new Date('2026-09-08T11:00:00-03:00') },
      ],
      now: EARLY_MORNING,
    })
    const forbidden = slots.some(
      (s) => s.start.getTime() === new Date('2026-09-08T09:30:00-03:00').getTime()
    )
    expect(forbidden).toBe(false)
  })

  it('retorna vazio se a duracao total for zero ou negativa', () => {
    const slotsZero = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 0,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now: EARLY_MORNING,
    })
    expect(slotsZero).toEqual([])

    const slotsNegative = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: -30,
      businessHours: WEEKLY_HOURS,
      busyIntervals: [],
      now: EARLY_MORNING,
    })
    expect(slotsNegative).toEqual([])
  })

  it('aceita o formato HH:mm:ss que o Postgres retorna pra colunas do tipo time', () => {
    const hoursWithSeconds: BusinessHours[] = WEEKLY_HOURS.map((h) =>
      h.startTime && h.endTime
        ? { ...h, startTime: `${h.startTime}:00`, endTime: `${h.endTime}:00` }
        : h
    )
    const slots = calculateAvailableSlots({
      dateISO: '2026-09-08',
      totalDurationMinutes: 60,
      businessHours: hoursWithSeconds,
      busyIntervals: [],
      now: EARLY_MORNING,
    })
    expect(slots[0].start.toISOString()).toBe(new Date('2026-09-08T09:00:00-03:00').toISOString())
  })
})
