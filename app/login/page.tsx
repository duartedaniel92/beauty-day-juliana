import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ProfessionalBrand } from '@/components/auth/ProfessionalBrand'
import { login } from '../../lib/actions/auth'
import { retryPasswordRecoveryLogout } from '../../lib/actions/password-recovery'
import { SubmitButton } from '../../components/auth/SubmitButton'
import { LogoutForm } from '../../components/auth/LogoutForm'

export const metadata: Metadata = {
  title: 'Acesso da profissional | Beauty Day Juliana',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[]; status?: string | string[] }>
}): Promise<React.JSX.Element> {
  const { error, status } = await searchParams
  const loginError = error === 'login'
  const logoutError = error === 'logout'
  const passwordUpdated = status === 'password-updated'
  const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-ink/30 bg-white px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay'

  return (
    <main className="admin-site auth-site min-h-svh bg-white text-ink">
      <header className="auth-header"><ProfessionalBrand /><Link href="/" className="auth-back">Voltar ao site</Link></header>
      <div className="auth-layout">
        <figure className="auth-portrait">
          <Image src="/images/juliana-canva.webp" alt="Juliana Souza, profissional do Beauty Day" width={533} height={800} preload sizes="(min-width: 1024px) 440px, (min-width: 768px) 42vw, 90vw" />
          <figcaption>Juliana Souza <span>Beauty Day</span></figcaption>
        </figure>
        <section aria-labelledby="login-title" className="auth-form">
          <h1 id="login-title">Seu espaço de cuidado.</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">Entre para cuidar da sua agenda, dos serviços e de cada atendimento.</p>
            {passwordUpdated && <p role="status" className="mt-6 rounded-xl border border-sand bg-white/70 p-4 text-sm text-ink">Senha atualizada.{!logoutError && ' Entre com sua nova senha.'}</p>}
            {loginError && <p id="login-error" role="alert" className="mt-6 rounded-xl border border-[#c89177] bg-[#fae9df] p-4 text-sm text-[#78341e]">Não foi possível entrar. Confira seus dados e tente novamente.</p>}
            {logoutError && <div role="alert" className="mt-6 space-y-4 rounded-xl border border-[#c89177] bg-[#fae9df] p-4 text-sm text-[#78341e]">
              {passwordUpdated ? <>
                <p>Não foi possível encerrar todas as sessões. Tente novamente para sair da conta em todos os dispositivos. Sua nova senha já foi salva.</p>
                <form action={retryPasswordRecoveryLogout}><SubmitButton pendingLabel="Encerrando sessões…">Encerrar todas as sessões</SubmitButton></form>
              </> : <><p>Não foi possível encerrar a sessão. Tente sair novamente.</p><LogoutForm /></>}
            </div>}
            <form action={login} aria-describedby={loginError ? 'login-error' : undefined} className="mt-7 space-y-5">
              <div><label htmlFor="email" className="text-sm font-bold">E-mail</label><input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={254} required className={inputClass} /></div>
              <div><label htmlFor="password" className="text-sm font-bold">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" maxLength={1024} required className={inputClass} /></div>
              <div className="pt-2"><SubmitButton pendingLabel="Entrando…">Entrar no painel</SubmitButton></div>
            </form>
            <Link href="/recuperar-senha" className="mt-4 inline-flex min-h-11 items-center rounded text-sm font-bold text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">Esqueci minha senha</Link>
            <p className="mt-7 border-t border-sand pt-5 text-sm leading-relaxed text-ink-soft">Quer reservar um momento para você? <Link href="/agendar" className="inline-flex min-h-11 items-center rounded font-bold text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">Agende seu horário</Link></p>
        </section>
      </div>
      <footer className="auth-footer"><span>Juliana Souza · Beauty Day</span><span>Área da profissional</span></footer>
    </main>
  )
}
