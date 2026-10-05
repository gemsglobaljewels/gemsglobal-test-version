import { NextRequest, NextResponse } from 'next/server'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const ct = request.headers.get('content-type') || ''
    const keyBase = `diamond-shapes-3d/${Date.now()}-${Math.random().toString(36).slice(2)}`

    if (ct.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
      const name = (file as any).name || 'shape.glb'
      // Sanitize the filename used in the object key/URL — raw spaces or unicode
      // produce a URL the 3D viewer can't fetch (404). Keep the original for display.
      const safeName = name.replace(/[^a-zA-Z0-9._-]+/g, '-')
      const key = `diamond-shape-3d/${keyBase}-${safeName}`
      const ext = (() => {
        const i = name.lastIndexOf('.')
        return i > -1 ? name.slice(i + 1).toLowerCase() : ''
      })()
      const map: Record<string, string> = {
        glb: 'model/gltf-binary',
        gltf: 'model/gltf+json',
        usdz: 'model/vnd.usdz+zip',
        obj: 'text/plain',
        fbx: 'application/octet-stream',
      }
      const contentType = map[ext] || 'application/octet-stream'

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
      console.log('[upload-3d] Uploaded successfully:', publicUrl)
      return NextResponse.json({ url: publicUrl, name })
    } else {
      const body = await request.json().catch(() => ({}))
      const remoteUrl = (body?.url as string | undefined) || ''
      if (!remoteUrl) {
        return NextResponse.json({ error: 'url required' }, { status: 400 })
      }
      const resp = await fetch(remoteUrl)
      if (!resp.ok) {
        return NextResponse.json({ error: 'Failed to fetch remote file' }, { status: 400 })
      }
      const arr = await resp.arrayBuffer()
      const buffer = Buffer.from(arr)
      const urlObj = new URL(remoteUrl)
      const lastSeg = urlObj.pathname.split('/').filter(Boolean).pop() || 'shape.glb'
      const safeSeg = lastSeg.replace(/[^a-zA-Z0-9._-]+/g, '-')
      const key = `diamond-shape-3d/${keyBase}-${safeSeg}`

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
  } catch (e: any) {
    console.error('[upload-3d] Error:', e)
    return NextResponse.json({ error: e?.message || 'upload failed' }, { status: 500 })
  }
}
