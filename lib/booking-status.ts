export const bookingStatusLabels = {
  pending: 'Aguardando autorização', confirmed: 'Confirmada',
  cancelled: 'Cancelada', rejected: 'Recusada', expired: 'Prazo encerrado',
} as const
export type BookingStatus = keyof typeof bookingStatusLabels

export function effectiveBookingStatus(status: BookingStatus, expiresAt: string | null, now = Date.now()): BookingStatus {
  return status === 'pending' && expiresAt !== null && Date.parse(expiresAt) <= now ? 'expired' : status
}

export type BookingDecision = 'approve' | 'reschedule' | 'cancel' | 'reject'
type BookingTimes = { start_time: string; end_time: string }

/** Estado da reserva logo após a decisão, para o diálogo mostrar o aviso antes de a agenda recarregar. */
export function decidedBooking(booking: BookingTimes, action: BookingDecision, newStart?: string): BookingTimes & { status: BookingStatus } {
  const status = action === 'reject' ? 'rejected' : action === 'cancel' ? 'cancelled' : 'confirmed'
  if (action !== 'reschedule' || !newStart) return { status, start_time: booking.start_time, end_time: booking.end_time }
  const duration = Date.parse(booking.end_time) - Date.parse(booking.start_time)
  return { status, start_time: newStart, end_time: new Date(Date.parse(newStart) + duration).toISOString() }
}
