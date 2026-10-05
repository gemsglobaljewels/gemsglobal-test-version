/**
 * Size Guide — shared config types + defaults.
 *
 * The whole /size-guide page is driven by a single JSONB row in the `size_guide`
 * table (singleton, mirrors ring_size_guide / about_page). Both the public page
 * (app/size-guide) and the admin editor (app/admin/size-guide) import these types
 * + DEFAULT_SIZE_GUIDE so the page renders sensibly before the table is seeded.
 *
 * Structure: a `hero` banner, then `sections` — an ordered, admin-managed list of
 * "chart guide" blocks. Each section has a title/subtitle, an illustration image,
 * a set of tip callout cards (icon + title + text), a set of numbered step cards
 * (image + text), and a video (uploaded file OR embedded YouTube/Vimeo URL).
 *
 * The admin can add any number of sections, remove and reorder them, and manage
 * the tips/steps inside each. Tip icons are stored as lucide name strings clamped
 * to ALLOWED_TIP_ICONS so nothing arbitrary reaches the client.
 */

/** Curated lucide icon names offered in the admin tip icon picker. */
export const ALLOWED_TIP_ICONS = [
  'Ruler', 'Hand', 'Scissors', 'Table2', 'BadgeCheck', 'Scale', 'Gem',
  'Diamond', 'Eye', 'Search', 'Target', 'Sparkles', 'Circle', 'Info', 'PencilRuler',
] as const
export type TipIconName = (typeof ALLOWED_TIP_ICONS)[number]
export const DEFAULT_TIP_ICON: TipIconName = 'Ruler'

export interface Tip {
  id: string
  /** lucide icon name, clamped to ALLOWED_TIP_ICONS */
  icon: string
  title: string
  text: string
}

export interface Step {
  id: string
  image_url: string
  text: string
}

export interface SizeGuideSection {
  /** stable id so React keys + reorder stay correct across edits */
  id: string
  title: string
  subtitle: string
  /** illustration / chart image beside the tips */
  image_url: string
  video_url: string
  /** 'file' -> <video>; 'embed' -> <iframe> (YouTube/Vimeo) */
  video_type: 'file' | 'embed'
  tips: Tip[]
  steps: Step[]
}

export interface SizeGuideHero {
  eyebrow: string
  title: string
  subtitle: string
  background_url: string
}

export interface SizeGuideDoc {
  hero: SizeGuideHero
  sections: SizeGuideSection[]
}

/** Deterministic id generator — avoids Math.random at module load. */
let _idSeed = 0
export const newSizeGuideId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`

/** Return 'embed' for known video hosts (YouTube/Vimeo), else 'file'. */
export function deriveVideoType(url: string): 'file' | 'embed' {
  if (!url) return 'file'
  return /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(url) ? 'embed' : 'file'
}

/** Factories for blank items (used by the admin "Add" buttons). */
export const blankTip = (): Tip => ({ id: newSizeGuideId('tip'), icon: DEFAULT_TIP_ICON, title: '', text: '' })
export const blankStep = (): Step => ({ id: newSizeGuideId('step'), image_url: '', text: '' })
export const blankSection = (): SizeGuideSection => ({
  id: newSizeGuideId('sec'),
  title: '',
  subtitle: '',
  image_url: '',
  video_url: '',
  video_type: 'file',
  tips: [blankTip()],
  steps: [blankStep()],
})

/**
 * Default page content. Mirrors the reference guide (Ring + Bracelet + Diamond).
 * Serves as the GET fallback so /size-guide renders fully before the migration
 * has been run and the table seeded. Images/videos are left blank so the admin
 * uploads their own assets to R2 — the page degrades gracefully without them.
 */
export const DEFAULT_SIZE_GUIDE: SizeGuideDoc = {
  hero: {
    eyebrow: 'Size Master Guide',
    title: 'Find your perfect jewelry fit',
    subtitle:
      'Effortlessly determine your ideal ring, bracelet, and diamond sizes with our comprehensive Size Master Guide. Ensure a perfect fit for every piece with easy-to-use charts and expert tips — and shop with confidence.',
    background_url: '',
  },
  sections: [
    {
      id: 'sg_default_ring',
      title: 'Ring Size Chart',
      subtitle: 'Measure the base of your finger and match it to your perfect ring size in minutes.',
      image_url: '',
      video_url: '',
      video_type: 'file',
      tips: [
        { id: 'sg_ring_t1', icon: 'Ruler', title: 'Measure Your Finger', text: 'Wrap a thin strip of paper or a piece of string around the base of your finger. Mark where it overlaps, then measure the length against a ruler.' },
        { id: 'sg_ring_t2', icon: 'Table2', title: 'Refer to Size Chart', text: 'Compare your measurement with our ring size chart to find your corresponding size.' },
        { id: 'sg_ring_t3', icon: 'BadgeCheck', title: 'Ensure Accuracy', text: 'For the best fit, measure your finger at the end of the day when your fingers are at their largest. Consider the width of the band for snug fits.' },
      ],
      steps: [
        { id: 'sg_ring_s1', image_url: '', text: 'Cut out the sizer strip from the printed page.' },
        { id: 'sg_ring_s2', image_url: '', text: 'Wear it as a ring and mark where it meets your fit.' },
        { id: 'sg_ring_s3', image_url: '', text: 'Read the size on the scale to find your ring size.' },
      ],
    },
    {
      id: 'sg_default_bracelet',
      title: 'Bracelet Size Chart',
      subtitle: 'Measure the widest part of your hand so your bangle slides on with a comfortable, secure fit.',
      image_url: '',
      video_url: '',
      video_type: 'file',
      tips: [
        { id: 'sg_brac_t1', icon: 'Hand', title: 'Measure Your Hand', text: 'Close your fingers together and bring your thumb to your little finger. Use a measuring tape or string to measure the widest part of your hand — this is where the bangle will slide over.' },
        { id: 'sg_brac_t2', icon: 'Search', title: 'Find Your Measurement', text: 'If using a string, mark where it meets and measure the length against a ruler to find the circumference of your hand.' },
        { id: 'sg_brac_t3', icon: 'Scale', title: 'Match Your Size', text: 'Compare your measurement to our bracelet size chart to find the size that fits you best.' },
      ],
      steps: [
        { id: 'sg_brac_s1', image_url: '', text: 'Cut out the bangle sizer strip from the page.' },
        { id: 'sg_brac_s2', image_url: '', text: 'Wear it as shown in the image and point it out.' },
        { id: 'sg_brac_s3', image_url: '', text: 'Measure it by the scale and you’ll get your bangle size.' },
      ],
    },
    {
      id: 'sg_default_diamond',
      title: 'Diamond Size Chart',
      subtitle: 'Understand how carat weight translates to millimeters so you can picture your stone before it is set.',
      image_url: '',
      video_url: '',
      video_type: 'file',
      tips: [
        { id: 'sg_diam_t1', icon: 'Gem', title: 'Understand Carat Weight', text: 'Diamond size is often expressed in carats, a measurement of weight, not size. One carat is equivalent to 0.2 grams.' },
        { id: 'sg_diam_t2', icon: 'Scale', title: 'Consider Proportions', text: 'Look at the diamond’s cut and shape, as these factors influence how large the diamond appears. A well-cut diamond can appear larger than its carat weight might suggest.' },
        { id: 'sg_diam_t3', icon: 'Eye', title: 'View Size Charts', text: 'Consult size charts that compare diamond carat weights to their approximate sizes in millimeters. This helps you visualize how different carat weights will look in your jewelry setting.' },
      ],
      steps: [
        { id: 'sg_diam_s1', image_url: '', text: 'Cut out any shape from the diamond sizer page.' },
        { id: 'sg_diam_s2', image_url: '', text: 'Wear it as shown in the image and point it out.' },
        { id: 'sg_diam_s3', image_url: '', text: 'Measure it by the scale and you’ll get your diamond size.' },
      ],
    },
  ],
}

const str = (v: any, fb = ''): string => (typeof v === 'string' ? v : fb)

/** Coerce one stored tip; clamps the icon name to the whitelist. */
function normalizeTip(raw: any, i: number): Tip {
  const t = raw && typeof raw === 'object' ? raw : {}
  const icon = (ALLOWED_TIP_ICONS as readonly string[]).includes(str(t.icon))
    ? str(t.icon)
    : DEFAULT_TIP_ICON
  return {
    id: str(t.id) || newSizeGuideId(`tip_${i}`),
    icon,
    title: str(t.title),
    text: str(t.text),
  }
}

/** Coerce one stored step. */
function normalizeStep(raw: any, i: number): Step {
  const s = raw && typeof raw === 'object' ? raw : {}
  return {
    id: str(s.id) || newSizeGuideId(`step_${i}`),
    image_url: str(s.image_url),
    text: str(s.text),
  }
}

/** Coerce one stored section, preserving array order (never re-sorts). */
function normalizeSection(raw: any, i: number): SizeGuideSection {
  const s = raw && typeof raw === 'object' ? raw : {}
  const video_url = str(s.video_url)
  const video_type =
    s.video_type === 'file' || s.video_type === 'embed'
      ? s.video_type
      : deriveVideoType(video_url)
  return {
    id: str(s.id) || newSizeGuideId(`sec_${i}`),
    title: str(s.title),
    subtitle: str(s.subtitle),
    image_url: str(s.image_url),
    video_url,
    video_type,
    tips: Array.isArray(s.tips) ? s.tips.map(normalizeTip) : [],
    steps: Array.isArray(s.steps) ? s.steps.map(normalizeStep) : [],
  }
}

/**
 * Merge a partial/legacy stored document over the defaults so missing keys never
 * crash the page. An explicitly empty `sections` array is respected — the admin
 * may have deleted every section.
 */
export function normalizeSizeGuide(raw: any): SizeGuideDoc {
  const doc = raw && typeof raw === 'object' ? raw : {}
  const hero = doc.hero && typeof doc.hero === 'object' ? doc.hero : {}
  return {
    hero: {
      eyebrow: str(hero.eyebrow, DEFAULT_SIZE_GUIDE.hero.eyebrow),
      title: str(hero.title, DEFAULT_SIZE_GUIDE.hero.title),
      subtitle: str(hero.subtitle, DEFAULT_SIZE_GUIDE.hero.subtitle),
      background_url: str(hero.background_url),
    },
    sections: Array.isArray(doc.sections)
      ? doc.sections.map(normalizeSection)
      : DEFAULT_SIZE_GUIDE.sections,
  }
}
