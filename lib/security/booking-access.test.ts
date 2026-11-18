import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { addBookingReceipt, readBookingReceipts, RECEIPT_TTL } from './booking-access'

const id = '11111111-1111-4111-8111-111111111111'
describe('prova de posse do comprovante', () => {
  beforeEach(() => vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-secret-'.repeat(4)))
  afterEach(() => vi.unstubAllEnvs())
  it('não aceita UUID, lixo ou cookie adulterado como autorização', () => {
    const receipt = addBookingReceipt(undefined, id, 1000)
    expect(readBookingReceipts(id, 1000)).toEqual([])
    expect(readBookingReceipts('x'.repeat(5000), 1000)).toEqual([])
    expect(readBookingReceipts(receipt.slice(0, -1) + '!', 1000)).toEqual([])
  })
  it('autoriza somente as reservas emitidas e dentro do prazo', () => {
    const receipt = addBookingReceipt(undefined, id, 1000)
    expect(readBookingReceipts(receipt, 1001).map(x => x.id)).toEqual([id])
    expect(readBookingReceipts(receipt, 1000 + 3 * 86_400).map(x => x.id)).toEqual([id])
    expect(readBookingReceipts(receipt, 1000 + RECEIPT_TTL)).toEqual([])
  })
  it('mantém no máximo oito reservas, sem renovar o prazo das antigas', () => {
    let receipt = addBookingReceipt(undefined, id, 1000)
    for (let n = 2; n <= 10; n++) receipt = addBookingReceipt(receipt, `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, 1000 + n)
    const entries = readBookingReceipts(receipt, 1020)
    expect(entries).toHaveLength(8)
    expect(entries.some(x => x.id === id)).toBe(false)
    expect(receipt.length).toBeLessThan(3000)
  })
  it('rotação da credencial invalida comprovantes anteriores', () => {
    const receipt = addBookingReceipt(undefined, id, 1000)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'different-test-secret-'.repeat(4))
    expect(readBookingReceipts(receipt, 1000)).toEqual([])
  })
})
