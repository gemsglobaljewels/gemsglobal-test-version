import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { shapeForAdmin, ADMIN_COLUMNS, STATUSES } from '@/lib/customOrder'
import { sendAdminNewCustomOrderEmail } from '@/lib/email'
import { requireAuth, requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Keep only well-formed http(s) image URLs (defends the JSONB column).
function sanitizeImages(v: any): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u.trim()))
    .map((u) => u.trim())
    .slice(0, 12)
}

// ── GET: list custom orders (admin), with search + status filter ────────────
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
      .from('custom_orders')
      .select(ADMIN_COLUMNS)
      .order('created_at', { ascending: false })

    if (status && (STATUSES as readonly string[]).includes(status)) {
      query = query.eq('status', status)
    }
    if (limit && Number.isFinite(limit) && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let list = (data || []).map(shapeForAdmin)

    if (search) {
      list = list.filter(
        (r) =>
          String(r.customerName || '').toLowerCase().includes(search) ||
          String(r.customerEmail || '').toLowerCase().includes(search) ||
          String(r.customerPhone || '').toLowerCase().includes(search) ||
          String(r.title || '').toLowerCase().includes(search) ||
          String(r.id || '').toLowerCase().includes(search)
      )
    }

    return NextResponse.json(list)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

// ── POST: create a custom order (signed-in customer) ────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const body = await request.json().catch(() => ({}))

    const customerName = String(body?.customerName || '').trim()
    const customerEmail = String(body?.customerEmail || user.email || '').trim()
    const customerPhone = String(body?.customerPhone || '').trim()
    const country = String(body?.country || '').trim()
    const title = String(body?.title || '').trim()
    const description = String(body?.description || '').trim()
    const category = String(body?.category || '').trim()
    const metalPreference = String(body?.metalPreference || '').trim()
    const processingTime = String(body?.processingTime || '').trim()

    // Budget: structured (currency + amount) with a legacy free-text fallback.
    const budgetCurrency = String(body?.budgetCurrency || 'INR').toUpperCase() === 'USD' ? 'USD' : 'INR'
    const budgetAmtNum = Number(body?.budgetAmount)
    const budgetAmount = Number.isFinite(budgetAmtNum) && budgetAmtNum > 0 ? budgetAmtNum : null
    // Human-readable string kept in the legacy `budget` column for back-compat.
    const budget = budgetAmount
      ? `${budgetCurrency === 'USD' ? '$' : '₹'}${budgetAmount.toLocaleString(budgetCurrency === 'USD' ? 'en-US' : 'en-IN')}`
      : String(body?.budget || '').trim()
    const referenceProduct = String(body?.referenceProduct || '').trim()
    const referenceImages = sanitizeImages(body?.referenceImages)
    const qtyNum = Number(body?.quantity)
    const quantity = Number.isFinite(qtyNum) && qtyNum >= 1 ? Math.floor(qtyNum) : 1

    // ── Validation ──
    if (!customerName) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'A title for your custom order is required' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json({ error: 'Please describe your custom order' }, { status: 400 })
    }
    if (!customerPhone) {
      return NextResponse.json({ error: 'A contact number is required' }, { status: 400 })
    }
    if (customerEmail && !EMAIL_RE.test(customerEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 })
    }

    // Best-effort: ensure a public.users row exists so the FK holds (mirrors
    // the appointments flow). If it can't be ensured, fall back to a null owner.
    let userId: string | null = user.id
    try {
      const { data: existing } = await supabaseServer
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      if (!existing) {
        await supabaseServer
          .from('users')
          .upsert([{ id: userId, email: customerEmail || user.email || null }], { onConflict: 'id' })
      }
    } catch {
      userId = null
    }

    // `withBudgetCols` is dropped on retry if migration 104 hasn't added the
    // budget_currency / budget_amount columns yet (Postgres 42703).
    const insertRow = (withBudgetCols: boolean) =>
      supabaseServer
        .from('custom_orders')
        .insert({
          user_id: userId,
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          country: country || null,
          title,
          description: description || null,
          category: category || null,
          metal_preference: metalPreference || null,
          budget: budget || null,
          ...(withBudgetCols
            ? { budget_currency: budgetAmount ? budgetCurrency : null, budget_amount: budgetAmount }
            : {}),
          processing_time: processingTime || null,
          quantity,
          reference_images: referenceImages,
          reference_product: referenceProduct || null,
          status: 'new',
        })
        .select(ADMIN_COLUMNS)
        .single()

    let { data, error } = await insertRow(true)
    // 42703 = undefined_column → budget columns not migrated yet; retry without.
    if (error && (error as any).code === '42703') {
      ;({ data, error } = await insertRow(false))
    }
    // 23503 = foreign_key_violation on user_id → retry without the owner link.
    if (error && error.code === '23503' && userId) {
      userId = null
      ;({ data, error } = await insertRow(true))
      if (error && (error as any).code === '42703') {
        ;({ data, error } = await insertRow(false))
      }
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const shaped = shapeForAdmin(data)

    // Notify the admin (fire-and-forget — email latency/failure never blocks).
    sendAdminNewCustomOrderEmail({
      requestId: shaped.id,
      customerName: shaped.customerName,
      customerEmail: shaped.customerEmail,
      customerPhone: shaped.customerPhone,
      country: shaped.country,
      title: shaped.title,
      description: shaped.description,
      category: shaped.category,
      metalPreference: shaped.metalPreference,
      budget: shaped.budget,
      processingTime: shaped.processingTime,
      quantity: shaped.quantity,
      referenceImages: shaped.referenceImages,
      referenceProduct: shaped.referenceProduct,
    }).catch((err) => console.error('[CustomOrders POST] Admin email failed:', err))

    return NextResponse.json(shaped, { status: 201 })
  } catch (err) {
    console.error('[CustomOrders POST] Error:', err)
    return NextResponse.json({ error: 'Failed to submit custom order' }, { status: 500 })
  }
}
