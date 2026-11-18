import { z } from 'zod'

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().refine(value => {
    const url = new URL(value)
    const local = process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    return (url.protocol === 'https:' || (local && url.protocol === 'http:')) &&
      !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().max(4096).refine(value => {
    if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true
    // Classifica a chave legada; a assinatura continua sendo validada pelo Supabase.
    // Não aceitar credenciais privilegiadas em campos embutidos no navegador.
    try {
      const parts = value.split('.')
      return parts.length === 3 && JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'
    } catch { return false }
  }),
})

export function publicEnv(): z.infer<typeof publicSchema> {
  const result = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
  if (!result.success) throw new Error('Configure a URL e a chave pública do Supabase no ambiente.')
  return result.data
}

export function serviceRoleKey(): string {
  const result = z.string().min(1).safeParse(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!result.success) throw new Error('Configure a credencial de servidor do Supabase.')
  return result.data
}
