import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isUuid, isPayable, logEvent } from '@/lib/customPayment'
import { sendCustomPaymentLinkEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

function resolveOrigin(request: NextRequest): string {
  const envUrl = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL]
  .map((u) => (u || '').trim())
  .find((u) => u && !/localhost|127\.0\.0\.1|vercel\.app/.test(u))
  if (envUrl) return envUrl.replace(/\/+$/, '')
  return 'https://gemsglobaljewels.com'
}

// ── POST: resend the payment link email to the customer ─────────────────────
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

    const { data: req, error } = await supabaseServer
      .from('custom_payment_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!req) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })

    // Optional override recipient; default to the stored customer email.
    const body = await request.json().catch(() => ({}))
    const overrideEmail = String(body?.email || '').trim()
    const toEmail = overrideEmail || req.customer_email

    if (!toEmail) {
      return NextResponse.json({ error: 'No customer email on file to send to' }, { status: 400 })
    }
    if (overrideEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(overrideEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 })
    }

    const payable = isPayable(req)
    if (!payable.ok) {
      return NextResponse.json({ error: `Cannot resend: ${payable.reason}` }, { status: 400 })
    }

    const origin = resolveOrigin(request)
    const payUrl = `${origin}/custom-payment/${req.token}`

    const sent = await sendCustomPaymentLinkEmail({
      customerName: req.customer_name,
      customerEmail: toEmail,
      title: req.title,
      description: req.description,
      amount: Number(req.amount),
      currency: req.currency,
      payUrl,
      expiresAt: req.expires_at,
    })

    if (!sent) {
      return NextResponse.json({ error: 'Email could not be sent. Check SMTP configuration.' }, { status: 502 })
    }

    await supabaseServer
      .from('custom_payment_requests')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('id', id)
    await logEvent(id, 'link_sent', { to: toEmail, resend: true })

    return NextResponse.json({ ok: true, sentTo: toEmail })
  } catch {
    return NextResponse.json({ error: 'Failed to resend payment link' }, { status: 500 })
  }
}
