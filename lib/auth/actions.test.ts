import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn(), getUser: vi.fn(), membership: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('../security/rate-limit', () => ({ enforceRateLimit: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../supabase/server', () => ({ createClient: async () => ({ auth: {
  signInWithPassword: mocks.signIn, signOut: mocks.signOut, getUser: mocks.getUser,
} }) }))
vi.mock('./owner-membership', () => ({ isOwner: mocks.membership }))
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`) } }))

import { login, logout } from '../actions/auth'

function loginData(): FormData {
  const form = new FormData()
  form.set('email', `${randomUUID()}@example.test`)
  form.set('password', randomUUID())
  return form
}

describe('authentication actions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.signIn.mockResolvedValue({ error: null })
    mocks.signOut.mockResolvedValue({ error: null })
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner-id' } }, error: null })
    mocks.membership.mockResolvedValue(true)
  })

  it('rejects invalid forms before calling authentication', async () => {
    await expect(login(new FormData())).rejects.toThrow('redirect:/login?error=login')
    expect(mocks.signIn).not.toHaveBeenCalled()
  })

  it('uses a fixed destination even when an external next URL is supplied', async () => {
    const form = loginData()
    form.set('next', 'https://example.test/redirect')
    await expect(login(form)).rejects.toThrow('redirect:/painel')
    expect(mocks.getUser).toHaveBeenCalledOnce()
    expect(mocks.membership).toHaveBeenCalledWith(expect.anything(), 'owner-id')
  })

  it('does not distinguish wrong credentials from denied membership', async () => {
    mocks.signIn.mockResolvedValueOnce({ error: { message: 'private auth detail' } })
    await expect(login(loginData())).rejects.toThrow('redirect:/login?error=login')
    mocks.membership.mockResolvedValue(false)
    await expect(login(loginData())).rejects.toThrow('redirect:/login?error=login')
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('rejects a successful sign-in when server identity verification fails', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } })
    await expect(login(loginData())).rejects.toThrow('redirect:/login?error=login')
    expect(mocks.membership).not.toHaveBeenCalled()
  })

  it('maps thrown authentication failures to a generic error', async () => {
    mocks.signIn.mockRejectedValue(new Error('private transport detail'))
    await expect(login(loginData())).rejects.toThrow('redirect:/login?error=login')
  })

  it('ends the local session and preserves the success redirect', async () => {
    await expect(logout()).rejects.toThrow('redirect:/login')
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it.each(['returned', 'thrown'])('does not pretend logout succeeded on %s errors', async kind => {
    if (kind === 'returned') mocks.signOut.mockResolvedValue({ error: { message: 'private error' } })
    else mocks.signOut.mockRejectedValue(new Error('private error'))
    await expect(logout()).rejects.toThrow('redirect:/login?error=logout')
  })
})
