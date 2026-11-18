import { describe, expect, it } from 'vitest'
import { effectiveBookingStatus } from './booking-status'

describe('prazo da decisão da profissional', () => {
  it('encerra um pedido exatamente no limite', () => {
    expect(effectiveBookingStatus('pending', '2026-10-04T12:00:00Z', Date.parse('2026-10-04T12:00:00Z'))).toBe('expired')
  })
  it('preserva pedidos sem prazo e reservas confirmadas', () => {
    expect(effectiveBookingStatus('pending', null)).toBe('pending')
    expect(effectiveBookingStatus('confirmed', '2020-01-01T00:00:00Z')).toBe('confirmed')
  })
})
