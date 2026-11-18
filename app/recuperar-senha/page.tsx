import type { Metadata } from 'next'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '../../lib/actions/password-recovery'
import { SubmitButton } from '../../components/auth/SubmitButton'
import { ProfessionalBrand } from '../../components/auth/ProfessionalBrand'

export const metadata: Metadata = {
  title: 'Recuperar senha | Beauty Day Juliana',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function RecoverPasswordPage({ searchParams }: {
  searchParams: Promise<{ status?: string | string[]; error?: string | string[] }>
}): Promise<ReactElement> {
  const { status, error } = await searchParams
  const message = error === 'invalid' ? 'Informe um e-mail válido para solicitar a recuperação.'
    : error === 'unavailable' ? 'Não foi possível enviar o link agora. Tente novamente em instantes.'
    : error === 'expired' ? 'Este link expirou, já foi utilizado ou foi aberto em outro navegador. Solicite um novo link abaixo.'
    : null

  return (
    <div className="admin-site auth-site min-h-svh bg-white text-ink">
      <header className="auth-header"><ProfessionalBrand /></header>
      <main className="mx-auto max-w-lg px-5 py-10 sm:py-16">
        <h1 className="font-display text-3xl sm:text-4xl">Recuperar sua senha</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">Informe o e-mail da sua conta profissional para receber um link de recuperação.</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">Solicite e abra o link no mesmo navegador e dispositivo. No celular, abra o e-mail no navegador usado aqui, evitando o navegador interno do aplicativo de e-mail.</p>
        {message && <p id="recovery-error" role="alert" className="mt-6 border-l-2 border-clay pl-4 text-sm text-clay-dark">{message}</p>}
        {status === 'sent' && !message && <p role="status" className="mt-6 rounded-xl border border-sand bg-white/70 p-4 text-sm leading-relaxed">Se este e-mail estiver associado à conta profissional, você receberá um link para criar uma nova senha. Confira também a pasta de spam.</p>}
        <form action={requestPasswordReset} aria-describedby={message ? 'recovery-error' : undefined} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-semibold">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} required
              className="mt-2 min-h-12 w-full rounded-xl border border-ink-soft/60 bg-white px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay" />
          </div>
          <SubmitButton pendingLabel="Enviando…">Enviar link de recuperação</SubmitButton>
        </form>
        <Link href="/login" className="mt-6 inline-flex min-h-11 items-center rounded text-sm text-clay-dark underline underline-offset-4">Voltar para entrar</Link>
      </main>
    </div>
  )
}
