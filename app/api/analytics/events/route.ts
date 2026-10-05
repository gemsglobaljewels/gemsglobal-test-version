import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const type = String(body?.type || '').toLowerCase()
    const path = String(body?.path || '')
    const title = String(body?.title || '')
    const target = String(body?.target || '')
    const sessionId = String(body?.sessionId || '')
    if (!type || !path) return NextResponse.json({ ok: false }, { status: 400 })
    const payload = {
      event_type: type,
      path,
      page_title: title,
      element_target: type === 'time_on_page' ? String(body?.duration || 0) : target,
      session_id: sessionId || null,
    }
    const { error } = await supabaseServer.from('analytics_events').insert([payload])
    if (error) return NextResponse.json({ ok: false }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
