import Link from 'next/link'
import type { ReactElement } from 'react'
import { dateLabel, salonDate, shiftDate, type CalendarView } from '@/lib/calendar'
import { control, field } from './styles'

export function CalendarToolbar({ date, view }: { date: string; view: CalendarView }): ReactElement {
  return <div className="mb-6 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><Link className={control} href={`/painel?date=${shiftDate(date, view, -1)}&view=${view}`} aria-label="Período anterior">←</Link><Link className={control} href={`/painel?date=${salonDate()}&view=${view}`}>Hoje</Link><Link className={control} href={`/painel?date=${shiftDate(date, view, 1)}&view=${view}`} aria-label="Próximo período">→</Link></div><nav aria-label="Visualização da agenda" className="flex gap-1 rounded-xl border border-sand p-1">{([['day', 'Dia'], ['week', 'Semana'], ['month', 'Mês']] as const).map(([value, label]) => <Link key={value} aria-current={view === value ? 'page' : undefined} href={`/painel?date=${date}&view=${value}`} className={`${control} ${view === value ? 'border-ink bg-ink text-cream' : 'border-transparent bg-transparent'}`}>{label}</Link>)}</nav></div>
    <div className="flex flex-wrap items-end justify-between gap-4"><h2 id="agenda-focus-target" tabIndex={-1} className="font-display text-xl sm:text-2xl">{dateLabel(date)}</h2><form action="/painel" className="flex w-full min-w-0 items-end gap-2 sm:w-auto"><input type="hidden" name="view" value={view} /><label htmlFor="agenda-date" className="min-w-0 flex-1 space-y-1 text-xs"><span>Ir para a data</span><input id="agenda-date" name="date" type="date" min="1900-01-01" max="2100-12-31" defaultValue={date} key={date} required className={field} /></label><button className={control}>Ver</button></form></div>
    {view === 'week' && <p className="text-xs text-ink-soft lg:hidden">Deslize a agenda para os lados para consultar os sete dias.</p>}
  </div>
}
