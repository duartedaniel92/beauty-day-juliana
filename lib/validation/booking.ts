import { z } from 'zod'

export const bookingInputSchema = z.object({
  requestId: z.uuid(),
  expectedServices: z.array(z.object({ id:z.uuid(), priceCents:z.number().int().min(0).max(10_000_000), durationMinutes:z.number().int().min(1).max(720) })).min(1).max(20),
  serviceIds: z
    .array(z.string().uuid())
    .min(1, 'Selecione pelo menos um serviço.')
    .max(20, 'Selecione no máximo 20 serviços.')
    .refine(ids => new Set(ids).size === ids.length, 'Não repita serviços.'),
  clientName: z.string().max(120, 'Nome muito longo.').trim().min(2, 'Digite seu nome completo.'),
  clientWhatsapp: z
    .string()
    .max(32, 'Digite um WhatsApp válido com DDD.')
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().min(10, 'Digite um WhatsApp válido com DDD.').max(11, 'Digite um WhatsApp válido com DDD.')),
  clientEmail: z.string().trim().email('Digite um e-mail válido.').max(254),
  startTime: z.coerce.date(),
}).refine(value => value.expectedServices.length === value.serviceIds.length
  && new Set(value.expectedServices.map(service => service.id)).size === value.serviceIds.length
  && value.expectedServices.every(service => value.serviceIds.includes(service.id)), 'Confira os serviços selecionados.')

export type BookingInput = z.infer<typeof bookingInputSchema>

export const getAvailableSlotsInputSchema = z.object({
  serviceIds: z
    .array(z.string().uuid())
    .max(20, 'Selecione no máximo 20 serviços.'),
  dateISO: z.iso.date('Data inválida.'),
})

export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsInputSchema>
