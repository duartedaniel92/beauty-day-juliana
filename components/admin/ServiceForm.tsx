'use client'
import { useState, type ReactElement, type FormEvent } from 'react'
import type { Service } from '@/lib/admin-types'
import { saveService } from '@/lib/actions/admin'
import { parsePriceCents } from '@/lib/calendar'
import { field, primary } from './styles'
import { useMutation } from './useMutation'

export function ServiceForm({ service }: { service?: Service }): ReactElement {
  const mutation = useMutation()
  const [validation, setValidation] = useState('')
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setValidation('')
    try {
      const input = { id: service?.id, name: String(data.get('name')), description: String(data.get('description')), priceCents: parsePriceCents(String(data.get('price'))), durationMinutes: Number(data.get('duration')) }
      mutation.run(() => saveService(input), 'Serviço salvo.', () => { if (!service) form.reset() })
    } catch { setValidation('Informe o preço em reais, como 120,00.') }
  }
  return <form onSubmit={submit} className="space-y-4">
    <fieldset disabled={mutation.pending} className="space-y-4">
      <label className="block space-y-2 text-sm"><span>Nome do serviço</span><input name="name" required minLength={2} maxLength={100} defaultValue={service?.name} className={field} /></label>
      <label className="block space-y-2 text-sm"><span>Descrição</span><textarea name="description" maxLength={1000} rows={3} defaultValue={service?.description ?? ''} className={field} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-2 text-sm"><span>Preço (R$)</span><input name="price" required inputMode="decimal" placeholder="120,00" defaultValue={service ? (service.price_cents / 100).toFixed(2).replace('.', ',') : ''} className={field} /></label>
        <label className="block space-y-2 text-sm"><span>Duração (min)</span><input name="duration" type="number" required min={1} max={720} step={1} defaultValue={service?.duration_minutes} className={field} /></label>
      </div>
      <button type="submit" className={primary}>{mutation.pending ? 'Salvando…' : 'Salvar serviço'}</button>
    </fieldset>
    {validation && <p role="alert" className="text-sm text-clay-dark">{validation}</p>}
    {mutation.message && <p role={mutation.error ? 'alert' : 'status'} className="text-sm">{mutation.message}</p>}
  </form>
}
