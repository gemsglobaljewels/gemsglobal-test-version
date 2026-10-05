import { NextRequest, NextResponse } from 'next/server'
import { razorpay } from '@/lib/razorpayServer'
import { stripe } from '@/lib/stripeServer'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      email,
      deliveryMethod = 'home_delivery',
      userId = null,
      paymentMethod = 'online', // 'online' | 'cod' | 'upi'
      currency = 'INR', // Default to INR
    } = await request.json()

    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    console.log('[Checkout] Starting checkout:', { itemCount: items.length, paymentMethod, email, userId })

    // COD is temporarily disabled — only online payments (Razorpay/Stripe) are accepted
    if (paymentMethod === 'cod') {
      return NextResponse.json(
        { error: 'Cash on Delivery is currently unavailable. Please pay online.' },
        { status: 400 }
      )
    }

    // 0. VALIDATE STOCK FOR ALL ITEMS BEFORE PROCEEDING
    console.log('[Checkout] Validating stock for all items...')
    const stockValidationResults = []
    for (const item of items) {
      const productId = item.productId || item.id
      const requestedQty = Number(item.quantity || 1)

      const { data: product, error: productError } = await supabaseServer
        .from('products')
        .select('id, name, stock_quantity')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return NextResponse.json(
          { error: "Product is out of stock" },
          { status: 404 }
        )
      }

      const availableStock = Number(product.stock_quantity ?? 0)

      if (availableStock === 0) {
        return NextResponse.json(
          {
            error: "Product is out of stock",
            message: `${product.name} is currently unavailable. Please remove it from your cart and try again.`,
            outOfStockProductId: productId,
            outOfStockProductName: product.name
          },
          { status: 400 }
        )
      }

      if (requestedQty > availableStock) {
        return NextResponse.json(
          {
            error: 'Insufficient Stock',
            message: `Only ${availableStock} piece${availableStock === 1 ? '' : 's'} of ${product.name} available in stock.`,
            insufficientStockProductId: productId,
            insufficientStockProductName: product.name,
            availableStock,
            requestedQty
          },
          { status: 400 }
        )
      }

      stockValidationResults.push({
        productId,
        productName: product.name,
        requested: requestedQty,
        available: availableStock,
        valid: true
      })
    }
    console.log('[Checkout] Stock validation passed:', stockValidationResults)

    // 1. Fetch live exchange rate (fallback to 83)
    let usdToInr = 83
    try {
      const rateRes = await fetch(`${new URL(request.url).origin}/api/exchange-rate`, { cache: 'no-store' })
      const rateData = await rateRes.json()
      if (rateData?.rate) usdToInr = Number(rateData.rate)
    } catch { console.error('[Checkout] Rate fetch failed') }

    // 2. Calculate Totals
    let subtotalUsd = 0
    let subtotalInr = 0

    items.forEach((item: any) => {
      const itemPriceUsd = Number(item.price)
      const itemQty = Number(item.quantity || 1)
      subtotalUsd += itemPriceUsd * itemQty
      subtotalInr += Math.round(itemPriceUsd * usdToInr) * itemQty
    })

    const taxUsd = subtotalUsd * 0.08
    const taxInr = Math.round(subtotalInr * 0.08)

    const shippingUsd = deliveryMethod === 'express' ? 15 : 0
    const shippingInr = deliveryMethod === 'express' ? Math.round(15 * usdToInr) : 0

    const totalUsd = subtotalUsd + taxUsd + shippingUsd
    const totalInr = subtotalInr + taxInr + shippingInr

    // For database storage, use the selected currency's amount
    const isUsd = String(currency).toUpperCase() === 'USD'
    const isInr = String(currency).toUpperCase() === 'INR'

    const dbSubtotal = isUsd ? Math.round(subtotalUsd * 100) / 100 : subtotalInr
    const dbTax = isUsd ? Math.round(taxUsd * 100) / 100 : taxInr
    const dbShipping = isUsd ? shippingUsd : shippingInr
    const dbTotal = isUsd ? Math.round(totalUsd * 100) / 100 : totalInr

    console.log(`[Checkout] Routing: Currency=${currency} | isUsd=${isUsd} | isInr=${isInr}`)

    // 2. Save Pending Order in Supabase
    const normalizedPaymentMethod =
      paymentMethod === 'cod'
        ? 'cod'
        : isUsd
          ? 'stripe'
          : 'razorpay'

    const orderInsert: any = {
      // Stored lowercased so the account orders API's email fallback match
      // (which compares against the lowercased JWT email) always hits.
      email: String(email).trim().toLowerCase(),
      status: 'pending', // Confirmed only after successful payment verification (Razorpay/Stripe verify routes)
      subtotal: dbSubtotal,
      tax: dbTax,
      shipping_cost: dbShipping,
      total_price: dbTotal,
      currency: currency,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      payment_method: normalizedPaymentMethod,
    }

    // Only set user_id if it's a valid value (Supabase UUID columns reject invalid nulls)
    // Validate userId before setting it
    if (userId) {
      const { data: user, error: userError } = await supabaseServer
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        // The profile insert at sign-up is best-effort, so a real auth user can
        // be missing from 'users' (which the orders FK points at). Recreate the
        // profile from the verified auth record instead of silently dropping
        // user_id — otherwise the order never appears under the account.
        orderInsert.user_id = null
        try {
          const { data: authUser } = await supabaseServer.auth.admin.getUserById(userId)
          if (authUser?.user) {
            const { error: profileError } = await supabaseServer.from('users').insert([{
              id: authUser.user.id,
              email: authUser.user.email,
              full_name: authUser.user.user_metadata?.full_name || null,
              phone: authUser.user.user_metadata?.phone || null,
            }])
            if (!profileError) {
              orderInsert.user_id = userId
            } else {
              console.warn(`[Checkout] Could not backfill users profile for ${userId}:`, profileError)
            }
          } else {
            console.warn(`[Checkout] Provided userId ${userId} is not a known auth user. Proceeding without user_id.`)
          }
        } catch (e) {
          console.warn(`[Checkout] Auth lookup failed for userId ${userId}. Proceeding without user_id.`, e)
        }
      } else {
        orderInsert.user_id = userId
      }
    }

    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .insert(orderInsert)
      .select()
      .single()

    if (orderError) {
      console.error('[Checkout] Order creation failed:', orderError)
      throw new Error(`Order creation failed: ${orderError.message}`)
    }

    console.log('[Checkout] Order created:', order.id, '| Currency:', order.currency || currency)

    // 3. Save Order Items (use same currency as the order)
    const orderItems = items.map((item: any) => {
      const itemPriceUsd = Number(item.price)
      const finalPrice = isUsd ? itemPriceUsd : Math.round(itemPriceUsd * usdToInr)

      return {
        order_id: order.id,
        product_id: item.productId || item.id,
        quantity: item.quantity,
        price_at_purchase: finalPrice,
        metal: item.metal || null,
        carat: item.carat || null,
        size: item.size || null
      }
    })

    console.log('[Checkout] Order items to save:', orderItems.map((oi: any) => ({ product_id: oi.product_id, quantity: oi.quantity })))
    console.log('[Checkout] Raw cart items keys:', items.map((item: any) => ({ id: item.id, productId: item.productId, name: item.name })))

    const { error: itemsError } = await supabaseServer.from('order_items').insert(orderItems)
    if (itemsError) {
      console.error('[Checkout] Order items saving failed:', itemsError)
      throw new Error(`Order items saving failed: ${itemsError.message}`)
    }

    console.log('[Checkout] Order items saved')

    // 4. If COD, confirm order and reduce stock immediately via atomic RPC
    if (paymentMethod === 'cod') {
      console.log('[Checkout COD] Calling confirm_order_and_reduce_stock RPC for orderId:', order.id)
      const { data: rpcResult, error: rpcError } = await supabaseServer.rpc('confirm_order_and_reduce_stock', {
        p_order_id: order.id,
        p_payment_id: 'cod'
      })

      if (rpcError) {
        console.error('[Checkout COD] RPC Error details:', {
          orderId: order.id,
          error: rpcError
        })
        return NextResponse.json({
          error: `Failed to confirm COD order: ${rpcError.message || 'Unknown error'}`
        }, { status: 500 })
      }

      const result = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult

      if (!result.success) {
        console.error('[Checkout COD] Order confirmation failed:', result.message)
        // If stock check fails, mark the order as failed with a note
        await supabaseServer.from('orders').update({
          status: 'failed',
          notes: `COD confirmation failed: ${result.message}`
        }).eq('id', order.id)
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      // Send confirmation email for COD order
      try {
        const { data: orderData } = await supabaseServer
          .from('orders')
          .select('id, email, total_price, currency, shipping_address, order_items(quantity, price_at_purchase, metal, carat, size, products(name, image, images))')
          .eq('id', order.id)
          .single()

        if (orderData?.email) {
          const codItems = ((orderData.order_items as any[]) || []).map((item: any) => ({
            name: item.products?.name || 'Jewellery Item',
            quantity: item.quantity,
            price: item.price_at_purchase,
            image: item.products?.image || (Array.isArray(item.products?.images) ? item.products.images[0] : undefined),
            metal: item.metal || null,
            carat: item.carat || null,
            size: item.size || null,
          }))

          // Use order's actual currency field
          const orderCurrency = (orderData as any).currency || 'INR'
          const currency: 'INR' | 'USD' = String(orderCurrency).toUpperCase() === 'USD' ? 'USD' : 'INR'

          console.log('[Checkout COD] Sending email with currency:', currency)

          await sendOrderConfirmationEmail({
            orderId: orderData.id,
            customerName: (orderData.shipping_address as any)?.name || orderData.email,
            customerEmail: orderData.email,
            paymentId: 'COD',
            totalAmount: Number(orderData.total_price),
            currency,
            items: codItems,
          })

          // Notify the store team of the new order (non-blocking)
          await sendAdminNewOrderEmail({
            orderId: orderData.id,
            customerName: (orderData.shipping_address as any)?.name || orderData.email,
            customerEmail: orderData.email,
            customerPhone: (orderData.shipping_address as any)?.phone,
            paymentLabel: 'Cash on Delivery',
            paymentId: 'COD',
            totalAmount: Number(orderData.total_price),
            currency,
            items: codItems,
            shippingAddress: orderData.shipping_address,
          })
        }
      } catch (emailErr) {
        console.error('[Checkout COD] Email sending failed (non-fatal):', emailErr)
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentMethod: 'cod',
      })
    }

    // 5. Handle Stripe for USD — full-screen Stripe-hosted Checkout page.
    // The client redirects to session.url; on completion Stripe returns the
    // user to /order/success (verified there and via webhook), and on cancel
    // to /checkout?cancelled=1 which marks the pending order payment_failed.
    if (isUsd) {
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('[Checkout] Stripe key not configured')
        return NextResponse.json({ error: 'Payment service (Stripe) is not configured.' }, { status: 500 })
      }

      // Fetch site settings for branding (product image fallback)
      let logoUrl = ''
      try {
        const { data: settingsData } = await supabaseServer
          .from('site_settings')
          .select('key, value')

        const settings: any = settingsData?.reduce((acc: any, item: any) => {
          acc[item.key] = item.value
          return acc
        }, {}) || {}

        if (settings.logo_url) logoUrl = settings.logo_url
      } catch (e) {
        console.error('[Checkout] Failed to fetch settings for Stripe branding:', e)
      }

      // CRITICAL: Convert exact total to cents using proper rounding
      // This ensures $90.72 becomes 9072 cents, NOT 9071 or 9073
      const amountInCents = Math.round(totalUsd * 100)

      if (amountInCents < 50) { // Stripe minimum is $0.50
        return NextResponse.json({ error: 'Order amount is too small for online payment. Min $0.50.' }, { status: 400 })
      }

      try {
        // Resolve origin, prefer env vars, never use vercel.app/localhost
        const envUrl = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL]
          .map((u) => (u || '').trim())
          .find((u) => u && !/localhost|127\.0\.0\.1|vercel\.app/.test(u))
        const origin = envUrl ? envUrl.replace(/\/+$/, '') : 'https://gemsglobaljewels.com'

        // Helper to ensure image URLs are absolute AND valid for Stripe.
        // Uses the URL constructor so spaces/unicode get percent-encoded and
        // anything unparseable is dropped instead of failing the session
        // with "Not a valid URL".
        const ensureAbsoluteUrl = (url: string) => {
          if (!url || typeof url !== 'string' || url.trim() === '') return null
          const trimmed = url.trim()
          if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return null // Stripe doesn't support these
          try {
            const parsed = trimmed.startsWith('http')
              ? new URL(trimmed)
              : new URL(trimmed.replace(/^\/+/, '/'), origin)
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
            const abs = parsed.toString()
            if (abs.length > 2048) return null // Stripe rejects overly long URLs
            return abs
          } catch {
            return null
          }
        }

        const absoluteLogo = ensureAbsoluteUrl(logoUrl)

        // Calculate line items with exact amounts
        const stripeLineItems = (items || []).map((item: any) => {
          const unitAmountCents = Math.round(Number(item.price) * 100)
          const quantity = Number(item.quantity || 1)

          // Try to use the product's actual image, fallback to site logo
          const itemImg = ensureAbsoluteUrl(item.image) || absoluteLogo
          const images = itemImg ? [itemImg] : []

          return {
            quantity: quantity,
            price_data: {
              currency: 'usd',
              unit_amount: unitAmountCents,
              product_data: {
                name: String(item.productName || item.name || 'Product'),
                images: images,
              },
            },
          }
        })

        // Add tax as a separate line item for precision
        const taxAmountCents = Math.round(taxUsd * 100)
        if (taxAmountCents > 0) {
          stripeLineItems.push({
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: taxAmountCents,
              product_data: {
                name: 'Tax (8%)',
              },
            },
          })
        }

        // Add shipping as a separate line item
        if (shippingUsd > 0) {
          const shippingAmountCents = Math.round(shippingUsd * 100)
          stripeLineItems.push({
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: shippingAmountCents,
              product_data: {
                name: deliveryMethod === 'express' ? 'Express Shipping' : 'Shipping',
              },
            },
          })
        }

        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: email,
          line_items: stripeLineItems,
          metadata: {
            orderId: String(order.id),
            email: String(email || ''),
            subtotal: String(dbSubtotal),
            tax: String(dbTax),
            shipping: String(dbShipping),
            total: String(dbTotal),
          },
          success_url: `${origin}/order/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/checkout?cancelled=1&order_id=${order.id}`,
        })

        console.log('[Stripe] Session created:', {
          sessionId: session.id,
          amountExpected: amountInCents,
          lineItemsTotal: stripeLineItems.reduce((sum: number, item: any) => sum + (item.price_data?.unit_amount || 0) * item.quantity, 0),
          totalUsd: totalUsd,
          totalRounded: dbTotal
        })

        return NextResponse.json({
          url: session.url,
          sessionId: session.id,
          amount: amountInCents,
          currency: 'USD',
          orderId: order.id,
          paymentMethod: 'stripe_checkout',
        })
      } catch (stripeError: any) {
        console.error('[Checkout] Stripe error:', stripeError)
        const errorMsg = stripeError?.message || 'Failed to initialize Stripe payment'
        return NextResponse.json({ error: `Stripe Error: ${errorMsg}` }, { status: 500 })
      }
    }

    // 6. Validate Razorpay configuration
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[Checkout] Razorpay keys not configured')
      return NextResponse.json({ error: 'Payment service is not configured. Please contact support.' }, { status: 500 })
    }

    // 7. Use the exact computed INR total for Razorpay
    const amountInPaise = Math.round(totalInr * 100) // Convert to smallest unit (paise)

    // Razorpay minimum is ₹1 (100 paise)
    if (amountInPaise < 100) {
      return NextResponse.json({ error: 'Order amount is too small for online payment. Min ₹1.' }, { status: 400 })
    }

    // 8. Create Razorpay Order (online payment)
    console.log('[Checkout] Creating Razorpay order, amount (paise):', amountInPaise, '= ₹', (amountInPaise / 100).toFixed(2))
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `r_${order.id}`.substring(0, 40),
        notes: {
          orderId: order.id,
          email: email
        }
      });
      console.log('[Checkout] Razorpay order created:', razorpayOrder.id)
    } catch (razorpayError: any) {
      console.error('[Checkout] Razorpay order creation failed:', razorpayError?.error || razorpayError?.message || razorpayError)
      const errorMsg = razorpayError?.error?.description || razorpayError?.message || 'Payment service error'
      return NextResponse.json(
        { error: `${errorMsg}. Please try again or use Cash on Delivery.` },
        { status: 502 }
      )
    }

    return NextResponse.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order.id,
      paymentMethod: 'online',
    })
  } catch (err: any) {
    console.error('[Checkout] Error:', err)
    return NextResponse.json({ error: err.message || 'Something went wrong during checkout' }, { status: 500 })
  }
}
