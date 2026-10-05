/**
 * Terms & Conditions — shared config type + defaults.
 *
 * The /terms page is driven by a single JSONB `config` row in the `terms`
 * table (singleton, mirrors sustainability / repairs). Reuses the shared
 * LegalConfig shape (eyebrow / title / subtitle / updated / rich-text body).
 */

import type { LegalConfig } from '@/lib/privacy'
export type { LegalConfig } from '@/lib/privacy'

export const DEFAULT_TERMS: LegalConfig = {
  eyebrow: 'Legal',
  title: 'Terms & Conditions',
  subtitle:
    'The terms that govern your use of our website and the purchase of our products.',
  updated: 'Last updated: 14 July 2026',
  body: `<p>Welcome. These Terms &amp; Conditions govern your access to and use of our website and the purchase of any products or services from us. By using our site or placing an order, you agree to these terms.</p>
<h2>Use of Our Website</h2>
<p>You agree to use our website lawfully and not to misuse it, interfere with its operation, or attempt to access it in any unauthorised way. All content on this site — including text, images and designs — is owned by us or our licensors and may not be reproduced without permission.</p>
<h2>Orders &amp; Pricing</h2>
<ul>
<li>All orders are subject to acceptance and availability.</li>
<li>Prices are shown in the applicable currency and may change without notice, but changes will not affect orders already confirmed.</li>
<li>We reserve the right to refuse or cancel any order, including where an item is mispriced or out of stock.</li>
</ul>
<h2>Product Information</h2>
<p>We take care to describe and photograph our pieces accurately. As many items are handcrafted, slight natural variations in colour, finish and measurement may occur.</p>
<h2>Payment</h2>
<p>Payment must be received in full before an order is dispatched. Payments are processed securely through our payment partners.</p>
<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by law, we are not liable for any indirect or consequential loss arising from the use of our website or products. Nothing in these terms limits your statutory rights as a consumer.</p>
<h2>Changes to These Terms</h2>
<p>We may update these Terms &amp; Conditions from time to time. The version published on this page at the time of your order applies to that order.</p>
<h2>Contact Us</h2>
<p>If you have any questions about these terms, please contact us.</p>`,
}

export function normalizeTerms(raw: any): LegalConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  return {
    eyebrow: typeof cfg.eyebrow === 'string' ? cfg.eyebrow : DEFAULT_TERMS.eyebrow,
    title: typeof cfg.title === 'string' ? cfg.title : DEFAULT_TERMS.title,
    subtitle: typeof cfg.subtitle === 'string' ? cfg.subtitle : DEFAULT_TERMS.subtitle,
    updated: typeof cfg.updated === 'string' ? cfg.updated : DEFAULT_TERMS.updated,
    body: typeof cfg.body === 'string' ? cfg.body : DEFAULT_TERMS.body,
  }
}
