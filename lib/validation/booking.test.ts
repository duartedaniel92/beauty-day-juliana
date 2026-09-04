import { describe, expect, it } from 'vitest'
import { bookingInputSchema, getAvailableSlotsInputSchema } from './booking'

const validInput = {
  serviceIds: ['550e8400-e29b-41d4-a716-446655440000'],
  clientName: 'Maria Silva',
  clientWhatsapp: '(11) 98888-7777',
  clientEmail: 'maria@example.com',
  startTime: new Date('2026-09-10T13:00:00Z'),
}

describe('bookingInputSchema', () => {
  it('aceita um input valido', () => {
    const result = bookingInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejeita quando nenhum servico foi selecionado', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, serviceIds: [] })
    expect(result.success).toBe(false)
  })

  it('rejeita nome muito curto', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, clientName: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejeita e-mail invalido', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, clientEmail: 'nao-e-email' })
    expect(result.success).toBe(false)
  })

  it('normaliza o whatsapp removendo formatacao', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, clientWhatsapp: '(11) 98888-7777' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientWhatsapp).toBe('11988887777')
    }
  })

  it('rejeita whatsapp com poucos digitos', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, clientWhatsapp: '123' })
    expect(result.success).toBe(false)
  })

  it('rejeita serviceId que nao e um uuid', () => {
    const result = bookingInputSchema.safeParse({ ...validInput, serviceIds: ['nao-e-uuid'] })
    expect(result.success).toBe(false)
  })
})

describe('getAvailableSlotsInputSchema', () => {
  it('aceita serviceIds e uma data no formato YYYY-MM-DD', () => {
    const result = getAvailableSlotsInputSchema.safeParse({
      serviceIds: ['550e8400-e29b-41d4-a716-446655440000'],
      dateISO: '2026-09-10',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita data em formato invalido', () => {
    const result = getAvailableSlotsInputSchema.safeParse({
      serviceIds: ['550e8400-e29b-41d4-a716-446655440000'],
      dateISO: '10/09/2026',
    })
    expect(result.success).toBe(false)
  })
})
