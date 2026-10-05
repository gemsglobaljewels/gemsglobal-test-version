import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAuthUser, isAdminUser, unauthorized, forbidden } from '@/lib/apiAuth'
import { isCustomOrderNote, customTitleFromNote } from '@/lib/customPayment'
import { UNPAID_STATUS_IN_LIST } from '@/lib/orderStatus'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const status = params.get('status')
  let userId = params.get('userId')
  let email = params.get('email')
  const limitParam = params.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined
  const includeUnpaid = params.get('includeUnpaid') === '1' || params.get('includeUnpaid') === 'true'

  // Authorization: a normal signed-in user may only read their OWN orders.
  // Admins may read all orders (and use the userId/email/status filters freely).
  const caller = await getAuthUser(request)
  if (!caller) return unauthorized()
  const callerIsAdmin = await isAdminUser(caller.id)

  let query = supabaseServer
    .from('orders')
    .select(`
      id,
      email,
      status,
      total_price,
      currency,
      created_at,
      payment_method,
      notes,
      order_items (
        id,
        quantity,
        price_at_purchase,
        product_id,
        metal,
        carat,
        size,
        products (
          name,
          image,
          images
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (status) {
    // An explicit status filter always wins — this is how an admin audits
    // abandoned attempts (e.g. ?status=payment_failed) and how any caller can
    // narrow to their own in-progress order. For a non-admin the ownership
    // filter below still applies, so they only ever see their own rows.
    query = query.eq('status', status)
  } else if (!(callerIsAdmin && includeUnpaid)) {
    // DEFAULT: an order only "exists" once paid. Hide unpaid / abandoned
    // checkouts (pending, payment_failed, failed) from every listing so an
    // add-to-cart-then-abandon flow never shows up as a placed order — on the
    // customer account, the admin dashboard revenue/counts, or the orders list.
    // Admins can opt back in with ?includeUnpaid=1 to review abandoned attempts.
    query = query.not('status', 'in', UNPAID_STATUS_IN_LIST)
  }

  if (!callerIsAdmin) {
    // A signed-in customer sees every order that belongs to them. Historically
    // many orders were created without a user_id (guest checkout, custom
    // payments), so matching on user_id alone hides them. We also match on the
    // caller's VERIFIED email (from the JWT — never a client-supplied param),
    // which safely recovers those unlinked orders.
    const callerEmail = (caller.email || '').trim().toLowerCase()
    const ors: string[] = [`user_id.eq.${caller.id}`]
    if (callerEmail) ors.push(`email.eq.${callerEmail}`)
    query = query.or(ors.join(','))
  } else {
    // Admin may narrow by the provided filters.
    if (userId) {
      query = query.eq('user_id', userId)
    } else if (email) {
      query = query.eq('email', email)
    }
  }

  if (limit && Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) {
    console.error('[API ORDERS ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }

  const shaped = (data || []).map((o: any) => ({
    id: o.id,
    customerName: o.email,
    total: Number(o.total_price),
    currency: o.currency || 'INR',
    status: o.status,
    createdAt: o.created_at,
    payment_method: o.payment_method,
    // Bespoke purchases (created from a custom payment) have no catalogue
    // line-items — flag them and expose the bespoke title for display.
    isCustom: isCustomOrderNote(o.notes),
    customTitle: customTitleFromNote(o.notes),
    items: (o.order_items || []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price_at_purchase),
      metal: item.metal || null,
      carat: item.carat || null,
      size: item.size || null,
      productName: item.products?.name || 'Product',
      image: item.products?.image || (Array.isArray(item.products?.images) ? item.products.images[0] : null)
    }))
  }))

  return NextResponse.json(shaped)
}

export async function POST(request: NextRequest) {
  try {
    // Orders for real purchases are created by the checkout/verify flow.
    // This manual creation endpoint is admin-only (e.g. offline/manual orders).
    const caller = await getAuthUser(request)
    if (!caller) return unauthorized()
    if (!(await isAdminUser(caller.id))) return forbidden('Admin access required')

    const body = await request.json()
    const {
      email,
      userId,
      status,
      subtotal,
      tax,
      shipping_cost,
      total_price,
      shipping_address,
      billing_address,
      notes,
    } = body || {}

    if (!email || !total_price || !shipping_address || !billing_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const payload = {
      email,
      user_id: userId || null,
      status: status || 'pending',
      subtotal: subtotal || 0,
      tax: tax || 0,
      shipping_cost: shipping_cost || 0,
      total_price,
      shipping_address,
      billing_address,
      notes: notes || null,
    }

    const { data, error } = await supabaseServer.from('orders').insert([payload]).select().single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      customerName: data.email,
      total: Number(data.total_price),
      status: data.status,
      createdAt: data.created_at,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
