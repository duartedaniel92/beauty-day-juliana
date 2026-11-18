export const BOOKING_CLIENT_COOKIE = 'bd_booking_client'
// A sessão é consumida somente pelo servidor; nenhum SDK de navegador é necessário.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development' && (process.env.VERCEL === '1' || process.env.SITE_URL?.startsWith('https://') === true),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  }
}
