import { expect, it } from 'vitest'
import { DEFAULT_SITE_CONTENT, siteContentSchema, managedImageSchema, imageUrl } from './site-content'
it('aceita conteúdo padrão do Canva e texto literal sem HTML executável', () => {
  expect(siteContentSchema.safeParse(DEFAULT_SITE_CONTENT).success).toBe(true)
  expect(siteContentSchema.parse({ ...DEFAULT_SITE_CONTENT, aboutText:'<script>alert(1)</script>' }).aboutText).toBe('<script>alert(1)</script>')
})
it('recusa imagens por URL externa, path traversal e formatos executáveis', () => {
  for (const path of ['https://attacker.test/a.png','site/../../a.webp','/images/x.svg','data:image/png;base64,x']) {
    expect(managedImageSchema.safeParse({ path, alt:'Uma foto' }).success).toBe(false)
  }
  expect(imageUrl('/images/corte-canva.webp', 'https://example.supabase.co')).toBe('/images/corte-canva.webp')
  expect(imageUrl('site/11111111-1111-4111-8111-111111111111.webp', 'https://example.supabase.co')).toBe('https://example.supabase.co/storage/v1/object/public/beauty-site/site/11111111-1111-4111-8111-111111111111.webp')
})
it('limita conteúdo e exige descrição de imagem', () => {
  expect(siteContentSchema.safeParse({ ...DEFAULT_SITE_CONTENT, aboutText:'x'.repeat(1201) }).success).toBe(false)
  expect(managedImageSchema.safeParse({ path:'/images/corte-canva.webp',alt:'' }).success).toBe(false)
})
