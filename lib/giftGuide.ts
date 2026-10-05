/**
 * Gift Guide — shared config types + defaults.
 *
 * The whole Gift Guide page is driven by a single JSONB `config` row in the
 * `gift_guide` table (singleton, mirrors hero_sections). Both the public page
 * (app/gift-guide) and the admin editor (app/admin/gift-guide) import these
 * types + DEFAULT_GIFT_GUIDE so the page renders sensibly even before the
 * table is seeded.
 */

export interface GiftGuideHero {
  eyebrow: string
  title: string
  /** italic accent word rendered after the title (optional flourish) */
  accent: string
  subtitle: string
  image: string
  primary_cta_text: string
  primary_cta_link: string
  secondary_cta_text: string
  secondary_cta_link: string
}

export interface GiftGuideRecipient {
  /** category id when the tile is sourced from a recipient category (optional for legacy config tiles) */
  id?: string
  label: string
  image: string
  /** where the tile navigates, e.g. /collection/necklaces or /collection?category=rings */
  link: string
}

export interface GiftGuidePriceTier {
  /** e.g. "$50" — display label for the tier */
  label: string
  /** upper bound in USD; products with price <= max fall in this tier */
  max: number
  is_enabled: boolean
}

export interface GiftGuideCategoryCard {
  title: string
  image: string
  description: string
  link: string
}

export interface GiftGuideClosing {
  eyebrow: string
  title: string
  accent: string
  subtitle: string
  cta_text: string
  cta_link: string
  /** 'accent' = taupe band, 'dark' = deep-brown band (both on-brand, no black/gold) */
  theme: 'accent' | 'dark'
}

export interface GiftGuideConfig {
  hero: GiftGuideHero
  recipients_title: string
  /**
   * Legacy hand-authored recipient tiles. Recipients are now driven by the
   * Categories admin (categories flagged `show_on_recipient`); this array is
   * kept only as a fallback when no such categories exist.
   */
  recipients: GiftGuideRecipient[]
  /**
   * Per-recipient-category visibility on the Gift Guide, keyed by category id.
   * Missing / true = shown; false = hidden. Lets the gift-guide admin hide a
   * recipient category from this page without unflagging it site-wide.
   */
  recipient_visibility: Record<string, boolean>
  price_title: string
  price_subtitle: string
  price_tiers: GiftGuidePriceTier[]
  /** curated product ids hand-picked in admin for the "For Her" rail */
  her_title: string
  her_product_ids: string[]
  /** curated product ids for the "For Him" rail */
  him_title: string
  him_product_ids: string[]
  categories_title: string
  /**
   * Legacy hand-authored "Shop by Category" editorial cards. The section is now
   * driven by real site categories (see category_visibility); this array is kept
   * only for backward-compatibility with older seeds and is no longer edited or
   * rendered.
   */
  categories: GiftGuideCategoryCard[]
  /**
   * Per-category visibility for the "Shop by Category" section, keyed by category
   * id. Opt-in — the inverse of recipient_visibility: a category appears on the
   * Gift Guide only when its value is explicitly `true`, so the admin curates
   * exactly which of the site's categories show here (nothing shows by default).
   */
  category_visibility: Record<string, boolean>
  closing: GiftGuideClosing
}

export const DEFAULT_GIFT_GUIDE: GiftGuideConfig = {
  hero: {
    eyebrow: 'The Jewelry Gift Guide',
    title: 'Gifts as Unforgettable as',
    accent: 'the Moment',
    subtitle:
      'A hand-selected edit of pieces that make the perfect gift — every order arrives beautifully packaged in our signature gift boxes.',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000&h=1100&fit=crop&q=90',
    primary_cta_text: 'Shop the Guide',
    primary_cta_link: '/collection',
    secondary_cta_text: 'Gifts Under $100',
    secondary_cta_link: '#gifts-by-price',
  },
  recipients_title: 'Gifts for Everyone You Love',
  recipient_visibility: {},
  recipients: [
    {
      label: 'For Her',
      image:
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&h=700&fit=crop&q=85',
      link: '/collection',
    },
    {
      label: 'For Him',
      image:
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&h=700&fit=crop&q=85',
      link: '/collection',
    },
    {
      label: 'For Kids',
      image:
        'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=700&h=700&fit=crop&q=85',
      link: '/collection',
    },
    {
      label: 'For Friends',
      image:
        'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=700&fit=crop&q=85',
      link: '/collection',
    },
  ],
  price_title: 'Thoughtful Gifts by Price',
  price_subtitle: 'Find something special at every budget — tap a tier to browse.',
  price_tiers: [
    { label: '$50', max: 50, is_enabled: true },
    { label: '$75', max: 75, is_enabled: true },
    { label: '$100', max: 100, is_enabled: true },
  ],
  her_title: 'For Her',
  her_product_ids: [],
  him_title: 'For Him',
  him_product_ids: [],
  categories_title: 'Shop by Category',
  categories: [
    {
      title: 'Earrings',
      image:
        'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=800&h=900&fit=crop&q=85',
      description:
        'Discover the perfect gift — from sparkling studs to elegant hoops and drop earrings that add sparkle and joy.',
      link: '/collection/earrings',
    },
    {
      title: 'Bracelets',
      image:
        'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=900&fit=crop&q=85',
      description:
        'From classic tennis bracelets to bold interpretations of iconic design — timeless pieces to treasure.',
      link: '/collection/bracelets',
    },
    {
      title: 'Necklaces',
      image:
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=900&fit=crop&q=85',
      description:
        'Explore understated classics and eye-catching statement pieces, each designed to shine beautifully on its own.',
      link: '/collection/necklaces',
    },
  ],
  category_visibility: {},
  closing: {
    eyebrow: 'Still Searching?',
    title: 'Let Us Help You Find',
    accent: 'the One',
    subtitle:
      'Book a complimentary styling appointment or explore our full collection — the perfect gift is closer than you think.',
    cta_text: 'Book an Appointment',
    cta_link: '/appointments',
    theme: 'accent',
  },
}

/**
 * Merge a partial/legacy stored config over the defaults so missing keys never
 * crash the page (older seeds may lack newly added fields).
 */
export function normalizeGiftGuide(raw: any): GiftGuideConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  return {
    ...DEFAULT_GIFT_GUIDE,
    ...cfg,
    hero: { ...DEFAULT_GIFT_GUIDE.hero, ...(cfg.hero || {}) },
    recipients: Array.isArray(cfg.recipients) ? cfg.recipients : DEFAULT_GIFT_GUIDE.recipients,
    recipient_visibility:
      cfg.recipient_visibility && typeof cfg.recipient_visibility === 'object'
        ? cfg.recipient_visibility
        : {},
    price_tiers: Array.isArray(cfg.price_tiers) ? cfg.price_tiers : DEFAULT_GIFT_GUIDE.price_tiers,
    her_product_ids: Array.isArray(cfg.her_product_ids) ? cfg.her_product_ids : [],
    him_product_ids: Array.isArray(cfg.him_product_ids) ? cfg.him_product_ids : [],
    categories: Array.isArray(cfg.categories) ? cfg.categories : DEFAULT_GIFT_GUIDE.categories,
    category_visibility:
      cfg.category_visibility && typeof cfg.category_visibility === 'object'
        ? cfg.category_visibility
        : {},
    closing: { ...DEFAULT_GIFT_GUIDE.closing, ...(cfg.closing || {}) },
  }
}
