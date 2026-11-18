import 'server-only'
import sharp from 'sharp'
import { SITE_IMAGE_MAX_BYTES } from '../site-content'

/** Decodifica apenas formatos raster e remove metadados antes da publicação. */
export async function prepareSiteImage(file: Pick<File, 'size' | 'type' | 'arrayBuffer'>): Promise<Buffer> {
  if (file.size > SITE_IMAGE_MAX_BYTES) throw new Error('A imagem deve ter no máximo 4 MB.')
  if (!file.size || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Imagem inválida. Use JPEG, PNG ou WebP.')
  try {
    const bytes = Buffer.from(await file.arrayBuffer())
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
    if (!jpeg && !png && !webp) throw new Error()
    const image = sharp(bytes, { limitInputPixels: 24_000_000, failOn: 'warning' })
    const metadata = await image.metadata()
    if ((metadata.pages ?? 1) !== 1 || !metadata.width || !metadata.height) throw new Error()
    return await image.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
  } catch { throw new Error('Imagem inválida. Use uma foto JPEG, PNG ou WebP de até 24 megapixels.') }
}
