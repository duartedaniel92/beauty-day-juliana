import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), maybeSingle: vi.fn(), eq: vi.fn(), from: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('../supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: mocks.getUser },
  from: mocks.from,
}) }))
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`) } }))

import { requireOwner } from './require-owner'

describe('requireOwner', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner-id' } }, error: null })
    mocks.maybeSingle.mockResolvedValue({ data: { user_id: 'owner-id' }, error: null })
    mocks.eq.mockReturnValue({ eq: mocks.eq, maybeSingle: mocks.maybeSingle })
    mocks.from.mockReturnValue({ select: () => ({ eq: mocks.eq }) })
  })

  it('redirects anonymous visitors without querying membership', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(requireOwner()).rejects.toThrow('redirect:/login')
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('rejects authenticated non-owners', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    await expect(requireOwner()).rejects.toThrow('Acesso não autorizado.')
  })

  it('returns only the verified owner id', async () => {
    await expect(requireOwner()).resolves.toEqual({ id: 'owner-id' })
    expect(mocks.from).toHaveBeenCalledWith('salon_owner')
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'owner-id')
    expect(mocks.eq).toHaveBeenCalledWith('singleton', true)
  })

  it('rejects a different membership identity', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { user_id: 'other-id' }, error: null })
    await expect(requireOwner()).rejects.toThrow('Acesso não autorizado.')
  })

  it('fails closed on membership errors without exposing database details', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { user_id: 'owner-id' }, error: { message: 'private database detail' } })
    await expect(requireOwner()).rejects.toThrow('Acesso não autorizado.')
  })

  it('does not trust a user returned alongside an auth error', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner-id' } }, error: { message: 'invalid token' } })
    await expect(requireOwner()).rejects.toThrow('redirect:/login')
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('sanitizes transport failures and denies access', async () => {
    mocks.getUser.mockRejectedValue(new Error('private transport detail'))
    await expect(requireOwner()).rejects.toThrow('Acesso não autorizado.')
  })
})
