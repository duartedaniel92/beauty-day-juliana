import { afterEach, expect, it, vi } from 'vitest'
import { sessionCookieOptions } from './cookies'
afterEach(() => vi.unstubAllEnvs())
it('protege cookies em HTTPS sem duração excessiva nem domínio compartilhado', () => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('SITE_URL', 'https://beauty.example.test')
  expect(sessionCookieOptions()).toEqual({ httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 604800 })
})
it('permite desenvolvimento local HTTP, mantendo HttpOnly e SameSite', () => {
  vi.stubEnv('NODE_ENV', 'development')
  expect(sessionCookieOptions()).toMatchObject({ secure: false, httpOnly: true, sameSite: 'lax' })
})
