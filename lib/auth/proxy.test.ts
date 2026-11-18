import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CookieMethodsServer } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { unstable_doesMiddlewareMatch as unstable_doesProxyMatch } from 'next/experimental/testing/server'

const mocks = vi.hoisted(() => ({ create: vi.fn(), getUser: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.create }))
import { updateSession } from '../supabase/proxy'
import { config } from '../../proxy'

describe('SSR session proxy', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.test')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sb_publishable_mock_only')
    mocks.create.mockReturnValue({ auth: { getUser: mocks.getUser } })
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
  })
  afterEach(() => vi.unstubAllEnvs())

  it('rejects privileged keys before creating a public session client', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sb_secret_mock_only')
    await expect(updateSession(new NextRequest('https://example.test/'))).rejects.toThrow('chave pública')
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('propagates every refreshed cookie to server requests and browser responses with cache headers', async () => {
    mocks.create.mockImplementation((_url: string, _key: string, { cookies }: { cookies: CookieMethodsServer }) => {
      mocks.getUser.mockImplementation(async () => {
        await cookies.setAll?.([{ name: 'session-part-1', value: 'refreshed', options: { httpOnly: true, path: '/', sameSite: 'lax' } }], {
          'Cache-Control': 'private, no-store', Expires: '0', Pragma: 'no-cache',
        })
        await cookies.setAll?.([{ name: 'session-part-2', value: 'continued', options: { path: '/' } }], {})
        return { data: { user: null }, error: null }
      })
      return { auth: { getUser: mocks.getUser } }
    })
    const request = new NextRequest('https://example.test/')
    const response = await updateSession(request)
    expect(request.cookies.get('session-part-1')?.value).toBe('refreshed')
    expect(response.headers.get('x-middleware-request-cookie')).toContain('session-part-1=refreshed')
    expect(response.cookies.get('session-part-1')?.httpOnly).toBe(true)
    expect(response.cookies.get('session-part-2')?.value).toBe('continued')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('expires')).toBe('0')
    expect(response.headers.get('pragma')).toBe('no-cache')
  })

  it.each(['/login', '/painel', '/painel/servicos', '/sucesso/any', '/auth/confirm', '/agendar'])('prevents shared caching of %s even without a refresh', async path => {
    const response = await updateSession(new NextRequest(`https://example.test${path}`))
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(mocks.getUser).toHaveBeenCalledOnce()
  })

  it('emits a fresh nonce and replaces attacker supplied CSP headers', async () => {
    const first = await updateSession(new NextRequest('https://example.test/', { headers: { 'x-nonce':'attacker', 'Content-Security-Policy':"script-src *" } }))
    const second = await updateSession(new NextRequest('https://example.test/'))
    expect(first.headers.get('content-security-policy')).not.toContain('attacker')
    expect(first.headers.get('content-security-policy')).not.toBe(second.headers.get('content-security-policy'))
    expect(first.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
    expect(first.headers.get('x-middleware-request-content-security-policy')).toBe(first.headers.get('content-security-policy'))
    expect(first.headers.get('strict-transport-security')).toContain('31536000')
  })

  it.each(['/_next/static/chunks/app.js', '/_next/image?url=x', '/favicon.ico', '/images/Juliana_1.jpg', '/font.woff2', '/robots.txt'])('does not intercept asset %s', url => {
    expect(unstable_doesProxyMatch({ config, url })).toBe(false)
  })

  it.each(['/login', '/painel', '/painel/servicos', '/agendar'])('refreshes on %s', url => {
    expect(unstable_doesProxyMatch({ config, url })).toBe(true)
  })
})
