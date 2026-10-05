import { NextRequest, NextResponse } from 'next/server'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const filename = `blog/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const buffer = Buffer.from(await file.arrayBuffer())

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const publicUrl = `${R2_PUBLIC_URL}/${filename}`

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error('[Blog Upload API] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
