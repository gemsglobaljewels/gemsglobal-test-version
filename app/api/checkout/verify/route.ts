import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await request.json()

    // ── 1. Validate presence of required fields ──
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      console.error('[Verify] Missing required fields:', {
        razorpay_order_id: !!razorpay_order_id,
        razorpay_payment_id: !!razorpay_payment_id,
        razorpay_signature: !!razorpay_signature,
        orderId: !!orderId,
      })
      return NextResponse.json({ error: 'Missing required payment verification fields' }, { status: 400 })
    }

    console.log('[Verify] Starting payment verification for orderId:', orderId, '| paymentId:', razorpay_payment_id)

    // ── 2. Verify Razorpay signature ──
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      console.error('[Verify] RAZORPAY_KEY_SECRET is not configured')
      throw new Error('Razorpay secret key not configured')
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('[Verify] Signature mismatch for orderId:', orderId, '— marking as payment_failed')
      await supabaseServer
        .from('orders')
        .update({
          status: 'payment_failed',
          notes: 'Payment verification failed: invalid signature',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'pending') // Only update if still pending
      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      )
    }

    console.log('[Verify] Signature verified. Confirming order and reducing stock via RPC for orderId:', orderId)

    // ── 3. Call atomic RPC to confirm order and reduce stock ──
    const { data: rpcResult, error: rpcError } = await supabaseServer.rpc(
      'confirm_order_and_reduce_stock',
      {
        p_order_id: orderId,
        p_payment_id: razorpay_payment_id,
      }
    )

    if (rpcError) {
      console.error('[Verify] RPC invocation error details:', {
        orderId,
        paymentId: razorpay_payment_id,
        error: rpcError
      })
      return NextResponse.json({ 
        error: `Order confirmation failed: ${rpcError.message || 'Unknown RPC error'}`,
        details: rpcError
      }, { status: 500 })
    }

    const result = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult

    if (!result?.success) {
      console.error('[Verify] RPC returned failure for orderId:', orderId, '|', result?.message)
      return NextResponse.json({ error: result?.message || 'Order confirmation failed' }, { status: 400 })
    }

    // Explicitly set status to confirmed to ensure it doesn't stay pending
    await supabaseServer
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)

    console.log('[Verify] Order confirmed and stock reduced — orderId:', orderId, '| paymentId:', razorpay_payment_id)

    // ── 4. Fetch order details and send confirmation email ──
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
        console.error('[Verify] Could not fetch order for email:', orderError)
      } else {
        const customerEmail = orderData.email || null
        const customerName =
          (orderData.shipping_address as any)?.name || orderData.email || 'Valued Customer'

        if (customerEmail) {
          const items = ((orderData.order_items as any[]) || []).map((item: any) => ({
            name: item.products?.name || 'Jewellery Item',
            quantity: item.quantity,
            price: item.price_at_purchase,
            image: item.products?.image || (Array.isArray(item.products?.images) ? item.products.images[0] : undefined),
            metal: item.metal || null,
            carat: item.carat || null,
            size: item.size || null,
          }))

          // Use order's currency field directly - ensures correct currency in email
          const orderCurrency = (orderData as any).currency || 'INR'
          const currency: 'INR' | 'USD' = String(orderCurrency).toUpperCase() === 'USD' ? 'USD' : 'INR'

          console.log('[Verify] Sending email with currency:', currency, 'for orderId:', orderId)

          await sendOrderConfirmationEmail({
            orderId: orderData.id,
            customerName,
            customerEmail,
            paymentId: razorpay_payment_id,
            totalAmount: Number((orderData as any).total_price),
            currency,
            items,
          })

          // Notify the store team of the new order (non-blocking)
          await sendAdminNewOrderEmail({
            orderId: orderData.id,
            customerName,
            customerEmail,
            customerPhone: (orderData.shipping_address as any)?.phone,
            paymentLabel: 'Razorpay',
            paymentId: razorpay_payment_id,
            totalAmount: Number((orderData as any).total_price),
            currency,
            items,
            shippingAddress: orderData.shipping_address,
          })
        } else {
          console.warn('[Verify] No customer email found for orderId:', orderId)
        }
      }
    } catch (emailErr) {
      // Email failure should NOT block the success response
      console.error('[Verify] Email sending failed (non-fatal):', emailErr)
    }

    // ── 5. Success ──
    return NextResponse.json({
      success:   true,
      message:   'Order confirmed',
      orderId,
      paymentId: razorpay_payment_id,
    })

  } catch (err: any) {
    console.error('[Verify] Unexpected error:', err)
    return NextResponse.json(
      { error: err.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}
