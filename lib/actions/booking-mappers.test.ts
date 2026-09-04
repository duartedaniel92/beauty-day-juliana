import { describe, expect, it } from 'vitest'
import { mapBusinessHoursRows, mapAppointmentRows, buildServiceSnapshots } from './booking-mappers'

describe('mapBusinessHoursRows', () => {
  it('mapeia colunas do banco (snake_case) para o formato do motor de disponibilidade', () => {
    const rows = [
      { day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', is_working: true },
      { day_of_week: 0, start_time: null, end_time: null, is_working: false },
    ]
    const result = mapBusinessHoursRows(rows)
    expect(result).toEqual([
      { dayOfWeek: 2, startTime: '09:00:00', endTime: '18:00:00', isWorking: true },
      { dayOfWeek: 0, startTime: null, endTime: null, isWorking: false },
    ])
  })
})

describe('mapAppointmentRows', () => {
  it('converte start_time/end_time em string para objetos Date', () => {
    const rows = [{ start_time: '2026-09-10T13:00:00+00:00', end_time: '2026-09-10T14:00:00+00:00' }]
    const result = mapAppointmentRows(rows)
    expect(result).toEqual([
      { start: new Date('2026-09-10T13:00:00+00:00'), end: new Date('2026-09-10T14:00:00+00:00') },
    ])
  })
})

describe('buildServiceSnapshots', () => {
  const services = [
    { id: 'a', name: 'Corte', price_cents: 8000, duration_minutes: 45 },
    { id: 'b', name: 'Coloracao', price_cents: 22000, duration_minutes: 120 },
  ]

  it('monta um snapshot por servico selecionado, na ordem pedida', () => {
    const result = buildServiceSnapshots(services, ['b', 'a'])
    expect(result).toEqual([
      { service_id: 'b', service_name_snapshot: 'Coloracao', price_cents_snapshot: 22000, duration_minutes_snapshot: 120 },
      { service_id: 'a', service_name_snapshot: 'Corte', price_cents_snapshot: 8000, duration_minutes_snapshot: 45 },
    ])
  })

  it('lanca erro se um serviceId nao existir na lista de servicos', () => {
    expect(() => buildServiceSnapshots(services, ['c'])).toThrow()
  })
})
