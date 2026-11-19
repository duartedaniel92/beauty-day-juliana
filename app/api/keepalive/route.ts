import { timingSafeEqual } from 'node:crypto'
import { getPublicServices } from '../../../lib/public-services'

// Chamado 1x/dia pelo cron da Vercel (vercel.json): o Supabase gratuito pausa após 7 dias sem uso.
function fromCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(request.headers.get('authorization') ?? '')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export async function GET(request: Request): Promise<Response> {
  if (!fromCron(request)) return new Response('Não autorizado.', { status: 401 })
  try {
    await getPublicServices()
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false }, { status: 503 })
  }
}
