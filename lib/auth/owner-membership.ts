import 'server-only'
import type { createClient } from '../supabase/server'

export async function isOwner(
  client: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from('salon_owner')
    .select('user_id')
    .eq('singleton', true)
    .eq('user_id', userId)
    .maybeSingle()

  return !error && data?.user_id === userId
}
