import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

function clean(s: any) {
  return typeof s === 'string' ? s.trim() : ''
}

export async function GET(request: NextRequest) {
  try {
    const token = clean(request.nextUrl.searchParams.get('token'))
    const email = clean(request.nextUrl.searchParams.get('email'))
    const limit = Number(request.nextUrl.searchParams.get('limit') || 100)
    if (!token && !email) return NextResponse.json({ conversation: null, messages: [] })
    let conv: any = null
    if (email) {
      const r = await supabaseServer
        .from('conversations')
        .select('id, user_name, user_email, created_at, admin_typing_until')
        .eq('user_email', email)
        .maybeSingle()
      conv = r.data
    }
    if (!conv && token) {
      const r2 = await supabaseServer
        .from('conversations')
        .select('id, user_name, user_email, created_at, admin_typing_until')
        .eq('user_token', token)
        .maybeSingle()
      conv = r2.data
    }
    if (!conv) return NextResponse.json({ conversation: null, messages: [] })
    const { data: msgs } = await supabaseServer
      .from('messages')
      .select('id, sender, content, file_url, file_name, content_type, created_at, read_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
      .limit(limit)
    return NextResponse.json({ conversation: conv, messages: msgs || [] })
  } catch (e: any) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = clean(request.headers.get('x-user-token') || '')
    const body = await request.json().catch(() => ({}))
    const name = clean(body?.name || '')
    const email = clean(body?.email || '')
    const content = clean(body?.content || '')
    const fileUrl: string | null = body?.fileUrl ? String(body.fileUrl) : null
    const fileName: string | null = body?.fileName ? String(body.fileName) : null
    const contentType: string | null = body?.contentType ? String(body.contentType) : null
    if (!content && !fileUrl) return NextResponse.json({ error: 'content or file required' }, { status: 400 })

    let conversationId: string | null = null
    if (email) {
      const { data: byEmail } = await supabaseServer
        .from('conversations')
        .select('id')
        .eq('user_email', email)
        .maybeSingle()
      if (byEmail?.id) conversationId = byEmail.id
    }
    if (!conversationId && token) {
      const { data: byToken } = await supabaseServer
        .from('conversations')
        .select('id')
        .eq('user_token', token)
        .maybeSingle()
      if (byToken?.id) conversationId = byToken.id
    }
    if (!conversationId) {
      const { data: created } = await supabaseServer
        .from('conversations')
        .insert([{ user_token: token || crypto.randomUUID(), user_name: name || null, user_email: email || null }])
        .select('id, user_token')
        .single()
      conversationId = created?.id || null
    }
    if (!conversationId) return NextResponse.json({ error: 'failed to create conversation' }, { status: 500 })

    const { data: msg } = await supabaseServer
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender: 'user',
        content: content || null,
        file_url: fileUrl,
        file_name: fileName,
        content_type: contentType,
      }])
      .select('id, sender, content, file_url, file_name, content_type, created_at, read_at')
      .single()
    return NextResponse.json({ ok: true, conversationId, message: msg })
  } catch (e: any) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
