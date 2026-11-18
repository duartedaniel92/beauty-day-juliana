import type { NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/proxy'

export async function proxy(request: NextRequest): Promise<NextResponse> {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf|otf|mp4|webm|pdf)$).*)',
  ],
}
