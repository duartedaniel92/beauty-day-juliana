import type { ReactElement } from 'react'
import { getBusinessHours } from '@/lib/actions/admin'
import { BusinessHoursForm } from '@/components/admin/BusinessHoursForm'

export default async function SettingsPage(): Promise<ReactElement> {
  const hours = await getBusinessHours()
  return <><h1 className="font-display text-3xl">Seu expediente</h1><p className="mt-3 mb-7 max-w-xl text-sm leading-relaxed text-ink-soft">Defina sua semana de atendimento no horário de São Paulo. Reservas já confirmadas são protegidas: o novo expediente precisa comportar esses horários.</p><BusinessHoursForm hours={hours} /></>
}
