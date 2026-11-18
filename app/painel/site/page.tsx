import { requireOwner } from '@/lib/auth/require-owner'
import { getServices } from '@/lib/actions/admin'
import { getSiteContent, getServiceMedia } from '@/lib/site-data'
import { publicEnv } from '@/lib/env'
import { SiteEditor, ServicePhotoEditor } from '@/components/admin/SiteEditor'

export default async function SitePage() {
  await requireOwner()
  const [{ content, version }, services, media] = await Promise.all([getSiteContent(), getServices(), getServiceMedia()])
  const origin = publicEnv().NEXT_PUBLIC_SUPABASE_URL
  return <><header className="mb-8"><h1 className="text-3xl font-display">Seu site</h1><p className="mt-3 max-w-xl text-sm text-ink-soft">Atualize sua apresentação, fotos e contatos. A identidade visual acompanha o modelo escolhido no Canva.</p></header>
    <div className="max-w-3xl"><SiteEditor initial={content} initialVersion={version} origin={origin} />
      <section className="mt-12"><h2 className="text-2xl font-display">Fotos dos serviços</h2><p className="my-3 text-sm text-ink-soft">Nomes, descrições, preços e duração são editados em Serviços. Apenas serviços ativos aparecem para os clientes.</p>
        {services.filter(service => service.active).map(service => <ServicePhotoEditor key={service.id} serviceId={service.id} name={service.name} initial={media.find(photo => photo.service_id === service.id)} origin={origin} />)}
        {!services.some(service => service.active) && <p>Cadastre ou reative um serviço para adicionar sua foto.</p>}
      </section>
    </div></>
}
