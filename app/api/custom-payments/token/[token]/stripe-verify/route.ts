import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripeServer'
import { supabaseServer } from '@/lib/supabaseServer'
import {
  isValidToken,
  isPayable,
  normalizeCurrency,
  createOrderForCustomPayment,
} from '@/lib/customPayment'
import { sendCustomPaymentReceiptEmail, sendAdminCustomPaymentEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// ── POST: verify a Stripe Checkout session for a custom request ─────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    const { session_id } = await request.json()
    if (!session_id) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
    }

    const { data: req, error } = await supabaseServer
      .from('custom_payment_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (error || !req) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    if (req.status === 'paid') {
      return NextResponse.json({ success: true, alreadyPaid: true, paymentId: req.payment_id })
    }

    const payable = isPayable(req)
    if (!payable.ok) {
      return NextResponse.json({ error: payable.reason }, { status: 400 })
    }

    // The session must be the one we created for THIS request.
    if (req.gateway_order_id && req.gateway_order_id !== session_id) {
      return NextResponse.json({ error: 'Payment session mismatch' }, { status: 400 })
    }

    // ── Retrieve + validate the session with Stripe ──
    let session: any
    try {
      session = await stripe.checkout.sessions.retrieve(session_id)
    } catch (e: any) {
      return NextResponse.json({ error: 'Could not verify payment session' }, { status: 400 })
    }

    // Guard: session must belong to this request and be genuinely paid.
    if (session?.metadata?.customPaymentId && session.metadata.customPaymentId !== String(req.id)) {
      return NextResponse.json({ error: 'Payment session mismatch' }, { status: 400 })
    }
    if (session?.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed yet. Please try again.' }, { status: 400 })
    }
    // Amount cross-check (cents) — never trust anything but the DB amount.
    const expectedCents = Math.round(Number(req.amount) * 100)
    if (typeof session.amount_total === 'number' && session.amount_total !== expectedCents) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
    }

    const paymentId =
      (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id) ||
      session.id

    const orderId = await createOrderForCustomPayment(req, paymentId)

    const { data: rpcResult, error: rpcError } = await supabaseServer.rpc('mark_custom_payment_paid', {
      p_request_id: req.id,
      p_gateway: 'stripe',
      p_payment_id: paymentId,
      p_gateway_order_id: session.id,
      p_order_id: orderId,
    })

    if (rpcError) {
      console.error('[CustomPayment StripeVerify] RPC error:', rpcError)
      return NextResponse.json({ error: `Confirmation failed: ${rpcError.message}` }, { status: 500 })
    }
    const result = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult
    if (!result?.success) {
      return NextResponse.json({ error: result?.message || 'Confirmation failed' }, { status: 400 })
    }

    const currency = normalizeCurrency(req.currency)
    if (!result.already_paid) {
      try {
        if (req.customer_email) {
          await sendCustomPaymentReceiptEmail({
            customerName: req.customer_name,
            customerEmail: req.customer_email,
            title: req.title,
            description: req.description,
            amount: Number(req.amount),
            currency,
            paymentId,
            requestId: req.id,
            paidAt: new Date().toISOString(),
          })
        }
        await sendAdminCustomPaymentEmail({
          requestId: req.id,
          customerName: req.customer_name,
          customerEmail: req.customer_email,
          customerPhone: req.customer_phone,
          title: req.title,
          amount: Number(req.amount),
          currency,
          paymentId,
          gateway: 'Stripe',
        })
      } catch (e) {
        console.error('[CustomPayment StripeVerify] Email failed (non-fatal):', e)
      }
    }

    return NextResponse.json({ success: true, paymentId, orderId })
  } catch (err: any) {
    console.error('[CustomPayment StripeVerify] Error:', err)
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 })
  }
}
