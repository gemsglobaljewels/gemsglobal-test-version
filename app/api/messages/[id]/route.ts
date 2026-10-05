import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { data } = await supabaseServer
      .from('messages')
      .select('id, sender, content, file_url, file_name, content_type, created_at, read_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    // best-effort mark read for admin views
    try {
      await supabaseServer.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', id).eq('sender', 'user').is('read_at', null)
    } catch { }
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json().catch(() => ({}))
    const content: string = String(body?.content || '').trim()
    const fileUrl: string | null = body?.fileUrl ? String(body.fileUrl) : null
    const fileName: string | null = body?.fileName ? String(body.fileName) : null
    const contentType: string | null = body?.contentType ? String(body.contentType) : null
    if (!content && !fileUrl) return NextResponse.json({ error: 'content or file required' }, { status: 400 })
    const { data } = await supabaseServer
      .from('messages')
      .insert([{
        conversation_id: id,
        sender: 'admin',
        content: content || null,
        file_url: fileUrl,
        file_name: fileName,
        content_type: contentType,
      }])
      .select('id, sender, content, file_url, file_name, content_type, created_at, read_at')
      .single()
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
