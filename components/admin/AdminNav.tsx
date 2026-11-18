'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ReactElement } from 'react'
import { adminHref } from '@/lib/admin-navigation'

export function AdminNav(): ReactElement {
  const pathname = usePathname()
  const query = useSearchParams()
  return <nav aria-label="Painel da profissional" className="flex gap-1 lg:flex-col lg:gap-2">
    {[['/painel', 'Agenda'], ['/painel/servicos', 'Serviços'], ['/painel/configuracoes', 'Expediente'], ['/painel/site', 'Site']].map(([href, label]) => <Link key={href} href={adminHref(href, query)} aria-current={pathname === href ? 'page' : undefined} className={`flex min-h-11 flex-1 items-center gap-3 rounded-lg px-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay ${pathname === href ? 'bg-ink text-cream' : 'hover:bg-sand/35'}`}>{label}</Link>)}
  </nav>
}
