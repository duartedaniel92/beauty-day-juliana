import 'server-only'

// Ativar somente após aplicar a migration de decisões no banco correspondente.
export function bookingApprovalEnabled(): boolean {
  return process.env.BOOKING_APPROVAL_ENABLED === 'true'
}
