import { z } from 'zod'

export const bookingInputSchema = z.object({
  serviceIds: z
    .array(z.string().uuid())
    .min(1, 'Selecione pelo menos um serviço.')
    .max(20, 'Selecione no máximo 20 serviços.'),
  clientName: z.string().trim().min(2, 'Digite seu nome completo.').max(120, 'Nome muito longo.'),
  clientWhatsapp: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().min(10, 'Digite um WhatsApp válido com DDD.').max(11, 'Digite um WhatsApp válido com DDD.')),
  clientEmail: z.string().trim().email('Digite um e-mail válido.'),
  startTime: z.coerce.date(),
})

export type BookingInput = z.infer<typeof bookingInputSchema>

export const getAvailableSlotsInputSchema = z.object({
  serviceIds: z
    .array(z.string().uuid())
    .max(20, 'Selecione no máximo 20 serviços.'),
  dateISO: z.iso.date('Data inválida.'),
})

export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsInputSchema>
