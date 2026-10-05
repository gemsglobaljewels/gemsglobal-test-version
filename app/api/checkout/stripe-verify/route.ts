import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripeServer'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, orderId, payment_intent, session_id } = await request.json()
    let piId = paymentIntentId || payment_intent

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    // ── 1. If we have a sessionId but no piId, retrieve it from Stripe ──
    if (!piId && session_id) {
      console.log('[Stripe Verify] Retrieving PI from Session:', session_id)
      const session = await stripe.checkout.sessions.retrieve(session_id)
      piId = session.payment_intent as string
    }

    if (!piId) {
      return NextResponse.json({ error: 'Missing paymentIntentId or sessionId' }, { status: 400 })
    }

    console.log('[Stripe Verify] Verifying payment for orderId:', orderId, '| paymentIntentId:', piId)

    // 1. Retrieve the PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(piId)
    console.log('[Stripe Verify] PaymentIntent status:', paymentIntent.status)

    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
      console.error('[Stripe Verify] Payment not successful:', paymentIntent.status)
      return NextResponse.json({ error: `Payment not successful: status is ${paymentIntent.status}` }, { status: 400 })
    }

    console.log('[Stripe Verify] Calling RPC with:', { p_order_id: orderId, p_payment_id: piId })
    // 2. Call atomic RPC to confirm order and reduce stock
    const { data: rpcResult, error: rpcError } = await supabaseServer.rpc(
      'confirm_order_and_reduce_stock',
      {
        p_order_id: orderId,
        p_payment_id: piId,
      }
    )

    if (rpcError) {
      console.error('[Stripe Verify] RPC invocation error details:', {
        orderId,
        piId,
        error: rpcError,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING',
      })
      return NextResponse.json({ 
        error: `Order confirmation failed: ${rpcError.message || 'Unknown RPC error'}`,
        details: rpcError
      }, { status: 500 })
    }

    const result = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult

    if (!result?.success) {
      console.error('[Stripe Verify] RPC returned failure for orderId:', orderId, '|', result?.message)
      return NextResponse.json({ error: result?.message || 'Order confirmation failed (RPC returned false)' }, { status: 400 })
    }

    // Explicitly set status to confirmed to ensure it doesn't stay pending
    await supabaseServer
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)

    // ── 3. Fetch order details and send confirmation email ──
    try {
      const { data: orderData, error: orderError } = await supabaseServer
        .from('orders')
        .select(`
          id,
          email,
          total_price,
          currency,
          shipping_address,
          order_items (
            quantity,
            price_at_purchase,
            metal,
            carat,
            size,
            products (name, image, images)
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError || !orderData) {
        console.error('[Stripe Verify] Could not fetch order for email:', orderError)
      } else if (orderData.email) {
        const items = ((orderData.order_items as any[]) || []).map((item: any) => ({
          name: item.products?.name || 'Jewellery Item',
          quantity: item.quantity,
          price: item.price_at_purchase,
          image: item.products?.image || (Array.isArray(item.products?.images) ? item.products.images[0] : undefined),
          metal: item.metal || null,
          carat: item.carat || null,
          size: item.size || null,
        }))

        // Use order's actual currency field - Stripe orders should be USD
        const orderCurrency = (orderData as any).currency || 'USD'
        const currency: 'INR' | 'USD' = String(orderCurrency).toUpperCase() === 'USD' ? 'USD' : 'INR'
        
        console.log('[Stripe Verify] Sending email with currency:', currency)

        await sendOrderConfirmationEmail({
          orderId: orderData.id,
          customerName: (orderData.shipping_address as any)?.name || orderData.email,
          customerEmail: orderData.email,
          paymentId: piId,
          totalAmount: Number(orderData.total_price),
          currency,
          items,
        })

        // Notify the store team of the new order (non-blocking)
        await sendAdminNewOrderEmail({
          orderId: orderData.id,
          customerName: (orderData.shipping_address as any)?.name || orderData.email,
          customerEmail: orderData.email,
          customerPhone: (orderData.shipping_address as any)?.phone,
          paymentLabel: 'Card · Stripe',
          paymentId: piId,
          totalAmount: Number(orderData.total_price),
          currency,
          items,
          shippingAddress: orderData.shipping_address,
        })
      }
    } catch (emailErr) {
      // Email failure should NOT block the success response
      console.error('[Stripe Verify] Email sending failed (non-fatal):', emailErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Order confirmed',
      orderId,
      paymentId: piId,
    })

  } catch (err: any) {
    console.error('[Stripe Verify] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
