import { z } from 'zod'

export const serviceSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, 'Informe o nome do serviço.').max(100),
  description: z.string().trim().max(1000).default(''),
  priceCents: z.number().int().min(1).max(10_000_000),
  durationMinutes: z.number().int().min(1).max(720),
})

export const serviceActiveSchema = z.object({ id: z.uuid(), active: z.boolean() })
export const idSchema = z.object({ id: z.uuid() })
export const bookingDecisionSchema = z.object({
  id: z.uuid(),
  version: z.number().int().min(0),
  action: z.enum(['approve', 'reschedule', 'cancel', 'reject']),
  startTime: z.iso.datetime({ offset: true }).optional(),
  agreedWithClient: z.boolean().optional(),
  reason: z.string().trim().max(500).default(''),
}).refine(value => value.action !== 'reschedule' || (!!value.startTime && value.agreedWithClient === true), 'Confirme o novo horário combinado com a cliente.')
  .refine(value => !['cancel', 'reject'].includes(value.action) || value.reason.length >= 3, 'Informe o motivo.')
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
const daySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: timeSchema.nullable(),
  end_time: timeSchema.nullable(),
  is_working: z.boolean(),
}).refine(day => !day.is_working || (day.start_time !== null && day.end_time !== null && day.end_time > day.start_time), 'O fechamento deve ser posterior à abertura.')
export const weekSchema = z.object({ days: z.array(daySchema).length(7) })
  .refine(({ days }) => new Set(days.map(day => day.day_of_week)).size === 7, 'Informe os sete dias da semana sem repetir.')

export const blockSchema = z.object({
  startTime: z.iso.datetime({ offset: true }),
  endTime: z.iso.datetime({ offset: true }),
  notes: z.string().trim().max(500).default(''),
}).refine(block => new Date(block.endTime) > new Date(block.startTime), 'O fim deve ser posterior ao início.')

export const agendaSchema = z.object({ date: z.iso.date(), view: z.enum(['day', 'week', 'month']) })
