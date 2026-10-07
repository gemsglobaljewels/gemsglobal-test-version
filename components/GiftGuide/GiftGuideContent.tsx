'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Gift, Sparkles, Truck, ShieldCheck, RotateCcw, Heart,
  ArrowRight, Star,
} from 'lucide-react'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import ProductCard from '@/components/ProductCard'
import { GiftGuideConfig, GiftGuideRecipient } from '@/lib/giftGuide'

/* ════════════════════════════════════════════════════════════════
   GIFT GUIDE — public marketing page (2.0)
   Clean, rich, editorial. Pure-white canvas with warm taupe accent
   (--c-accent) and deep-brown ink. Cormorant + Bodoni serifs,
   DM Sans for UI. All styles scoped to `.gg-`. The page is driven by
   a single admin-editable GiftGuideConfig — the data contract is kept
   intact (hero, recipients, price tiers, curated rails, category
   cards, closing banner).
════════════════════════════════════════════════════════════════ */

interface RecipientCard extends GiftGuideRecipient {
  id?: string
}
interface CategoryNode {
  id: string
  name: string
  slug: string
  parent_category_id: string | null
  /** category thumbnail (image_url → header_image_url fallback), for the "Shop by Category" cards */
  image?: string
  /** optional editorial blurb (header_description) shown under the category title */
  description?: string
}

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1000&fit=crop&q=85'

const ASSURANCES = [
  { icon: Gift, title: 'Signature Gift Boxing', sub: 'On every single order' },
  { icon: Truck, title: 'Complimentary Shipping', sub: 'Fully insured, worldwide' },
  { icon: ShieldCheck, title: 'Lifetime Warranty', sub: 'Certified & authentic' },
  { icon: RotateCcw, title: 'Easy 30-Day Returns', sub: 'Gift with confidence' },
]

export default function GiftGuideContent({
  config,
  products,
  recipientCards,
  allCategories,
}: {
  config: GiftGuideConfig
  products: any[]
  /** Live recipient categories (show_on_recipient) — same source as the homepage rail. */
  recipientCards?: RecipientCard[]
  /** Full category tree — resolves recipient descendants AND powers "Shop by Category". */
  allCategories?: CategoryNode[]
}) {
  const { hero, closing } = config

  /* ── prefer live DB recipient categories; fall back to admin config tiles ── */
  const liveRecipients = recipientCards && recipientCards.length > 0 ? recipientCards : null
  const recipients = useMemo(() => {
    if (!liveRecipients) return config.recipients
    const vis = config.recipient_visibility || {}
    return liveRecipients.filter((r) => !r.id || vis[r.id] !== false)
  }, [liveRecipients, config.recipients, config.recipient_visibility])

  /* ── recipient → own + descendant categories (for scoping the For Her/Him rails) ── */
  const descendantsOf = useMemo(() => {
    const tree = allCategories || []
    const byId = new Map<string, CategoryNode>()
    const childrenByParent = new Map<string, string[]>()
    for (const c of tree) {
      byId.set(c.id, c)
      if (c.parent_category_id) {
        const arr = childrenByParent.get(c.parent_category_id) || []
        arr.push(c.id)
        childrenByParent.set(c.parent_category_id, arr)
      }
    }
    const norm = (s: string) => String(s || '').toLowerCase().trim()
    const collect = (rootId: string, rootLabel?: string) => {
      const ids = new Set<string>([rootId])
      const names = new Set<string>()
      if (rootLabel) names.add(norm(rootLabel))
      const stack = [rootId]
      while (stack.length) {
        const cur = stack.pop()!
        const cat = byId.get(cur)
        if (cat) {
          if (cat.name) names.add(norm(cat.name))
          if (cat.slug) names.add(norm(cat.slug))
        }
        for (const child of childrenByParent.get(cur) || []) {
          if (!ids.has(child)) {
            ids.add(child)
            stack.push(child)
          }
        }
      }
      return { ids, names }
    }
    const m = new Map<string, { ids: Set<string>; names: Set<string> }>()
    for (const r of liveRecipients || []) {
      if (r.id) m.set(r.id, collect(r.id, r.label))
    }
    return m
  }, [allCategories, liveRecipients])

  const byId = useMemo(() => {
    const m = new Map<string, any>()
    for (const p of products) m.set(String(p.id), p)
    return m
  }, [products])

  const findRecipient = (re: RegExp) =>
    (liveRecipients || []).find((r) => r.id && (re.test(r.label) || re.test(r.link)))
  const herRecipient = findRecipient(/\b(her|hers|women|woman|womens|ladies|lady|female)\b/i)
  const himRecipient = findRecipient(/\b(him|his|men|man|mens|male|gent|gents|boy|boys)\b/i)

  const railProducts = (pickedIds: string[] | undefined, recId?: string) => {
    const picked = (pickedIds || []).map((id) => byId.get(String(id))).filter(Boolean)
    const allowed = recId ? descendantsOf.get(recId) : null
    if (!allowed) return picked.slice(0, 8)
    const inRecipient = (p: any) => {
      if (p.category_id != null && allowed.ids.has(String(p.category_id))) return true
      const nm = String(p.category || p.categories?.name || '').toLowerCase().trim()
      return !!nm && (allowed.names.has(nm) || allowed.names.has(nm.replace(/\s+/g, '-')))
    }
    const pickedInRecipient = picked.filter(inRecipient)
    if (pickedInRecipient.length) return pickedInRecipient.slice(0, 8)
    return products
      .filter((p) => Number(p.price || 0) > 0 && inRecipient(p))
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
      .slice(0, 8)
  }
  const herProducts = railProducts(config.her_product_ids, herRecipient?.id)
  const himProducts = railProducts(config.him_product_ids, himRecipient?.id)

  /* ── interactive "Gifts by Price" ── */
  const priceTiers = useMemo(
    () => (config.price_tiers || []).filter((t) => t.is_enabled && Number(t.max) > 0),
    [config.price_tiers]
  )
  const [activeTier, setActiveTier] = useState(0)
  const tierProducts = useMemo(() => {
    const t = priceTiers[activeTier]
    if (!t) return []
    return products
      .filter((p) => {
        const price = Number(p.price || 0)
        return price > 0 && price <= Number(t.max)
      })
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
      .slice(0, 8)
  }, [priceTiers, activeTier, products])
  const activeTierMax = priceTiers[activeTier]?.max

  /* ── "Shop by Category" — real site categories the admin opted in via
     config.category_visibility (opt-in: only ids explicitly set to true). ── */
  const categoryCards = useMemo(() => {
    const vis = config.category_visibility || {}
    return (allCategories || [])
      .filter((c) => vis[c.id] === true)
      .map((c) => ({
        id: c.id,
        title: c.name,
        image: c.image || FALLBACK_IMG,
        description: c.description || '',
        link: `/collection?category=${c.slug}`,
      }))
  }, [allCategories, config.category_visibility])

  /* ── "Shop by Category" drag-to-scroll slider (mirrors the homepage rail) ──
     Mouse-only manual drag (touch uses native overflow scrolling) with no
     pointer capture: capturing retargets the subsequent click away from the
     card, silently killing tap navigation on touch devices. A tap counts as
     a drag only past 10px of mostly-horizontal movement. */
  const router = useRouter()
  const catTrackRef = useRef<HTMLDivElement>(null)
  const catDrag = useRef({ active: false, moved: false, startX: 0, startY: 0, scrollLeft: 0 })

  const onCatPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const el = catTrackRef.current
    if (!el) return
    catDrag.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft }
  }, [])

  const onCatPointerMove = useCallback((e: React.PointerEvent) => {
    const st = catDrag.current
    const el = catTrackRef.current
    if (!st.active || !el || e.pointerType !== 'mouse') return
    const dx = e.clientX - st.startX
    const dy = e.clientY - st.startY
    if (!st.moved && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      st.moved = true
    }
    if (st.moved) {
      el.scrollLeft = st.scrollLeft - dx
    }
  }, [])

  const endCatDrag = useCallback(() => {
    catDrag.current.active = false
    catDrag.current.moved = false
  }, [])

  /* suppress navigation when the pointer-up ends a drag, not a tap */
  const goCategory = useCallback(
    (link: string) => {
      if (catDrag.current.moved) {
        catDrag.current.moved = false
        return
      }
      router.push(link)
    },
    [router]
  )

  /* ── graceful scroll-reveal (no flash: only pre-hide off-screen blocks) ── */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const els = Array.from(document.querySelectorAll<HTMLElement>('.gg-page [data-reveal]'))
    if (!('IntersectionObserver' in window) || !els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('gg-in')
            e.target.classList.remove('gg-pre')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    )
    for (const el of els) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.88) {
        el.classList.add('gg-pre')
        io.observe(el)
      }
    }
    return () => io.disconnect()
  }, [])

  return (
    <>
      <style>{CSS}</style>
      {/* Header lives OUTSIDE the overflow-clipping wrapper so its
          position:sticky keeps working (an overflow-x ancestor would
          create a scroll container and break the sticky scroll-hide). */}
      <HeaderMegaMenu />

      <main className="gg-page" suppressHydrationWarning>
        {/* ── 1. HERO ─────────────────────────────────────────── */}
        <section className="gg-hero">
          <div className="gg-hero-glow" aria-hidden="true" />
          <div className="gg-hero-copy" data-reveal>
            <p className="gg-eyebrow"><span className="gg-eyebrow-rule" />{hero.eyebrow}</p>
            <h1 className="gg-hero-title">
              {hero.title} {hero.accent && <em>{hero.accent}</em>}
            </h1>
            <p className="gg-hero-sub">{hero.subtitle}</p>
            <div className="gg-hero-actions">
              {hero.primary_cta_text && (
                <Link href={hero.primary_cta_link || '/collection'} className="gg-btn gg-btn--primary">
                  <span>{hero.primary_cta_text}</span>
                  <ArrowRight size={17} className="gg-btn-ico" />
                </Link>
              )}
              {hero.secondary_cta_text && (
                <Link href={hero.secondary_cta_link || '#gg-price'} className="gg-btn gg-btn--ghost">
                  <span>{hero.secondary_cta_text}</span>
                </Link>
              )}
            </div>
            <div className="gg-hero-trust">
              <span className="gg-stars" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </span>
              <span className="gg-hero-trust-tx">Loved by <strong>10,000+</strong> thoughtful gifters</span>
            </div>
          </div>

          <div className="gg-hero-media" data-reveal>
            <div className="gg-hero-frame">
              <img src={hero.image || FALLBACK_IMG} alt="" className="gg-hero-img" />
              <span className="gg-hero-frame-line" aria-hidden="true" />
            </div>
            <span className="gg-hero-badge">
              <Gift size={14} /> Signature Gift Boxing
            </span>
            <span className="gg-hero-chip">
              <Sparkles size={15} className="gg-hero-chip-ico" />
              <span>
                <strong>Hand-selected</strong>
                <em>Gift-ready in 24h</em>
              </span>
            </span>
          </div>
        </section>

        {/* ── 2. ASSURANCE STRIP ──────────────────────────────── */}
        <section className="gg-assure" data-reveal>
          <div className="gg-assure-in">
            {ASSURANCES.map((a, i) => (
              <div className="gg-assure-item" key={i}>
                <span className="gg-assure-ico"><a.icon size={20} strokeWidth={1.5} /></span>
                <span className="gg-assure-tx">
                  <strong>{a.title}</strong>
                  <em>{a.sub}</em>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. SHOP BY RECIPIENT ────────────────────────────── */}
        {recipients?.length > 0 && (
          <section className="gg-section">
            <SectionHead eyebrow="Shop by recipient" title={config.recipients_title} data-reveal />
            <div className="gg-recipients" data-reveal>
              {recipients.map((r, i) => (
                <Link
                  key={r.id || i}
                  href={r.link || '/collection'}
                  className="gg-rec-card"
                  aria-label={`Shop ${r.label}`}
                >
                  <div className="gg-rec-img-box">
                    <img
                      src={r.image || FALLBACK_IMG}
                      alt={r.label}
                      className="gg-rec-img"
                      loading="lazy"
                    />
                    <span className="gg-rec-shade" aria-hidden="true" />
                    <span className="gg-rec-plate">
                      <span className="gg-rec-name">{r.label}</span>
                      <span className="gg-rec-cta">Shop Now <ArrowRight size={14} className="gg-arrow" /></span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. GIFTS BY PRICE (interactive) ─────────────────── */}
        {priceTiers.length > 0 && (
          <section className="gg-section gg-section--tint" id="gg-price">
            <div className="gg-wrap">
              <SectionHead eyebrow="Gifts by budget" title={config.price_title} sub={config.price_subtitle} data-reveal />
              <div className="gg-tiers" data-reveal role="tablist" aria-label="Gift price tiers">
                {priceTiers.map((t, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === activeTier}
                    className={`gg-tier${i === activeTier ? ' is-active' : ''}`}
                    onClick={() => setActiveTier(i)}
                  >
                    <span className="gg-tier-cap">Under</span>
                    <span className="gg-tier-amt">{t.label}</span>
                    <span className="gg-tier-note">Perfect little luxuries</span>
                  </button>
                ))}
              </div>

              {tierProducts.length > 0 ? (
                <>
                  <div className="gg-grid gg-tier-reveal" key={activeTier}>
                    {tierProducts.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                  <div className="gg-viewall" data-reveal>
                    <Link href="/collection" className="gg-btn gg-btn--outline">
                      <span>Browse all gifts under {priceTiers[activeTier]?.label}</span>
                      <ArrowRight size={16} className="gg-btn-ico" />
                    </Link>
                  </div>
                </>
              ) : (
                <p className="gg-empty">
                  No gifts under {priceTiers[activeTier]?.label} just yet — explore the full{' '}
                  <Link href="/collection" className="gg-inline-link">collection</Link>.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── 5. FOR HER ──────────────────────────────────────── */}
        {herProducts.length > 0 && (
          <section className="gg-section">
            <SectionHead eyebrow="Curated edit" title={config.her_title || 'For Her'} data-reveal />
            <div className="gg-grid" data-reveal>
              {herProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="gg-viewall" data-reveal>
              <Link href={herRecipient ? herRecipient.link : '/collection'} className="gg-btn gg-btn--outline">
                <span>View all gifts for her</span>
                <ArrowRight size={16} className="gg-btn-ico" />
              </Link>
            </div>
          </section>
        )}

        {/* ── 6. FOR HIM ──────────────────────────────────────── */}
        {himProducts.length > 0 && (
          <section className="gg-section gg-section--tint">
            <div className="gg-wrap">
              <SectionHead eyebrow="Curated edit" title={config.him_title || 'For Him'} data-reveal />
              <div className="gg-grid" data-reveal>
                {himProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="gg-viewall" data-reveal>
                <Link href={himRecipient ? himRecipient.link : '/collection'} className="gg-btn gg-btn--outline">
                  <span>View all gifts for him</span>
                  <ArrowRight size={16} className="gg-btn-ico" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── 7. SHOP BY CATEGORY — homepage-style drag-scroll slider ───────────── */}
        {categoryCards.length > 0 && (
          <section className="gg-section">
            <SectionHead eyebrow="By category" title={config.categories_title} data-reveal />
            <div
              ref={catTrackRef}
              className="gg-catslide-track"
              data-reveal
              onPointerDown={onCatPointerDown}
              onPointerMove={onCatPointerMove}
              onPointerUp={endCatDrag}
              onPointerCancel={endCatDrag}
            >
              {categoryCards.map((c) => (
                <article
                  key={c.id}
                  className="gg-catslide-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`Shop ${c.title}`}
                  onClick={() => goCategory(c.link)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(c.link)
                    }
                  }}
                >
                  <div className="gg-catslide-img-box">
                    <img
                      src={c.image}
                      alt={c.title}
                      className="gg-catslide-img"
                      draggable={false}
                      loading="lazy"
                    />
                  </div>
                  <div className="gg-catslide-info">
                    <p className="gg-catslide-name">{c.title}</p>
                    <span className="gg-catslide-cta">
                      Shop Now
                      <ArrowRight size={14} className="gg-arrow gg-catslide-chevron" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── 8. THE GIFTING PROMISE ──────────────────────────── */}
        <section className="gg-promise" data-reveal>
          <div className="gg-promise-in">
            <p className="gg-eyebrow gg-eyebrow--center"><span className="gg-eyebrow-rule" />Why gift with us<span className="gg-eyebrow-rule" /></p>
            <h2 className="gg-promise-title">Every gift, made <em>unforgettable</em></h2>
            <div className="gg-promise-grid">
              <div className="gg-promise-card">
                <span className="gg-promise-ico"><Gift size={22} strokeWidth={1.5} /></span>
                <h3>Beautifully Boxed</h3>
                <p>Each piece arrives cradled in our signature gift box, ribbon-tied and ready to give.</p>
              </div>
              <div className="gg-promise-card">
                <span className="gg-promise-ico"><Sparkles size={22} strokeWidth={1.5} /></span>
                <h3>Personal Touch</h3>
                <p>Add a handwritten note and complimentary engraving to make it truly one of a kind.</p>
              </div>
              <div className="gg-promise-card">
                <span className="gg-promise-ico"><Heart size={22} strokeWidth={1.5} /></span>
                <h3>Concierge Styling</h3>
                <p>Not sure what to choose? Our stylists help you find the perfect piece — free of charge.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. CLOSING CTA ──────────────────────────────────── */}
        <section className={`gg-closing ${closing.theme === 'dark' ? 'is-dark' : 'is-accent'}`} data-reveal>
          <span className="gg-closing-orn" aria-hidden="true" />
          <div className="gg-closing-in">
            {closing.eyebrow && <p className="gg-closing-eyebrow">{closing.eyebrow}</p>}
            <h2 className="gg-closing-title">
              {closing.title} {closing.accent && <em>{closing.accent}</em>}
            </h2>
            {closing.subtitle && <p className="gg-closing-sub">{closing.subtitle}</p>}
            {closing.cta_text && (
              <Link href={closing.cta_link || '/appointments'} className="gg-closing-btn">
                <span>{closing.cta_text}</span>
                <ArrowRight size={17} className="gg-arrow" />
              </Link>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}

/* ── Section heading ─────────────────────────────────────────── */
function SectionHead({
  eyebrow,
  title,
  sub,
  ...rest
}: {
  eyebrow?: string
  title: string
  sub?: string
  [key: string]: any
}) {
  return (
    <div className="gg-head" {...rest}>
      {eyebrow && <span className="gg-head-eyebrow">{eyebrow}</span>}
      <h2 className="gg-head-title">{title}</h2>
      {sub && <p className="gg-head-sub">{sub}</p>}
      <span className="gg-head-rule" aria-hidden="true" />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   SCOPED CSS  ·  white canvas, warm-taupe accent, deep-brown ink
════════════════════════════════════════════════════════════════ */
const CSS = `
.gg-page{
  --gg-ink:#241d18;
  --gg-body:#5c5048;
  --gg-muted:#8a7d72;
  --gg-accent:#8f7a70;
  --gg-accent-deep:#6f5c52;
  --gg-line:rgba(36,29,24,.09);
  --gg-line-2:rgba(36,29,24,.14);
  --gg-tint:#faf7f3;
  --gg-tint-2:#f4efe9;
  --gg-serif:var(--font-playfair, 'Cormorant Garamond', Georgia, serif);
  --gg-display:var(--font-main, 'Bodoni Moda', Georgia, serif);
  --gg-sans:var(--font-dmsans, system-ui, sans-serif);
  --gg-e:cubic-bezier(.22,1,.36,1);
  --gg-shadow:0 22px 60px -28px rgba(36,29,24,.42);
  background:#fff; color:var(--gg-body); min-height:100vh; overflow-x:clip;
}
.gg-page *{ box-sizing:border-box; }

/* ── scroll reveal ── */
.gg-pre{ opacity:0; transform:translateY(28px); }
.gg-in{ animation:ggReveal .85s var(--gg-e) both; }
@keyframes ggReveal{ from{ opacity:0; transform:translateY(28px);} to{ opacity:1; transform:none;} }

/* ── shared layout ── */
.gg-section{ position:relative; padding:clamp(56px,7.5vw,104px) clamp(18px,4vw,52px); }
.gg-section > *{ max-width:1240px; margin-left:auto; margin-right:auto; }
.gg-section--tint{ background:var(--gg-tint); border-top:1px solid var(--gg-line); border-bottom:1px solid var(--gg-line); }
.gg-wrap{ max-width:1240px; margin:0 auto; }

/* ── shared buttons / CTAs ── */
.gg-btn{
  position:relative; display:inline-flex; align-items:center; gap:10px;
  font-family:var(--gg-sans); font-size:12.5px; font-weight:600; letter-spacing:.11em;
  text-transform:uppercase; text-decoration:none; cursor:pointer;
  padding:15px 30px; border-radius:999px; border:1px solid transparent;
  transition:transform .3s var(--gg-e), box-shadow .3s var(--gg-e), background .3s ease, color .3s ease, border-color .3s ease;
  white-space:nowrap;
}
.gg-btn-ico{ transition:transform .3s var(--gg-e); }
.gg-btn:hover .gg-btn-ico{ transform:translateX(4px); }
.gg-btn--primary{ background:var(--gg-ink); color:#fff; box-shadow:0 14px 30px -14px rgba(36,29,24,.55); }
.gg-btn--primary:hover{ background:var(--gg-accent-deep); transform:translateY(-2px); box-shadow:0 20px 40px -16px rgba(111,92,82,.6); }
.gg-btn--ghost{ background:transparent; color:var(--gg-ink); border-color:var(--gg-line-2); padding:15px 26px; }
.gg-btn--ghost:hover{ border-color:var(--gg-accent); color:var(--gg-accent-deep); transform:translateY(-2px); }
.gg-btn--outline{ background:#fff; color:var(--gg-ink); border-color:var(--gg-line-2); }
.gg-btn--outline:hover{ border-color:var(--gg-accent); color:var(--gg-accent-deep); transform:translateY(-2px); box-shadow:var(--shadow-md); }

/* ── shared section heading ── */
.gg-head{ display:flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:clamp(30px,4vw,52px); }
.gg-head-eyebrow{
  font-family:var(--gg-sans); font-size:11px; font-weight:700; letter-spacing:.34em;
  text-transform:uppercase; color:var(--gg-accent); margin-bottom:14px;
}
.gg-head-title{
  font-family:var(--gg-serif); font-size:clamp(30px,4.6vw,50px); font-weight:500; line-height:1.06;
  letter-spacing:.004em; color:var(--gg-ink); margin:0;
}
.gg-head-sub{
  font-family:var(--gg-sans); font-size:15px; font-weight:300; line-height:1.7;
  color:var(--gg-muted); max-width:540px; margin:16px auto 0;
}
.gg-head-rule{ display:block; width:52px; height:2px; border-radius:2px; background:var(--gg-accent); opacity:.6; margin-top:22px; }

/* eyebrow (hero + promise) */
.gg-eyebrow{
  display:inline-flex; align-items:center; gap:12px;
  font-family:var(--gg-sans); font-size:12px; font-weight:700; letter-spacing:.32em;
  text-transform:uppercase; color:var(--gg-accent); margin:0 0 22px;
}
.gg-eyebrow--center{ justify-content:center; }
.gg-eyebrow-rule{ display:block; width:30px; height:1px; background:var(--gg-accent); opacity:.55; }

/* ══ 1. HERO ══ */
.gg-hero{
  position:relative; max-width:1300px; margin:0 auto;
  padding:clamp(40px,6vw,92px) clamp(18px,4vw,52px) clamp(30px,4vw,56px);
  display:grid; grid-template-columns:1.02fr .98fr; gap:clamp(34px,5vw,84px); align-items:center;
}
.gg-hero-glow{
  position:absolute; top:-10%; right:-6%; width:60%; height:120%; z-index:0; pointer-events:none;
  background:radial-gradient(60% 55% at 70% 40%, rgba(143,122,112,.14), transparent 70%);
}
.gg-hero-copy, .gg-hero-media{ position:relative; z-index:1; }
.gg-hero-title{
  font-family:var(--gg-display); font-size:clamp(40px,6.4vw,78px); font-weight:400; line-height:1.02;
  letter-spacing:-.012em; color:var(--gg-ink); margin:0 0 24px;
}
.gg-hero-title em{ font-family:var(--gg-serif); font-style:italic; font-weight:500; color:var(--gg-accent); }
.gg-hero-sub{
  font-family:var(--gg-sans); font-size:clamp(15px,1.5vw,17px); font-weight:300; line-height:1.78;
  color:var(--gg-body); max-width:490px; margin:0 0 34px;
}
.gg-hero-actions{ display:flex; flex-wrap:wrap; gap:14px; margin-bottom:30px; }
.gg-hero-trust{ display:flex; align-items:center; gap:12px; }
.gg-stars{ display:inline-flex; gap:2px; color:#c9a35a; }
.gg-hero-trust-tx{ font-family:var(--gg-sans); font-size:13px; font-weight:300; color:var(--gg-muted); }
.gg-hero-trust-tx strong{ font-weight:600; color:var(--gg-ink); }

.gg-hero-media{ position:relative; }
.gg-hero-frame{
  position:relative; border-radius:clamp(16px,1.8vw,26px); overflow:hidden;
  aspect-ratio:5/6; box-shadow:var(--gg-shadow);
}
.gg-hero-frame-line{ position:absolute; inset:12px; border:1px solid rgba(255,255,255,.4); border-radius:inherit; pointer-events:none; z-index:2; }
.gg-hero-img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform 1.2s var(--gg-e); }
.gg-hero-media:hover .gg-hero-img{ transform:scale(1.05); }
.gg-hero-badge{
  position:absolute; left:-16px; top:30px; z-index:3;
  display:inline-flex; align-items:center; gap:8px; background:#fff; color:var(--gg-accent-deep);
  font-family:var(--gg-sans); font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  padding:12px 18px; border-radius:999px; border:1px solid var(--gg-line-2); box-shadow:0 14px 30px -14px rgba(36,29,24,.4);
}
.gg-hero-chip{
  position:absolute; right:-14px; bottom:28px; z-index:3;
  display:inline-flex; align-items:center; gap:12px; background:#fff;
  padding:13px 20px 13px 14px; border-radius:16px; border:1px solid var(--gg-line-2);
  box-shadow:0 18px 40px -18px rgba(36,29,24,.45);
}
.gg-hero-chip-ico{ color:var(--gg-accent); }
.gg-hero-chip span:not(.gg-hero-chip-ico){ display:flex; flex-direction:column; line-height:1.2; }
.gg-hero-chip strong{ font-family:var(--gg-sans); font-size:13px; font-weight:700; color:var(--gg-ink); }
.gg-hero-chip em{ font-family:var(--gg-sans); font-size:11px; font-style:normal; color:var(--gg-muted); margin-top:2px; }
@media(max-width:880px){
  .gg-hero{ grid-template-columns:1fr; gap:40px; text-align:center; padding-top:36px; }
  .gg-hero-sub{ margin-left:auto; margin-right:auto; }
  .gg-hero-actions, .gg-hero-trust{ justify-content:center; }
  .gg-hero-glow{ display:none; }
  .gg-hero-frame{ max-width:430px; margin:0 auto; aspect-ratio:4/5; }
  .gg-hero-badge{ left:8px; }
  .gg-hero-chip{ right:8px; }
}
@media(max-width:460px){
  .gg-hero-badge{ left:50%; transform:translateX(-50%); top:auto; bottom:auto; top:14px; }
  .gg-hero-chip{ right:12px; bottom:14px; padding:10px 14px; }
}

/* ══ 2. ASSURANCE STRIP ══ */
.gg-assure{ border-top:1px solid var(--gg-line); border-bottom:1px solid var(--gg-line); background:#fff; }
.gg-assure-in{
  max-width:1240px; margin:0 auto; padding:26px clamp(18px,4vw,52px);
  display:grid; grid-template-columns:repeat(4,1fr); gap:22px;
}
.gg-assure-item{ display:flex; align-items:center; gap:14px; min-width:0; }
.gg-assure-item + .gg-assure-item{ position:relative; }
.gg-assure-ico{
  width:46px; height:46px; flex-shrink:0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;
  color:var(--gg-accent-deep); background:var(--gg-tint-2); border:1px solid var(--gg-line);
}
.gg-assure-tx{ display:flex; flex-direction:column; min-width:0; }
.gg-assure-tx strong{ font-family:var(--gg-sans); font-size:13.5px; font-weight:600; color:var(--gg-ink); line-height:1.25; }
.gg-assure-tx em{ font-family:var(--gg-sans); font-size:12px; font-style:normal; color:var(--gg-muted); margin-top:2px; }
@media(max-width:900px){ .gg-assure-in{ grid-template-columns:repeat(2,1fr); gap:20px 18px; } }
@media(max-width:420px){ .gg-assure-in{ grid-template-columns:1fr; } }

/* ══ 3. RECIPIENTS ══ */
.gg-recipients{ display:grid; grid-template-columns:repeat(4,1fr); gap:clamp(14px,1.8vw,24px); }
.gg-rec-card{
  display:block; text-decoration:none; border-radius:clamp(14px,1.4vw,20px); overflow:hidden;
  box-shadow:0 10px 30px -18px rgba(36,29,24,.4); transition:transform .45s var(--gg-e), box-shadow .45s var(--gg-e);
}
.gg-rec-card:hover{ transform:translateY(-6px); box-shadow:0 26px 50px -22px rgba(36,29,24,.5); }
.gg-rec-img-box{ position:relative; width:100%; aspect-ratio:4/5; overflow:hidden; background:var(--gg-tint-2); }
.gg-rec-img{ width:100%; height:100%; object-fit:cover; object-position:center 22%; transition:transform 1s var(--gg-e); }
.gg-rec-card:hover .gg-rec-img{ transform:scale(1.07); }
.gg-rec-shade{ position:absolute; inset:0; background:linear-gradient(to top, rgba(24,18,13,.82) 0%, rgba(24,18,13,.28) 42%, transparent 72%); }
.gg-rec-plate{ position:absolute; left:0; right:0; bottom:0; padding:20px; display:flex; flex-direction:column; gap:8px; }
.gg-rec-name{ font-family:var(--gg-serif); font-size:clamp(20px,2vw,26px); font-weight:500; color:#fff; line-height:1.1; }
.gg-rec-cta{
  display:inline-flex; align-items:center; gap:6px; font-family:var(--gg-sans);
  font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#f2e4d8;
}
.gg-arrow{ transition:transform .3s var(--gg-e); }
.gg-rec-card:hover .gg-arrow{ transform:translateX(4px); }
@media(max-width:880px){ .gg-recipients{ grid-template-columns:repeat(2,1fr); } }

/* ══ 4. PRICE TIERS ══ */
.gg-tiers{ display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(14px,1.8vw,22px); max-width:920px; margin:0 auto clamp(40px,4.5vw,56px); }
.gg-tier{
  position:relative; display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;
  padding:clamp(26px,3.2vw,40px) 18px; cursor:pointer; background:#fff;
  border:1px solid var(--gg-line-2); border-radius:16px; font-family:inherit;
  transition:transform .35s var(--gg-e), box-shadow .35s var(--gg-e), border-color .35s ease, background .35s ease;
}
.gg-tier::after{
  content:''; position:absolute; left:24px; right:24px; bottom:0; height:3px; border-radius:3px;
  background:var(--gg-accent); transform:scaleX(0); transform-origin:center; transition:transform .4s var(--gg-e);
}
.gg-tier:hover{ transform:translateY(-4px); box-shadow:0 20px 44px -22px rgba(36,29,24,.4); border-color:var(--gg-accent); }
.gg-tier.is-active{ background:#fff; border-color:var(--gg-accent); box-shadow:0 20px 44px -20px rgba(111,92,82,.4); }
.gg-tier.is-active::after{ transform:scaleX(1); }
.gg-tier-cap{ font-family:var(--gg-sans); font-size:10.5px; font-weight:700; letter-spacing:.24em; text-transform:uppercase; color:var(--gg-muted); }
.gg-tier-amt{ font-family:var(--gg-serif); font-size:clamp(38px,5vw,58px); font-weight:500; line-height:1; color:var(--gg-ink); }
.gg-tier.is-active .gg-tier-amt{ color:var(--gg-accent-deep); }
.gg-tier-note{ font-family:var(--gg-sans); font-size:11.5px; font-weight:300; color:var(--gg-muted); }
.gg-tier-reveal{ animation:ggFade .55s var(--gg-e); }
@keyframes ggFade{ from{ opacity:0; transform:translateY(14px);} to{ opacity:1; transform:none;} }
@media(max-width:620px){ .gg-tiers{ grid-template-columns:1fr; max-width:360px; } }

/* ── product grid (shared) ── */
.gg-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:clamp(14px,1.8vw,26px); align-items:stretch; }
@media(max-width:1024px){ .gg-grid{ grid-template-columns:repeat(3,1fr); } }
@media(max-width:760px){ .gg-grid{ grid-template-columns:repeat(2,1fr); } }
.gg-viewall{ display:flex; justify-content:center; margin-top:clamp(30px,3.8vw,46px); }
.gg-empty{ text-align:center; padding:40px 20px; color:var(--gg-muted); font-family:var(--gg-sans); font-size:15px; }
.gg-inline-link, .gg-inline-link:hover{ color:var(--gg-accent-deep); text-decoration:underline; }

/* ══ 7. SHOP BY CATEGORY — homepage-style slider ══
   Mirrors components/Categories.tsx: a centred grid up to 5 cards that
   turns into a horizontal drag-scroll slider from the 6th card on, and a
   horizontal strip on mobile. Beige card + square image + "Shop Now" CTA. */
.gg-catslide-track{
  display:grid; grid-template-columns:repeat(5,1fr);
  gap:clamp(12px,1.4vw,18px);
  max-width:1240px; margin:0 auto; padding:0 clamp(4px,1vw,12px);
  box-sizing:border-box; cursor:default;
  user-select:none; -webkit-user-select:none;
}
/* becomes a drag-scroll slider once there are 6+ categories */
.gg-catslide-track:has(.gg-catslide-card:nth-child(6)){
  display:flex; overflow-x:auto; scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch; scrollbar-width:none;
  padding:0 2px 10px; scroll-behavior:smooth;
}
.gg-catslide-track::-webkit-scrollbar{ display:none; }

.gg-catslide-card{
  display:flex; flex-direction:column; border-radius:clamp(12px,1.4vw,20px);
  background:#ede8df; overflow:hidden; cursor:pointer; outline:none; flex-shrink:0;
  border:1px solid var(--gg-line);
  transition:transform .35s var(--gg-e), box-shadow .35s var(--gg-e), border-color .35s ease;
  -webkit-user-drag:none;
}
.gg-catslide-track:has(.gg-catslide-card:nth-child(6)) .gg-catslide-card{
  width:clamp(190px,15vw,230px); scroll-snap-align:start;
}
.gg-catslide-card:hover{ transform:translateY(-4px); box-shadow:0 20px 44px -22px rgba(36,29,24,.42); border-color:var(--gg-line-2); }
.gg-catslide-card:focus-visible{ box-shadow:0 0 0 3px var(--gg-accent); }

.gg-catslide-img-box{ position:relative; width:100%; aspect-ratio:1/1; overflow:hidden; background:var(--gg-tint-2); }
.gg-catslide-img{
  width:100%; height:100%; object-fit:cover; object-position:center 20%;
  transition:transform .9s var(--gg-e); pointer-events:none; -webkit-user-drag:none;
}
.gg-catslide-card:hover .gg-catslide-img{ transform:scale(1.06); }

.gg-catslide-info{ padding:clamp(12px,1.2vw,16px) clamp(12px,1.2vw,16px) clamp(14px,1.4vw,18px); display:flex; flex-direction:column; gap:6px; background:#ede8df; }
.gg-catslide-name{ margin:0; font-family:var(--gg-serif); font-size:clamp(16px,1.5vw,21px); font-weight:600; line-height:1.16; letter-spacing:.006em; color:var(--gg-ink); }
.gg-catslide-cta{
  display:inline-flex; align-items:center; gap:5px; font-family:var(--gg-sans);
  font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  color:var(--gg-ink); transition:gap .3s var(--gg-e);
}
.gg-catslide-card:hover .gg-catslide-cta{ gap:9px; }
.gg-catslide-chevron{ flex-shrink:0; }
.gg-catslide-card:hover .gg-catslide-chevron{ transform:translateX(3px); }

/* Mobile: always a horizontal drag-scroll strip */
@media(max-width:768px){
  .gg-catslide-track,
  .gg-catslide-track:has(.gg-catslide-card:nth-child(6)){
    display:flex; flex-direction:row; overflow-x:auto; overflow-y:hidden;
    scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;
    gap:14px; padding:0 4px 14px; scrollbar-width:none;
  }
  .gg-catslide-card,
  .gg-catslide-track:has(.gg-catslide-card:nth-child(6)) .gg-catslide-card{
    width:clamp(180px,64vw,240px); scroll-snap-align:start;
  }
}

/* ══ 8. GIFTING PROMISE ══ */
.gg-promise{ background:var(--gg-tint); border-top:1px solid var(--gg-line); padding:clamp(60px,8vw,110px) clamp(18px,4vw,52px); }
.gg-promise-in{ max-width:1080px; margin:0 auto; text-align:center; }
.gg-promise-title{ font-family:var(--gg-serif); font-size:clamp(28px,4.2vw,46px); font-weight:500; line-height:1.08; color:var(--gg-ink); margin:0 0 clamp(38px,4.5vw,56px); }
.gg-promise-title em{ font-style:italic; color:var(--gg-accent); }
.gg-promise-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(20px,2.6vw,36px); }
.gg-promise-card{ display:flex; flex-direction:column; align-items:center; text-align:center; padding:clamp(24px,2.6vw,34px) 22px; background:#fff; border:1px solid var(--gg-line); border-radius:18px; transition:transform .4s var(--gg-e), box-shadow .4s var(--gg-e); }
.gg-promise-card:hover{ transform:translateY(-4px); box-shadow:0 22px 46px -26px rgba(36,29,24,.4); }
.gg-promise-ico{ width:56px; height:56px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:var(--gg-accent-deep); background:var(--gg-tint-2); border:1px solid var(--gg-line); margin-bottom:18px; }
.gg-promise-card h3{ margin:0 0 10px; font-family:var(--gg-serif); font-size:21px; font-weight:600; color:var(--gg-ink); }
.gg-promise-card p{ margin:0; font-family:var(--gg-sans); font-size:13.5px; font-weight:300; line-height:1.7; color:var(--gg-muted); }
@media(max-width:820px){ .gg-promise-grid{ grid-template-columns:1fr; max-width:440px; margin:0 auto; } }

/* ══ 9. CLOSING CTA ══ */
.gg-closing{ position:relative; overflow:hidden; padding:clamp(66px,9vw,128px) clamp(18px,4vw,52px); }
.gg-closing.is-accent{ background:linear-gradient(135deg,#8f7a70,#6f5c52); }
.gg-closing.is-dark{ background:linear-gradient(135deg,#2c231e,#1a130f); }
.gg-closing-orn{ position:absolute; inset:0; pointer-events:none; background:radial-gradient(50% 60% at 82% 20%, rgba(255,255,255,.14), transparent 60%), radial-gradient(46% 60% at 8% 96%, rgba(255,255,255,.08), transparent 60%); }
.gg-closing-in{ position:relative; z-index:1; max-width:740px; margin:0 auto; text-align:center; }
.gg-closing-eyebrow{ font-family:var(--gg-sans); font-size:11px; font-weight:700; letter-spacing:.32em; text-transform:uppercase; color:rgba(255,255,255,.72); margin:0 0 18px; }
.gg-closing-title{ font-family:var(--gg-serif); font-size:clamp(32px,4.8vw,54px); font-weight:500; line-height:1.08; color:#fff; margin:0 0 20px; }
.gg-closing-title em{ font-style:italic; color:var(--lux-cream,#f5f0e8); }
.gg-closing-sub{ font-family:var(--gg-sans); font-size:15.5px; font-weight:300; line-height:1.78; color:rgba(255,255,255,.85); max-width:540px; margin:0 auto 36px; }
.gg-closing-btn{
  display:inline-flex; align-items:center; gap:10px; background:#fff; color:var(--gg-ink); text-decoration:none;
  font-family:var(--gg-sans); font-size:12.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
  padding:17px 38px; border-radius:999px; transition:transform .3s var(--gg-e), box-shadow .3s var(--gg-e);
  box-shadow:0 16px 40px -16px rgba(0,0,0,.5);
}
.gg-closing-btn:hover{ transform:translateY(-3px); box-shadow:0 24px 50px -18px rgba(0,0,0,.55); }

@media (prefers-reduced-motion: reduce){
  .gg-page *{ transition-duration:.001ms !important; animation-duration:.001ms !important; }
  .gg-pre{ opacity:1 !important; transform:none !important; }
}
`
