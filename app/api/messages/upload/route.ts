import { NextRequest, NextResponse } from 'next/server'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const ct = request.headers.get('content-type') || ''
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })
    }
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
    const name = (file as any).name || 'file'
    const key = `message-attachments/attachments/${Date.now()}-${Math.random().toString(36).slice(2)}-${name}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const publicUrl = `${R2_PUBLIC_URL}/${key}`
    return NextResponse.json({ url: publicUrl, name })
  } catch (e) {
    console.error('Message attachment upload error:', e)
    return NextResponse.json({ error: 'upload failed' }, { status: 500 })
  }
}
