'use client'
import Image from 'next/image'
import { useId, useState } from 'react'
import { saveSiteContent, saveServicePhoto, uploadSiteImage } from '@/lib/actions/site'
import { imageUrl, SITE_IMAGE_MAX_BYTES, type ManagedImage, type SiteContent } from '@/lib/site-content'
import { control, field, primary } from './styles'

function PhotoField({ label, image, origin, onChange, onBusy }: { label: string; image: ManagedImage; origin: string; onChange: (value: ManagedImage) => void; onBusy: (busy: boolean) => void }) {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return <div className="space-y-3">
    <p className="font-semibold">{label}</p>
    {image.path && <Image src={imageUrl(image.path, origin)} alt={image.alt || 'Prévia da foto'} width={400} height={260} className="h-44 w-full rounded-xl object-cover" sizes="(min-width: 1024px) 320px, 90vw" />}
    <label htmlFor={`${id}-file`} className="block text-sm">Trocar foto <span className="text-ink-soft">· JPEG, PNG ou WebP, até 4 MB</span></label>
    <input id={`${id}-file`} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className={`${field} py-3 file:mr-3 file:rounded-full file:border-0 file:bg-sand file:px-3 file:py-1`} onChange={async event => {
      const input = event.currentTarget
      const file = input.files?.[0]
      if (!file) return
      setError(''); setBusy(true); onBusy(true)
      try {
        if (file.size > SITE_IMAGE_MAX_BYTES) { setError('A imagem deve ter no máximo 4 MB.'); return }
        const form = new FormData(); form.set('image', file)
        const result = await uploadSiteImage(form)
        if (result.error) setError(result.error)
        else if (result.path) onChange({ ...image, path: result.path })
      } catch { setError('Não foi possível enviar a foto. Tente novamente.') }
      finally { setBusy(false); onBusy(false); input.value = '' }
    }} />
    <label className="block text-sm" htmlFor={`${id}-alt`}>Descrição da imagem para acessibilidade</label>
    <input id={`${id}-alt`} required disabled={busy} maxLength={180} value={image.alt} onChange={event => onChange({ ...image, alt: event.target.value })} className={field} />
    {busy && <p role="status" className="text-sm">Preparando foto…</p>}
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </div>
}

const sections = [
  ['Apresentação', [['heroTitle','Título'],['subtitle','Subtítulo']]],
  ['Sobre Juliana', [['aboutTitle','Título da seção'],['aboutText','Apresentação']]],
  ['Trabalhos e serviços', [['resultsTitle','Título dos trabalhos'],['servicesTitle','Título do catálogo']]],
  ['Contato', [['contactTitle','Título do contato'],['contactText','Convite'],['address','Endereço'],['email','E-mail'],['whatsapp','WhatsApp com código do país'],['instagram','Nome de usuário no Instagram']]],
] as const

export function SiteEditor({ initial, initialVersion, origin }: { initial: SiteContent; initialVersion: number; origin: string }) {
  const [content, setContent] = useState(initial)
  const [version, setVersion] = useState(initialVersion)
  const [uploads, setUploads] = useState(0)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const onBusy = (busy: boolean) => setUploads(count => count + (busy ? 1 : -1))
  return <form className="space-y-8" onChange={() => setStatus('')} onSubmit={async event => {
    event.preventDefault(); setSaving(true); setError(''); setStatus('')
    try {
      const result = await saveSiteContent({ content, version })
      if ('error' in result && result.error) setError(result.error)
      else if (result.version !== undefined) { setVersion(result.version); setStatus('Alterações publicadas no site.') }
    } catch { setError('Não foi possível salvar. Seus campos foram preservados.') }
    finally { setSaving(false) }
  }}>
    <fieldset disabled={saving} className="min-w-0 space-y-8">
      {sections.map(([title, fields]) => <section key={title} className="space-y-4 border-b border-sand pb-8">
        <h2 className="text-xl font-semibold">{title}</h2>
        {fields.map(([key,label]) => <label key={key} className="block space-y-2 text-sm"><span>{label}</span>
          {key === 'aboutText' || key === 'contactText' ? <textarea required rows={4} maxLength={key === 'aboutText' ? 1200 : 500} value={content[key]} onChange={event => setContent({ ...content, [key]: event.target.value })} className={field} /> : <input required type={key === 'email' ? 'email' : key === 'whatsapp' ? 'tel' : 'text'} maxLength={key === 'email' ? 254 : key === 'address' ? 240 : key === 'instagram' ? 30 : 100} value={content[key]} onChange={event => setContent({ ...content, [key]: event.target.value })} className={field} />}
        </label>)}
      </section>)}
      <section className="space-y-5"><h2 className="text-xl font-semibold">Fotos do site</h2><p className="text-sm text-ink-soft">Envie apenas fotos que você tem autorização para publicar. Não inclua informações de clientes.</p>
        <div className="grid gap-8 md:grid-cols-2">
          {([['heroImage','Banner'],['aboutImage','Retrato'],['footerImage','Rodapé']] as const).map(([key,label]) => <PhotoField key={key} label={label} image={content[key]} origin={origin} onBusy={onBusy} onChange={image => setContent(current => ({ ...current, [key]: image }))} />)}
          {content.gallery.map((image,index) => <div key={index} className="space-y-3"><PhotoField label={`Trabalho ${index+1}`} image={image} origin={origin} onBusy={onBusy} onChange={value => setContent(current => ({ ...current, gallery: current.gallery.map((item,i) => i === index ? value : item) }))} />{content.gallery.length > 1 && <button type="button" disabled={uploads > 0} className={control} onClick={() => setContent(current => ({ ...current, gallery: current.gallery.filter((_,i) => i !== index) }))}>Remover trabalho {index+1}</button>}</div>)}
        </div>
        {content.gallery.length < 6 && <button type="button" className={control} disabled={uploads > 0} onClick={() => setContent(current => ({ ...current, gallery: [...current.gallery, { path: '', alt: '' }] }))}>Adicionar foto de trabalho</button>}
      </section>
    </fieldset>
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving || uploads > 0} className={primary}>{saving ? 'Salvando…' : 'Salvar site'}</button><a href="/" target="_blank" rel="noopener" className={control}>Ver site publicado ↗</a></div>
    <p className="text-sm text-ink-soft">A prévia das fotos acima é um rascunho. Textos e fotos aparecem para os clientes após salvar.</p>
    {status && <p role="status" className="text-sm">{status}</p>}{error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </form>
}

export function ServicePhotoEditor({ serviceId, name, initial, origin }: { serviceId: string; name: string; initial?: ManagedImage; origin: string }) {
  const [image, setImage] = useState<ManagedImage>(initial ?? { path: '', alt: '' })
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function save(remove: boolean) {
    setSaving(true); setMessage(''); setError('')
    try {
      const result = await saveServicePhoto({ serviceId, image: remove ? null : image })
      if ('error' in result) setError(result.error)
      else { if (remove) setImage({ path: '', alt: '' }); setMessage('Foto do serviço atualizada.') }
    } catch { setError('Não foi possível salvar a foto.') }
    finally { setSaving(false) }
  }
  return <section className="space-y-4 border-t border-sand py-6"><fieldset disabled={saving} className="min-w-0"><PhotoField label={name} image={image} origin={origin} onChange={setImage} onBusy={setBusy} /></fieldset><div className="flex flex-wrap gap-3"><button type="button" disabled={busy || saving || !image.path || !image.alt.trim()} className={primary} onClick={() => void save(false)}>Salvar foto do serviço</button><button type="button" disabled={busy || saving || !image.path} className={control} onClick={() => void save(true)}>Retirar foto</button></div>{message && <p role="status" className="text-sm">{message}</p>}{error && <p role="alert" className="text-sm text-red-800">{error}</p>}</section>
}
