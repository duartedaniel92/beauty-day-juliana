import type { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { requireOwner } from '@/lib/auth/require-owner'
import { logout } from '@/lib/actions/auth'
import { AdminNav } from '@/components/admin/AdminNav'
import { control } from '@/components/admin/styles'
import { ProfessionalBrand } from '@/components/auth/ProfessionalBrand'

export const dynamic = 'force-dynamic'
export default async function AdminLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  await requireOwner()
  return <div className="admin-site min-h-screen bg-cream font-sans text-ink lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
    <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-4">Ir para o conteúdo</a>
    <aside className="border-b border-ink/15 p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:p-6">
      <div className="mb-7"><ProfessionalBrand href="/painel" /></div>
      <AdminNav />
      <div className="mt-4 flex items-center justify-between gap-2 lg:mt-auto lg:flex-col lg:items-stretch"><Link href="/" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Ver site público ↗</Link><form action={logout}><button className={`${control} w-full`} type="submit">Sair da conta</button></form></div>
    </aside>
    <main id="admin-content" className="min-w-0 p-4 sm:p-7 lg:p-10"><div className="mx-auto max-w-[1500px]">{children}</div></main>
  </div>
}
