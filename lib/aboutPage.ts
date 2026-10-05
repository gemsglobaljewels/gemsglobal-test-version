/**
 * About page — shared config types + defaults.
 *
 * The whole /about page is driven by a single JSONB `config` row in the
 * `about_page` table (singleton, mirrors craftsmanship / gift_guide). Both the
 * public page (app/about) and the admin editor (app/admin/about) import these
 * types + DEFAULT_ABOUT so the page renders sensibly before the table is seeded.
 *
 * Structure: a fixed `hero` block at the top, then `sections` — an ordered,
 * admin-managed list of TYPED blocks (services strip, numbered step timeline,
 * feature grid, story rows, value cards, stats band, CTA banner, free-form
 * image+text). The admin can add any number of blocks of any type, remove,
 * reorder and hide them. Icons are stored as string names resolved through
 * ABOUT_ICON_NAMES (see components/About/aboutIcons.ts for the component map).
 */

/** Curated lucide icon names offered in the admin icon picker. */
export const ABOUT_ICON_NAMES = [
  'sparkles', 'shield', 'shield-check', 'heart', 'award', 'package',
  'pencil-ruler', 'scissors', 'gem', 'zap', 'truck', 'headphones',
  'badge-check', 'leaf', 'scale', 'banknote', 'star', 'crown',
  'hand-heart', 'ribbon', 'medal', 'globe', 'clock', 'users',
] as const
export type AboutIconName = (typeof ABOUT_ICON_NAMES)[number]

export interface AboutHero {
  is_visible: boolean
  eyebrow: string
  /** first title line (regular) */
  title: string
  /** second title line (italic gradient accent) */
  accent: string
  paragraph: string
  primary_cta_text: string
  primary_cta_link: string
  secondary_cta_text: string
  secondary_cta_link: string
  image: string
  /** small pill top-right of the hero image (empty = hidden) */
  chip_icon: string
  chip_text: string
  /** floating card bottom-left of the hero image (empty title = hidden) */
  badge_icon: string
  badge_title: string
  badge_subtitle: string
  /** stat row under the hero copy */
  meta: { num: string; label: string }[]
}

interface AboutSectionBase {
  /** stable id so React keys + reorder stay correct across edits */
  id: string
  is_visible: boolean
}

/** Horizontal strip of icon services ("Free Shipping", "IGI Certified", …). */
export interface AboutServicesSection extends AboutSectionBase {
  type: 'services'
  items: { icon: string; title: string; sub: string }[]
}

/** Interactive numbered timeline (the "From sketch to heirloom" block). */
export interface AboutStepsSection extends AboutSectionBase {
  type: 'steps'
  eyebrow: string
  title: string
  accent: string
  lead: string
  steps: { icon: string; title: string; desc: string; details: string }[]
}

/** Heading + grid of icon feature cards (the lab-grown diamonds block). */
export interface AboutFeaturesSection extends AboutSectionBase {
  type: 'features'
  eyebrow: string
  title: string
  accent: string
  lead: string
  points: { icon: string; title: string; desc: string }[]
}

/** Alternating image / text rows with optional pull-quote. */
export interface AboutStorySection extends AboutSectionBase {
  type: 'story'
  eyebrow: string
  title: string
  accent: string
  rows: {
    image: string
    tag_title: string
    tag_sub: string
    /** blank lines split into paragraphs */
    body: string
    quote: string
    /** true = image on the right */
    flip: boolean
  }[]
}

/** Numbered value cards (the "What we stand for" block). */
export interface AboutValuesSection extends AboutSectionBase {
  type: 'values'
  eyebrow: string
  title: string
  accent: string
  lead: string
  values: { icon: string; title: string; desc: string }[]
}

/** Dark full-width stats band. */
export interface AboutStatsSection extends AboutSectionBase {
  type: 'stats'
  stats: { num: string; label: string }[]
}

/** Closing call-to-action banner. */
export interface AboutCtaSection extends AboutSectionBase {
  type: 'cta'
  icon: string
  title: string
  accent: string
  paragraph: string
  primary_cta_text: string
  primary_cta_link: string
  secondary_cta_text: string
  secondary_cta_link: string
}

/** Free-form image + text block (image left or right) for brand-new content. */
export interface AboutTextImageSection extends AboutSectionBase {
  type: 'text_image'
  eyebrow: string
  title: string
  accent: string
  /** blank lines split into paragraphs */
  body: string
  image: string
  image_side: 'left' | 'right'
  cta_text: string
  cta_link: string
}

export type AboutSection =
  | AboutServicesSection
  | AboutStepsSection
  | AboutFeaturesSection
  | AboutStorySection
  | AboutValuesSection
  | AboutStatsSection
  | AboutCtaSection
  | AboutTextImageSection

export type AboutSectionType = AboutSection['type']

export interface AboutConfig {
  hero: AboutHero
  sections: AboutSection[]
}

/** Deterministic id generator — avoids Math.random at module load. */
let _idSeed = 0
export const newAboutSectionId = () =>
  `ab_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`

/** Human labels for the "Add section" picker in the admin. */
export const ABOUT_SECTION_TYPE_META: Record<AboutSectionType, { label: string; hint: string }> = {
  services: { label: 'Services Strip', hint: 'Row of small icon + title services' },
  steps: { label: 'Step Timeline', hint: 'Interactive numbered process timeline' },
  features: { label: 'Feature Grid', hint: 'Heading beside a grid of icon cards' },
  story: { label: 'Story Rows', hint: 'Alternating image + text rows with quotes' },
  values: { label: 'Value Cards', hint: 'Numbered cards of principles/values' },
  stats: { label: 'Stats Band', hint: 'Dark band of big numbers' },
  cta: { label: 'CTA Banner', hint: 'Closing call-to-action with buttons' },
  text_image: { label: 'Image + Text', hint: 'Free-form image beside text block' },
}

/** Factory for a blank section of the given type (used by "Add section"). */
export function blankAboutSection(type: AboutSectionType): AboutSection {
  const base = { id: newAboutSectionId(), is_visible: true }
  switch (type) {
    case 'services':
      return { ...base, type, items: [{ icon: 'truck', title: '', sub: '' }] }
    case 'steps':
      return {
        ...base, type, eyebrow: '', title: '', accent: '', lead: '',
        steps: [{ icon: 'pencil-ruler', title: '', desc: '', details: '' }],
      }
    case 'features':
      return {
        ...base, type, eyebrow: '', title: '', accent: '', lead: '',
        points: [{ icon: 'sparkles', title: '', desc: '' }],
      }
    case 'story':
      return {
        ...base, type, eyebrow: '', title: '', accent: '',
        rows: [{ image: '', tag_title: '', tag_sub: '', body: '', quote: '', flip: false }],
      }
    case 'values':
      return {
        ...base, type, eyebrow: '', title: '', accent: '', lead: '',
        values: [{ icon: 'sparkles', title: '', desc: '' }],
      }
    case 'stats':
      return { ...base, type, stats: [{ num: '', label: '' }] }
    case 'cta':
      return {
        ...base, type, icon: 'gem', title: '', accent: '', paragraph: '',
        primary_cta_text: '', primary_cta_link: '',
        secondary_cta_text: '', secondary_cta_link: '',
      }
    case 'text_image':
      return {
        ...base, type, eyebrow: '', title: '', accent: '', body: '',
        image: '', image_side: 'left', cta_text: '', cta_link: '',
      }
  }
}

/** Defaults mirror the original hand-coded /about page exactly. */
export const DEFAULT_ABOUT: AboutConfig = {
  hero: {
    is_visible: true,
    eyebrow: 'The House of Gems Global',
    title: 'Crafting elegance,',
    accent: 'since day one',
    paragraph:
      "Every piece tells a story. We blend traditional artistry with modern design to create jewelry that celebrates life's most precious moments — meticulously handcrafted, ethically sourced, and made to be cherished for generations.",
    primary_cta_text: 'Explore Collection',
    primary_cta_link: '/collection',
    secondary_cta_text: 'Read Our Journal',
    secondary_cta_link: '/blog',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop',
    chip_icon: 'sparkles',
    chip_text: 'IGI Certified',
    badge_icon: 'gem',
    badge_title: '100%',
    badge_subtitle: 'Handmade with love',
    meta: [
      { num: '15+', label: 'Years of Mastery' },
      { num: '50+', label: 'Master Artisans' },
      { num: '100%', label: 'Handcrafted' },
    ],
  },
  sections: [
    {
      id: 'ab_default_services',
      type: 'services',
      is_visible: true,
      items: [
        { icon: 'truck', title: 'Free Shipping', sub: 'Worldwide' },
        { icon: 'headphones', title: '24/7 Service', sub: 'Always On Call' },
        { icon: 'award', title: 'IGI Certified', sub: 'Diamonds' },
        { icon: 'badge-check', title: '14/18K Gold', sub: 'Hallmarked' },
        { icon: 'shield-check', title: 'Secured & Insured', sub: 'Shipping' },
      ],
    },
    {
      id: 'ab_default_steps',
      type: 'steps',
      is_visible: true,
      eyebrow: 'The Art of Creation',
      title: 'From sketch to',
      accent: 'heirloom',
      lead:
        'Seven exacting stages transform raw vision into wearable art. Follow the journey each Gems Global piece takes before it ever reaches your hands.',
      steps: [
        {
          icon: 'pencil-ruler',
          title: 'Design Selection',
          desc: 'Our journey begins with a vision. Our designers sketch intricate patterns, blending contemporary trends with timeless aesthetics to create a unique blueprint for every masterpiece.',
          details: 'Hand-sketched concepts • 3D CAD modeling • Prototyping',
        },
        {
          icon: 'scissors',
          title: 'Flawless Diamond Cutting',
          desc: 'Master cutters analyze each rough stone to maximize brilliance. Using state-of-the-art technology and decades of expertise, we achieve the perfect symmetry and fire.',
          details: 'Laser mapping • Precision faceting • Maximum light return',
        },
        {
          icon: 'zap',
          title: 'Casting Timeline',
          desc: 'The design comes to life in precious metal. We use high-grade gold and platinum, melted at precise temperatures to ensure a strong, bubble-free foundation.',
          details: 'Vacuum casting • High-purity alloys • Structural integrity',
        },
        {
          icon: 'gem',
          title: 'Stone Setting',
          desc: 'Each diamond is hand-set under high-power microscopes. Our artisans ensure every prong is perfectly aligned, securing the stones while allowing maximum light exposure.',
          details: 'Micro-pave technique • Secure prongs • Expert alignment',
        },
        {
          icon: 'sparkles',
          title: 'Polishing',
          desc: 'The piece undergoes multiple stages of polishing. We use specialized compounds to bring out the deep luster of the metal, creating a mirror-like finish.',
          details: 'Multi-stage buffing • High-shine finish • Detail refinement',
        },
        {
          icon: 'award',
          title: 'Grading',
          desc: 'Independent gemologists verify the 4Cs of every diamond. Each piece is documented and certified to meet the highest international standards of quality.',
          details: 'GIA standards • Authenticity certs • Expert valuation',
        },
        {
          icon: 'package',
          title: 'Quality Check & Packaging',
          desc: 'A final 20-point inspection ensures perfection. Each treasure is then nestled in our signature luxury packaging, ready for its forever home.',
          details: '20-point inspection • Silk-lined boxes • Secure delivery',
        },
      ],
    },
    {
      id: 'ab_default_features',
      type: 'features',
      is_visible: true,
      eyebrow: 'Conscious Luxury',
      title: 'Why choose',
      accent: 'lab-grown diamonds?',
      lead:
        'Modern luxury meets conscious living. Lab-grown diamonds offer the same physical, chemical, and optical properties as mined diamonds — with a far more sustainable footprint and a fully traceable origin.',
      points: [
        { icon: 'leaf', title: 'Sustainable', desc: 'Minimal environmental impact and no large-scale mining required.' },
        { icon: 'shield', title: 'Ethical', desc: '100% conflict-free with a transparent and traceable origin.' },
        { icon: 'banknote', title: 'Affordable', desc: 'Exquisite quality at a significantly better value than mined stones.' },
        { icon: 'sparkles', title: 'Unmatched Brilliance', desc: 'Same refractive index and fire as the finest natural diamonds.' },
      ],
    },
    {
      id: 'ab_default_story',
      type: 'story',
      is_visible: true,
      eyebrow: 'Who We Are',
      title: 'A legacy of',
      accent: 'excellence',
      rows: [
        {
          image:
            'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1400&auto=format&fit=crop',
          tag_title: 'Fine Jewelry',
          tag_sub: 'Handcrafted with love',
          body:
            'Founded with a passion for extraordinary craftsmanship, our brand represents the pinnacle of fine jewelry artistry. Our journey began with a simple belief — that every person deserves to wear something truly remarkable.',
          quote: "We don't make jewelry to be worn for a season. We make it to be passed down.",
          flip: false,
        },
        {
          image:
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1400&auto=format&fit=crop',
          tag_title: 'The Atelier',
          tag_sub: 'Master artisans',
          body:
            'Our master artisans bring decades of experience to every creation, meticulously handcrafting each piece with unparalleled attention to detail. From the initial design sketch to the final polish, every step reflects our commitment to perfection.\n\nIt is this devotion — quiet, patient, and uncompromising — that turns precious materials into pieces worthy of a lifetime, and beyond.',
          quote: '',
          flip: true,
        },
      ],
    },
    {
      id: 'ab_default_values',
      type: 'values',
      is_visible: true,
      eyebrow: 'Our Philosophy',
      title: 'What we',
      accent: 'stand for',
      lead:
        'Three principles guide every decision we make — from the stones we source to the hands that shape them.',
      values: [
        { icon: 'sparkles', title: 'Exquisite Craftsmanship', desc: 'Every piece is meticulously handcrafted by master artisans with decades of experience, ensuring exceptional quality.' },
        { icon: 'shield', title: 'Ethical Sourcing', desc: 'We are committed to responsible practices — using only conflict-free diamonds and ethically sourced gemstones.' },
        { icon: 'heart', title: 'Timeless Design', desc: 'Our designs blend classic elegance with modern sophistication, creating pieces that transcend trends.' },
      ],
    },
    {
      id: 'ab_default_stats',
      type: 'stats',
      is_visible: true,
      stats: [
        { num: '10K+', label: 'Happy Customers' },
        { num: '5K+', label: 'Pieces Crafted' },
        { num: '50+', label: 'Master Artisans' },
        { num: '15+', label: 'Years Experience' },
      ],
    },
    {
      id: 'ab_default_cta',
      type: 'cta',
      is_visible: true,
      icon: 'gem',
      title: 'Discover our',
      accent: 'collection',
      paragraph:
        'Explore our curated collection of fine jewelry, designed to make every moment unforgettable — and every wearer feel extraordinary.',
      primary_cta_text: 'Shop Now',
      primary_cta_link: '/collection',
      secondary_cta_text: 'Read Our Blog',
      secondary_cta_link: '/blog',
    },
  ],
}

const str = (v: any, fb = ''): string => (typeof v === 'string' ? v : fb)

function normalizeItems<T extends Record<string, any>>(
  raw: any,
  shape: T,
): T[] {
  if (!Array.isArray(raw)) return []
  return raw.map((it) => {
    const o = it && typeof it === 'object' ? it : {}
    const out: Record<string, any> = {}
    for (const k of Object.keys(shape)) {
      const fb = shape[k]
      out[k] = typeof o[k] === typeof fb ? o[k] : fb
    }
    return out as T
  })
}

/** Coerce one stored section; returns null for unknown/corrupt entries. */
function normalizeAboutSection(raw: any, i: number): AboutSection | null {
  const s = raw && typeof raw === 'object' ? raw : {}
  const base = {
    id: str(s.id) || `ab_${i}_${(_idSeed++).toString(36)}`,
    is_visible: s.is_visible !== false,
  }
  switch (s.type) {
    case 'services':
      return { ...base, type: 'services', items: normalizeItems(s.items, { icon: '', title: '', sub: '' }) }
    case 'steps':
      return {
        ...base, type: 'steps',
        eyebrow: str(s.eyebrow), title: str(s.title), accent: str(s.accent), lead: str(s.lead),
        steps: normalizeItems(s.steps, { icon: '', title: '', desc: '', details: '' }),
      }
    case 'features':
      return {
        ...base, type: 'features',
        eyebrow: str(s.eyebrow), title: str(s.title), accent: str(s.accent), lead: str(s.lead),
        points: normalizeItems(s.points, { icon: '', title: '', desc: '' }),
      }
    case 'story':
      return {
        ...base, type: 'story',
        eyebrow: str(s.eyebrow), title: str(s.title), accent: str(s.accent),
        rows: normalizeItems(s.rows, { image: '', tag_title: '', tag_sub: '', body: '', quote: '', flip: false }),
      }
    case 'values':
      return {
        ...base, type: 'values',
        eyebrow: str(s.eyebrow), title: str(s.title), accent: str(s.accent), lead: str(s.lead),
        values: normalizeItems(s.values, { icon: '', title: '', desc: '' }),
      }
    case 'stats':
      return { ...base, type: 'stats', stats: normalizeItems(s.stats, { num: '', label: '' }) }
    case 'cta':
      return {
        ...base, type: 'cta', icon: str(s.icon, 'gem'),
        title: str(s.title), accent: str(s.accent), paragraph: str(s.paragraph),
        primary_cta_text: str(s.primary_cta_text), primary_cta_link: str(s.primary_cta_link),
        secondary_cta_text: str(s.secondary_cta_text), secondary_cta_link: str(s.secondary_cta_link),
      }
    case 'text_image':
      return {
        ...base, type: 'text_image',
        eyebrow: str(s.eyebrow), title: str(s.title), accent: str(s.accent), body: str(s.body),
        image: str(s.image), image_side: s.image_side === 'right' ? 'right' : 'left',
        cta_text: str(s.cta_text), cta_link: str(s.cta_link),
      }
    default:
      return null
  }
}

/**
 * Merge a partial/legacy stored config over the defaults so missing keys never
 * crash the page. An explicitly empty `sections` array is respected — the admin
 * may have deleted every block.
 */
export function normalizeAbout(raw: any): AboutConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  const hero = cfg.hero && typeof cfg.hero === 'object' ? cfg.hero : {}
  return {
    hero: {
      ...DEFAULT_ABOUT.hero,
      ...hero,
      is_visible: hero.is_visible !== false,
      meta: Array.isArray(hero.meta)
        ? normalizeItems(hero.meta, { num: '', label: '' })
        : DEFAULT_ABOUT.hero.meta,
    },
    sections: Array.isArray(cfg.sections)
      ? (cfg.sections.map(normalizeAboutSection).filter(Boolean) as AboutSection[])
      : DEFAULT_ABOUT.sections,
  }
}
