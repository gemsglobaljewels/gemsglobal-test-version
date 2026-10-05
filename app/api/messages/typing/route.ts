import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const conversationId = String(body?.conversationId || '').trim()
    const actor = String(body?.actor || 'admin')
    if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
    const until = new Date(Date.now() + 5000).toISOString()
    // best-effort update; ignore if column doesn't exist
    const fields: Record<string, any> = {}
    if (actor === 'admin') fields.admin_typing_until = until
    else fields.user_typing_until = until
    try {
      await supabaseServer.from('conversations').update(fields).eq('id', conversationId)
    } catch {}
    return NextResponse.json({ ok: true, until })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
