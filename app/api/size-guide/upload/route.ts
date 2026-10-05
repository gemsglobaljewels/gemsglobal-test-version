import { NextRequest, NextResponse } from 'next/server'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'
// Videos are heavier than images — allow more processing time.
export const maxDuration = 300

function extFromName(name: string) {
  const idx = name.lastIndexOf('.')
  return idx > -1 ? name.slice(idx + 1).toLowerCase() : ''
}

function contentTypeFromExt(ext: string) {
  const map: Record<string, string> = {
    // images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    avif: 'image/avif',
    // videos
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    ogg: 'video/ogg',
    ogv: 'video/ogg',
    m4v: 'video/mp4',
  }
  return map[ext] || 'application/octet-stream'
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const ct = request.headers.get('content-type') || ''
    const keyBase = `size-guide/${Date.now()}-${Math.random().toString(36).slice(2)}`

    if (ct.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'file required' }, { status: 400 })
      }
      const name = (file as any).name || 'media'
      const ext = extFromName(name)
      // Prefer the browser-reported MIME type; fall back to extension mapping.
      const contentType = file.type || contentTypeFromExt(ext)
      const key = `${keyBase}-${name}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      )

      const publicUrl = `${R2_PUBLIC_URL}/${key}`
      return NextResponse.json({ url: publicUrl }, { status: 200 })
    } else {
      // JSON { url } — import a remote asset into R2 (direct-file URLs only).
      const body = await request.json().catch(() => ({}))
      const remoteUrl = (body?.url as string | undefined) || ''
      if (!remoteUrl) {
        return NextResponse.json({ error: 'url required' }, { status: 400 })
      }
      const resp = await fetch(remoteUrl)
      if (!resp.ok) {
        return NextResponse.json({ error: 'Failed to fetch remote file' }, { status: 400 })
      }
      const buffer = Buffer.from(await resp.arrayBuffer())
      const urlObj = new URL(remoteUrl)
      const lastSeg = urlObj.pathname.split('/').filter(Boolean).pop() || 'media'
      const ext = extFromName(lastSeg)
      const contentType = resp.headers.get('content-type') || contentTypeFromExt(ext)
      const key = `${keyBase}-${lastSeg}`

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      )

      const publicUrl = `${R2_PUBLIC_URL}/${key}`
      return NextResponse.json({ url: publicUrl }, { status: 200 })
    }
  } catch (e: any) {
    console.error('Size Guide Upload error:', e)
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}
