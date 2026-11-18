import 'server-only'
import { isIP } from 'node:net'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createAdminClient } from '../supabase/admin'
import { securityHash } from './booking-access'

const policies = {
  login: [['login_ip', 50, 900], ['login_identity', 10, 900]],
  recovery: [['recovery_ip', 10, 3600], ['recovery_identity', 3, 3600]],
  booking: [['booking_ip', 5, 900], ['booking_identity', 5, 900]],
  slots: [['slots_ip', 60, 60]],
  site: [['site_ip', 30, 600]],
} as const
const resultSchema = z.object({ allowed: z.boolean(), retry_after_seconds: z.number().int().min(0).max(86400) })

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) { super('Muitas tentativas. Aguarde alguns minutos e tente novamente.') }
}

export function trustedRequestIdentity(requestHeaders: Headers, env: Readonly<Record<string,string|undefined>> = process.env): string {
  if (env.VERCEL === '1') {
    const ip = requestHeaders.get('x-vercel-forwarded-for')?.trim()
    if (ip && isIP(ip)) return ip
  } else if (env.NODE_ENV === 'development' || env.ALLOW_LOCAL_SECURITY === 'true') {
    return 'local'
  }
  throw new Error('Proteção de tentativas indisponível. Tente novamente mais tarde.')
}

export async function enforceRateLimit(action: keyof typeof policies, identity = ''): Promise<void> {
  const ip = trustedRequestIdentity(await headers())
  for (const [scope, limit, seconds] of policies[action]) {
    // Login combina IP + conta; não bloqueia a proprietária globalmente por tentativas alheias.
    const key = scope.endsWith('_identity') ? `${ip}\0${identity.trim().toLowerCase()}` : ip
    const { data, error } = await createAdminClient().rpc('consume_rate_limit', {
      p_scope: scope, p_identity_hash: securityHash('rate', key), p_limit: limit, p_window_seconds: seconds,
    })
    const parsed = resultSchema.safeParse(data)
    if (error || !parsed.success) throw new Error('Proteção de tentativas indisponível. Tente novamente mais tarde.')
    if (!parsed.data.allowed) throw new RateLimitError(parsed.data.retry_after_seconds)
  }
}
