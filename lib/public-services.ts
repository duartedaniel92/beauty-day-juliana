import 'server-only'
import { createClient } from './supabase/server'
import type { Tables } from './supabase/database.types'

export type PublicService = Pick<Tables<'services'>, 'id' | 'name' | 'price_cents' | 'duration_minutes'> & { description?: string | null }

// Vitrine e agendamento compartilham o catálogo público, com RLS preservada.
export async function getPublicServices(): Promise<PublicService[]> {
  const client = await createClient()
  const { data, error } = await client.from('services')
    .select('id,name,description,price_cents,duration_minutes').eq('active', true)
    .order('duration_minutes', { ascending: true })
  if (error) throw new Error('Não foi possível carregar os serviços agora.')
  return data ?? []
}
