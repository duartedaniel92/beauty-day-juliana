'use client'
import { useState, type ReactElement } from 'react'
import type { BusinessHour } from '@/lib/admin-types'
import { saveBusinessHours } from '@/lib/actions/admin'
import { field, primary } from './styles'
import { useMutation } from './useMutation'

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
export function BusinessHoursForm({ hours }: { hours: BusinessHour[] }): ReactElement {
  const [days, setDays] = useState(() => hours.map(day => ({ day_of_week: day.day_of_week, is_working: day.is_working, start_time: day.start_time?.slice(0, 5) ?? '09:00', end_time: day.end_time?.slice(0, 5) ?? '18:00' })))
  const mutation = useMutation()
  function update(index: number, changes: Partial<(typeof days)[number]>): void { setDays(current => current.map((day, i) => i === index ? { ...day, ...changes } : day)) }
  return <form onSubmit={event => { event.preventDefault(); mutation.run(() => saveBusinessHours({ days }), 'Expediente atualizado.') }} className="max-w-3xl">
    <fieldset disabled={mutation.pending} className="divide-y divide-sand rounded-xl border border-sand bg-white/70 px-4 sm:px-6">
      <legend className="sr-only">Dias e horários de atendimento</legend>
      {days.map((day, index) => <div key={day.day_of_week} className="grid gap-3 py-5 sm:grid-cols-[minmax(140px,1fr)_2fr] sm:items-center">
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={day.is_working} onChange={event => update(index, { is_working: event.target.checked })} className="size-5 accent-clay" />{WEEKDAYS[day.day_of_week]}</label>
        {day.is_working ? <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-xs"><span>Abertura</span><input aria-label={`Abertura ${WEEKDAYS[day.day_of_week]}`} type="time" required value={day.start_time} onChange={event => update(index, { start_time: event.target.value })} className={field} /></label><label className="space-y-1 text-xs"><span>Fechamento</span><input aria-label={`Fechamento ${WEEKDAYS[day.day_of_week]}`} type="time" required value={day.end_time} onChange={event => update(index, { end_time: event.target.value })} className={field} /></label></div> : <p className="text-sm text-ink-soft">Fechado</p>}
      </div>)}
    </fieldset>
    <button type="submit" disabled={mutation.pending} className={`${primary} mt-6`}>{mutation.pending ? 'Salvando…' : 'Salvar expediente'}</button>
    {mutation.message && <p className="mt-4 text-sm" role={mutation.error ? 'alert' : 'status'}>{mutation.message}</p>}
  </form>
}
