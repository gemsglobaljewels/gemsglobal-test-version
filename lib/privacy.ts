/**
 * Privacy Policy — shared config type + defaults.
 *
 * The /privacy page is driven by a single JSONB `config` row in the
 * `privacy` table (singleton, mirrors sustainability / repairs). Both the
 * public page (app/privacy) and the admin editor (app/admin/privacy) import
 * these so the page renders sensibly even before the table is seeded.
 *
 * These four legal pages (privacy / terms / shipping / returns) share the
 * same simple shape: an eyebrow, title, subtitle, a "last updated" line and
 * a rich-text (HTML) body edited with the shared RichTextEditor.
 */

export interface LegalConfig {
  eyebrow: string
  title: string
  /** short lead line under the title */
  subtitle: string
  /** free-text "last updated" line, e.g. "Last updated: 14 July 2026" */
  updated: string
  /** rich HTML body from the admin RichTextEditor */
  body: string
}

export const DEFAULT_PRIVACY: LegalConfig = {
  eyebrow: 'Legal',
  title: 'Privacy Policy',
  subtitle:
    'How we collect, use and protect your personal information when you shop with us.',
  updated: 'Last updated: 14 July 2026',
  body: `<p>Your privacy matters to us. This Privacy Policy explains what information we collect, how we use it, and the choices you have. By using our website and services, you agree to the practices described below.</p>
<h2>Information We Collect</h2>
<p>We collect information you provide directly to us — such as your name, email address, shipping and billing address, and phone number — when you place an order, create an account, book an appointment, or contact us. We also collect limited technical information automatically, such as your device type, browser and pages viewed, to help us improve our site.</p>
<h2>How We Use Your Information</h2>
<ul>
<li>To process and deliver your orders and provide customer support.</li>
<li>To manage your account, appointments and requests.</li>
<li>To send order updates and, where you have opted in, marketing communications.</li>
<li>To detect, prevent and address fraud or security issues.</li>
</ul>
<h2>Payment Information</h2>
<p>Payments are processed securely by our payment partners. We do not store your full card details on our servers.</p>
<h2>Sharing Your Information</h2>
<p>We do not sell your personal information. We share it only with trusted service providers who help us operate our business (such as payment, shipping and email providers), and where required by law.</p>
<h2>Your Rights</h2>
<p>You may request access to, correction of, or deletion of your personal information, and you can unsubscribe from marketing emails at any time using the link in any email.</p>
<h2>Contact Us</h2>
<p>If you have any questions about this Privacy Policy or how we handle your data, please contact us and we will be glad to help.</p>`,
}

/** Merge a partial/legacy stored config over the defaults so missing keys
 *  never crash the page. */
export function normalizePrivacy(raw: any): LegalConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  return {
    eyebrow: typeof cfg.eyebrow === 'string' ? cfg.eyebrow : DEFAULT_PRIVACY.eyebrow,
    title: typeof cfg.title === 'string' ? cfg.title : DEFAULT_PRIVACY.title,
    subtitle: typeof cfg.subtitle === 'string' ? cfg.subtitle : DEFAULT_PRIVACY.subtitle,
    updated: typeof cfg.updated === 'string' ? cfg.updated : DEFAULT_PRIVACY.updated,
    body: typeof cfg.body === 'string' ? cfg.body : DEFAULT_PRIVACY.body,
  }
}
