import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ reset: vi.fn(), verify: vi.fn(), exchange: vi.fn(), update: vi.fn(), signOut: vi.fn(), owner: vi.fn(), requireOwner: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('../security/rate-limit', () => ({ enforceRateLimit: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../supabase/server', () => ({ createClient: async () => ({ auth: { resetPasswordForEmail: mocks.reset, verifyOtp: mocks.verify, exchangeCodeForSession: mocks.exchange, updateUser: mocks.update, signOut: mocks.signOut } }) }))
vi.mock('./owner-membership', () => ({ isOwner: mocks.owner }))
vi.mock('./require-owner', () => ({ requireOwner: mocks.requireOwner }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`) } }))
import { requestPasswordReset, confirmPasswordRecovery, confirmPasswordRecoveryCode, updatePassword, retryPasswordRecoveryLogout } from '../actions/password-recovery'

function form(values: Record<string, string>): FormData {
  const result = new FormData()
  for (const [key, value] of Object.entries(values)) result.set(key, value)
  return result
}

describe('password recovery', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('SITE_URL', 'https://beauty.example.test')
    mocks.reset.mockResolvedValue({ error: null })
    mocks.verify.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
    mocks.exchange.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
    mocks.owner.mockResolvedValue(true)
    mocks.requireOwner.mockResolvedValue({ id: 'owner' })
    mocks.update.mockResolvedValue({ error: null })
    mocks.signOut.mockResolvedValue({ error: null })
  })
  afterEach(() => vi.unstubAllEnvs())

  it('exchanges a PKCE code for the owner and ignores a submitted destination', async () => {
    const code = '12345678-1234-1234-1234-123456789abc'
    await expect(confirmPasswordRecoveryCode(form({ code, next: 'https://attacker.test' }))).rejects.toThrow('redirect:/nova-senha')
    expect(mocks.exchange).toHaveBeenCalledExactlyOnceWith(code)
    expect(mocks.owner).toHaveBeenCalledWith(expect.anything(), 'owner')
    expect(mocks.verify).not.toHaveBeenCalled()
    expect(mocks.signOut).not.toHaveBeenCalled()
  })
  it.each(['returned', 'thrown', 'missing-user'])('rejects an unsuccessful PKCE exchange (%s)', async failure => {
    if (failure === 'thrown') mocks.exchange.mockRejectedValue(new Error('private transport detail'))
    else mocks.exchange.mockResolvedValue({ data: { user: null }, error: failure === 'returned' ? { message: 'missing verifier' } : null })
    await expect(confirmPasswordRecoveryCode(form({ code: '12345678-1234-1234-1234-123456789abc' }))).rejects.toThrow('redirect:/recuperar-senha?error=expired')
    expect(mocks.owner).not.toHaveBeenCalled()
  })
  it('signs out locally when a PKCE code belongs to a non-owner', async () => {
    mocks.owner.mockResolvedValue(false)
    await expect(confirmPasswordRecoveryCode(form({ code: '12345678-1234-1234-1234-123456789abc' }))).rejects.toThrow('redirect:/recuperar-senha?error=expired')
    expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' })
  })
  it.each([undefined, '', 'a'.repeat(15), 'a'.repeat(513), 'invalid/code-value', ' invalid-code-value'])('rejects malformed PKCE code before exchange (%s)', async code => {
    await expect(confirmPasswordRecoveryCode(form(code === undefined ? {} : { code }))).rejects.toThrow('redirect:/recuperar-senha?error=expired')
    expect(mocks.exchange).not.toHaveBeenCalled()
    expect(mocks.owner).not.toHaveBeenCalled()
  })

  it('uses only the configured public origin, ignoring a submitted redirect', async () => {
    await expect(requestPasswordReset(form({ email: 'owner@example.test', redirectTo: 'https://attacker.test' }))).rejects.toThrow('redirect:/recuperar-senha?status=sent')
    expect(mocks.reset).toHaveBeenCalledWith('owner@example.test', { redirectTo: 'https://beauty.example.test/auth/confirm' })
  })
  it('rejects malformed email without requesting a message', async () => {
    await expect(requestPasswordReset(form({ email: 'invalid' }))).rejects.toThrow('redirect:/recuperar-senha?error=invalid')
    expect(mocks.reset).not.toHaveBeenCalled()
  })
  it('reports delivery failures without exposing provider details', async () => {
    mocks.reset.mockResolvedValue({ error: { message: 'private SMTP details' } })
    await expect(requestPasswordReset(form({ email: 'owner@example.test' }))).rejects.toThrow('redirect:/recuperar-senha?error=unavailable')
  })
  it('exchanges only recovery tokens and uses a fixed destination', async () => {
    const token = 'a'.repeat(64)
    await expect(confirmPasswordRecovery(form({ token_hash: token, type: 'signup', next: 'https://attacker.test' }))).rejects.toThrow('redirect:/nova-senha')
    expect(mocks.verify).toHaveBeenCalledWith({ token_hash: token, type: 'recovery' })
  })
  it('rejects expired links without creating a password form session', async () => {
    mocks.verify.mockResolvedValue({ data: { user: null }, error: { message: 'expired token' } })
    await expect(confirmPasswordRecovery(form({ token_hash: 'a'.repeat(64) }))).rejects.toThrow('redirect:/recuperar-senha?error=expired')
    expect(mocks.owner).not.toHaveBeenCalled()
  })
  it('denies a non-owner even after a valid recovery token', async () => {
    mocks.owner.mockResolvedValue(false)
    await expect(confirmPasswordRecovery(form({ token_hash: 'a'.repeat(64) }))).rejects.toThrow('redirect:/recuperar-senha?error=expired')
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
  it('denies anonymous password changes before calling updateUser', async () => {
    mocks.requireOwner.mockRejectedValue(new Error('redirect:/login'))
    await expect(updatePassword(form({ password: 'temporary-test-password', confirmPassword: 'temporary-test-password' }))).rejects.toThrow('redirect:/login')
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('requires matching passwords of at least twelve characters', async () => {
    await expect(updatePassword(form({ password: 'short', confirmPassword: 'short' }))).rejects.toThrow('redirect:/nova-senha?error=invalid')
    await expect(updatePassword(form({ password: 'temporary-test-password', confirmPassword: 'different-test-password' }))).rejects.toThrow('redirect:/nova-senha?error=invalid')
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('updates the owner password and revokes sessions before returning to login', async () => {
    await expect(updatePassword(form({ password: 'temporary-test-password', confirmPassword: 'temporary-test-password' }))).rejects.toThrow('redirect:/login?status=password-updated')
    expect(mocks.update).toHaveBeenCalledWith({ password: 'temporary-test-password' })
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'global' })
  })
  it('does not claim success when the password update fails', async () => {
    mocks.update.mockResolvedValue({ error: { message: 'private auth detail' } })
    await expect(updatePassword(form({ password: 'temporary-test-password', confirmPassword: 'temporary-test-password' }))).rejects.toThrow('redirect:/nova-senha?error=update')
    expect(mocks.signOut).not.toHaveBeenCalled()
  })
  it.each(['returned', 'thrown'])('preserves password success when global logout fails (%s)', async failure => {
    if (failure === 'returned') mocks.signOut.mockResolvedValue({ error: { message: 'private auth detail' } })
    else mocks.signOut.mockRejectedValue(new Error('private transport detail'))
    await expect(updatePassword(form({ password: 'temporary-test-password', confirmPassword: 'temporary-test-password' }))).rejects.toThrow('redirect:/login?status=password-updated&error=logout')
    expect(mocks.update).toHaveBeenCalledTimes(1)
    expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'global' })
  })
  it('retries global logout without changing the password again and returns to a fixed login destination', async () => {
    await expect(retryPasswordRecoveryLogout()).rejects.toThrow('redirect:/login?status=password-updated')
    expect(mocks.requireOwner).toHaveBeenCalledTimes(1)
    expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'global' })
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it.each(['returned', 'thrown'])('keeps the global retry available after another failure (%s)', async failure => {
    if (failure === 'returned') mocks.signOut.mockResolvedValue({ error: { message: 'private auth detail' } })
    else mocks.signOut.mockRejectedValue(new Error('private transport detail'))
    await expect(retryPasswordRecoveryLogout()).rejects.toThrow('redirect:/login?status=password-updated&error=logout')
    expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'global' })
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it.each(['redirect:/login', 'Acesso não autorizado.'])('denies global retry before signOut when authorization fails: %s', async message => {
    mocks.requireOwner.mockRejectedValue(new Error(message))
    await expect(retryPasswordRecoveryLogout()).rejects.toThrow(message)
    expect(mocks.signOut).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
