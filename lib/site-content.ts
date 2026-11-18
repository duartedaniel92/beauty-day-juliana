import { z } from 'zod'

export const SITE_BUCKET = 'beauty-site'
// ponytail: upload pela Server Action até 4 MB; usar staging privado se precisar de arquivos maiores.
export const SITE_IMAGE_MAX_BYTES = 4 * 1024 * 1024
const localImages = ['/images/corte-canva.webp', '/images/juliana-canva.webp', '/images/alisamento-canva.webp', '/images/maquiagem-canva.webp', '/images/cosmeticos-canva.webp']
export const imagePathSchema = z.string().refine(path => localImages.includes(path) || /^site\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/.test(path), 'Imagem inválida.')
export const managedImageSchema = z.object({ path: imagePathSchema, alt: z.string().trim().min(1).max(180) })
const title = z.string().trim().min(1).max(100)
export const siteContentSchema = z.object({
  heroTitle: title, subtitle: title, aboutTitle: title, aboutText: z.string().trim().min(1).max(1200),
  resultsTitle: title, servicesTitle: title, contactTitle: title, contactText: z.string().trim().min(1).max(500),
  address: z.string().trim().min(1).max(240), email: z.email().max(254),
  whatsapp: z.string().regex(/^\+[1-9]\d{7,14}$/), instagram: z.string().regex(/^[a-zA-Z0-9_\.]{1,30}$/),
  heroImage: managedImageSchema, aboutImage: managedImageSchema, footerImage: managedImageSchema,
  gallery: z.array(managedImageSchema).min(1).max(6),
})
export type SiteContent = z.infer<typeof siteContentSchema>
export type ManagedImage = z.infer<typeof managedImageSchema>
export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroTitle: 'Juliana Souza', subtitle: 'Beauty Day', aboutTitle: 'Sobre mim',
  aboutText: 'Sou Juliana Souza.\nEspecialista em maquiagem e alisamentos térmicos.',
  resultsTitle: 'Resultados que encantam', servicesTitle: 'Meus serviços',
  contactTitle: 'Vamos fazer você brilhar', contactText: 'Seja para um casamento ou um evento profissional, quero te ajudar a ser sua melhor versão.',
  address: 'Rua Benedito Leite, 435, Jd Nossa Sra de Fátima', email: 'juliana.francielle.sc@gmail.com', whatsapp: '+5519971580111', instagram: 'julianasouza_beauty',
  heroImage: { path: localImages[0], alt: 'Cuidado e precisão no corte de cabelo' },
  aboutImage: { path: localImages[1], alt: 'Juliana Souza, profissional do Beauty Day' },
  footerImage: { path: localImages[4], alt: 'Produtos de beleza' },
  gallery: [{ path: localImages[2], alt: 'Alisamento apresentado por Juliana' }, { path: localImages[3], alt: 'Maquiagem apresentada por Juliana' }],
}
export function imageUrl(path: string, origin: string): string {
  imagePathSchema.parse(path)
  return path.startsWith('/images/') ? path : `${origin}/storage/v1/object/public/${SITE_BUCKET}/${path}`
}
