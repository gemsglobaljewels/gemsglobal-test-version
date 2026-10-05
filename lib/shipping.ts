/**
 * Shipping Policy — shared config type + defaults.
 *
 * The /shipping page is driven by a single JSONB `config` row in the
 * `shipping` table (singleton, mirrors sustainability / repairs). Reuses the
 * shared LegalConfig shape (eyebrow / title / subtitle / updated / body).
 */

import type { LegalConfig } from '@/lib/privacy'
export type { LegalConfig } from '@/lib/privacy'

export const DEFAULT_SHIPPING: LegalConfig = {
  eyebrow: 'Customer Care',
  title: 'Shipping Policy',
  subtitle:
    'How and when your order reaches you — fully insured and beautifully packaged.',
  updated: 'Last updated: 14 July 2026',
  body: `<p>Every order is carefully packaged in our signature boxes and shipped fully insured. Here is what to expect once you place your order.</p>
<h2>Processing Time</h2>
<p>In-stock pieces are typically prepared and dispatched within 1–3 business days. Made-to-order and custom pieces take longer; the estimated timeframe is shown on the product page or confirmed with you directly.</p>
<h2>Delivery Times</h2>
<ul>
<li><strong>Domestic:</strong> 2–5 business days after dispatch.</li>
<li><strong>International:</strong> 7–14 business days after dispatch, depending on destination and customs.</li>
</ul>
<p>Delivery estimates begin from the dispatch date, not the order date, and exclude weekends and public holidays.</p>
<h2>Shipping Costs</h2>
<p>Shipping charges, where applicable, are calculated at checkout based on your destination. Complimentary shipping may be offered on qualifying orders.</p>
<h2>Insurance &amp; Tracking</h2>
<p>All shipments are fully insured until they reach you and require a signature on delivery. You will receive a tracking number by email as soon as your order is dispatched.</p>
<h2>Customs &amp; Duties</h2>
<p>International orders may be subject to import duties and taxes levied by the destination country. These charges are the responsibility of the recipient and are not included in our prices or shipping charges.</p>
<h2>Questions?</h2>
<p>If you need your piece by a specific date or have any delivery questions, please contact us before ordering and we will do our best to help.</p>`,
}

export function normalizeShipping(raw: any): LegalConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  return {
    eyebrow: typeof cfg.eyebrow === 'string' ? cfg.eyebrow : DEFAULT_SHIPPING.eyebrow,
    title: typeof cfg.title === 'string' ? cfg.title : DEFAULT_SHIPPING.title,
    subtitle: typeof cfg.subtitle === 'string' ? cfg.subtitle : DEFAULT_SHIPPING.subtitle,
    updated: typeof cfg.updated === 'string' ? cfg.updated : DEFAULT_SHIPPING.updated,
    body: typeof cfg.body === 'string' ? cfg.body : DEFAULT_SHIPPING.body,
  }
}
