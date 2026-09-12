import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-16">
      <h1 className="font-display text-2xl text-ink">Página não encontrada</h1>
      <p className="font-sans text-ink-soft">
        O endereço que você abriu não existe ou o agendamento não foi localizado.
      </p>
      <Link
        href="/"
        className="w-fit rounded-sm bg-clay px-6 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-clay-dark"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
