import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripeServer'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch (e) {
    console.error('[Stripe Webhook] Failed to read raw body', e)
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    console.error('[Stripe Webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: any
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err?.message || err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const eventId = event?.id
  const eventType = event?.type
  console.log('[Stripe Webhook] Received:', eventType, '| id:', eventId)

  // Best-effort idempotency. If table doesn't exist, RPC idempotency still protects stock reduction.
  if (eventId) {
    try {
      const { error } = await supabaseServer
        .from('stripe_webhook_events')
        .insert({ id: eventId, type: eventType, created_at: new Date().toISOString() } as any)
      if (error) {
        // If duplicate key, Supabase returns error; treat as already processed.
        if (String(error.message || '').toLowerCase().includes('duplicate')) {
          console.log('[Stripe Webhook] Duplicate event, skipping:', eventId)
          return NextResponse.json({ received: true, skipped: true })
        }
        // If table not created yet, keep processing (RPC is idempotent).
        if (!String(error.message || '').toLowerCase().includes('stripe_webhook_events')) {
          console.warn('[Stripe Webhook] Event log insert failed (continuing):', error.message)
        }
      }
    } catch (e) {
      console.warn('[Stripe Webhook] Event log insert error (continuing):', e)
    }
  }

  try {
    if (eventType === 'checkout.session.completed') {
      const session = event.data.object as any
      const orderId = session?.metadata?.orderId
      const paymentIntentId = session?.payment_intent

      if (!orderId) {
        console.error('[Stripe Webhook] Missing metadata.orderId on session', session?.id)
        return NextResponse.json({ received: true })
      }

      console.log('[Stripe Webhook] Updating order status to confirmed from session:', {
        orderId,
        sessionId: session?.id,
        paymentIntentId,
      })

      // Update order status to 'confirmed' which triggers inventory update via Orders API
      const { error: updateError } = await supabaseServer
        .from('orders')
        .update({
          status: 'confirmed',  // This triggers inventory deduction in Orders API
          payment_id: String(paymentIntentId || session?.id || ''),
          payment_method: 'stripe',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
      
      if (updateError) {
        console.error('[Stripe Webhook] Order status update error:', updateError)
        await supabaseServer
          .from('orders')
          .update({
            status: 'failed',
            notes: `Stripe payment succeeded but order confirmation failed: ${updateError.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      console.log('[Stripe Webhook] Order confirmed — orderId:', orderId)

      return NextResponse.json({ received: true })
    }

    if (eventType === 'payment_intent.succeeded') {
      const pi = event.data.object as any
      const orderId = pi?.metadata?.orderId
      if (!orderId) return NextResponse.json({ received: true })

      console.log('[Stripe Webhook] Updating order status to confirmed from payment_intent:', {
        orderId,
        paymentIntentId: pi?.id,
      })

      // Update order status to 'confirmed' which triggers inventory update via Orders API
      const { error: updateError } = await supabaseServer
        .from('orders')
        .update({
          status: 'confirmed',  // This triggers inventory deduction in Orders API
          payment_id: String(pi?.id || ''),
          payment_method: 'stripe',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
      
      if (updateError) {
        console.error('[Stripe Webhook] Order status update error:', updateError)
        await supabaseServer
          .from('orders')
          .update({
            status: 'failed',
            notes: `Stripe payment succeeded but order confirmation failed: ${updateError.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      console.log('[Stripe Webhook] Order confirmed — orderId:', orderId)

      return NextResponse.json({ received: true })
    }

    if (eventType === 'payment_intent.payment_failed') {
      const pi = event.data.object as any
      const orderId = pi?.metadata?.orderId
      if (orderId) {
        await supabaseServer
          .from('orders')
          .update({
            status: 'payment_failed',
            payment_id: pi?.id,
            notes: pi?.last_payment_error?.message || 'Stripe payment failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .in('status', ['pending'])
      }
      return NextResponse.json({ received: true })
    }

    // User abandoned the Stripe checkout page (closed tab / never completed).
    // Sessions expire after 24h — mark the still-pending order as payment_failed,
    // same as the Razorpay dismiss flow.
    if (eventType === 'checkout.session.expired') {
      const session = event.data.object as any
      const orderId = session?.metadata?.orderId
      if (orderId) {
        await supabaseServer
          .from('orders')
          .update({
            status: 'payment_failed',
            notes: 'Stripe checkout session expired without payment',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .in('status', ['pending'])
        console.log('[Stripe Webhook] Expired session — order marked payment_failed:', orderId)
      }
      return NextResponse.json({ received: true })
    }

    // Unhandled event types are acknowledged to avoid Stripe retries
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Stripe Webhook] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Webhook handler failed' }, { status: 500 })
  }
}

