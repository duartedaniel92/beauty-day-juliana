'use client'
import { useState, type ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import type { AgendaEntry } from '@/lib/admin-types'
import { removeBlock } from '@/lib/actions/admin'
import { dateLabel, money, salonDate, salonTime } from '@/lib/calendar'
import { Dialog } from './Dialog'
import { control, primary } from './styles'
import { useMutation } from './useMutation'
import { BookingDecisionForm } from './BookingDecisionForm'
import { bookingStatusLabels } from '@/lib/booking-status'
import { clientWhatsappLink } from '@/lib/whatsapp-message'

function NotifyClient({ entry }: { entry: AgendaEntry }): ReactElement | null {
  if (entry.status === 'pending') return null
  const href = clientWhatsappLink(entry)
  if (!href) return <p className="text-xs text-ink-soft">WhatsApp da cliente ausente ou inválido: avise por outro meio.</p>
  return <div className="space-y-2">
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${primary} inline-flex items-center`}>Avisar cliente no WhatsApp</a>
    <p className="text-xs text-ink-soft">Abre o seu WhatsApp com a mensagem pronta. Confira e toque em enviar.</p>
  </div>
}

export function EntryDetails({ entry: saved }: { entry: AgendaEntry }): ReactElement {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  // A agenda só recarrega ao fechar: recarregar antes tira a reserva da lista e fecha o diálogo sem o aviso.
  const [decided, setDecided] = useState<Pick<AgendaEntry, 'status' | 'start_time' | 'end_time'> | null>(null)
  const entry = decided ? { ...saved, ...decided } : saved
  const mutation = useMutation()
  const blocked = entry.type === 'block'
  const title = blocked ? 'Bloqueio de agenda' : entry.client_name || 'Agendamento'
  return <Dialog title={title} unmountFocusId={blocked ? 'agenda-focus-target' : undefined} onClose={() => { if (decided) { setDecided(null); router.refresh() } }} trigger={<span className="block break-words"><span className="block text-xs font-semibold text-clay-dark">{blocked ? 'Bloqueio' : bookingStatusLabels[entry.status ?? 'confirmed']} · {dateLabel(salonDate(entry.start_time))} · {salonTime(entry.start_time)}–{salonTime(entry.end_time)}</span><span className="mt-1 block font-semibold">{blocked ? entry.notes || 'Horário reservado' : title}</span>{!blocked && <span className="mt-1 block text-xs">{entry.appointment_services.map(service => service.service_name_snapshot).join(' · ')}</span>}</span>}>
    <div className="space-y-5 text-sm"><p>{dateLabel(salonDate(entry.start_time))}<br />{salonTime(entry.start_time)} → {salonDate(entry.end_time) !== salonDate(entry.start_time) ? `${dateLabel(salonDate(entry.end_time))}, ` : ''}{salonTime(entry.end_time)} · São Paulo</p>
      {!blocked && <><dl className="space-y-3"><div><dt className="text-ink-soft">WhatsApp</dt><dd className="break-words">{entry.client_whatsapp || 'Não informado'}</dd></div><div><dt className="text-ink-soft">E-mail</dt><dd className="break-all">{entry.client_email || 'Não informado'}</dd></div></dl><ul className="divide-y divide-sand border-y border-sand">{entry.appointment_services.map((service, index) => <li key={index} className="flex justify-between gap-3 py-3"><span>{service.service_name_snapshot}<span className="block text-xs">{service.duration_minutes_snapshot} min</span></span><span className="shrink-0">{money(service.price_cents_snapshot)}</span></li>)}</ul><p className="flex justify-between font-semibold"><span>Total reservado</span><span>{money(entry.appointment_services.reduce((sum, service) => sum + service.price_cents_snapshot, 0))}</span></p></>}
      {!blocked && entry.status && <p className="admin-status" data-status={entry.status}>{bookingStatusLabels[entry.status]}</p>}
      {!blocked && entry.status === 'pending' && <p className="text-xs text-ink-soft">{entry.expires_at ? `Aguardando decisão até ${dateLabel(salonDate(entry.expires_at))}, ${salonTime(entry.expires_at)}.` : 'Pedido fora do expediente: aguarda sua decisão.'}</p>}
      {!blocked && <NotifyClient entry={entry} />}
      {!blocked && (decided ? <p role="status">Reserva atualizada.</p> : <BookingDecisionForm entry={entry} onDecided={setDecided} />)}
      {entry.notes && <p className="whitespace-pre-wrap break-words border-l border-gold pl-3">{entry.notes}</p>}
      {blocked && (confirm ? <div className="space-y-3 border-t border-sand pt-4"><p>Remover este bloqueio? O período ficará disponível para novos agendamentos.</p><div className="flex flex-wrap gap-2"><button className={primary} disabled={mutation.pending} onClick={() => mutation.run(() => removeBlock({ id: entry.id }), 'Bloqueio removido.')}>{mutation.pending ? 'Removendo…' : 'Confirmar remoção'}</button><button className={control} disabled={mutation.pending} onClick={() => setConfirm(false)}>Manter bloqueio</button></div></div> : <button className={control} onClick={() => setConfirm(true)}>Remover bloqueio</button>)}
      {mutation.message && <p role={mutation.error ? 'alert' : 'status'}>{mutation.message}</p>}
    </div>
  </Dialog>
}
