import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import {
  generatePaymentToken,
  normalizeCurrency,
  shapeRequestForAdmin,
  logEvent,
} from '@/lib/customPayment'
import { sendCustomPaymentLinkEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/apiAuth'
import { isUuid, furthestStatus, canonicalStatus } from '@/lib/customOrder'

export const dynamic = 'force-dynamic'

// Resolve the public origin for building the pay URL.
function resolveOrigin(request: NextRequest): string {
  const envUrl = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL]
    .map((u) => (u || '').trim())
    .find((u) => u && !/localhost|127\.0\.0\.1|vercel\.app/.test(u))
  if (envUrl) return envUrl.replace(/\/+$/, '')
  return 'https://gemsglobaljewels.com'
}

// ── GET: list requests (admin), with search + status filter ─────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const params = request.nextUrl.searchParams
    const search = (params.get('search') || '').trim().toLowerCase()
    const status = (params.get('status') || '').trim().toLowerCase()
    const limitParam = params.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    let query = supabaseServer
      .from('custom_payment_requests')
      .select(
        'id, token, customer_name, customer_email, customer_phone, title, description, amount, currency, status, expires_at, gateway, payment_id, gateway_order_id, order_id, paid_at, last_sent_at, created_at, updated_at'
      )
      .order('created_at', { ascending: false })

    if (status && ['pending', 'paid', 'failed', 'archived'].includes(status)) {
      query = query.eq('status', status)
    }
    if (limit && Number.isFinite(limit) && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let list = (data || []).map(shapeRequestForAdmin)

    if (search) {
      list = list.filter((r) => {
        return (
          String(r.customerName || '').toLowerCase().includes(search) ||
          String(r.customerEmail || '').toLowerCase().includes(search) ||
          String(r.customerPhone || '').toLowerCase().includes(search) ||
          String(r.title || '').toLowerCase().includes(search) ||
          String(r.id || '').toLowerCase().includes(search)
        )
      })
    }

    return NextResponse.json(list)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

// ── POST: create a new custom payment request ───────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const body = await request.json().catch(() => ({}))

    const customerName = String(body?.customerName || '').trim()
    const customerEmail = String(body?.customerEmail || '').trim()
    const customerPhone = String(body?.customerPhone || '').trim()
    const title = String(body?.title || '').trim()
    const description = String(body?.description || '').trim()
    const amount = Number(body?.amount)
    const currency = normalizeCurrency(body?.currency)
    const recordedBy = body?.recordedBy && typeof body.recordedBy === 'string' ? body.recordedBy : null
    const sendEmail = body?.sendEmail !== false // default: send the link email
    const expiresInDays = body?.expiresInDays
    // Optional link back to the custom order this payment bills.
    const customOrderId = isUuid(body?.customOrderId) ? String(body.customOrderId) : null

    // ── Server-side validation ──
    if (!customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'Order title / product name is required' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'A valid amount greater than zero is required' }, { status: 400 })
    }
    // Gateway minimums (Razorpay ₹1, Stripe $0.50)
    if (currency === 'INR' && amount < 1) {
      return NextResponse.json({ error: 'Minimum amount for INR is ₹1' }, { status: 400 })
    }
    if (currency === 'USD' && amount < 0.5) {
      return NextResponse.json({ error: 'Minimum amount for USD is $0.50' }, { status: 400 })
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json({ error: 'Please enter a valid customer email' }, { status: 400 })
    }
    if (sendEmail && !customerEmail) {
      return NextResponse.json({ error: 'A customer email is required to send the payment link' }, { status: 400 })
    }

    // Optional expiry (never expires when omitted / 0)
    let expiresAt: string | null = null
    const days = Number(expiresInDays)
    if (Number.isFinite(days) && days > 0) {
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    }

    // Resolve the linked custom order (if any) so we can attribute the eventual
    // paid order to its owning customer and advance its fulfilment funnel.
    let linkedOrder: { id: string; user_id: string | null; status: string } | null = null
    if (customOrderId) {
      const { data: co } = await supabaseServer
        .from('custom_orders')
        .select('id, user_id, status')
        .eq('id', customOrderId)
        .maybeSingle()
      if (co) linkedOrder = co as any
    }

    // Insert with a fresh unique token (retry once on the astronomically
    // unlikely event of a token collision). `withLink` is dropped on retry if
    // migration 106 (custom_order_id / user_id columns) hasn't been run yet.
    const buildRow = (token: string, withLink: boolean) => ({
      token,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      title,
      description: description || null,
      amount,
      currency,
      status: 'pending',
      expires_at: expiresAt,
      recorded_by: recordedBy,
      ...(withLink && linkedOrder
        ? { custom_order_id: linkedOrder.id, user_id: linkedOrder.user_id }
        : {}),
    })

    let inserted: any = null
    let withLink = true
    for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
      const token = generatePaymentToken()
      const { data, error } = await supabaseServer
        .from('custom_payment_requests')
        .insert(buildRow(token, withLink))
        .select('*')
        .maybeSingle()

      if (!error && data) {
        inserted = data
        break
      }
      // 42703 = undefined_column → link columns not migrated yet; retry without.
      if (error && (error as any).code === '42703' && withLink) {
        withLink = false
        attempt-- // don't consume a token-collision retry for a schema retry
        continue
      }
      // 23505 = unique_violation → loop retries with a new token
      if (error && error.code !== '23505') {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    if (!inserted) {
      return NextResponse.json({ error: 'Could not create payment request. Please try again.' }, { status: 500 })
    }

    const origin = resolveOrigin(request)
    const payUrl = `${origin}/custom-payment/${inserted.token}`

    await logEvent(inserted.id, 'created', { amount, currency })

    // Forward-only: creating a payment link nudges the custom order to
    // 'processing', but never drags a further-along request backwards.
    if (linkedOrder) {
      const nextStatus = furthestStatus(canonicalStatus(linkedOrder.status), 'processing')
      if (nextStatus !== canonicalStatus(linkedOrder.status)) {
        await supabaseServer
          .from('custom_orders')
          .update({ status: nextStatus })
          .eq('id', linkedOrder.id)
      }
    }

    // Send the payment link email (non-blocking result, but we report it)
    let emailSent = false
    if (sendEmail && customerEmail) {
      emailSent = await sendCustomPaymentLinkEmail({
        customerName,
        customerEmail,
        title,
        description,
        amount,
        currency,
        payUrl,
        expiresAt,
      })
      if (emailSent) {
        await supabaseServer
          .from('custom_payment_requests')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('id', inserted.id)
        await logEvent(inserted.id, 'link_sent', { to: customerEmail })
      }
    }

    return NextResponse.json(
      {
        ...shapeRequestForAdmin(inserted),
        payUrl,
        emailSent,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[CustomPayments POST] Error:', err)
    return NextResponse.json({ error: 'Failed to create payment request' }, { status: 500 })
  }
}
