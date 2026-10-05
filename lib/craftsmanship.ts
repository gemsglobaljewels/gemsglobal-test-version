/**
 * Craftsmanship — shared config types + defaults.
 *
 * The whole /craftsmanship page is driven by a single JSONB `config` row in the
 * `craftsmanship` table (singleton, mirrors gift_guide / hero_sections). Both the
 * public page (app/craftsmanship) and the admin editor (app/admin/craftsmanship)
 * import these types + DEFAULT_CRAFTSMANSHIP so the page renders sensibly even
 * before the table is seeded.
 *
 * The heart of the page is `sections`: an admin-managed, reorderable list of
 * image + text blocks that alternate sides (image left / content right, then
 * image right / content left, …). The admin can add as many as needed, flip the
 * image side per block, upload a per-section image, reorder and hide them.
 */

export interface CraftsmanshipHero {
  eyebrow: string
  title: string
  /** italic accent word rendered after the title (optional flourish) */
  accent: string
  subtitle: string
  /** long-form intro shown under the title (supports blank-line paragraph breaks) */
  intro: string
  image: string
}

export interface CraftsmanshipSection {
  /** stable id so React keys + reorder stay correct across edits */
  id: string
  /** short kicker above the heading (optional) */
  eyebrow: string
  title: string
  /** body copy — blank lines split into paragraphs on the public page */
  body: string
  image: string
  /** which side the image sits on for this block */
  image_side: 'left' | 'right'
  /** hidden sections stay in config but don't render on the public page */
  is_visible: boolean
  /** optional inline CTA under the body */
  cta_text: string
  cta_link: string
}

export interface CraftsmanshipClosing {
  eyebrow: string
  title: string
  accent: string
  subtitle: string
  cta_text: string
  cta_link: string
  /** full-bleed background image behind the closing CTA (optional — falls back
   *  to the first section image, then the hero image, then a stock shot) */
  bg_image: string
  /** 'accent' = taupe band, 'dark' = deep-brown band (both on-brand) */
  theme: 'accent' | 'dark'
}

export interface CraftsmanshipConfig {
  hero: CraftsmanshipHero
  /** section heading shown above the alternating blocks (optional) */
  sections_eyebrow: string
  sections_title: string
  /** the repeatable, reorderable alternating image + text blocks */
  sections: CraftsmanshipSection[]
  closing: CraftsmanshipClosing
}

/** Deterministic id generator — avoids Math.random/Date.now at module load. */
let _idSeed = 0
export const newSectionId = () =>
  `sec_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`

export const DEFAULT_CRAFTSMANSHIP: CraftsmanshipConfig = {
  hero: {
    eyebrow: 'The Atelier',
    title: 'Craftsmanship: How We Make Our',
    accent: 'Bespoke Fine Jewellery',
    subtitle:
      'From a first sketch to the final polish, every piece is shaped by hand in our workshop.',
    intro:
      'Creating a piece of bespoke fine jewellery is a journey — one that begins with a conversation and ends with an heirloom made to be worn for a lifetime and passed on for many more.\n\nEach ring, pendant and pair of earrings passes through the hands of designers, goldsmiths and stone-setters, blending time-honoured techniques with modern precision. Below, we walk you through exactly how it is made.',
    image:
      'https://images.unsplash.com/photo-1618403088890-3d9ff6f4c8b1?w=1100&h=1200&fit=crop&q=90',
  },
  sections_eyebrow: 'The Process',
  sections_title: 'Every Step, Made by Hand',
  sections: [
    {
      id: 'sec_default_1',
      eyebrow: 'Step One',
      title: 'The Design Consultation',
      body:
        'Every bespoke piece begins with you. We sit down to understand the story behind the jewellery — the occasion, the person, the feeling it should capture.\n\nOur designers sketch initial concepts by hand, refining shape, proportion and character until the design feels exactly right before a single tool is picked up.',
      image:
        'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=900&h=1000&fit=crop&q=85',
      image_side: 'left',
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sec_default_2',
      eyebrow: 'Step Two',
      title: 'CAD & 3D Modelling',
      body:
        'The chosen sketch is translated into a precise three-dimensional model using computer-aided design. This lets us perfect every millimetre — the height of a setting, the sweep of a shoulder, the exact seat for each stone.\n\nYou see a photo-realistic preview of the finished piece and can approve every detail before we begin making it.',
      image:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900&h=1000&fit=crop&q=85',
      image_side: 'right',
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sec_default_3',
      eyebrow: 'Step Three',
      title: 'Casting in Precious Metal',
      body:
        'From the approved model we create a wax pattern, which is then cast in your chosen precious metal — 18ct gold, platinum or palladium — using the centuries-old lost-wax technique.\n\nThe raw casting emerges, and the real handwork begins: filing, shaping and refining the metal until the form is clean and true.',
      image:
        'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=900&h=1000&fit=crop&q=85',
      image_side: 'left',
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sec_default_4',
      eyebrow: 'Step Four',
      title: 'Setting the Stones',
      body:
        'Our master stone-setter secures each diamond and gemstone by hand, cutting precise seats in the metal so every stone sits perfectly and catches the light from every angle.\n\nIt is painstaking, millimetre-precise work — the difference between a good piece and an extraordinary one.',
      image:
        'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=900&h=1000&fit=crop&q=85',
      image_side: 'right',
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sec_default_5',
      eyebrow: 'The Finish',
      title: 'Polishing & Hallmarking',
      body:
        'Finally the piece is polished to a flawless lustre, hand-finished and independently hallmarked as a guarantee of its precious-metal purity.\n\nAfter a last quality inspection, your bespoke piece is ready — made entirely for you, and made to last.',
      image:
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900&h=1000&fit=crop&q=85',
      image_side: 'left',
      is_visible: true,
      cta_text: 'Start Your Bespoke Piece',
      cta_link: '/custom-order',
    },
  ],
  closing: {
    eyebrow: 'Ready to Begin?',
    title: 'Let Us Craft Something',
    accent: 'Just for You',
    subtitle:
      'Book a complimentary design consultation and start the journey to a piece made entirely by hand, entirely for you.',
    cta_text: 'Book a Consultation',
    cta_link: '/appointments',
    bg_image:
      'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=1600&h=1000&fit=crop&q=90',
    theme: 'accent',
  },
}

/** Coerce a single stored section over the section defaults (fills missing keys). */
function normalizeSection(raw: any, i: number): CraftsmanshipSection {
  const s = raw && typeof raw === 'object' ? raw : {}
  return {
    id: typeof s.id === 'string' && s.id ? s.id : `sec_${i}_${(_idSeed++).toString(36)}`,
    eyebrow: typeof s.eyebrow === 'string' ? s.eyebrow : '',
    title: typeof s.title === 'string' ? s.title : '',
    body: typeof s.body === 'string' ? s.body : '',
    image: typeof s.image === 'string' ? s.image : '',
    image_side: s.image_side === 'right' ? 'right' : 'left',
    is_visible: s.is_visible !== false,
    cta_text: typeof s.cta_text === 'string' ? s.cta_text : '',
    cta_link: typeof s.cta_link === 'string' ? s.cta_link : '',
  }
}

/**
 * Merge a partial/legacy stored config over the defaults so missing keys never
 * crash the page (older seeds may lack newly added fields). An explicitly empty
 * `sections` array is respected — the admin may have deleted every block.
 */
export function normalizeCraftsmanship(raw: any): CraftsmanshipConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  return {
    ...DEFAULT_CRAFTSMANSHIP,
    ...cfg,
    hero: { ...DEFAULT_CRAFTSMANSHIP.hero, ...(cfg.hero || {}) },
    sections_eyebrow:
      typeof cfg.sections_eyebrow === 'string'
        ? cfg.sections_eyebrow
        : DEFAULT_CRAFTSMANSHIP.sections_eyebrow,
    sections_title:
      typeof cfg.sections_title === 'string'
        ? cfg.sections_title
        : DEFAULT_CRAFTSMANSHIP.sections_title,
    sections: Array.isArray(cfg.sections)
      ? cfg.sections.map(normalizeSection)
      : DEFAULT_CRAFTSMANSHIP.sections,
    closing: { ...DEFAULT_CRAFTSMANSHIP.closing, ...(cfg.closing || {}) },
  }
}
