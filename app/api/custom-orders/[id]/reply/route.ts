import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isUuid, shapeForAdmin, ADMIN_COLUMNS, furthestStatus, canonicalStatus } from '@/lib/customOrder'
import { sendCustomOrderReplyEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

// ── POST: admin replies to a custom order → save + email the customer ───────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const message = String(body?.message || '').trim()
    if (!message) {
      return NextResponse.json({ error: 'Reply message cannot be empty' }, { status: 400 })
    }

    const { data: order, error } = await supabaseServer
      .from('custom_orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!order) return NextResponse.json({ error: 'Custom order not found' }, { status: 404 })

    const toEmail = String(order.customer_email || '').trim()
    if (!toEmail) {
      return NextResponse.json({ error: 'No customer email on file to reply to' }, { status: 400 })
    }

    const sent = await sendCustomOrderReplyEmail({
      requestId: order.id,
      customerName: order.customer_name,
      customerEmail: toEmail,
      title: order.title,
      message,
      description: order.description,
    })

    if (!sent) {
      return NextResponse.json(
        { error: 'Email could not be sent. Check SMTP configuration.' },
        { status: 502 }
      )
    }

    // Forward-only: replying nudges a brand-new request to "Replied", but if the
    // request has already advanced further (Process, Payment Done, …) it must
    // stay there — a reply never drags the status backwards.
    const current = canonicalStatus(order.status)
    const nextStatus = furthestStatus(current, 'replied')

    const { data: updated, error: updErr } = await supabaseServer
      .from('custom_orders')
      .update({
        admin_reply: message,
        replied_at: new Date().toISOString(),
        status: nextStatus,
      })
      .eq('id', id)
      .select(ADMIN_COLUMNS)
      .maybeSingle()

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, sentTo: toEmail, order: updated ? shapeForAdmin(updated) : null })
  } catch {
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
  }
}
