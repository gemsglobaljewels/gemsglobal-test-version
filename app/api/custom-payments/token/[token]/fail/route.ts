import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isValidToken } from '@/lib/customPayment'

export const dynamic = 'force-dynamic'

// ── POST: record a failed / dismissed payment attempt (keeps link retryable) ─
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const reason = String(body?.reason || 'Payment failed or dismissed').slice(0, 300)

    const { data: req } = await supabaseServer
      .from('custom_payment_requests')
      .select('id, status')
      .eq('token', token)
      .maybeSingle()

    if (!req) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }
    // Never override a completed payment.
    if (req.status === 'paid') {
      return NextResponse.json({ ok: true, alreadyPaid: true })
    }

    await supabaseServer.rpc('mark_custom_payment_failed', {
      p_request_id: req.id,
      p_reason: reason,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 })
  }
}
