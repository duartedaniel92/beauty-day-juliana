import { z } from 'zod'

export const bookingInputSchema = z.object({
  serviceIds: z
    .array(z.string().uuid())
    .min(1, 'Selecione pelo menos um servico.')
    .max(20, 'Selecione no maximo 20 servicos.'),
  clientName: z.string().trim().min(2, 'Digite seu nome completo.').max(120, 'Nome muito longo.'),
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
  serviceIds: z
    .array(z.string().uuid())
    .max(20, 'Selecione no maximo 20 servicos.'),
  dateISO: z.iso.date('Data invalida.'),
})

export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsInputSchema>
