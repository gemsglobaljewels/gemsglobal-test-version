import { NextRequest, NextResponse } from 'next/server'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function extFromName(name: string) {
  const idx = name.lastIndexOf('.')
  return idx > -1 ? name.slice(idx + 1).toLowerCase() : ''
}

function contentTypeFromExt(ext: string) {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    avif: 'image/avif',
  }
  return map[ext] || 'application/octet-stream'
}

export async function POST(request: NextRequest) {
  try {
    const ct = request.headers.get('content-type') || ''
    const keyBase = `mega-menu/${Date.now()}-${Math.random().toString(36).slice(2)}`

    if (ct.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'file required' }, { status: 400 })
      }
      const name = (file as any).name || 'image'
      const ext = extFromName(name)
      const contentType = contentTypeFromExt(ext)
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
      return NextResponse.json({ error: 'Multipart form data required' }, { status: 400 })
    }
  } catch (e: any) {
    console.error('Mega menu upload error:', e)
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}
