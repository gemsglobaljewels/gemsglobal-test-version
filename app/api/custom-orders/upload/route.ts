import { NextRequest, NextResponse } from 'next/server'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { requireAuth } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

// ── POST: upload reference images for a custom order (signed-in customer) ────
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const formData = await request.formData()
    const files = formData.getAll('files').filter(Boolean) as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }
    if (files.length > 12) {
      return NextResponse.json({ error: 'You can attach up to 12 images' }, { status: 400 })
    }

    const urls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type?.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
      }
      // ~8MB per image ceiling.
      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json({ error: 'Each image must be 8MB or smaller' }, { status: 400 })
      }

      const filename = `custom-orders/${user.id}/${Date.now()}-${i}-${safeFileName(file.name || 'reference')}`
      const buffer = Buffer.from(await file.arrayBuffer())

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filename,
          Body: buffer,
          ContentType: file.type || 'application/octet-stream',
        })
      )

      urls.push(`${R2_PUBLIC_URL}/${filename}`)
    }

    return NextResponse.json({ urls }, { status: 200 })
  } catch (error: any) {
    console.error('[CustomOrder Upload API] error:', error)
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 })
  }
}
