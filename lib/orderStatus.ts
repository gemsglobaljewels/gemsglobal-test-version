/**
 * Single source of truth for what an order's `status` MEANS across the app.
 *
 * The core rule the business cares about: an order is NOT a real "placed order"
 * until payment has actually succeeded. Orders are created in the DB with
 * status `pending` at the *start* of checkout (before the customer pays), so an
 * abandoned checkout — add to cart, proceed, then never pay — leaves a `pending`
 * (or, once a dismiss/expiry callback fires, `payment_failed`) row behind.
 *
 * Those rows must never be shown or counted as placed orders anywhere:
 * customer account, admin orders list, dashboard revenue/counts, sidebar badges.
 * This module centralises that classification so every surface agrees.
 */

/** Statuses that represent an unpaid / abandoned checkout — NOT a real order. */
export const UNPAID_STATUSES = ['pending', 'payment_failed', 'failed'] as const

/**
 * Statuses whose money was actually collected and NOT reversed — i.e. what a
 * store owner means by "revenue". Excludes cancelled / refunded / returned
 * (money reversed) and every unpaid status. `return_requested` is still counted
 * (payment is held while the return is pending resolution).
 */
export const REVENUE_STATUSES = [
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'return_requested',
] as const

const UNPAID_SET = new Set<string>(UNPAID_STATUSES as readonly string[])
const REVENUE_SET = new Set<string>(REVENUE_STATUSES as readonly string[])

/** Normalise a raw status value to a lowercase string for comparison. */
function norm(status: unknown): string {
  return String(status ?? '').trim().toLowerCase()
}

/** True for an unpaid / abandoned checkout (pending, payment_failed, failed). */
export function isUnpaidStatus(status: unknown): boolean {
  return UNPAID_SET.has(norm(status))
}

/** True once payment has succeeded — the order genuinely exists / was placed. */
export function isPlacedOrder(status: unknown): boolean {
  return !isUnpaidStatus(status)
}

/** True when this order's amount should count towards revenue totals. */
export function countsAsRevenue(status: unknown): boolean {
  return REVENUE_SET.has(norm(status))
}

/**
 * PostgREST-formatted list for `.not('status', 'in', UNPAID_STATUS_IN_LIST)`.
 * Values contain no spaces or special chars, so no quoting is required.
 */
export const UNPAID_STATUS_IN_LIST = `(${UNPAID_STATUSES.join(',')})`
