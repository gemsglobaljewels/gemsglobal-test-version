import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendOrderStatusEmail, OrderStatus } from '@/lib/email'
import { getAuthUser, isAdminUser, unauthorized, forbidden } from '@/lib/apiAuth'

/** True when the order belongs to the caller (by user_id or verified email). */
function ownsOrder(order: { user_id?: string | null; email?: string | null }, caller: { id: string; email?: string | null }): boolean {
  if (order.user_id && order.user_id === caller.id) return true
  const callerEmail = (caller.email || '').trim().toLowerCase()
  const orderEmail = (order.email || '').trim().toLowerCase()
  return !!callerEmail && callerEmail === orderEmail
}

/** Statuses a customer may self-cancel from — anything before dispatch.
 *  From 'shipped' onwards cancellation is blocked; the return flow takes over
 *  after delivery. */
const USER_CANCELLABLE = ['pending', 'confirmed', 'processing']
/** Statuses a customer may request a return from. */
const USER_RETURNABLE = ['delivered']
/** Statuses a customer may remove from their ledger (money already settled/void). */
const USER_REMOVABLE = ['cancelled', 'canceled', 'refunded', 'returned']

/** Column missing = migration 109 not applied yet — retry without it. */
function isMissingColumnError(error: any): boolean {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  const code = String(error.code || '')
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    (msg.includes('column') && (msg.includes('does not exist') || msg.includes('not found'))) ||
    msg.includes('could not find')
  )
}

const ORDER_COLUMNS = 'id, email, status, subtotal, tax, shipping_cost, total_price, currency, created_at, payment_method, payment_id, notes, tracking_number, shipping_address, billing_address'

// NOTE: GET is intentionally reachable without auth because the post-checkout
// confirmation page (including GUEST checkout) loads the order by its id right
// after payment. The order id is an unguessable random UUID, which is the
// access secret. Residual risk: anyone who obtains an order UUID can read that
// order. Recommended hardening: issue a short-lived signed order-access token
// at checkout and require it here. Writes below are strictly admin-only.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let { data, error } = await supabaseServer
    .from('orders')
    .select(`${ORDER_COLUMNS}, cancellation_reason, return_reason`)
    .eq('id', id)
    .single()
  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabaseServer
      .from('orders')
      .select(ORDER_COLUMNS)
      .eq('id', id)
      .single())
  }

  if (error) {
    console.error('[Orders API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Fetch order items with product details
  const { data: items, error: itemsError } = await supabaseServer
    .from('order_items')
    .select(`
      id,
      product_id,
      quantity,
      price_at_purchase,
      metal,
      carat,
      size,
      products (
        name,
        image,
        images
      )
    `)
    .eq('order_id', id)

  if (itemsError) {
    console.error('[Orders API] Items error:', itemsError)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({
    id: data.id,
    customerName: data.email,
    email: data.email,
    status: data.status,
    subtotal: Number(data.subtotal || 0),
    tax: Number(data.tax || 0),
    shipping: Number(data.shipping_cost || 0),
    total: Number(data.total_price),
    currency: data.currency || 'INR',
    createdAt: data.created_at,
    paymentMethod: data.payment_method || '—',
    paymentId: (data as any).payment_id || null,
    notes: data.notes,
    trackingNumber: (data as any).tracking_number || '',
    cancellationReason: (data as any).cancellation_reason || '',
    returnReason: (data as any).return_reason || '',
    shippingAddress: data.shipping_address,
    billingAddress: data.billing_address,
    items: (items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      name: item.products?.name || 'Product',
      image: item.products?.image || (Array.isArray(item.products?.images) ? item.products.images[0] : null),
      quantity: item.quantity,
      price: Number(item.price_at_purchase),
      metal: item.metal || null,
      carat: item.carat || null,
      size: item.size || null,
    })),
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admins may edit anything; a signed-in customer may only CANCEL their own
    // order (checked against the verified JWT identity, below).
    const caller = await getAuthUser(request)
    if (!caller) return unauthorized()
    const callerIsAdmin = await isAdminUser(caller.id)

    const { id } = await params
    const body = await request.json()
    const updates: any = {}

    if (body.status !== undefined && body.status !== null) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.shippingAddress) updates.shipping_address = body.shippingAddress
    if (body.billingAddress) updates.billing_address = body.billingAddress
    if (body.trackingNumber !== undefined) updates.tracking_number = body.trackingNumber

    // Reason the customer gives when cancelling — stored so admins can see it.
    const cancellationReason = typeof body.cancellationReason === 'string'
      ? body.cancellationReason.trim().slice(0, 500)
      : ''
    if (body.status === 'cancelled' && cancellationReason) {
      updates.cancellation_reason = cancellationReason
    }

    // Reason the customer gives when requesting a return — also admin-visible.
    const returnReason = typeof body.returnReason === 'string'
      ? body.returnReason.trim().slice(0, 500)
      : ''
    if (body.status === 'return_requested' && returnReason) {
      updates.return_reason = returnReason
    }

    console.log('[Orders API] PUT updating order:', id, 'with:', updates)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Fetch full order details for email notification and inventory logic
    const { data: orderDetails, error: fetchErr } = await supabaseServer
      .from('orders')
      .select('*, order_items(*, products(name, image, images))')
      .eq('id', id)
      .single()

    if (fetchErr || !orderDetails) {
      console.error('[Orders API] Fetch order error:', fetchErr)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ─── NON-ADMIN: owner-only; may cancel (pre-dispatch) or request a
    //     return (post-delivery). Both require a reason. ───
    if (!callerIsAdmin) {
      if (!ownsOrder(orderDetails, caller)) return forbidden()

      const isCancel = updates.status === 'cancelled'
        && Object.keys(updates).every(k => ['status', 'cancellation_reason'].includes(k))
      const isReturn = updates.status === 'return_requested'
        && Object.keys(updates).every(k => ['status', 'return_reason'].includes(k))
      if (!isCancel && !isReturn) {
        return forbidden('Only order cancellation or a return request is allowed')
      }

      if (isCancel) {
        if (!cancellationReason) {
          return NextResponse.json({ error: 'Please tell us why you are cancelling this order.' }, { status: 400 })
        }
        if (!USER_CANCELLABLE.includes(orderDetails.status)) {
          // Once dispatched, cancellation is off the table — point to returns.
          const msg = ['shipped', 'delivered'].includes(orderDetails.status)
            ? `This order has already been ${orderDetails.status} and can no longer be cancelled. If you are not happy with it after delivery, you can request a return instead.`
            : `A ${orderDetails.status} order can no longer be cancelled. Please contact us for assistance.`
          return NextResponse.json({ error: msg }, { status: 400 })
        }
      }

      if (isReturn) {
        if (!returnReason) {
          return NextResponse.json({ error: 'Please tell us why you are returning this order.' }, { status: 400 })
        }
        if (!USER_RETURNABLE.includes(orderDetails.status)) {
          return NextResponse.json({
            error: 'Returns can only be requested once an order has been delivered.'
          }, { status: 400 })
        }
      }
    }

    // ─── STATUS TRANSITION VALIDATION ───
    if (updates.status) {
      const oldStatus = orderDetails.status
      const newStatus = updates.status

      const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
      const oldIdx = statusOrder.indexOf(oldStatus)
      const newIdx = statusOrder.indexOf(newStatus)

      // If both statuses are in our primary flow, prevent going backwards
      if (oldIdx !== -1 && newIdx !== -1 && newIdx < oldIdx) {
        return NextResponse.json({
          error: `Cannot revert status from ${oldStatus} to ${newStatus}`
        }, { status: 400 })
      }

      // If order is already delivered, cancelled, or refunded, prevent most changes
      if (['delivered', 'cancelled', 'refunded', 'returned'].includes(oldStatus) && newStatus !== oldStatus) {
        // Exceptions: delivered → refunded / return_requested (return flow starts);
        // returned → refunded (completed return concludes with a refund)
        const allowed =
          (oldStatus === 'delivered' && ['refunded', 'return_requested'].includes(newStatus)) ||
          (oldStatus === 'returned' && newStatus === 'refunded')
        if (!allowed) {
          return NextResponse.json({
            error: `Order is already ${oldStatus} and cannot be changed to ${newStatus}`
          }, { status: 400 })
        }
      }

      // A pending return may only conclude: returned, refunded, or back to delivered (rejected).
      if (oldStatus === 'return_requested' && !['return_requested', 'returned', 'refunded', 'delivered'].includes(newStatus)) {
        return NextResponse.json({
          error: `A return request can only be marked returned, refunded, or reverted to delivered`
        }, { status: 400 })
      }
    }

    // =========================================================================
    // COMPREHENSIVE INVENTORY CONTROL SYSTEM
    // =========================================================================
    if (updates.status) {
      const oldStatus = orderDetails.status
      const newStatus = updates.status

      console.log(`[Orders API] Status change detected: ${oldStatus} → ${newStatus}`)

      // Call the atomic inventory control function
      const { data: invResult, error: invError } = await supabaseServer.rpc(
        'update_inventory_on_status_change',
        {
          p_order_id: id,
          p_old_status: oldStatus,
          p_new_status: newStatus
        }
      )

      if (invError) {
        console.error('[Orders API] Inventory RPC error:', invError)
      } else {
        console.log('[Orders API] Inventory update result:', invResult)
      }
    }
    // =========================================================================

    let { data, error } = await supabaseServer
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select('id, email, status, total_price, created_at, notes, shipping_address, billing_address, currency')
      .single()
    if (error && isMissingColumnError(error) && ('cancellation_reason' in updates || 'return_reason' in updates)) {
      // Migrations 109/110 not applied — save the status change without the
      // reason column rather than blocking the customer.
      const { cancellation_reason, return_reason, ...rest } = updates
        ; ({ data, error } = await supabaseServer
          .from('orders')
          .update(rest)
          .eq('id', id)
          .select('id, email, status, total_price, created_at, notes, shipping_address, billing_address, currency')
          .single())
    }

    if (error) {
      console.error('[Orders API] PUT error:', error)
      return NextResponse.json({ error: error.message || 'Database update failed' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ─── SEND EMAIL NOTIFICATION ───
    if (updates.status && ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'canceled', 'refunded', 'return_requested', 'returned'].includes(updates.status)) {
      try {
        console.log(`[Orders API] Triggering email for status: ${updates.status} to: ${data.email}`)
        console.log(`[Orders API] SMTP check — SMTP_USER: ${process.env.SMTP_USER ? 'SET' : 'MISSING'}, SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'SET' : 'MISSING'}`)

        const items = (orderDetails.order_items || []).map((item: any) => ({
          name: item.products?.name || 'Product',
          quantity: item.quantity,
          price: Number(item.price_at_purchase),
          image: item.products?.image || (Array.isArray(item.products?.images) ? item.products.images[0] : undefined),
          metal: item.metal || null,
          carat: item.carat || null,
          size: item.size || null,
        }))

        const trackingNum = updates.tracking_number || orderDetails.tracking_number || ''

        // Normalize currency — DB may return 'inr', 'usd', null etc.
        const rawCurrency = (data.currency || 'INR').toString().toUpperCase()
        const currency: 'INR' | 'USD' = rawCurrency === 'USD' ? 'USD' : 'INR'

        const emailResult = await sendOrderStatusEmail({
          orderId: data.id,
          customerName: (data.shipping_address as any)?.name || data.email,
          customerEmail: data.email,
          status: updates.status as OrderStatus,
          totalAmount: Number(data.total_price),
          currency,
          items,
          trackingNumber: trackingNum,
          trackingLink: trackingNum ? `https://www.delhivery.com/track/package/${trackingNum}` : '',
          notes: data.notes || orderDetails.notes || '',
        })

        console.log(`[Orders API] Email send result: ${emailResult}`)
      } catch (emailErr) {
        console.error('[Orders API] CRITICAL: Failed to send status email:', emailErr)
      }
    }

    return NextResponse.json({
      id: data.id,
      customerName: data.email,
      status: data.status,
      total: Number(data.total_price),
      createdAt: data.created_at,
      notes: data.notes,
      shippingAddress: data.shipping_address,
      billingAddress: data.billing_address,
    })
  } catch (error: any) {
    console.error('[Orders API] PUT catch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admins may delete any order. A signed-in customer may remove their OWN
    // order from their ledger, but only once it is cancelled or refunded —
    // live orders must go through cancellation first.
    const caller = await getAuthUser(request)
    if (!caller) return unauthorized()
    const callerIsAdmin = await isAdminUser(caller.id)

    const { id } = await params

    if (!callerIsAdmin) {
      const { data: order, error: fetchErr } = await supabaseServer
        .from('orders')
        .select('id, user_id, email, status')
        .eq('id', id)
        .single()
      if (fetchErr || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      if (!ownsOrder(order, caller)) return forbidden()
      if (!USER_REMOVABLE.includes(order.status)) {
        return NextResponse.json({
          error: 'Only cancelled or refunded orders can be removed. Cancel the order first.'
        }, { status: 400 })
      }
    }

    const { error } = await supabaseServer.from('orders').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
