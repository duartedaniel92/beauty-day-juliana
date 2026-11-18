import type { Metadata } from 'next'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { confirmPasswordRecovery, confirmPasswordRecoveryCode } from '../../../lib/actions/password-recovery'
import { SubmitButton } from '../../../components/auth/SubmitButton'
import { PublicHeader } from '../../../components/public/PublicHeader'

export const metadata: Metadata = {
  title: 'Confirmar recuperação | Beauty Day Juliana',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function ConfirmRecoveryPage({ searchParams }: {
  searchParams: Promise<{ token_hash?: string | string[]; type?: string | string[]; code?: string | string[] }>
}): Promise<ReactElement> {
  const { token_hash: tokenHash, type, code } = await searchParams
  const validToken = type === 'recovery' && typeof tokenHash === 'string'
    && /^[a-zA-Z0-9_-]{16,512}$/.test(tokenHash)
  const validCode = typeof code === 'string' && /^[a-zA-Z0-9_-]{16,512}$/.test(code)
  const validLink = validToken || validCode

  return (
    <div className="public-site min-h-svh bg-cream text-ink">
      <PublicHeader />
      <main className="mx-auto max-w-lg px-5 py-10 sm:py-16">
        <h1 className="font-display text-3xl sm:text-4xl">{validLink ? 'Crie uma nova senha' : 'Link de recuperação inválido'}</h1>
        {validLink ? <>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">Continue para confirmar seu link de recuperação e escolher uma nova senha para a conta profissional.</p>
          <form action={validCode ? confirmPasswordRecoveryCode : confirmPasswordRecovery} className="mt-8">
            {validCode ? <input type="hidden" name="code" value={code} /> : <input type="hidden" name="token_hash" value={tokenHash} />}
            <SubmitButton pendingLabel="Confirmando…">Continuar para nova senha</SubmitButton>
          </form>
        </> : <p role="alert" className="mt-4 text-sm leading-relaxed text-clay-dark">Este link está incompleto ou não é um link de recuperação de senha. Solicite um novo para continuar.</p>}
        <Link href="/recuperar-senha" className="mt-6 inline-flex min-h-11 items-center rounded text-sm text-clay-dark underline underline-offset-4">Solicitar novo link de recuperação</Link>
      </main>
    </div>
  )
}
