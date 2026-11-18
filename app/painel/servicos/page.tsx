import type { ReactElement } from 'react'
import { getServices } from '@/lib/actions/admin'
import { money } from '@/lib/calendar'
import { Dialog } from '@/components/admin/Dialog'
import { ServiceForm } from '@/components/admin/ServiceForm'
import { ServiceStatus } from '@/components/admin/ServiceStatus'

export default async function ServicesPage(): Promise<ReactElement> {
  const services = await getServices()
  return <>
    <header className="mb-8 flex flex-wrap items-start justify-between gap-5"><div><h1 className="font-display text-3xl">Seus serviços</h1><p className="mt-2 max-w-lg text-sm text-ink-soft">Preços e tempos para o próximo cuidado. Alterações valem para novas reservas.</p></div><div><Dialog title="Novo serviço" trigger="Adicionar serviço"><ServiceForm /></Dialog></div></header>
    <div className="space-y-4">{services.length === 0 && <p>Nenhum serviço cadastrado. Adicione o primeiro para abrir sua agenda.</p>}{services.map(service => <article key={service.id} className="rounded-xl border border-sand bg-white/75 p-5 ">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-ink-soft">{service.active ? 'Disponível no site' : 'Arquivado'}</p><h2 className="mt-1 font-display text-xl break-words">{service.name}</h2><p className="mt-2 text-sm">{money(service.price_cents)} · {service.duration_minutes} min</p>{service.description && <p className="mt-3 max-w-xl text-sm break-words text-ink-soft">{service.description}</p>}</div><div className="flex flex-wrap items-start gap-2"><div><Dialog title={`Editar ${service.name}`} trigger="Editar serviço"><ServiceForm service={service} /></Dialog></div><ServiceStatus id={service.id} active={service.active} /></div></div>
    </article>)}</div>
    <p className="mt-6 max-w-xl text-sm text-ink-soft">Arquivar retira o serviço do site e preserva o histórico dos agendamentos. Você pode reativá-lo quando quiser.</p>
  </>
}
