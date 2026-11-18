export const bookingStatusLabels = {
  pending: 'Aguardando autorização', confirmed: 'Confirmada',
  cancelled: 'Cancelada', rejected: 'Recusada', expired: 'Prazo encerrado',
} as const
export type BookingStatus = keyof typeof bookingStatusLabels

export function effectiveBookingStatus(status: BookingStatus, expiresAt: string | null, now = Date.now()): BookingStatus {
  return status === 'pending' && expiresAt !== null && Date.parse(expiresAt) <= now ? 'expired' : status
}
