'use client'
import { useId, useState, type FormEvent } from 'react'
import type { AgendaEntry } from '@/lib/admin-types'
import { decideBooking } from '@/lib/actions/admin'
import { localDateTimeToISO, salonDate, salonTime } from '@/lib/calendar'
import { decidedBooking, type BookingDecision } from '@/lib/booking-status'
import { control, field, primary } from './styles'
import { useMutation } from './useMutation'

export function BookingDecisionForm({ entry, onDecided }: { entry: AgendaEntry; onDecided: (decided: ReturnType<typeof decidedBooking>) => void }) {
  const id = useId()
  const [action, setAction] = useState<BookingDecision | null>(null)
  const [error, setError] = useState('')
  const mutation = useMutation()
  if (entry.version === undefined || !['pending', 'confirmed'].includes(entry.status ?? '')) return null
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setError('')
    try {
      const startTime = action === 'reschedule' ? localDateTimeToISO(String(data.get('start'))) : undefined
      mutation.run(() => decideBooking({ id: entry.id, version: entry.version, action, startTime,
        agreedWithClient: data.get('agreed') === 'on', reason: String(data.get('reason') ?? '') }),
      'Reserva atualizada. Use “Avisar cliente no WhatsApp” para enviar a mensagem.', () => { setAction(null); if (action) onDecided(decidedBooking(entry, action, startTime)) }, false)
    } catch { setError('Informe uma data e um horário válidos.') }
  }
  return <section className="space-y-4 border-t border-sand pt-5" aria-label="Decidir sobre a reserva">
    {!action ? <div className="flex flex-wrap gap-2">
      {entry.status === 'pending' && <button type="button" className={primary} onClick={() => setAction('approve')}>Autorizar reserva</button>}
      <button type="button" className={control} onClick={() => setAction('reschedule')}>Reagendar</button>
      <button type="button" className={control} onClick={() => setAction(entry.status === 'pending' ? 'reject' : 'cancel')}>{entry.status === 'pending' ? 'Recusar pedido' : 'Cancelar reserva'}</button>
    </div> : <form onSubmit={submit}><fieldset disabled={mutation.pending} className="space-y-4">
      <legend className="mb-3 font-semibold">{action === 'approve' ? 'Confirmar este atendimento?' : action === 'reschedule' ? 'Novo horário combinado' : action === 'reject' ? 'Recusar este pedido?' : 'Cancelar este atendimento?'}</legend>
      {action === 'reschedule' && <>
        <label htmlFor={`${id}-start`} className="block space-y-2"><span>Data e horário · São Paulo</span><input id={`${id}-start`} name="start" type="datetime-local" step={900} defaultValue={`${salonDate(entry.start_time)}T${salonTime(entry.start_time)}`} required className={field} /></label>
        <p className="text-xs text-ink-soft">A duração e os valores reservados serão mantidos. O novo horário precisa estar livre e dentro do expediente.</p>
        <label className="flex min-h-11 items-start gap-3"><input type="checkbox" name="agreed" required className="mt-1 size-5 shrink-0 accent-clay" />Combinei este horário com a cliente.</label>
      </>}
      {(action === 'cancel' || action === 'reject') && <><p>O horário ficará disponível. O registro e os serviços serão preservados no histórico.</p><label htmlFor={`${id}-reason`} className="block space-y-2"><span>Motivo</span><textarea id={`${id}-reason`} name="reason" required minLength={3} maxLength={500} rows={3} className={field} /></label></>}
      <p className="text-xs text-ink-soft">Depois de confirmar, o botão “Avisar cliente no WhatsApp” abre a mensagem pronta para você enviar.</p>
      {error && <p role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2"><button className={primary}>{mutation.pending ? 'Salvando…' : 'Confirmar decisão'}</button><button type="button" className={control} onClick={() => setAction(null)}>Voltar</button></div>
    </fieldset></form>}
    {mutation.message && <p role={mutation.error ? 'alert' : 'status'}>{mutation.message}</p>}
  </section>
}
