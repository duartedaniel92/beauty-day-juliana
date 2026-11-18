import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { publicEnv, serviceRoleKey } from '../env'

// Cliente com service role — ignora RLS. So pode ser importado em codigo
// que roda exclusivamente no servidor (Server Actions). Nunca importar
// este arquivo em um Client Component.
export function createAdminClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    publicEnv().NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
