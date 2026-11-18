import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), headers: vi.fn() }))
vi.mock('../supabase/admin', () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }))
vi.mock('next/headers', () => ({ headers: mocks.headers }))
import { enforceRateLimit, trustedRequestIdentity } from './rate-limit'

describe('limitação de tentativas', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-secret-'.repeat(6))
    vi.stubEnv('VERCEL', '1')
    mocks.headers.mockResolvedValue(new Headers({ 'x-vercel-forwarded-for': '203.0.113.10' }))
    mocks.rpc.mockResolvedValue({ data: { allowed: true, retry_after_seconds: 0 }, error: null })
  })
  afterEach(() => vi.unstubAllEnvs())
  it('não confia em IP de formulário ou X-Forwarded-For alternativo', () => {
    expect(() => trustedRequestIdentity(new Headers({ 'x-forwarded-for': '203.0.113.1' }), { VERCEL: '1' })).toThrow()
    expect(trustedRequestIdentity(new Headers({ 'x-vercel-forwarded-for': '2001:db8::1' }), { VERCEL: '1' })).toBe('2001:db8::1')
    expect(() => trustedRequestIdentity(new Headers({ 'x-vercel-forwarded-for': 'bad,203.0.113.1' }), { VERCEL: '1' })).toThrow()
  })
  it('exige contexto confiável em produção e permite desenvolvimento explícito', () => {
    expect(() => trustedRequestIdentity(new Headers(), { NODE_ENV: 'production' })).toThrow()
    expect(trustedRequestIdentity(new Headers(), { NODE_ENV: 'development' })).toBe('local')
  })
  it('grava somente HMAC do identificador e aplica duas barreiras de login', async () => {
    await enforceRateLimit('login', 'Owner@example.test')
    expect(mocks.rpc).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain('example.test')
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain('203.0.113.10')
  })
  it.each(['blocked', 'database-error', 'malformed-result'])('não libera silenciosamente quando %s', async failure => {
    mocks.rpc.mockResolvedValue(failure === 'blocked'
      ? { data: { allowed: false, retry_after_seconds: 120 }, error: null }
      : failure === 'database-error' ? { data: null, error: { message: 'private SQL detail' } }
        : { data: {}, error: null })
    await expect(enforceRateLimit('booking', '11999999999')).rejects.toThrow(/Aguarde|indisponível/)
  })
})
