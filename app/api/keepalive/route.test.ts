import { beforeEach, describe, expect, it, vi } from 'vitest'
const services = vi.hoisted(() => vi.fn())
vi.mock('../../../lib/public-services', () => ({ getPublicServices: services }))
import { GET } from './route'

const call = (authorization?: string) =>
  GET(new Request('https://example.test/api/keepalive', { headers: authorization ? { authorization } : {} }))

describe('keepalive diário contra a pausa do Supabase', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('CRON_SECRET', 'segredo-de-teste'); services.mockResolvedValue([]) })

  it('recusa chamada sem o segredo do cron, sem tocar no banco', async () => {
    expect((await call()).status).toBe(401)
    expect((await call('Bearer outro')).status).toBe(401)
    expect(services).not.toHaveBeenCalled()
  })
  it('recusa tudo quando CRON_SECRET não está configurado', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await call('Bearer ')).status).toBe(401)
  })
  it('consulta o banco quando chamado pelo cron', async () => {
    expect((await call('Bearer segredo-de-teste')).status).toBe(200)
    expect(services).toHaveBeenCalledOnce()
  })
  it('sinaliza falha do banco para aparecer no log do cron', async () => {
    services.mockRejectedValue(new Error('pausado'))
    expect((await call('Bearer segredo-de-teste')).status).toBe(503)
  })
})
