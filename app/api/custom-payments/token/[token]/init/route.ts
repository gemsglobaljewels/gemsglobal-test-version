import { NextRequest, NextResponse } from 'next/server'
import { razorpay } from '@/lib/razorpayServer'
import { stripe } from '@/lib/stripeServer'
import { supabaseServer } from '@/lib/supabaseServer'
import { isValidToken, isPayable, normalizeCurrency, logEvent } from '@/lib/customPayment'

export const dynamic = 'force-dynamic'

function resolveOrigin(request: NextRequest): string {
  const envUrl = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL]
    .map((u) => (u || '').trim())
    .find((u) => u && !/localhost|127\.0\.0\.1|vercel\.app/.test(u))
  if (envUrl) return envUrl.replace(/\/+$/, '')
  return 'https://gemsglobaljewels.com'
}

// ── POST: begin a payment for a custom request ──────────────────────────────
// INR → creates a Razorpay order and returns its id/amount for the client popup.
// USD → creates a Stripe Checkout session and returns the redirect url.
// The amount is ALWAYS read from the DB row — the client never supplies it.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    const { data: req, error } = await supabaseServer
      .from('custom_payment_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (error || !req) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    const payable = isPayable(req)
    if (!payable.ok) {
      return NextResponse.json({ error: payable.reason }, { status: 400 })
    }

    const currency = normalizeCurrency(req.currency)
    const amount = Number(req.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    await logEvent(req.id, 'attempt', { gateway: currency === 'USD' ? 'stripe' : 'razorpay' })

    // ── USD → Stripe Checkout ──
    if (currency === 'USD') {
      if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: 'Payment service (Stripe) is not configured.' }, { status: 500 })
      }
      const amountInCents = Math.round(amount * 100)
      if (amountInCents < 50) {
        return NextResponse.json({ error: 'Amount is too small for online payment. Min $0.50.' }, { status: 400 })
      }

      const origin = resolveOrigin(request)
      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: req.customer_email || undefined,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'usd',
                unit_amount: amountInCents,
                product_data: {
                  name: String(req.title || 'Custom Payment'),
                  ...(req.description ? { description: String(req.description).slice(0, 500) } : {}),
                },
              },
            },
          ],
          metadata: {
            customPaymentId: String(req.id),
            token: String(req.token),
          },
          success_url: `${origin}/custom-payment/${token}?status=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/custom-payment/${token}?status=cancelled`,
        })

        // Store the session id so verify can cross-check.
        await supabaseServer
          .from('custom_payment_requests')
          .update({ gateway: 'stripe', gateway_order_id: session.id })
          .eq('id', req.id)

        return NextResponse.json({
          gateway: 'stripe',
          url: session.url,
          sessionId: session.id,
        })
      } catch (e: any) {
        console.error('[CustomPayment Init] Stripe error:', e)
        return NextResponse.json({ error: `Stripe Error: ${e?.message || 'Failed to start payment'}` }, { status: 500 })
      }
    }

    // ── INR → Razorpay order ──
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payment service is not configured. Please contact support.' }, { status: 500 })
    }
    const amountInPaise = Math.round(amount * 100)
    if (amountInPaise < 100) {
      return NextResponse.json({ error: 'Amount is too small for online payment. Min ₹1.' }, { status: 400 })
    }

    try {
      const rzOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `cpr_${String(req.id).slice(0, 30)}`,
        notes: { customPaymentId: String(req.id), token: String(req.token) },
      })

      await supabaseServer
        .from('custom_payment_requests')
        .update({ gateway: 'razorpay', gateway_order_id: rzOrder.id })
        .eq('id', req.id)

      return NextResponse.json({
        gateway: 'razorpay',
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        orderId: rzOrder.id,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        name: req.customer_name,
        email: req.customer_email,
        phone: req.customer_phone,
        title: req.title,
      })
    } catch (e: any) {
      console.error('[CustomPayment Init] Razorpay error:', e?.error || e?.message || e)
      const msg = e?.error?.description || e?.message || 'Payment service error'
      return NextResponse.json({ error: `${msg}. Please try again.` }, { status: 502 })
    }
  } catch (err: any) {
    console.error('[CustomPayment Init] Error:', err)
    return NextResponse.json({ error: 'Failed to start payment' }, { status: 500 })
  }
}
