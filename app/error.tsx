"use client";

import Link from "next/link";

// Recarrega a página inteira: reset() só refaz o lado do navegador e não busca de novo os dados do servidor.
export default function ErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-16">
      <h1 className="font-display text-2xl text-ink">Algo deu errado por aqui</h1>
      <p className="font-sans text-ink-soft">
        Não conseguimos carregar esta página agora. Pode ser uma instabilidade
        momentânea — tente de novo em instantes.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-sm bg-clay px-6 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-clay-dark"
        >
          Tentar de novo
        </button>
        <Link href="/" className="font-sans text-sm text-ink-soft underline">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
