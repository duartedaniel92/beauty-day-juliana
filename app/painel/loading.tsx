import type { ReactElement } from 'react'
export default function Loading(): ReactElement {
  return <div role="status" className="space-y-6 py-8"><p className="font-display text-3xl">Carregando seu painel…</p><div aria-hidden="true" className="h-80 rounded-xl border border-sand bg-white/60 motion-safe:animate-pulse" /><p className="text-sm">Consultando informações atualizadas.</p></div>
}
