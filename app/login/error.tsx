'use client'

export default function LoginError(): React.JSX.Element {
  return <main className="mx-auto max-w-lg px-6 py-20 text-ink"><h1 className="font-display text-3xl">Vamos tentar de novo?</h1><p role="alert" className="my-6">Não foi possível carregar o acesso. Tente novamente em instantes.</p><button type="button" onClick={() => window.location.reload()} className="public-cta">Tentar novamente</button></main>
}
