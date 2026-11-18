import Image from 'next/image'
import Link from 'next/link'
import { getPublicServices } from '@/lib/public-services'
import { getSiteContent, getServiceMedia } from '@/lib/site-data'
import { imageUrl } from '@/lib/site-content'
import { publicEnv } from '@/lib/env'
import { formatPrice } from '@/lib/format'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ContactForm } from '@/components/public/ContactForm'

export default async function HomePage() {
  const [{ content }, services, media] = await Promise.all([getSiteContent(), getPublicServices(), getServiceMedia()])
  const origin = publicEnv().NEXT_PUBLIC_SUPABASE_URL
  return <div className="public-site"><PublicHeader /><main>
    <section className="canva-hero" aria-labelledby="hero-title">
      <h1 id="hero-title">{content.heroTitle}</h1><p className="canva-subtitle">{content.subtitle}</p>
      <div className="canva-banner"><Image src={imageUrl(content.heroImage.path, origin)} alt={content.heroImage.alt} fill preload sizes="(min-width: 1280px) 1184px, 92vw" className="object-cover" /></div>
      <Link href="/agendar" className="public-cta">Agendar horário</Link>
    </section>
    <section className="canva-about" aria-labelledby="about-title"><div>
      <h2 id="about-title">{content.aboutTitle}</h2><p className="whitespace-pre-line">{content.aboutText}</p>
      <a href="#servicos" className="public-cta">Veja meu trabalho</a>
    </div><div className="canva-portrait"><Image src={imageUrl(content.aboutImage.path, origin)} alt={content.aboutImage.alt} width={533} height={800} sizes="(min-width: 768px) 40vw, 90vw" /></div></section>
    <section className="atelier-results" aria-labelledby="results-title"><h2 id="results-title">{content.resultsTitle}</h2>
      <div className="canva-work-photos">{content.gallery.map((image,index) => <Image key={`${image.path}-${index}`} src={imageUrl(image.path, origin)} alt={image.alt} width={533} height={800} sizes="(min-width: 768px) 45vw, 90vw" />)}</div>
    </section>
    <section id="servicos" className="atelier-services" aria-labelledby="services-title"><h2 id="services-title">{content.servicesTitle}</h2>
      {services.length ? <ul className="canva-service-grid">{services.map(service => {
        const photo = media.find(image => image.service_id === service.id)
        return <li key={service.id}>
          {photo && <Image src={imageUrl(photo.path, origin)} alt={photo.alt} width={533} height={400} sizes="(min-width: 768px) 22vw, 90vw" className="mb-5 aspect-[4/3] w-full rounded-2xl object-cover" />}
          <h3 className="text-lg font-semibold">{service.name}</h3>{service.description && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{service.description}</p>}
          <p className="mt-4 text-sm tabular-nums">{formatPrice(service.price_cents)} · {service.duration_minutes} min</p>
        </li>
      })}</ul> : <p className="mt-6 text-ink-soft">Nenhum serviço disponível no momento. Volte mais tarde.</p>}
      {services.length > 0 && <Link href="/agendar" className="public-cta mt-8">Escolher serviços e horário</Link>}
    </section>
    <section className="atelier-contact" aria-labelledby="contact-title"><ContactForm whatsapp={content.whatsapp} /><div><h2 id="contact-title">{content.contactTitle}</h2><p>{content.contactText}</p><Link href="/agendar" className="public-cta">Escolher meu horário</Link></div></section>
    <div className="canva-footer-image" aria-hidden="true"><Image src={imageUrl(content.footerImage.path, origin)} alt="" fill sizes="100vw" className="object-cover" /></div>
  </main><PublicFooter content={content} /></div>
}
