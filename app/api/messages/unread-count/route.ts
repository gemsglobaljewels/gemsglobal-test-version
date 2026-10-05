import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

/**
 * Unread badge for the admin sidebar.
 *
 * This MUST match the number shown on the Messaging inbox page
 * (app/admin/messaging/page.tsx), which counts a conversation as "unread"
 * when its most recent message was sent by the customer (i.e. it's awaiting an
 * admin reply). The inbox also groups conversations by user_email so a single
 * customer never counts twice.
 *
 * The previous implementation counted distinct conversations that merely had a
 * message with read_at IS NULL. That drifts out of sync the moment an admin
 * opens a conversation (marking it read) without replying — the message stays
 * "awaiting reply" on the page but disappears from the read_at-based count,
 * producing the classic "page says 8, sidebar says 3" mismatch. We mirror the
 * inbox logic here so the two can never disagree.
 */
export async function GET(request: NextRequest) {
  try {
    // Same default window the inbox uses, so both count over the same set.
    const limit = Number(request.nextUrl.searchParams.get('limit') || 50)

    const { data: convs } = await supabaseServer
      .from('conversations')
      .select('id, user_email, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    const ids = (convs || []).map((c: any) => c.id)
    if (ids.length === 0) return NextResponse.json({ count: 0 })

    const { data: msgs } = await supabaseServer
      .from('messages')
      .select('conversation_id, sender, created_at')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })

    // Most-recent message per conversation (msgs are already newest-first).
    const lastByConv: Record<string, any> = {}
    for (const m of msgs || []) {
      if (!lastByConv[m.conversation_id]) lastByConv[m.conversation_id] = m
    }

    // Group conversations by email (fallback to id) and keep the group's
    // single latest message — exactly how the inbox builds its rows.
    const lastByGroup: Record<string, any> = {}
    for (const c of convs || []) {
      const lm = lastByConv[c.id]
      if (!lm) continue
      const key = c.user_email || c.id
      const cur = lastByGroup[key]
      if (!cur || new Date(lm.created_at).getTime() > new Date(cur.created_at).getTime()) {
        lastByGroup[key] = lm
      }
    }

    const count = Object.values(lastByGroup).filter((m: any) => m?.sender === 'user').length
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
