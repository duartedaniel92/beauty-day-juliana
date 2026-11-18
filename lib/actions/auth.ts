'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '../supabase/server'
import { isOwner } from '../auth/owner-membership'
import { enforceRateLimit } from '../security/rate-limit'

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(1024),
})

export async function login(formData: FormData): Promise<never> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) redirect('/login?error=login')

  let authorized = false
  try {
    await enforceRateLimit('login', parsed.data.email)
    const client = await createClient()
    const { error } = await client.auth.signInWithPassword(parsed.data)
    if (!error) {
      const { data: { user }, error: userError } = await client.auth.getUser()
      authorized = !userError && !!user && await isOwner(client, user.id)
      if (!authorized) await client.auth.signOut({ scope: 'local' })
    }
  } catch {
    authorized = false
  }

  // Destinations are fixed: form/query parameters never control navigation.
  redirect(authorized ? '/painel' : '/login?error=login')
}

export async function logout(): Promise<never> {
  let failed = false
  try {
    const client = await createClient()
    const { error } = await client.auth.signOut({ scope: 'local' })
    failed = !!error
  } catch {
    failed = true
  }

  redirect(failed ? '/login?error=logout' : '/login')
}
