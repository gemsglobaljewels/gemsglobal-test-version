// Helpers for the Custom Orders feature — mirrors lib/customPayment.ts.
// Custom orders are customer-submitted bespoke jewellery requests; admins
// review them and reply by email.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(v?: string | null): boolean {
  return typeof v === 'string' && UUID_RE.test(v)
}

// ── Forward-only lifecycle (migrations/103) ─────────────────────────────────
// A request only ever moves forward through the fulfilment funnel; it can never
// revert to an earlier stage (e.g. sending a second reply while a request is
// already at "Payment Done" must NOT drag it back to "Replied").
//
//   New → Replied → Process → Payment Done → Process Complete → Place Order
//
// STATUS_FLOW is the canonical order (also the set of valid DB values). Legacy
// aliases from the old 5-status set are accepted on read so rows created before
// migration 103 still render.
export const STATUS_FLOW = [
  'new', 'replied', 'processing', 'payment_done', 'process_complete', 'place_order',
] as const

export const STATUSES = STATUS_FLOW
export type CustomOrderStatus = (typeof STATUS_FLOW)[number]

export const STATUS_LABELS: Record<CustomOrderStatus, string> = {
  new: 'New',
  replied: 'Replied',
  processing: 'Process',
  payment_done: 'Payment Done',
  process_complete: 'Process Complete',
  place_order: 'Place Order',
}

// Admin badge CSS class per stage (classes defined in components/admin/admin-theme).
// Single source of truth so the list + detail views stay visually consistent.
export const STATUS_BADGE_CLASS: Record<CustomOrderStatus, string> = {
  new: 'a-badge--info',
  replied: 'a-badge--accent',
  processing: 'a-badge--warning',
  payment_done: 'a-badge--warning',
  process_complete: 'a-badge--success',
  place_order: 'a-badge--success',
}

// Legacy status values (pre-migration-103) → new funnel values.
const LEGACY_STATUS: Record<string, CustomOrderStatus> = {
  in_progress: 'processing',
  closed: 'process_complete',
  archived: 'place_order',
}

// Coerce any stored/incoming status to a canonical funnel value (best effort).
export function canonicalStatus(v: any): CustomOrderStatus {
  const s = String(v || '').toLowerCase()
  if ((STATUS_FLOW as readonly string[]).includes(s)) return s as CustomOrderStatus
  return LEGACY_STATUS[s] || 'new'
}

export function isValidStatus(v: any): v is CustomOrderStatus {
  return typeof v === 'string' && (STATUS_FLOW as readonly string[]).includes(v)
}

// Rank within the funnel (-1 for anything unknown, after legacy coercion).
export function statusRank(s: any): number {
  return (STATUS_FLOW as readonly string[]).indexOf(canonicalStatus(s))
}

// May `from` advance to `to`? Same stage is allowed (no-op); backward is not.
export function canAdvance(from: any, to: any): boolean {
  const a = statusRank(from)
  const b = statusRank(to)
  if (a === -1 || b === -1) return false
  return b >= a
}

// Never-reverse helper: returns whichever of the two is further along the funnel.
// Used by the reply flow so an already-advanced request is never pulled back.
export function furthestStatus(a: CustomOrderStatus, b: CustomOrderStatus): CustomOrderStatus {
  return statusRank(b) > statusRank(a) ? b : a
}

// Columns selected for admin views. We select '*' (rather than an explicit list)
// so the projection keeps working before AND after the budget_currency /
// budget_amount columns are added by migration 104 — a hard column list would
// 500 the whole admin view until the migration is run.
export const ADMIN_COLUMNS = '*'

// Format a structured budget (currency + amount) into a display string.
// Falls back to the legacy free-text `budget` column when no amount is set.
export function formatBudget(
  currency?: string | null,
  amount?: number | null,
  legacy?: string | null
): string {
  const amt = typeof amount === 'number' ? amount : Number(amount)
  if (Number.isFinite(amt) && amt > 0) {
    const cur = String(currency || 'INR').toUpperCase()
    const symbol = cur === 'USD' ? '$' : '₹'
    const locale = cur === 'USD' ? 'en-US' : 'en-IN'
    return `${symbol}${amt.toLocaleString(locale, { maximumFractionDigits: 2 })}`
  }
  return String(legacy || '').trim()
}

// Normalise the reference_images column (JSONB) into a clean string[] of URLs.
export function normalizeImages(v: any): string[] {
  if (Array.isArray(v)) return v.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v)
      return Array.isArray(parsed) ? parsed.filter((u) => typeof u === 'string' && u.trim()) : []
    } catch {
      return []
    }
  }
  return []
}

// ── Row → admin-facing shape (snake_case DB → camelCase API) ────────────────
export function shapeForAdmin(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    country: r.country,
    title: r.title,
    description: r.description,
    category: r.category,
    metalPreference: r.metal_preference,
    budget: formatBudget(r.budget_currency, r.budget_amount, r.budget),
    budgetCurrency: r.budget_currency || null,
    budgetAmount: r.budget_amount != null ? Number(r.budget_amount) : null,
    processingTime: r.processing_time,
    quantity: r.quantity ?? 1,
    referenceImages: normalizeImages(r.reference_images),
    referenceProduct: r.reference_product,
    status: canonicalStatus(r.status),
    adminReply: r.admin_reply,
    repliedAt: r.replied_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}
