'use server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireOwner } from '../auth/require-owner'
import { createAdminClient } from '../supabase/admin'
import { siteContentSchema, managedImageSchema, SITE_BUCKET } from '../site-content'
import { prepareSiteImage } from '../security/image-upload'
import { enforceRateLimit, RateLimitError } from '../security/rate-limit'

function invalidate() { revalidatePath('/'); revalidatePath('/painel/site') }
async function checkFiles(paths: string[]) {
  const bucket = createAdminClient().storage.from(SITE_BUCKET)
  for (const path of new Set(paths.filter(path => !path.startsWith('/images/')))) {
    const { data, error } = await bucket.exists(path)
    if (error || !data) throw new Error('Foto indisponível. Envie novamente antes de salvar.')
  }
}
const failure = (error: unknown) => ({ error: error instanceof RateLimitError ? error.message : 'Não foi possível salvar. Confira os dados e tente novamente.' })

export async function saveSiteContent(input: unknown) {
  await requireOwner()
  const parsed = z.object({ content: siteContentSchema, version: z.number().int().min(0).max(2147483646) }).safeParse(input)
  if (!parsed.success) return { error: 'Confira os textos, contatos e descrições das fotos.' }
  try {
    await enforceRateLimit('site')
    const { content, version } = parsed.data
    await checkFiles([content.heroImage.path, content.aboutImage.path, content.footerImage.path, ...content.gallery.map(x => x.path)])
    const { data, error } = await createAdminClient().from('site_content').update({ content, version: version + 1 }).eq('singleton', true).eq('version', version).select('version').maybeSingle()
    if (error) return failure(error)
    if (!data) return { error: 'O site foi alterado em outra aba. Atualize a página antes de editar.' }
    invalidate()
    return { version: data.version }
  } catch (error) { return failure(error) }
}

export async function uploadSiteImage(form: FormData) {
  await requireOwner()
  try {
    await enforceRateLimit('site')
    const file = form.get('image')
    if (!(file instanceof File)) return { error: 'Escolha uma foto JPEG, PNG ou WebP.' }
    const bytes = await prepareSiteImage(file)
    const path = `site/${randomUUID()}.webp`
    const { error } = await createAdminClient().storage.from(SITE_BUCKET).upload(path, bytes, { contentType: 'image/webp', upsert: false })
    if (error) return { error: 'Não foi possível enviar a foto. A imagem anterior foi preservada.' }
    return { path }
  } catch (error) {
    return { error: error instanceof RateLimitError || (error instanceof Error && /Imagem inválida|4 MB/.test(error.message)) ? error.message : 'Não foi possível enviar a foto.' }
  }
}

export async function saveServicePhoto(input: unknown) {
  await requireOwner()
  const parsed = z.object({ serviceId: z.uuid(), image: managedImageSchema.nullable() }).safeParse(input)
  if (!parsed.success) return { error: 'Confira o serviço e a descrição da foto.' }
  try {
    await enforceRateLimit('site')
    const { serviceId, image } = parsed.data
    const client = createAdminClient()
    const { data: service, error: lookupError } = await client.from('services').select('id').eq('id', serviceId).maybeSingle()
    if (lookupError || !service) return { error: 'Serviço indisponível.' }
    if (image) await checkFiles([image.path])
    const { error } = image ? await client.from('service_media').upsert({ service_id: serviceId, ...image }) : await client.from('service_media').delete().eq('service_id', serviceId)
    if (error) return failure(error)
    invalidate()
    return { success: true }
  } catch (error) { return failure(error) }
}
