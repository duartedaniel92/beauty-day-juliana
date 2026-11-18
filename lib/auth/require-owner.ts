import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'
import { isOwner } from './owner-membership'

export async function requireOwner(): Promise<{ id: string }> {
  let anonymous = false
  let ownerId: string | undefined

  try {
    const client = await createClient()
    const { data: { user }, error } = await client.auth.getUser()
    anonymous = !!error || !user
    if (!error && user && await isOwner(client, user.id)) ownerId = user.id
  } catch {
    // Fail closed and keep transport/database details out of action responses.
    throw new Error('Acesso não autorizado.')
  }

  if (anonymous) redirect('/login')
  if (!ownerId) throw new Error('Acesso não autorizado.')
  return { id: ownerId }
}
