'use server'

import { revalidatePath } from 'next/cache'
import { requireOwner } from '../auth/require-owner'
import { createAdminClient } from '../supabase/admin'
import { getCalendarRange } from '../calendar'
import type { ActionResult, AgendaEntry, BusinessHour, Service } from '../admin-types'
import { agendaSchema, blockSchema, idSchema, serviceActiveSchema, serviceSchema, weekSchema } from '../validation/admin'
import { bookingDecisionSchema } from '../validation/admin'
import { bookingApprovalEnabled } from '../booking-feature'
import { effectiveBookingStatus, type BookingStatus } from '../booking-status'

function invalidate(): void {
  for (const path of ['/', '/agendar', '/painel', '/painel/servicos', '/painel/configuracoes']) revalidatePath(path)
}

export async function getAgenda(input: unknown): Promise<AgendaEntry[]> {
  await requireOwner()
  const { date, view } = agendaSchema.parse(input)
  const { start, end } = getCalendarRange(date, view)
  const { data, error } = await createAdminClient().from('appointments')
    .select('*,appointment_services(service_name_snapshot,price_cents_snapshot,duration_minutes_snapshot)')
    .lt('start_time', end).gt('end_time', start).order('start_time')
  if (error) throw new Error('Não foi possível carregar a agenda.')
  return (data ?? []).map(row => {
    if (row.type !== 'booking' && row.type !== 'block') throw new Error('Tipo de compromisso inválido.')
    // Horário e versão vêm da mesma leitura; só os campos necessários saem do servidor.
    return { id: row.id, type: row.type, client_name: row.client_name, client_whatsapp: row.client_whatsapp,
      client_email: row.client_email, start_time: row.start_time, end_time: row.end_time,
      notes: row.notes, appointment_services: row.appointment_services,
      ...(bookingApprovalEnabled() ? { version: row.version, expires_at: row.expires_at,
        status: effectiveBookingStatus(row.status as BookingStatus, row.expires_at) } : {}) }
  })
}

export async function decideBooking(input: unknown): Promise<ActionResult> {
  const owner = await requireOwner()
  if (!bookingApprovalEnabled()) return { error: 'As decisões de reservas ainda não foram ativadas.' }
  const parsed = bookingDecisionSchema.safeParse(input)
  if (!parsed.success) return { error: 'Confira o horário, a confirmação da cliente e o motivo da alteração.' }
  const value = parsed.data
  const { error } = await createAdminClient().rpc('decide_appointment', {
    p_id: value.id, p_version: value.version, p_action: value.action,
    p_actor: owner.id, p_start_time: value.startTime, p_reason: value.reason,
  })
  if (error) return { error: error.code === '23P01' ? 'Esse horário está ocupado. Escolha outro.' : error.code === '40001' ? 'A reserva mudou ou o prazo encerrou. Atualize a agenda.' : 'Não foi possível alterar a reserva. Confira o expediente e o horário.' }
  // Sem revalidatePath: as páginas são dinâmicas (connection() no layout), e qualquer revalidação recarregaria
  // o painel com o diálogo aberto, fechando-o antes do aviso à cliente. O painel recarrega ao fechar o diálogo.
  return { success: true }
}

export async function getServices(): Promise<Service[]> {
  await requireOwner()
  const { data, error } = await createAdminClient().from('services').select('id,name,description,price_cents,duration_minutes,active').order('name')
  if (error) throw new Error('Não foi possível carregar os serviços.')
  return data ?? []
}

export async function getPendingBookings(): Promise<AgendaEntry[]> {
  await requireOwner()
  if (!bookingApprovalEnabled()) return []
  const now = new Date().toISOString()
  const { data, error } = await createAdminClient().from('appointments')
    .select('id,type,client_name,client_whatsapp,client_email,start_time,end_time,notes,status,version,expires_at,appointment_services(service_name_snapshot,price_cents_snapshot,duration_minutes_snapshot)')
    .eq('type', 'booking').eq('status', 'pending')
    .or(`expires_at.is.null,expires_at.gt.${now}`).order('start_time').limit(100)
  if (error) throw new Error('Não foi possível carregar os pedidos pendentes.')
  return (data ?? []).map(row => ({ ...row, type: 'booking', status: 'pending' }))
}

export async function getBusinessHours(): Promise<BusinessHour[]> {
  await requireOwner()
  const { data, error } = await createAdminClient().from('business_hours').select('*').order('day_of_week')
  if (error || data?.length !== 7) throw new Error('Não foi possível carregar o expediente completo.')
  return data
}

export async function saveService(input: unknown): Promise<ActionResult> {
  await requireOwner()
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) return { error: 'Confira nome, preço e duração do serviço.' }
  const { id, name, description, priceCents, durationMinutes } = parsed.data
  const payload = { name, description, price_cents: priceCents, duration_minutes: durationMinutes }
  const client = createAdminClient()
  const response = id
    ? await client.from('services').update(payload).eq('id', id).select('id').single()
    : await client.from('services').insert(payload).select('id').single()
  if (response.error || !response.data) return { error: 'Não foi possível salvar o serviço. Atualize e tente novamente.' }
  invalidate()
  return { success: true }
}

export async function setServiceActive(input: unknown): Promise<ActionResult> {
  await requireOwner()
  const parsed = serviceActiveSchema.safeParse(input)
  if (!parsed.success) return { error: 'Serviço inválido.' }
  const { data, error } = await createAdminClient().from('services').update({ active: parsed.data.active }).eq('id', parsed.data.id).select('id').single()
  if (error || !data) return { error: 'Não foi possível atualizar o serviço.' }
  invalidate()
  return { success: true }
}

export async function createBlock(input: unknown): Promise<ActionResult> {
  await requireOwner()
  const parsed = blockSchema.safeParse(input)
  if (!parsed.success) return { error: 'Confira as datas e o motivo (até 500 caracteres).' }
  const { startTime, endTime, notes } = parsed.data
  const { error } = await createAdminClient().from('appointments').insert({ type: 'block', start_time: startTime, end_time: endTime, notes })
  if (error) return { error: error.code === '23P01' ? 'Já existe um agendamento ou bloqueio nesse período.' : 'Não foi possível bloquear esse período.' }
  invalidate()
  return { success: true }
}

export async function removeBlock(input: unknown): Promise<ActionResult> {
  await requireOwner()
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { error: 'Bloqueio inválido.' }
  // O filtro de tipo impede usar este endpoint para excluir uma reserva de cliente.
  const { data, error } = await createAdminClient().from('appointments').delete().eq('id', parsed.data.id).eq('type', 'block').select('id').single()
  if (error || !data) return { error: 'Bloqueio não encontrado ou já removido.' }
  invalidate()
  return { success: true }
}

export async function saveBusinessHours(input: unknown): Promise<ActionResult> {
  await requireOwner()
  const parsed = weekSchema.safeParse(input)
  if (!parsed.success) return { error: 'Confira os sete dias e os horários de abertura e fechamento.' }
  const { error } = await createAdminClient().rpc('save_business_hours', { p_days: parsed.data.days })
  if (error) return { error: error.code === '23514' ? 'Há reservas futuras fora do novo expediente. Mantenha os horários que atendem essas reservas.' : 'Não foi possível salvar o expediente.' }
  invalidate()
  return { success: true }
}
