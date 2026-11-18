'use client'
import type { ReactElement } from 'react'
import { primary } from '@/components/admin/styles'
export default function ErrorPage(): ReactElement {
  return <section role="alert" className="space-y-4 rounded-2xl border border-sand p-6"><h1 className="font-display text-3xl">Não foi possível carregar o painel.</h1><p>Confira sua conexão e tente novamente.</p><button type="button" onClick={() => window.location.reload()} className={primary}>Tentar novamente</button></section>
}
