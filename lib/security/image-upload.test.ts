import { expect, it, vi } from 'vitest'
import sharp from 'sharp'
vi.mock('server-only', () => ({}))
import { prepareSiteImage } from './image-upload'
it('recusa SVG disfarçado e arquivo truncado', async () => {
  const fake = new File(['<svg onload="alert(1)"></svg>'], 'photo.png', { type:'image/png' })
  await expect(prepareSiteImage(fake)).rejects.toThrow('Imagem inválida')
})
it('verifica tamanho antes de ler os bytes', async () => {
  const read = vi.fn()
  await expect(prepareSiteImage({ size:4*1024*1024+1,type:'image/png',arrayBuffer:read })).rejects.toThrow('4 MB')
  expect(read).not.toHaveBeenCalled()
})
it('reprocessa imagem válida como WebP sem EXIF', async () => {
  const source = await sharp({ create:{ width:32,height:24,channels:3,background:'#ffffff' } }).jpeg().withMetadata({ orientation:6 }).toBuffer()
  const result = await prepareSiteImage(new File([new Uint8Array(source)], 'photo.jpg', {type:'image/jpeg'}))
  const meta = await sharp(result).metadata()
  expect(meta.format).toBe('webp')
  expect(meta.exif).toBeUndefined()
  expect(meta.orientation).toBeUndefined()
})
