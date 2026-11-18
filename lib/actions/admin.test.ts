import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ requireOwner: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('../auth/require-owner', () => ({ requireOwner: mocks.requireOwner }))
vi.mock('../supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('../booking-feature', () => ({ bookingApprovalEnabled: () => true }))
import { createBlock, getAgenda, getBusinessHours, getServices, removeBlock, saveBusinessHours, saveService, setServiceActive } from './admin'

describe('protected admin actions', () => {
  beforeEach(() => vi.resetAllMocks())
  it.each([
    ['agenda', () => getAgenda({})], ['services', () => getServices()], ['hours', () => getBusinessHours()],
    ['save service', () => saveService({})], ['archive', () => setServiceActive({})],
    ['block', () => createBlock({})], ['unblock', () => removeBlock({})], ['save hours', () => saveBusinessHours({})],
  ])('rejects unauthorized %s before privileged database access', async (_name, action) => {
    mocks.requireOwner.mockRejectedValue(new Error('Acesso não autorizado.'))
    await expect(action()).rejects.toThrow('Acesso não autorizado.')
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })
  it('does not send invalid service data to the database', async () => {
    mocks.requireOwner.mockResolvedValue({ id: 'owner' })
    expect(await saveService({ name: 'Corte', priceCents: -1, durationMinutes: 0 })).toHaveProperty('error')
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })
})
