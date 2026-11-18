import type { Metadata } from 'next'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { requireOwner } from '../../lib/auth/require-owner'
import { updatePassword } from '../../lib/actions/password-recovery'
import { SubmitButton } from '../../components/auth/SubmitButton'
import { ProfessionalBrand } from '../../components/auth/ProfessionalBrand'

// A password form depends on the visitor's session and must never be prerendered.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Nova senha | Beauty Day Juliana',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function NewPasswordPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>
}): Promise<ReactElement> {
  await requireOwner()
  const { error } = await searchParams
  const message = error === 'invalid' ? 'Use de 12 a 128 caracteres e digite a mesma senha nos dois campos.'
    : error === 'update' ? 'Não foi possível atualizar sua senha. Tente novamente.'
    : null
  const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-ink-soft/60 bg-white px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay'

  return (
    <div className="admin-site auth-site min-h-svh bg-white text-ink">
      <header className="auth-header"><ProfessionalBrand /></header>
      <main className="mx-auto max-w-lg px-5 py-10 sm:py-16">
        <h1 className="font-display text-3xl sm:text-4xl">Escolha sua nova senha</h1>
        <p id="password-hint" className="mt-4 text-sm leading-relaxed text-ink-soft">Use de 12 a 128 caracteres. Confirme a nova senha no segundo campo.</p>
        {message && <p id="password-error" role="alert" className="mt-6 border-l-2 border-clay pl-4 text-sm text-clay-dark">{message}</p>}
        <form action={updatePassword} aria-describedby={message ? 'password-error' : undefined} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="text-sm font-semibold">Nova senha</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required aria-describedby="password-hint" className={inputClass} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-sm font-semibold">Confirme a nova senha</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required aria-describedby="password-hint" className={inputClass} />
          </div>
          <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
        </form>
        <Link href="/recuperar-senha" className="mt-6 inline-flex min-h-11 items-center rounded text-sm text-clay-dark underline underline-offset-4">Solicitar outro link de recuperação</Link>
      </main>
    </div>
  )
}
