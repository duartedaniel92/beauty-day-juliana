import { describe, expect, it } from 'vitest'
import { decidedBooking, effectiveBookingStatus } from './booking-status'

describe('prazo da decisão da profissional', () => {
  it('encerra um pedido exatamente no limite', () => {
    expect(effectiveBookingStatus('pending', '2026-10-04T12:00:00Z', Date.parse('2026-10-04T12:00:00Z'))).toBe('expired')
  })
  it('preserva pedidos sem prazo e reservas confirmadas', () => {
    expect(effectiveBookingStatus('pending', null)).toBe('pending')
    expect(effectiveBookingStatus('confirmed', '2020-01-01T00:00:00Z')).toBe('confirmed')
  })
})

describe('reserva depois da decisão, antes de recarregar a agenda', () => {
  const booking = { start_time: '2026-11-20T13:00:00.000Z', end_time: '2026-11-20T14:25:00.000Z' }
  it('autorizar confirma sem mudar o horário', () => {
    expect(decidedBooking(booking, 'approve')).toEqual({ status: 'confirmed', ...booking })
  })
  it('reagendar mantém a duração no novo horário', () => {
    expect(decidedBooking(booking, 'reschedule', '2026-11-21T12:00:00.000Z'))
      .toEqual({ status: 'confirmed', start_time: '2026-11-21T12:00:00.000Z', end_time: '2026-11-21T13:25:00.000Z' })
  })
  it('recusar e cancelar encerram a reserva', () => {
    expect(decidedBooking(booking, 'reject').status).toBe('rejected')
    expect(decidedBooking(booking, 'cancel').status).toBe('cancelled')
  })
})
