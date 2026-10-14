'use client'

import Link from 'next/link'
import { groupByFamily, type CategoryRef } from '@/lib/categoryScope'

/* ── Styles on the homepage ────────────────────────────────────────────────
   Each admin-managed section ("Rings By Style", "Bracelets By Style", …) is
   its own stacked box: heading, then that section's styles, then the next
   box — one category per section, exactly as briefed.

   · `sections` comes from `style_sections` (migration 120) and carries the
     admin's title / order / show-on-home switch,
   · only `is_active` sections render, and a section with no visible styles
     is skipped rather than leaving an empty box,
   · a style whose section is switched OFF stays off with it — it is not
     re-parked in a visible box (otherwise hiding three sections would dump
     all their styles into the first one),
   · styles with no section (newly added, or their section was deleted) are
     parked in the first active section so they never vanish,
   · when the table does not exist yet (`sections === null`) the component
     groups styles by category family on its own, so a pre-migration DB still
     shows something sensible.

   Visual language: soft card boxes, serif headings with a gold hairline,
   rounded 4:5 images, uppercase letterspaced labels. No hover-only text —
   everything the shopper needs is visible.                                       */

interface StyleItem {
  key: string
  name: string
  sub?: string
  desc?: string
  image?: string
  position?: number
  is_enabled?: boolean
  /** Category UUIDs this style belongs to (empty = every category). */
  category_ids?: string[]
  /** Homepage block this style sits in. */
  section_id?: string | null
  [key: string]: unknown
}

interface StyleSection {
  id: string
  key: string
  title: string
  category_ids?: string[]
  position?: number
  /** Admin's "show on homepage" switch. */
  is_active?: boolean
}

const FALLBACK: StyleItem[] = [
  { key: 'three-stone', name: 'Three Stone', sub: 'Classic elegance', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=900&q=90&fit=crop' },
  { key: 'solitaire', name: 'Solitaire', sub: 'Timeless beauty', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=900&q=90&fit=crop' },
  { key: 'pave', name: 'Pavé', sub: 'Sparkling luxury', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=900&q=90&fit=crop' },
  { key: 'rose-gold', name: 'Rose Gold', sub: 'Warm & romantic', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=900&q=90&fit=crop' },
  { key: 'platinum', name: 'Platinum', sub: 'Precious white', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&h=900&q=90&fit=crop' },
]

/* Admin rows can carry a blank image. Never pass '' to <img src> (the browser
   re-requests the whole page); fall back to the matching stock shot and,
   failing that, render a lettered plate instead of an image. */
const FALLBACK_BY_KEY = new Map(FALLBACK.map(f => [f.key, f.image]))
const styleImage = (s: StyleItem): string =>
  String(s.image || '').trim() || String(FALLBACK_BY_KEY.get(s.key) || '')

function LetterPlate({ name }: { name: string }) {
  return (
    <div className="st-plate" aria-hidden>
      {(name || '?').trim().slice(0, 1).toUpperCase()}
    </div>
  )
}

function StyleCard({ style }: { style: StyleItem }) {
  const img = styleImage(style)
  return (
    <Link href={`/collection?style=${style.key}`} className="st-card">
      <div className="st-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img ? <img src={img} alt={style.name} loading="lazy" draggable={false} /> : <LetterPlate name={style.name} />}
      </div>
      <div className="st-meta">
        <span className="st-name home-item-name">{style.name}</span>
        {style.sub ? <span className="st-sub">{style.sub}</span> : null}
      </div>
    </Link>
  )
}

function StyleBox({ title, styles }: { title: string; styles: StyleItem[] }) {
  if (!styles.length) return null
  return (
    <section className="st-box">
      <header className="st-head">
        <h3 className="st-title home-sec-title">{title}</h3>
      </header>
      <div className="st-grid">
        {styles.map(s => <StyleCard key={s.key} style={s} />)}
      </div>
    </section>
  )
}

export default function RingsByStyle({
  initialStyles,
  categories,
  sections,
}: {
  initialStyles?: StyleItem[]
  categories?: CategoryRef[]
  /** `null` = pre-migration DB (table missing) → auto-group by category. */
  sections?: StyleSection[] | null
}) {
  const styles = initialStyles?.length
    ? initialStyles.filter(s => s.is_enabled !== false)
    : FALLBACK

  let boxes: Array<{ title: string; rows: StyleItem[] }> = []

  if (Array.isArray(sections)) {
    const active = [...sections]
      .filter(s => s.is_active !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .filter(s => !!s.id)

    if (active.length) {
      const bySection = new Map<string, StyleItem[]>(active.map(s => [s.id, []]))
      const allIds = new Set(sections.map(s => s.id))
      const orphans: StyleItem[] = []
      for (const st of styles) {
        const id = st.section_id ? String(st.section_id) : ''
        if (id && allIds.has(id)) {
          // Belongs to a real section. If that section is switched OFF, its
          // styles must stay off too — they are deliberately NOT parked in a
          // visible box (that's what made all 19 pile into "Rings By Style").
          if (bySection.has(id)) bySection.get(id)!.push(st)
        } else {
          // Truly unplaced: no section, or the section row was deleted.
          orphans.push(st)
        }
      }
      // Unplaced styles ride along with the first active section.
      if (orphans.length) bySection.get(active[0].id)!.push(...orphans)
      boxes = active
        .map(s => ({ title: s.title || s.key || 'Styles', rows: bySection.get(s.id) || [] }))
        .filter(b => b.rows.length > 0)
    }
    // No active section at all → admin turned the widget off completely.
  } else {
    // Pre-migration fallback: group by jewellery family ourselves.
    boxes = groupByFamily(styles, categories || [])
      .map(g => ({
        title: g.title === 'Featured' ? 'Styles' : `${g.title} By Style`,
        rows: g.rows,
      }))
      .filter(g => g.rows.length > 0)
  }

  if (!boxes.length) return null

  return (
    <div className="st-root">
      <style>{CSS}</style>
      <div className="st-stack">
        {boxes.map(b => <StyleBox key={b.title} title={b.title} styles={b.rows} />)}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   CSS — soft stacked boxes, one per category
══════════════════════════════════════ */
const CSS = `
.st-root {
  width: 100%;
  padding: clamp(48px,6vw,80px) 0;
}

.st-stack {
  width: min(1240px, calc(100% - clamp(24px, 5vw, 64px)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  /* Space BETWEEN sections now that the boxes have no padding of their own. */
  gap: clamp(40px, 5vw, 72px);
}

/* ── One category = one section. Deliberately NO panel: no background, no
   border, no shadow — the block sits straight on the page, and the stack
   gap below supplies the breathing room between sections. ── */
.st-box {
  position: relative;
}

.st-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: clamp(28px, 3.4vw, 44px);
  text-align: center;
}

/* Box title typography comes from the shared .home-sec-title */
.st-title {
  margin: 0;
}

/* ── Cards ── */
.st-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
  gap: clamp(14px, 2vw, 26px);
  justify-items: center;
}

.st-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-decoration: none;
  width: 100%;
  max-width: 230px;
}

/* No white card behind the photo: the media box is transparent and the whole
   box multiplies into the page background, so the white studio backdrop of
   each product shot disappears instead of showing as a white rectangle.
   (Blend lives HERE, not on the img — a transform on hover would otherwise
   isolate the img and switch the blend off exactly when it matters.) */
.st-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  overflow: hidden;
  background: transparent;
  mix-blend-mode: multiply;
  transition: transform .35s cubic-bezier(.16, 1, .3, 1);
}

.st-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .6s cubic-bezier(.16, 1, .3, 1);
}

.st-plate {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #F6F1EA 0%, #EDE4D6 100%);
  color: #B79B6E;
  font-family: var(--font-main, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3rem, 6vw, 4rem);
  font-style: italic;
  user-select: none;
}

.st-card:hover .st-media {
  transform: translateY(-4px);
}

.st-card:hover .st-media img { transform: scale(1.07); }

.st-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.st-name {
  transition: color .25s ease;
}

.st-card:hover .st-name { color: #C9A96E; }

.st-sub {
  font-size: 12px;
  line-height: 1.5;
  color: #555;
}

/* ══════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════ */
@media (max-width: 720px) {
  .st-stack { width: calc(100% - 24px); gap: 34px; }
  /* Box title size comes from the shared .home-sec-title */
  /* Two cards per row — the whole box stays visible without swiping. */
  .st-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .st-card { max-width: none; gap: 10px; }
  .st-sub { font-size: 11.5px; }
}
`
