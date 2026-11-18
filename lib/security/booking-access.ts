import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { serviceRoleKey } from '../env'

export const BOOKING_RECEIPT_COOKIE = 'bd_booking_receipts'
// Mantém acesso durante fins de semana sem tornar o UUID uma credencial pública.
export const RECEIPT_TTL = 7 * 24 * 60 * 60
const schema = z.array(z.object({ id: z.uuid(), expires: z.number().int().positive() })).max(8)

// Separação de propósito: a chave privada nunca é incluída no cookie ou HTML.
export function securityHash(purpose: string, value: string): string {
  return createHmac('sha256', serviceRoleKey()).update(`beauty-day:v1:${purpose}\0${value}`).digest('hex')
}

export function readBookingReceipts(value: string | undefined, now = Math.floor(Date.now() / 1000)): z.infer<typeof schema> {
  if (!value || value.length > 3000) return []
  const [payload, signature, extra] = value.split('.')
  if (extra || !payload || !/^[a-f0-9]{64}$/.test(signature ?? '')) return []
  const expected = securityHash('receipt', payload)
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return []
  try {
    const result = schema.safeParse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')))
    return result.success ? result.data.filter(entry => entry.expires > now && entry.expires <= now + RECEIPT_TTL) : []
  } catch { return [] }
}

export function addBookingReceipt(previous: string | undefined, id: string, now = Math.floor(Date.now() / 1000)): string {
  const entries = readBookingReceipts(previous, now).filter(entry => entry.id !== id)
  entries.push({ id: z.uuid().parse(id), expires: now + RECEIPT_TTL })
  const payload = Buffer.from(JSON.stringify(entries.slice(-8))).toString('base64url')
  return `${payload}.${securityHash('receipt', payload)}`
}
