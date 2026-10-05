import { NextRequest, NextResponse } from 'next/server'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const ct = request.headers.get('content-type') || ''
        const keyBase = `diamond-shapes/${Date.now()}-${Math.random().toString(36).slice(2)}`

        if (ct.includes('multipart/form-data')) {
            const form = await request.formData()
            const file = form.get('file') as File | null
            if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
            const name = (file as any).name || 'diamond-shape'
            const key = `diamond-shape-images/${keyBase}-${name}`

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
        } else {
            const body = await request.json().catch(() => ({}))
            const remoteUrl = (body?.url as string | undefined) || ''
            if (!remoteUrl) {
                return NextResponse.json({ error: 'url required' }, { status: 400 })
            }
            const resp = await fetch(remoteUrl)
            if (!resp.ok) {
                return NextResponse.json({ error: 'Failed to fetch remote image' }, { status: 400 })
            }
            const arr = await resp.arrayBuffer()
            const buffer = Buffer.from(arr)
            const urlObj = new URL(remoteUrl)
            const lastSeg = urlObj.pathname.split('/').filter(Boolean).pop() || 'diamond-shape'
            const key = `diamond-shape-images/${keyBase}-${lastSeg}`

            await r2Client.send(
                new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: key,
                    Body: buffer,
                    ContentType: resp.headers.get('content-type') || 'application/octet-stream',
                })
            )

            const publicUrl = `${R2_PUBLIC_URL}/${key}`
            return NextResponse.json({ url: publicUrl, name: lastSeg })
        }
    } catch (e) {
        console.error('Diamond shape upload error:', e)
        return NextResponse.json({ error: 'upload failed' }, { status: 500 })
    }
}
