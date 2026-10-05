import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

function clean(s: any) {
  return typeof s === 'string' ? s.trim() : ''
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// A session boundary the widget uses to partition one continuous conversation
// into browsable "chats". Shape returned to the client: { id, startTs }.
function toStartTs(iso: string | null): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

// GET /api/chat-sessions?token=XYZ  → { sessions: [{ id, startTs }] }
export async function GET(request: NextRequest) {
  try {
    const token = clean(request.nextUrl.searchParams.get('token'))
    if (!token) return NextResponse.json({ sessions: [] })
    const { data, error } = await supabaseServer
      .from('chat_sessions')
      .select('id, started_at')
      .eq('user_token', token)
      .order('started_at', { ascending: true })
    if (error) return NextResponse.json({ sessions: [] })
    const sessions = (data || []).map((r: any) => ({ id: r.id, startTs: toStartTs(r.started_at) }))
    return NextResponse.json({ sessions })
  } catch {
    return NextResponse.json({ sessions: [] })
  }
}

// POST /api/chat-sessions  body { token, id?, startTs? }  → { session: { id, startTs } }
// Accepts a client-supplied uuid so the widget can add sessions optimistically.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const token = clean(body?.token || request.headers.get('x-user-token') || '')
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

    const startTs = Number(body?.startTs)
    const started_at = new Date(Number.isFinite(startTs) ? startTs : Date.now()).toISOString()

    const row: Record<string, any> = { user_token: token, started_at }
    const id = clean(body?.id)
    if (id && UUID_RE.test(id)) row.id = id

    const { data, error } = await supabaseServer
      .from('chat_sessions')
      .insert([row])
      .select('id, started_at')
      .single()
    if (error || !data) return NextResponse.json({ error: 'failed' }, { status: 500 })
    return NextResponse.json({ session: { id: data.id, startTs: toStartTs(data.started_at) } })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// DELETE /api/chat-sessions?id=UUID&token=XYZ  → { ok: true }
export async function DELETE(request: NextRequest) {
  try {
    const id = clean(request.nextUrl.searchParams.get('id'))
    const token = clean(request.nextUrl.searchParams.get('token'))
    if (!id || !token) return NextResponse.json({ error: 'id and token required' }, { status: 400 })
    const { error } = await supabaseServer
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('user_token', token)
    if (error) return NextResponse.json({ error: 'failed' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
