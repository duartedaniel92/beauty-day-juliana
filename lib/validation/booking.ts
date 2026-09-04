import { z } from 'zod'

export const bookingInputSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um servico.'),
  clientName: z.string().trim().min(2, 'Digite seu nome completo.'),
  clientWhatsapp: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().min(10, 'Digite um WhatsApp valido com DDD.').max(11, 'Digite um WhatsApp valido com DDD.')),
  clientEmail: z.string().trim().email('Digite um e-mail valido.'),
  startTime: z.coerce.date(),
})

export type BookingInput = z.infer<typeof bookingInputSchema>

export const getAvailableSlotsInputSchema = z.object({
  serviceIds: z.array(z.string().uuid()),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida.'),
})

export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsInputSchema>
