import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ order: vi.fn(), eq: vi.fn(), select: vi.fn(), from: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('./supabase/server', () => ({ createClient: async () => ({ from: mocks.from }) }))
import { getPublicServices } from './public-services'

describe('public catalog', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.from.mockReturnValue({ select: mocks.select })
    mocks.select.mockReturnValue({ eq: mocks.eq })
    mocks.eq.mockReturnValue({ order: mocks.order })
  })

  it('returns only the active public catalog ordered by duration', async () => {
    const service = { id: 'service', name: 'Corte', price_cents: 8000, duration_minutes: 45 }
    mocks.order.mockResolvedValue({ data: [service], error: null })
    await expect(getPublicServices()).resolves.toEqual([service])
    expect(mocks.eq).toHaveBeenCalledWith('active', true)
    expect(mocks.order).toHaveBeenCalledWith('duration_minutes', { ascending: true })
  })

  it('returns an empty catalog without inventing services', async () => {
    mocks.order.mockResolvedValue({ data: null, error: null })
    await expect(getPublicServices()).resolves.toEqual([])
  })

  it('keeps provider details out of public errors', async () => {
    mocks.order.mockResolvedValue({ data: null, error: { message: 'private database details' } })
    await expect(getPublicServices()).rejects.toThrow('Não foi possível carregar os serviços agora.')
  })
})
