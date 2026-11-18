import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicEnv } from '../env'
import { sessionCookieOptions, BOOKING_CLIENT_COOKIE } from '../security/cookies'
import { randomBytes } from 'node:crypto'
import { contentSecurityPolicy } from '../security/headers'

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const environment = publicEnv()
  const nonce = randomBytes(18).toString('base64')
  const policy = contentSecurityPolicy(nonce, process.env.NODE_ENV === 'development')
  request.headers.set('Content-Security-Policy', policy)
  request.headers.set('x-nonce', nonce)
  let bookingClient: string | undefined
  if (request.nextUrl.pathname === '/agendar' && !/^[a-f0-9]{64}$/.test(request.cookies.get(BOOKING_CLIENT_COOKIE)?.value ?? '')) {
    bookingClient = randomBytes(32).toString('hex')
    request.cookies.set(BOOKING_CLIENT_COOKIE, bookingClient)
  }
  let response = NextResponse.next({ request })
  const client = createServerClient(environment.NEXT_PUBLIC_SUPABASE_URL, environment.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions: sessionCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        const previous = response
        response = NextResponse.next({ request })
        previous.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
        previous.headers.forEach((value, key) => {
          if (['cache-control', 'expires', 'pragma'].includes(key)) response.headers.set(key, value)
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  // Refresh before returning so both the server render and browser receive cookies.
  await client.auth.getUser()
  if (/^\/(login|painel|sucesso|auth|nova-senha|recuperar-senha|agendar)(?:\/|$)/.test(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  }
  if (bookingClient) response.cookies.set(BOOKING_CLIENT_COOKIE, bookingClient, { ...sessionCookieOptions(), maxAge: 86400 })
  response.headers.set('Content-Security-Policy', policy)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (request.nextUrl.protocol === 'https:') response.headers.set('Strict-Transport-Security', 'max-age=31536000')
  return response
}
