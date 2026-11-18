import { describe, expect, it } from 'vitest'
import { blockSchema, serviceSchema, weekSchema } from './admin'

describe('validação administrativa', () => {
  it('recusa centavos fracionados e duração inválida', () => {
    expect(serviceSchema.safeParse({ name: 'Corte', description: '', priceCents: 12.5, durationMinutes: 30 }).success).toBe(false)
    expect(serviceSchema.safeParse({ name: 'Corte', description: '', priceCents: 100, durationMinutes: 0 }).success).toBe(false)
  })
  it('exige sete dias distintos e fechamento após abertura', () => {
    const day = { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_working: true }
    expect(weekSchema.safeParse({ days: Array(7).fill(day) }).success).toBe(false)
    const days = Array.from({ length: 7 }, (_, i) => ({ ...day, day_of_week: i }))
    expect(weekSchema.safeParse({ days }).success).toBe(true)
    days[3].end_time = '08:00'
    expect(weekSchema.safeParse({ days }).success).toBe(false)
  })
  it('bloqueios exigem instantes explícitos e fim posterior', () => {
    expect(blockSchema.safeParse({ startTime: '2026-10-01T09:00:00-03:00', endTime: '2026-10-01T10:00:00-03:00', notes: '' }).success).toBe(true)
    expect(blockSchema.safeParse({ startTime: '2026-10-01T09:00', endTime: '2026-10-01T10:00', notes: '' }).success).toBe(false)
    expect(blockSchema.safeParse({ startTime: '2026-10-01T10:00:00Z', endTime: '2026-10-01T09:00:00Z', notes: '' }).success).toBe(false)
  })
})
