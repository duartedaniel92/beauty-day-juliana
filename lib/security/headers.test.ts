import { expect, it } from 'vitest'
import { contentSecurityPolicy } from './headers'
it('permite hidratação por nonce, sem eval em produção nem scripts arbitrários', () => {
  const policy = contentSecurityPolicy('test_nonce', false)
  expect(policy).toContain("'nonce-test_nonce' 'strict-dynamic'")
  expect(policy).not.toContain('unsafe-eval')
  expect(policy).toContain("frame-ancestors 'none'")
  expect(policy).toContain("form-action 'self'")
  expect(policy).toContain("object-src 'none'")
})
it('habilita eval apenas no desenvolvimento', () => {
  expect(contentSecurityPolicy('test_nonce', true)).toContain('unsafe-eval')
})
