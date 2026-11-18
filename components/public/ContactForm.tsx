'use client'
import { useState } from 'react'
import { getContactLinks } from '@/lib/contact'

export function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [error, setError] = useState('')
  return <form className="canva-contact-form" onSubmit={event => {
    event.preventDefault(); setError('')
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const message = String(form.get('message') ?? '').trim()
    const link = getContactLinks({ whatsapp }).whatsapp
    if (!name || !message || name.length > 120 || message.length > 1000 || !link) { setError('Confira seu nome e a mensagem.'); return }
    // Destino externo validado; Next Router só navega entre páginas do sistema.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${link}?text=${encodeURIComponent(`Olá, Juliana! Sou ${name}. ${message}`)}`)
  }}>
    <label>Seu nome<input name="name" required maxLength={120} autoComplete="name" /></label>
    <label>Sua mensagem<textarea name="message" required maxLength={1000} rows={4} /></label>
    <button className="public-cta" type="submit">Conversar no WhatsApp ↗</button>
    <p className="text-sm text-ink-soft">O WhatsApp abrirá com seu texto. Você confirma o envio por lá.</p>
    {error && <p role="alert">{error}</p>}
  </form>
}
