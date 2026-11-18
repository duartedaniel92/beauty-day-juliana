import { afterEach, describe, expect, it, vi } from 'vitest'
import { publicEnv } from './env'

afterEach(() => vi.unstubAllEnvs())
describe('ambiente público', () => {
  function configure(url = 'https://example.supabase.co', key = 'sb_publishable_test') {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', url)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', key)
    vi.stubEnv('NODE_ENV', 'production')
  }
  it('aceita apenas credencial pública', () => {
    configure()
    expect(publicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('sb_publishable_test')
  })
  it.each(['sb_secret_test', `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`])('recusa segredo sem reproduzi-lo no erro', key => {
    configure(undefined, key)
    expect(() => publicEnv()).toThrow('Configure a URL e a chave pública')
    try { publicEnv() } catch (error) { expect(String(error)).not.toContain(key) }
  })
  it.each(['http://example.supabase.co', 'https://user:password@example.supabase.co', 'https://example.supabase.co/path'])('recusa URL insegura ou ambígua: %s', url => {
    configure(url)
    expect(() => publicEnv()).toThrow()
  })
  it('permite HTTP local apenas em desenvolvimento', () => {
    configure('http://127.0.0.1:54321')
    expect(() => publicEnv()).toThrow()
    vi.stubEnv('NODE_ENV', 'development')
    expect(publicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321')
  })
})
