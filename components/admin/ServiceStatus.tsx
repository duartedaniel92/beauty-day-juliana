'use client'
import type { ReactElement } from 'react'
import { setServiceActive } from '@/lib/actions/admin'
import { useMutation } from './useMutation'
import { control } from './styles'

export function ServiceStatus({ id, active }: { id: string; active: boolean }): ReactElement {
  const mutation = useMutation()
  return <div><button type="button" className={control} disabled={mutation.pending} onClick={() => mutation.run(() => setServiceActive({ id, active: !active }), active ? 'Serviço arquivado. Reservas existentes foram preservadas.' : 'Serviço disponível para agendamento.')}>
    {mutation.pending ? 'Atualizando…' : active ? 'Arquivar serviço' : 'Reativar serviço'}
  </button>{mutation.message && <p className="mt-2 text-sm" role={mutation.error ? 'alert' : 'status'}>{mutation.message}</p>}</div>
}
