'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '../supabase/server'
import { isOwner } from '../auth/owner-membership'
import { requireOwner } from '../auth/require-owner'
import { enforceRateLimit } from '../security/rate-limit'

const emailSchema = z.string().trim().email().max(254)
const tokenSchema = z.string().min(16).max(512).regex(/^[a-zA-Z0-9_-]+$/)
const passwordSchema = z.object({
  password: z.string().min(12).max(128),
  confirmPassword: z.string(),
}).refine(value => value.password === value.confirmPassword)

function recoveryUrl(): string {
  const url = new URL(z.string().url().parse(process.env.SITE_URL))
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
    || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Invalid SITE_URL')
  }
  return `${url.origin}/auth/confirm`
}

export async function requestPasswordReset(formData: FormData): Promise<never> {
  const email = emailSchema.safeParse(formData.get('email'))
  if (!email.success) redirect('/recuperar-senha?error=invalid')
  let failed = false
  try {
    await enforceRateLimit('recovery', email.data)
    const client = await createClient()
    const { error } = await client.auth.resetPasswordForEmail(email.data, { redirectTo: recoveryUrl() })
    failed = !!error
  } catch {
    failed = true
  }
  // The same confirmation is shown whether or not an account exists.
  redirect(failed ? '/recuperar-senha?error=unavailable' : '/recuperar-senha?status=sent')
}

// Ambos os protocolos usam os mesmos controles de associação e destino fixo.
async function completePasswordRecovery(formData: FormData, field: 'token_hash' | 'code'): Promise<never> {
  const token = tokenSchema.safeParse(formData.get(field))
  if (!token.success) redirect('/recuperar-senha?error=expired')
  let authorized = false
  try {
    const client = await createClient()
    // POST evita consumir o link por scanners; PKCE mantém o vínculo com o navegador.
    const { data, error } = field === 'code'
      ? await client.auth.exchangeCodeForSession(token.data)
      : await client.auth.verifyOtp({ token_hash: token.data, type: 'recovery' })
    authorized = !error && !!data.user && await isOwner(client, data.user.id)
    if (!authorized && data.user) await client.auth.signOut({ scope: 'local' })
  } catch {
    authorized = false
  }
  redirect(authorized ? '/nova-senha' : '/recuperar-senha?error=expired')
}

export async function confirmPasswordRecovery(formData: FormData): Promise<never> {
  return completePasswordRecovery(formData, 'token_hash')
}

export async function confirmPasswordRecoveryCode(formData: FormData): Promise<never> {
  return completePasswordRecovery(formData, 'code')
}

export async function updatePassword(formData: FormData): Promise<never> {
  await requireOwner()
  const parsed = passwordSchema.safeParse({ password: formData.get('password'), confirmPassword: formData.get('confirmPassword') })
  if (!parsed.success) redirect('/nova-senha?error=invalid')
  let updated = false
  let logoutFailed = false
  try {
    const client = await createClient()
    const { error } = await client.auth.updateUser({ password: parsed.data.password })
    updated = !error
    if (updated) {
      logoutFailed = true
      const result = await client.auth.signOut({ scope: 'global' })
      logoutFailed = !!result.error
    }
  } catch {
    if (updated) logoutFailed = true
  }
  if (!updated) redirect('/nova-senha?error=update')
  redirect(`/login?status=password-updated${logoutFailed ? '&error=logout' : ''}`)
}

export async function retryPasswordRecoveryLogout(): Promise<never> {
  await requireOwner()
  let failed = false
  try {
    const client = await createClient()
    const { error } = await client.auth.signOut({ scope: 'global' })
    failed = !!error
  } catch {
    failed = true
  }
  redirect(failed ? '/login?status=password-updated&error=logout' : '/login?status=password-updated')
}
