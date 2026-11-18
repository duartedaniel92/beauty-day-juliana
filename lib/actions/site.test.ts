import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ owner: vi.fn(), admin: vi.fn(), rate: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('../auth/require-owner', () => ({ requireOwner: mocks.owner }))
vi.mock('../supabase/admin', () => ({ createAdminClient: mocks.admin }))
vi.mock('../security/rate-limit', () => ({ enforceRateLimit: mocks.rate, RateLimitError: class extends Error {} }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
import { saveSiteContent, saveServicePhoto, uploadSiteImage } from './site'
import { DEFAULT_SITE_CONTENT } from '../site-content'
beforeEach(() => {
  vi.resetAllMocks()
  mocks.owner.mockResolvedValue({ id: 'owner' })
  const query = { update: mocks.update, eq: mocks.eq, select: mocks.select, maybeSingle: mocks.single }
  for (const method of [mocks.update,mocks.eq,mocks.select]) method.mockReturnValue(query)
  mocks.admin.mockReturnValue({ storage: { from: vi.fn() }, from: () => query })
})
it('nega todas as operações antes de acessar banco ou arquivo sem proprietária', async () => {
  mocks.owner.mockRejectedValue(new Error('Acesso não autorizado.'))
  for (const operation of [() => saveSiteContent({}), () => saveServicePhoto({}), () => uploadSiteImage(new FormData())]) {
    await expect(operation()).rejects.toThrow('Acesso não autorizado.')
  }
  expect(mocks.admin).not.toHaveBeenCalled()
  expect(mocks.rate).not.toHaveBeenCalled()
})
it('valida conteúdo e IDs antes de gravar', async () => {
  expect(await saveSiteContent({ content: { ...DEFAULT_SITE_CONTENT, aboutText: 'x'.repeat(1201) }, version: 0 })).toHaveProperty('error')
  expect(await saveServicePhoto({ serviceId: 'not-a-uuid', image: null })).toHaveProperty('error')
  expect(mocks.admin).not.toHaveBeenCalled()
})
it('não anuncia sucesso se outra aba já salvou a versão', async () => {
  mocks.single.mockResolvedValue({ data: null, error: null })
  expect(await saveSiteContent({ content: DEFAULT_SITE_CONTENT, version: 0 })).toEqual({ error: 'O site foi alterado em outra aba. Atualize a página antes de editar.' })
  expect(mocks.eq).toHaveBeenCalledWith('version', 0)
})
it('não revela erro do banco e mantém a edição disponível para nova tentativa', async () => {
  mocks.single.mockResolvedValue({ data: null, error: { message: 'private database detail' } })
  const result = await saveSiteContent({ content: DEFAULT_SITE_CONTENT, version: 0 })
  expect(result).toHaveProperty('error')
  expect(JSON.stringify(result)).not.toContain('private database detail')
})
