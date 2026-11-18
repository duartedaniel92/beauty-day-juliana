import 'server-only'
import { createClient } from './supabase/server'
import { DEFAULT_SITE_CONTENT, siteContentSchema } from './site-content'

export async function getSiteContent() {
  const client = await createClient()
  const { data, error } = await client.from('site_content').select('content,version').eq('singleton', true).single()
  if (error || !data) throw new Error('Não foi possível carregar o conteúdo do site.')
  const saved = data.content && typeof data.content === 'object' && !Array.isArray(data.content) ? data.content : {}
  const parsed = siteContentSchema.safeParse({ ...DEFAULT_SITE_CONTENT, ...saved })
  if (!parsed.success) throw new Error('Conteúdo do site inválido.')
  return { content: parsed.data, version: data.version }
}
export async function getServiceMedia() {
  const client = await createClient()
  const { data, error } = await client.from('service_media').select('service_id,path,alt')
  if (error) throw new Error('Não foi possível carregar as fotos dos serviços.')
  return data ?? []
}
