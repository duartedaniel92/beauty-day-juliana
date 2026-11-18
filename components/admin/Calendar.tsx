import Link from 'next/link'
import type { ReactElement } from 'react'
import type { AgendaEntry } from '@/lib/admin-types'
import { calendarDays, dateLabel, getCalendarRange, salonTime, type CalendarView } from '@/lib/calendar'
import { EntryDetails } from './EntryDetails'

function entriesForDay(entries: AgendaEntry[], date: string): AgendaEntry[] {
  const { start, end } = getCalendarRange(date, 'day')
  return entries.filter(entry => Date.parse(entry.start_time) < Date.parse(end) && Date.parse(entry.end_time) > Date.parse(start)).sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time))
}

export function Calendar({ date, view, entries }: { date: string; view: CalendarView; entries: AgendaEntry[] }): ReactElement {
  const days = calendarDays(date, view)
  if (view === 'month') return <>
    <div className="overflow-hidden rounded-xl border border-ink/20 bg-white/70 ">
      <div className="grid grid-cols-7 border-b border-ink/15 bg-sand/30">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => <div key={day} className="py-3 text-center text-xs font-semibold">{day}</div>)}</div>
      <div className="grid grid-cols-7">{days.map(day => {
        const items = entriesForDay(entries, day)
        return <div key={day} className={`min-w-0 border-r border-b border-ink/10 p-1 sm:min-h-32 sm:p-2 ${day.slice(0, 7) !== date.slice(0, 7) ? 'bg-sand/20' : ''} ${day === date ? 'ring-2 ring-inset ring-clay' : ''}`}>
          <Link href={`/painel?date=${day}&view=month`} aria-label={`${dateLabel(day)}, ${items.length} registros`} aria-current={day === date ? 'date' : undefined} className="flex min-h-11 min-w-11 flex-col items-center justify-center rounded-md text-sm focus-visible:outline-2 focus-visible:outline-clay sm:items-start"><span>{Number(day.slice(8))}</span><span className="text-[10px] sm:hidden">{items.length > 0 ? `${items.length} reg.` : '—'}</span></Link>
          <div className="hidden space-y-1 sm:block">{items.slice(0, 2).map(entry => <p key={entry.id} className="truncate text-xs text-ink-soft">{salonTime(entry.start_time)} {entry.type === 'block' ? 'Bloqueio' : entry.client_name}</p>)}{items.length > 2 && <p className="text-xs">+{items.length - 2} registros</p>}</div>
        </div>
      })}</div>
    </div>
    <section className="mt-7" aria-label="Detalhes do dia selecionado"><h2 className="mb-4 font-display text-xl">{dateLabel(date)}</h2><DayEntries entries={entriesForDay(entries, date)} /></section>
  </>
  return <div className="overflow-x-auto rounded-xl border border-ink/20 bg-white/70 " tabIndex={view === 'week' ? 0 : undefined} role="region" aria-label={view === 'week' ? 'Agenda semanal. Role horizontalmente para ver todos os dias.' : 'Agenda diária'}>
    <div className={view === 'week' ? 'grid min-w-[1120px] grid-cols-7' : ''}>{days.map(day => <section key={day} className="min-w-0 border-r border-ink/15 last:border-r-0">
      <h2 className="sticky top-0 border-b border-ink/15 bg-cream p-3 text-sm font-semibold"><Link href={`/painel?date=${day}&view=day`} className="flex min-h-11 items-center rounded focus-visible:outline-2 focus-visible:outline-clay">{dateLabel(day)}</Link></h2>
      <TimeGrid entries={entriesForDay(entries, day)} date={day} />
    </section>)}</div>
  </div>
}

function DayEntries({ entries }: { entries: AgendaEntry[] }): ReactElement {
  return entries.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{entries.map(entry => <EntryDetails key={entry.id} entry={entry} />)}</div> : <p className="border-l-2 border-gold py-4 pl-4 text-sm text-ink-soft">Dia livre. Nenhum agendamento ou bloqueio neste período.</p>
}

function TimeGrid({ date, entries }: { date: string; entries: AgendaEntry[] }): ReactElement {
  const { start } = getCalendarRange(date, 'day')
  const midnight = Date.parse(start)
  const groups = Array.from({ length: 24 }, (_, hour) => entries.filter(entry => Math.max(0, Math.floor((Date.parse(entry.start_time) - midnight) / 3600000)) === hour))
  return <div>{entries.length === 0 && <p className="border-b border-sand px-3 py-4 text-xs text-ink-soft">Dia livre · use “Bloquear horário” para reservar uma pausa.</p>}{groups.map((items, hour) => <div key={hour} className={`grid min-h-14 grid-cols-[44px_minmax(0,1fr)] border-b border-ink/10 ${hour < 7 || hour >= 21 ? 'bg-sand/10' : ''}`}><span className="pt-3 pl-2 text-[11px] text-ink-soft">{String(hour).padStart(2, '0')}:00</span><div className="space-y-1 border-l border-ink/10 p-1">{items.map(entry => <EntryDetails key={entry.id} entry={entry} />)}</div></div>)}</div>
}
