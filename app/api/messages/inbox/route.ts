import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') || 50)
    // Fetch conversations and last message via two queries for portability
    const { data: convs } = await supabaseServer
      .from('conversations')
      .select('id, user_name, user_email, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    const ids = (convs || []).map((c: any) => c.id)
    let lastByConv: Record<string, any> = {}
    let unreadByConv: Record<string, number> = {}
    if (ids.length > 0) {
      const { data: lastMsgs } = await supabaseServer
        .from('messages')
        .select('id, conversation_id, sender, content, created_at')
        .in('conversation_id', ids)
        .order('created_at', { ascending: false })
      for (const m of lastMsgs || []) {
        const cid = m.conversation_id
        if (!lastByConv[cid]) lastByConv[cid] = m
      }
      try {
        const { data: unreadRows } = await supabaseServer
          .from('messages')
          .select('conversation_id, count:id', { count: 'exact', head: false })
          .in('conversation_id', ids)
          .eq('sender', 'user')
          .is('read_at', null)
        for (const r of unreadRows || []) unreadByConv[r.conversation_id] = Number(r.count || 0)
      } catch { }
    }
    // Group by user_email (or fallback to id) to avoid duplicate lines for same user across devices/domains
    const groups: Record<string, { id: string; user_name?: string; user_email?: string; last_message: any; unread_count: number }> = {}
    for (const c of convs || []) {
      const key = c.user_email || c.id
      const lm = lastByConv[c.id] || null
      if (!groups[key]) {
        groups[key] = { id: c.id, user_name: c.user_name, user_email: c.user_email, last_message: lm, unread_count: unreadByConv[c.id] || 0 }
      } else {
        // choose latest last_message across convs with same email
        const cur = groups[key].last_message
        if (!cur || (lm && new Date(lm.created_at).getTime() > new Date(cur.created_at).getTime())) {
          groups[key].last_message = lm
          groups[key].id = c.id
          groups[key].user_name = c.user_name
        }
        groups[key].unread_count += unreadByConv[c.id] || 0
      }
    }
    const rows = Object.values(groups).sort((a, b) => {
      const ta = a.last_message ? new Date(a.last_message.created_at).getTime() : 0
      const tb = b.last_message ? new Date(b.last_message.created_at).getTime() : 0
      return tb - ta
    })
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
