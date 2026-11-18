'use client'
import { useId, useState, type ReactElement, type FormEvent } from 'react'
import { createBlock } from '@/lib/actions/admin'
import { addDays, localDateTimeToISO } from '@/lib/calendar'
import { Dialog } from './Dialog'
import { field, primary } from './styles'
import { useMutation } from './useMutation'

export function BlockForm({ date }: { date: string }): ReactElement {
  const id = useId()
  const [allDay, setAllDay] = useState(false)
  const [validation, setValidation] = useState('')
  const mutation = useMutation()
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setValidation('')
    try {
      const start = String(data.get('start'))
      const end = String(data.get('end'))
      const startTime = localDateTimeToISO(allDay ? `${start}T00:00` : start)
      const endTime = localDateTimeToISO(allDay ? `${addDays(end, 1)}T00:00` : end)
      if (endTime <= startTime) throw new Error('O término deve ser posterior ao início.')
      mutation.run(() => createBlock({ startTime, endTime, notes: String(data.get('notes') ?? '').trim() }), 'Bloqueio criado. A agenda foi atualizada.', () => form.reset())
    } catch { setValidation('Confira as datas: o término deve ser posterior ao início e os horários devem ser válidos.') }
  }
  return <Dialog title="Reservar um tempo para você" trigger="+ Bloquear horário"><form onSubmit={submit} className="space-y-5">
    <p className="text-sm text-ink-soft">O período ficará indisponível para novos agendamentos. Horários de São Paulo.</p>
    <fieldset disabled={mutation.pending} className="space-y-5">
    <legend className="sr-only">Período e motivo do bloqueio</legend>
    <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={allDay} onChange={event => setAllDay(event.target.checked)} className="size-5 accent-clay" />Dia inteiro</label>
    <div className="grid gap-4 sm:grid-cols-2"><label htmlFor={`${id}-start`} className="space-y-2 text-sm"><span>Início</span><input key={`start-${allDay}`} id={`${id}-start`} name="start" type={allDay ? 'date' : 'datetime-local'} defaultValue={allDay ? date : `${date}T09:00`} required className={field} /></label>
    <label htmlFor={`${id}-end`} className="space-y-2 text-sm"><span>{allDay ? 'Último dia incluído' : 'Término'}</span><input key={`end-${allDay}`} id={`${id}-end`} name="end" type={allDay ? 'date' : 'datetime-local'} defaultValue={allDay ? date : `${date}T10:00`} required className={field} /></label></div>
    <label className="block space-y-2 text-sm" htmlFor={`${id}-notes`}><span>Motivo (opcional)</span><textarea id={`${id}-notes`} name="notes" maxLength={500} rows={3} className={field} /></label>
    {validation && <p role="alert" className="text-sm text-clay-dark">{validation}</p>}
    {mutation.message && <p role={mutation.error ? 'alert' : 'status'} className="text-sm">{mutation.message}</p>}
    <button disabled={mutation.pending} className={primary}>{mutation.pending ? 'Salvando…' : 'Criar bloqueio'}</button>
    </fieldset>
  </form></Dialog>
}

