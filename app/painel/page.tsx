import { EntryDetails } from '@/components/admin/EntryDetails'
import type { ReactElement } from 'react'
import { getAgenda, getPendingBookings } from '@/lib/actions/admin'
import { parseCalendarQuery } from '@/lib/calendar'
import { Calendar } from '@/components/admin/Calendar'
import { CalendarToolbar } from '@/components/admin/CalendarToolbar'
import { BlockForm } from '@/components/admin/BlockForm'

export default async function AgendaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<ReactElement> {
  const { date, view } = parseCalendarQuery(await searchParams)
  const entries = await getAgenda({ date, view })
  const pending = await getPendingBookings()
  const active = entries.filter(entry => !entry.status || ['pending', 'confirmed'].includes(entry.status))
  const history = entries.filter(entry => entry.status && !['pending', 'confirmed'].includes(entry.status))
  return <><header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-ink/20 pb-6"><div><h1 className="font-display text-4xl sm:text-5xl">Agenda</h1><p className="mt-3 text-sm text-ink-soft">Atendimentos e pausas · horário de São Paulo</p></div><div className="w-full sm:w-auto"><BlockForm key={date} date={date} /></div></header>{pending.length > 0 && <section className="mb-8 rounded-2xl border border-sand bg-[#f3f4e8] p-5" aria-label="Pedidos aguardando autorização"><h2 className="mb-2 text-xl">Aguardando sua decisão · {pending.length}</h2><p className="mb-4 text-sm text-ink-soft">Pedidos de todas as datas. Abra uma reserva para autorizar, reagendar ou recusar.</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{pending.map(entry => <EntryDetails key={entry.id} entry={entry} />)}</div></section>}<CalendarToolbar date={date} view={view} /><Calendar date={date} view={view} entries={active} />{history.length > 0 && <section className="mt-8" aria-label="Histórico do período"><h2 className="mb-4 text-xl">Reservas encerradas neste período</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{history.map(entry => <EntryDetails key={entry.id} entry={entry} />)}</div></section>}</>
}
