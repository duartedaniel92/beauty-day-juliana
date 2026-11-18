import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ owner: vi.fn(), rpc: vi.fn() }))
vi.mock('../auth/require-owner', () => ({ requireOwner: mocks.owner }))
vi.mock('../supabase/admin', () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }))
vi.mock('../booking-feature', () => ({ bookingApprovalEnabled: () => true }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
import { decideBooking } from './admin'
const id = '33333333-3333-4333-8333-333333333333'
describe('decisões protegidas no servidor', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.owner.mockResolvedValue({ id: 'owner-from-session' }); mocks.rpc.mockResolvedValue({ error: null }) })
  it('rejeita acesso sem sessão antes da RPC', async () => {
    mocks.owner.mockRejectedValue(new Error('Acesso não autorizado.'))
    await expect(decideBooking({ id, version: 0, action: 'approve' })).rejects.toThrow()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('usa identidade da sessão, nunca a enviada pelo cliente', async () => {
    expect(await decideBooking({ id, version: 2, action: 'approve', actor: 'attacker' })).toEqual({ success: true })
    expect(mocks.rpc).toHaveBeenCalledWith('decide_appointment', expect.objectContaining({ p_actor: 'owner-from-session', p_version: 2 }))
  })
  it('exige motivo e acordo explícito para reagendar', async () => {
    expect(await decideBooking({ id, version: 0, action: 'cancel' })).toHaveProperty('error')
    expect(await decideBooking({ id, version: 0, action: 'reschedule', startTime: '2030-10-08T12:00:00Z' })).toHaveProperty('error')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('traduz colisão sem expor mensagem do banco', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: '23P01', message: 'private SQL detail' } })
    expect(await decideBooking({ id, version: 0, action: 'approve' })).toEqual({ error: 'Esse horário está ocupado. Escolha outro.' })
  })
})
