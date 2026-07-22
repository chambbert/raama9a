import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export class UploadError extends Error {}

// HEIC/HEIF is rejected: browsers can't display it and the server's prebuilt
// sharp can't reliably decode it (patent-encumbered codec), so accepting it
// produces permanently broken images.
const IMAGE_MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const VIDEO_MIME_EXT: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
}
const OPTIMIZABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function mbLabel(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

// Re-encodes as JPEG, stepping quality down then resolution down, until it fits maxBytes.
async function optimizeImage(buffer: Buffer, maxBytes: number): Promise<Buffer> {
  let quality = 80
  let output = await sharp(buffer).rotate().jpeg({ quality, mozjpeg: true }).toBuffer()

  while (output.length > maxBytes && quality > 35) {
    quality -= 15
    output = await sharp(buffer).rotate().jpeg({ quality, mozjpeg: true }).toBuffer()
  }

  if (output.length > maxBytes) {
    const metadata = await sharp(buffer).metadata()
    let width = metadata.width ?? 1920
    while (output.length > maxBytes && width > 640) {
      width = Math.round(width * 0.85)
      output = await sharp(buffer).rotate().resize({ width }).jpeg({ quality: 70, mozjpeg: true }).toBuffer()
    }
  }

  return output
}

async function persist(buffer: Buffer, ext: string, prefix: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
  await writeFile(path.join(uploadsDir, filename), buffer)
  return `/uploads/${filename}`
}

/** Image-only upload (instructions, sightseeing, gallery photos, reviews). Auto-shrinks oversized images. */
export async function saveImageUpload(
  file: File,
  opts: { prefix: string; maxBytes?: number }
): Promise<string> {
  const { prefix, maxBytes = 5 * 1024 * 1024 } = opts

  if (!(file.type in IMAGE_MIME_EXT)) {
    throw new UploadError(
      'Invalid file type. Allowed: JPEG, PNG, WebP, GIF (iPhone HEIC photos must be exported as JPEG first)'
    )
  }

  let buffer: Buffer = Buffer.from(await file.arrayBuffer())
  let ext = IMAGE_MIME_EXT[file.type]

  if (buffer.length > maxBytes && OPTIMIZABLE_TYPES.has(file.type)) {
    buffer = await optimizeImage(buffer, maxBytes)
    ext = '.jpg'
  }

  if (buffer.length > maxBytes) {
    throw new UploadError(`File size must be less than ${mbLabel(maxBytes)}`)
  }

  return persist(buffer, ext, prefix)
}

/** Image-or-video upload (hero images, cleaner incidents/task media). Only images are auto-optimized. */
export async function saveMediaUpload(
  file: File,
  opts: { prefix: string; imageMaxBytes?: number; videoMaxBytes?: number }
): Promise<{ url: string; mediaType: 'IMAGE' | 'VIDEO' }> {
  const { prefix, imageMaxBytes = 5 * 1024 * 1024, videoMaxBytes = 50 * 1024 * 1024 } = opts
  const isVideo = file.type in VIDEO_MIME_EXT
  const isImage = file.type in IMAGE_MIME_EXT

  if (!isVideo && !isImage) {
    throw new UploadError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV, WebM')
  }

  let buffer: Buffer = Buffer.from(await file.arrayBuffer())
  let ext = isVideo ? VIDEO_MIME_EXT[file.type] : IMAGE_MIME_EXT[file.type]
  const maxBytes = isVideo ? videoMaxBytes : imageMaxBytes

  if (!isVideo && buffer.length > maxBytes && OPTIMIZABLE_TYPES.has(file.type)) {
    buffer = await optimizeImage(buffer, maxBytes)
    ext = '.jpg'
  }

  if (buffer.length > maxBytes) {
    throw new UploadError(`File size must be less than ${mbLabel(maxBytes)}`)
  }

  return { url: await persist(buffer, ext, prefix), mediaType: isVideo ? 'VIDEO' : 'IMAGE' }
}
