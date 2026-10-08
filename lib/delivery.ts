/**
 * Estimated delivery windows shown to shoppers.
 *
 * A product may pin its own window (Admin → product → "Estimated delivery");
 * when it doesn't, the storefront falls back to "2–3 weeks from today", which
 * is what made-to-order jewellery actually takes.
 *
 * Display format matches the brief: `1-7 to 7-7` — day first, then month
 * number, no padding.
 */

export type DeliveryWindow = { from: Date; to: Date }

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime())
  d.setHours(12, 0, 0, 0) // noon — never slips a day across a DST change
  d.setDate(d.getDate() + Math.round(days))
  return d
}

function parseDate(v: unknown): Date | null {
  if (!v) return null
  const s = String(v)
  // DATE columns come back as `YYYY-MM-DD`; `new Date()` would read that as
  // UTC midnight and shift the day in any timezone behind UTC. Parse it as
  // local noon instead so the printed day is exactly what the admin picked.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12, 0, 0, 0)
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Window for one product. Every gap is filled so the UI never renders an
 * empty range:
 *   · nothing set            → today+14 … today+21 (2–3 weeks),
 *   · only "from" set        → from … from + 7 days,
 *   · only "to" set          → to − 7 days … to,
 *   · both set, reversed     → swapped.
 */
export function deliveryWindow(
  product?: { delivery_from?: string | null; delivery_to?: string | null } | null,
  now: Date = new Date(),
): DeliveryWindow {
  const rawFrom = parseDate(product?.delivery_from)
  const rawTo = parseDate(product?.delivery_to)

  let from = rawFrom || addDays(now, 14)
  let to = rawTo || (rawFrom ? addDays(rawFrom, 7) : addDays(now, 21))

  if (to.getTime() < from.getTime()) {
    const t = from
    from = to
    to = t
  }
  return { from, to }
}

/** Arrival window for an order placed today + a shipping method's day range. */
export function windowFromDays(
  minDays: number,
  maxDays: number,
  now: Date = new Date(),
): DeliveryWindow {
  const min = Math.max(0, Math.round(Number(minDays) || 0))
  const max = Math.max(min, Math.round(Number(maxDays) || 0))
  return { from: addDays(now, min), to: addDays(now, max) }
}

/** `1-7 to 7-7` — day-month, exactly the format the brief asked for. */
export function formatDeliveryWindow(w: DeliveryWindow): string {
  const dm = (d: Date) => `${d.getDate()}-${d.getMonth() + 1}`
  return `${dm(w.from)} to ${dm(w.to)}`
}

/** Ready-to-render string for a product card / PDP. */
export function estimatedDeliveryText(
  product?: { delivery_from?: string | null; delivery_to?: string | null } | null,
  now: Date = new Date(),
): string {
  return formatDeliveryWindow(deliveryWindow(product, now))
}
