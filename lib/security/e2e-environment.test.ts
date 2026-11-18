import { expect, it } from 'vitest'
import { assertE2EEnvironment } from './e2e-environment'

it('nega testes com configuração ausente ou produção mesmo com opt-in', () => {
  expect(() => assertE2EEnvironment({})).toThrow()
  expect(() => assertE2EEnvironment({ E2E_ALLOW_MUTATIONS: 'true', E2E_SUPABASE_PROJECT_REF: 'dncuvkrwvrqxdltsympy', NEXT_PUBLIC_SUPABASE_URL: 'https://dncuvkrwvrqxdltsympy.supabase.co' })).toThrow()
})
it('exige coincidência exata do projeto de homologação autorizado', () => {
  const env = { E2E_ALLOW_MUTATIONS: 'true', E2E_SUPABASE_PROJECT_REF: 'testproject', NEXT_PUBLIC_SUPABASE_URL: 'https://testproject.supabase.co' }
  expect(() => assertE2EEnvironment(env)).not.toThrow()
  expect(() => assertE2EEnvironment({ ...env, NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co' })).toThrow()
})
