/**
 * Returns & Exchanges Policy — shared config type + defaults.
 *
 * The /returns page is driven by a single JSONB `config` row in the
 * `returns` table (singleton, mirrors sustainability / repairs). Reuses the
 * shared LegalConfig shape (eyebrow / title / subtitle / updated / body).
 */

import type { LegalConfig } from '@/lib/privacy'
export type { LegalConfig } from '@/lib/privacy'

export const DEFAULT_RETURNS: LegalConfig = {
  eyebrow: 'Customer Care',
  title: 'Returns & Exchanges',
  subtitle:
    'Your satisfaction matters. Here is how returns and exchanges work with us.',
  updated: 'Last updated: 14 July 2026',
  body: `<p>We want you to love your piece. If something isn’t quite right, our returns and exchanges process is designed to be simple and fair.</p>
<h2>Our Promise</h2>
<p>Unworn items in their original condition and packaging may be returned or exchanged within 14 days of delivery. To be eligible, pieces must be unused, undamaged and accompanied by proof of purchase.</p>
<h2>How to Start a Return</h2>
<ul>
<li>Contact us within 14 days of receiving your order to request a return.</li>
<li>We’ll provide return instructions and, where applicable, a return label.</li>
<li>Pack the item securely in its original packaging and send it back insured.</li>
</ul>
<h2>Refunds</h2>
<p>Once we receive and inspect your return, we’ll notify you of approval. Approved refunds are issued to your original payment method within 5–10 business days. Original shipping charges are non-refundable unless the item was faulty.</p>
<h2>Exchanges</h2>
<p>Would you prefer a different size or style? We’re happy to arrange an exchange, subject to availability. Ring resizing may be available as an alternative — please ask.</p>
<h2>Non-Returnable Items</h2>
<p>For hygiene and bespoke reasons, custom and personalised pieces, engraved items and earrings cannot be returned unless faulty.</p>
<h2>Faulty or Damaged Items</h2>
<p>If your item arrives faulty or damaged, please contact us within 48 hours of delivery with photos, and we will put it right promptly at no cost to you.</p>
<h2>Need Help?</h2>
<p>Our team is here to make this easy. Contact us with your order number and we’ll guide you through the next steps.</p>`,
}

export function normalizeReturns(raw: any): LegalConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  return {
    eyebrow: typeof cfg.eyebrow === 'string' ? cfg.eyebrow : DEFAULT_RETURNS.eyebrow,
    title: typeof cfg.title === 'string' ? cfg.title : DEFAULT_RETURNS.title,
    subtitle: typeof cfg.subtitle === 'string' ? cfg.subtitle : DEFAULT_RETURNS.subtitle,
    updated: typeof cfg.updated === 'string' ? cfg.updated : DEFAULT_RETURNS.updated,
    body: typeof cfg.body === 'string' ? cfg.body : DEFAULT_RETURNS.body,
  }
}
