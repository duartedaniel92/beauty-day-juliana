import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente com service role — ignora RLS. So pode ser importado em codigo
// que roda exclusivamente no servidor (Server Actions). Nunca importar
// este arquivo em um Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
