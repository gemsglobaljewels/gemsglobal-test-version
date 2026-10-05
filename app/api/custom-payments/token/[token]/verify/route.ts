import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabaseServer'
import {
  isValidToken,
  isPayable,
  normalizeCurrency,
  createOrderForCustomPayment,
} from '@/lib/customPayment'
import { sendCustomPaymentReceiptEmail, sendAdminCustomPaymentEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// ── POST: verify a Razorpay payment for a custom request ────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 })
    }

    const { data: req, error } = await supabaseServer
      .from('custom_payment_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (error || !req) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    // Already paid → idempotent success (handles double-submits / refresh).
    if (req.status === 'paid') {
      return NextResponse.json({ success: true, alreadyPaid: true, paymentId: req.payment_id })
    }

    const payable = isPayable(req)
    if (!payable.ok) {
      return NextResponse.json({ error: payable.reason }, { status: 400 })
    }

    // The Razorpay order id must match the one we created for THIS request.
    if (req.gateway_order_id && req.gateway_order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Payment order mismatch' }, { status: 400 })
    }

    // ── Verify HMAC signature ──
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 500 })
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      await supabaseServer.rpc('mark_custom_payment_failed', {
        p_request_id: req.id,
        p_reason: 'Invalid Razorpay signature',
      })
      return NextResponse.json({ error: 'Payment verification failed. Invalid signature.' }, { status: 400 })
    }

    // ── Create the matching order, then atomically mark paid ──
    const orderId = await createOrderForCustomPayment(req, razorpay_payment_id)

    const { data: rpcResult, error: rpcError } = await supabaseServer.rpc('mark_custom_payment_paid', {
      p_request_id: req.id,
      p_gateway: 'razorpay',
      p_payment_id: razorpay_payment_id,
      p_gateway_order_id: razorpay_order_id,
      p_order_id: orderId,
    })

    if (rpcError) {
      console.error('[CustomPayment Verify] RPC error:', rpcError)
      return NextResponse.json({ error: `Confirmation failed: ${rpcError.message}` }, { status: 500 })
    }
    const result = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult
    if (!result?.success) {
      return NextResponse.json({ error: result?.message || 'Confirmation failed' }, { status: 400 })
    }

    // ── Emails (non-blocking) ──
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
            paymentId: razorpay_payment_id,
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
          paymentId: razorpay_payment_id,
          gateway: 'Razorpay',
        })
      } catch (e) {
        console.error('[CustomPayment Verify] Email failed (non-fatal):', e)
      }
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId,
    })
  } catch (err: any) {
    console.error('[CustomPayment Verify] Error:', err)
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 })
  }
}
