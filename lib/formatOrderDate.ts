// Shared order-date formatting.
//
// Order `created_at` is stored in Supabase as a UTC timestamptz
// (e.g. "2026-07-03T05:38:11.402994+00:00"). Slicing the raw ISO string
// (`.slice(0, 10)`) yields the *UTC* calendar date, which is a day behind for
// any order placed between 00:00 and 05:30 IST. Since this is an INR-first
// store, all admin order dates are formatted in Asia/Kolkata for consistency.

const IST = 'Asia/Kolkata'

/** "03 Jul 2026" — compact IST date for tables/cards. */
export function formatOrderDate(value?: string | number | Date | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** "03 Jul 2026, 11:08 am" — IST date + time for detail views. */
export function formatOrderDateTime(value?: string | number | Date | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
