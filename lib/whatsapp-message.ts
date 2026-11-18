import type { BookingStatus } from './booking-status'
import { dateLabel, salonDate, salonTime } from './calendar'

const SALON_NAME = 'Beauty Day Juliana'

interface NotifiableBooking {
  client_name: string | null
  client_whatsapp: string | null
  start_time: string
  status?: BookingStatus
  appointment_services: { service_name_snapshot: string }[]
}

/** O formulário salva DDD + número (10–11 dígitos); registros antigos podem já ter o 55. */
function brazilPhone(value: string | null): string | undefined {
  const digits = (value ?? '').replace(/\D/g, '')
  if (/^[1-9]\d{9,10}$/.test(digits)) return `55${digits}`
  if (/^55[1-9]\d{9,10}$/.test(digits)) return digits
  return undefined
}

function message(booking: NotifiableBooking, status: BookingStatus): string | undefined {
  const firstName = booking.client_name?.trim().split(/\s+/)[0]
  const hello = firstName ? `Olá, ${firstName}!` : 'Olá!'
  const when = `${dateLabel(salonDate(booking.start_time))}, às ${salonTime(booking.start_time)}`
  const services = booking.appointment_services.map(service => service.service_name_snapshot).join(', ')
  switch (status) {
    case 'confirmed':
      return `${hello} Seu horário no ${SALON_NAME} está confirmado: ${when}.\nServiços: ${services}.\nQualquer dúvida, é só responder esta mensagem.`
    case 'cancelled':
      return `${hello} Seu horário de ${when} no ${SALON_NAME} foi cancelado. Se quiser, me responda aqui para combinarmos um novo horário.`
    case 'rejected':
      return `${hello} Infelizmente não vou conseguir atender no horário solicitado (${when}). Me responda aqui ou faça um novo pedido pelo site.`
    case 'expired':
      return `${hello} Desculpe, não consegui responder a tempo ao seu pedido para ${when}. Me responda aqui para combinarmos um horário.`
    default:
      return undefined
  }
}

/**
 * Link wa.me com a mensagem pronta. Abre o WhatsApp da proprietária; nada é enviado sem ela tocar em enviar.
 * Sem status (aprovação desativada), a reserva já nasce confirmada.
 */
export function clientWhatsappLink(booking: NotifiableBooking): string | undefined {
  const phone = brazilPhone(booking.client_whatsapp)
  const text = message(booking, booking.status ?? 'confirmed')
  if (!phone || !text) return undefined
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
