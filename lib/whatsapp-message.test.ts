import { describe, expect, it } from 'vitest'
import { clientWhatsappLink } from './whatsapp-message'

const base = {
  client_name: 'Maria Silva',
  client_whatsapp: '(19) 99876-5432',
  start_time: '2026-11-20T17:00:00.000Z', // 14:00 em São Paulo
  appointment_services: [{ service_name_snapshot: 'Escova' }, { service_name_snapshot: 'Maquiagem' }],
}

function text(url: string | undefined): string {
  expect(url).toBeDefined()
  return new URL(url!).searchParams.get('text') ?? ''
}

describe('clientWhatsappLink', () => {
  it('abre o número da cliente com código do Brasil', () => {
    const url = clientWhatsappLink({ ...base, status: 'confirmed' })
    expect(url?.startsWith('https://wa.me/5519998765432?text=')).toBe(true)
  })

  it('aceita número já salvo com 55', () => {
    expect(clientWhatsappLink({ ...base, client_whatsapp: '5519998765432', status: 'confirmed' }))
      .toMatch(/^https:\/\/wa\.me\/5519998765432\?/)
  })

  it('confirmação traz primeiro nome, data, horário e serviços', () => {
    const message = text(clientWhatsappLink({ ...base, status: 'confirmed' }))
    expect(message).toContain('Olá, Maria!')
    expect(message).toContain('confirmado')
    expect(message).toContain('20 de novembro')
    expect(message).toContain('14:00')
    expect(message).toContain('Escova, Maquiagem')
  })

  it('sem status (aprovação desativada) é tratado como confirmado', () => {
    expect(text(clientWhatsappLink(base))).toContain('confirmado')
  })

  it('cancelamento, recusa e prazo encerrado têm mensagens próprias', () => {
    expect(text(clientWhatsappLink({ ...base, status: 'cancelled' }))).toContain('cancelado')
    expect(text(clientWhatsappLink({ ...base, status: 'rejected' }))).toContain('não vou conseguir atender')
    expect(text(clientWhatsappLink({ ...base, status: 'expired' }))).toContain('não consegui responder a tempo')
  })

  it('não gera link para pedido pendente', () => {
    expect(clientWhatsappLink({ ...base, status: 'pending' })).toBeUndefined()
  })

  it('não gera link com telefone ausente ou inválido', () => {
    expect(clientWhatsappLink({ ...base, client_whatsapp: null, status: 'confirmed' })).toBeUndefined()
    expect(clientWhatsappLink({ ...base, client_whatsapp: '12345', status: 'confirmed' })).toBeUndefined()
    expect(clientWhatsappLink({ ...base, client_whatsapp: '0019998765432', status: 'confirmed' })).toBeUndefined()
  })

  it('sem nome usa saudação neutra', () => {
    expect(text(clientWhatsappLink({ ...base, client_name: '  ', status: 'confirmed' }))).toMatch(/^Olá!/)
  })
})
