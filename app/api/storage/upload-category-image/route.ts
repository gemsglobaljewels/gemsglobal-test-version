import { NextRequest, NextResponse } from 'next/server'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const form = await request.formData()
        const file = form.get('file') as File | null
        if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

        const name = (file as any).name || 'category'
        const key = `categories/${Date.now()}-${name}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: file.type || 'image/jpeg',
            })
        )

        const publicUrl = `${R2_PUBLIC_URL}/${key}`
        return NextResponse.json({ url: publicUrl })
    } catch (e: any) {
        console.error('Category image upload error:', e)
        return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
    }
}
