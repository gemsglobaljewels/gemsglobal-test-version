import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabaseServer'

// ── Secure, unguessable token ───────────────────────────────────────────────
// 32 bytes of CSPRNG entropy, URL-safe base64 (no padding). ~43 chars.
export function generatePaymentToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(v?: string | null): boolean {
  return typeof v === 'string' && UUID_RE.test(v)
}

// Tokens are base64url of 32 bytes → 43 chars of [A-Za-z0-9_-]. Validate shape
// before hitting the DB so obviously-bogus URLs are rejected cheaply.
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/
export function isValidToken(v?: string | null): boolean {
  return typeof v === 'string' && TOKEN_RE.test(v)
}

export type CurrencyCode = 'INR' | 'USD'

export function normalizeCurrency(v: any): CurrencyCode {
  return String(v || '').toUpperCase() === 'USD' ? 'USD' : 'INR'
}

// ── Row → admin-facing shape (full detail, safe for authenticated admin) ────
export function shapeRequestForAdmin(r: any) {
  return {
    id: r.id,
    token: r.token,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    title: r.title,
    description: r.description,
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status,
    expiresAt: r.expires_at,
    gateway: r.gateway,
    paymentId: r.payment_id,
    gatewayOrderId: r.gateway_order_id,
    orderId: r.order_id,
    paidAt: r.paid_at,
    lastSentAt: r.last_sent_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// ── Row → public shape (only what the customer needs; NEVER leaks the token
//     of *other* requests, internal ids, or audit fields) ───────────────────
export function shapeRequestForPublic(r: any) {
  const expired = isExpired(r)
  return {
    token: r.token,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    title: r.title,
    description: r.description,
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status,
    expired,
    paidAt: r.paid_at,
    paymentId: r.status === 'paid' ? r.payment_id : null,
  }
}

export function isExpired(r: any): boolean {
  if (!r?.expires_at) return false
  const t = new Date(r.expires_at).getTime()
  return Number.isFinite(t) && t < Date.now()
}

// Whether a request can currently accept a payment attempt.
export function isPayable(r: any): { ok: boolean; reason?: string } {
  if (!r) return { ok: false, reason: 'Payment request not found' }
  if (r.status === 'paid') return { ok: false, reason: 'This payment has already been completed' }
  if (r.status === 'archived') return { ok: false, reason: 'This payment link is no longer active' }
  if (isExpired(r)) return { ok: false, reason: 'This payment link has expired' }
  return { ok: true }
}

// ── Custom-order marker on the orders row ───────────────────────────────────
// Orders created from a custom payment are tagged with a leading `[custom]` in
// their notes (see createOrderForCustomPayment). These helpers let the orders
// API / account view flag such a purchase and recover its bespoke title without
// a join (custom orders have no catalogue order_items to derive a name from).
// Matches the current `[custom] <title>` tag AND the legacy `Custom payment ·
// <title>` prefix so orders placed before the tag change still render nicely.
const CUSTOM_NOTE_RE = /^(?:\[custom\]|custom payment\s*·)\s*(.*)/i

export function isCustomOrderNote(notes?: string | null): boolean {
  return typeof notes === 'string' && CUSTOM_NOTE_RE.test(notes.trim())
}

// Pull the bespoke title (first line after the `[custom]` tag) for display.
export function customTitleFromNote(notes?: string | null): string | null {
  if (typeof notes !== 'string') return null
  const m = notes.trim().match(CUSTOM_NOTE_RE)
  if (!m) return null
  const firstLine = String(m[1] || '').split('\n')[0].trim()
  return firstLine || null
}

// ── Build the minimal address JSONB the orders table requires (NOT NULL) ────
function addressFromRequest(r: any) {
  return {
    name: r.customer_name || 'Customer',
    email: r.customer_email || '',
    phone: r.customer_phone || '',
    // Custom payments are off-catalogue; no shipping address is collected.
    note: 'Custom payment request',
  }
}

// ── Create a matching `orders` row on successful custom payment ─────────────
// Mirrors the confirmed-order shape used by the live checkout so all existing
// reporting/admin-order views keep working. Returns the new order id or null.
export async function createOrderForCustomPayment(r: any, paymentId: string): Promise<string | null> {
  try {
    const currency = normalizeCurrency(r.currency)
    const amount = Number(r.amount)
    const addr = addressFromRequest(r)

    const orderInsert: any = {
      email: r.customer_email || 'no-email@custom-payment.local',
      // Attribute the order to the owning customer when the request is linked
      // to one (via a custom order). This is what makes the purchase surface in
      // the customer's account. NULL for anonymous / manual off-catalogue links.
      user_id: r.user_id || null,
      status: 'confirmed',
      subtotal: amount,
      tax: 0,
      shipping_cost: 0,
      total_price: amount,
      currency,
      shipping_address: addr,
      billing_address: addr,
      payment_method: currency === 'USD' ? 'stripe' : 'razorpay',
      // The `[custom]` tag lets the orders API / account flag this as a bespoke
      // purchase (no catalogue line-items exist for it).
      notes: `[custom] ${r.title}${r.description ? `\n${r.description}` : ''}\nRef #${String(r.id).slice(0, 8).toUpperCase()} · Payment ${paymentId}`,
    }

    const { data: order, error } = await supabaseServer
      .from('orders')
      .insert(orderInsert)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[CustomPayment] Order creation failed (non-fatal):', error.message)
      return null
    }
    return order?.id ?? null
  } catch (e) {
    console.error('[CustomPayment] Order creation threw (non-fatal):', e)
    return null
  }
}

// Fire-and-forget audit event.
export async function logEvent(requestId: string, type: string, detail?: any) {
  try {
    await supabaseServer.from('custom_payment_events').insert({
      request_id: requestId,
      type,
      detail: detail ?? null,
    })
  } catch { /* audit log must never break the request */ }
}
