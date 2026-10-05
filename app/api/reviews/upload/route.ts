import { NextRequest, NextResponse } from 'next/server'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = String(formData.get('user_id') || 'guest')
    const files = formData.getAll('files').filter(Boolean) as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    const urls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type?.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
      }

      const filename = `reviews/${userId}/${Date.now()}-${i}-${safeFileName(file.name || 'review-image')}`
      const buffer = Buffer.from(await file.arrayBuffer())

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filename,
          Body: buffer,
          ContentType: file.type || 'application/octet-stream',
        })
      )

      const publicUrl = `${R2_PUBLIC_URL}/${filename}`
      urls.push(publicUrl)
    }

    return NextResponse.json({ urls }, { status: 200 })
  } catch (error: any) {
    console.error('[Review Upload API] error:', error)
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 })
  }
}
