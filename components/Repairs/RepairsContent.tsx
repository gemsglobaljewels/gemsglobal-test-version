'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ArrowDown,
  Wrench, Hammer, Settings, Cog, Ruler, Scissors, Gem, Diamond, Sparkles,
  Crown, Watch, PenTool, ShieldCheck, BadgeCheck, Award, Medal, Star,
  CircleCheck, Clock, Timer, CalendarClock, RefreshCw, Recycle, Droplets,
  Truck, PackageCheck, HandHeart, HeartHandshake, Users, Scale, MapPin,
  Phone, Send, Feather, Sun, Search, type LucideIcon,
} from 'lucide-react'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import { RepairsConfig, RepairSection } from '@/lib/repairs'

/* ════════════════════════════════════════════════════════════════
   REPAIRS — public editorial page  ·  THEME-COLOUR REDESIGN
   A clean, Swiss-editorial page on a WHITE canvas. The only colour is the
   site's own theme accent — warm taupe-gold (#8F7A70) — paired with warm
   espresso ink and soft warm greys (no black). White / warm off-white
   bands give rhythm; hairline rules, generous whitespace, crisp
   rectangular frames and a numbered 01 / 02 … section index carry the
   layout. Photography renders grayscale by default and reveals full
   colour on hover, so the page itself stays quiet while the jewellery
   is still inspectable.

   Driven entirely by the admin-editable RepairsConfig: cinematic hero,
   trust-stat strip, editorial intro, and reorderable content sections in
   three layouts — 'statement' (centred prose + optional image), 'split'
   (alternating image/text with a points checklist) and 'points' (an
   icon-card grid) — plus a full-bleed image CTA. All styles scoped `.rep-`.
════════════════════════════════════════════════════════════════ */

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1000&h=1200&fit=crop&q=85'

/** name → lucide component (names come from REPAIRS_ICONS in the lib).
 *  `Search` is not in the allow-list but the default config references it,
 *  so it is mapped here for backward-compatibility. */
const ICONS: Record<string, LucideIcon> = {
  Wrench, Hammer, Settings, Cog, Ruler, Scissors, Gem, Diamond, Sparkles,
  Crown, Watch, PenTool, ShieldCheck, BadgeCheck, Award, Medal, Star,
  CircleCheck, Clock, Timer, CalendarClock, RefreshCw, Recycle, Droplets,
  Truck, PackageCheck, HandHeart, HeartHandshake, Users, Scale, MapPin,
  Phone, Send, Feather, Sun, Search,
}
const iconFor = (name: string): LucideIcon => ICONS[name] || Wrench

/** Split a textarea value into paragraphs on blank lines. */
const toParagraphs = (text: string) =>
  String(text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

/** 1 → "01" — editorial section index. */
const idx = (n: number) => String(n).padStart(2, '0')

export default function RepairsContent({
  config,
}: {
  config: RepairsConfig
}) {
  const { hero, closing } = config
  const stats = (config.stats || []).filter((s) => s.value || s.label)
  const sections = (config.sections || []).filter((s) => s.is_visible)
  const heroIntro = toParagraphs(hero.intro)

  /* CTA backdrop: admin-set image first, then first section image, hero, stock */
  const ctaBg =
    closing.bg_image ||
    sections.find((s) => s.image)?.image ||
    hero.image ||
    FALLBACK_IMG

  /* ── scroll-reveal + subtle parallax on media ── */
  const pageRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (!reduce && 'IntersectionObserver' in window) {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('.rep-page [data-reveal]')
      )
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('rep-in')
              e.target.classList.remove('rep-pre')
              io.unobserve(e.target)
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      )
      for (const el of els) {
        if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
          el.classList.add('rep-pre')
          io.observe(el)
        }
      }

      const media = Array.from(document.querySelectorAll<HTMLElement>('.rep-parallax'))
      let raf = 0
      const onScroll = () => {
        if (raf) return
        raf = requestAnimationFrame(() => {
          const vh = window.innerHeight
          for (const m of media) {
            const r = m.getBoundingClientRect()
            if (r.bottom < 0 || r.top > vh) continue
            const p = (r.top + r.height / 2 - vh / 2) / vh // -0.5..0.5
            m.style.setProperty('--rep-py', `${(-p * 24).toFixed(1)}px`)
          }
          raf = 0
        })
      }
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll)
      return () => {
        io.disconnect()
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
        if (raf) cancelAnimationFrame(raf)
      }
    }
  }, [])

  /* ── per-layout section renderer (n = 1-based editorial index) ── */
  const renderSection = (s: RepairSection, i: number, n: number) => {
    const paras = toParagraphs(s.body)
    const pts = s.points || []

    /* ── STATEMENT: centred editorial band + optional image ── */
    if (s.layout === 'statement') {
      return (
        <section className="rep-statement" data-reveal key={s.id || i}>
          <span className="rep-statement-num" aria-hidden="true">{idx(n)}</span>
          <div className="rep-statement-in">
            <span className="rep-orn" aria-hidden="true">
              <i /><Wrench size={15} strokeWidth={1.5} /><i />
            </span>
            {s.eyebrow && <p className="rep-statement-eyebrow">{s.eyebrow}</p>}
            {s.title && <h2 className="rep-statement-title">{s.title}</h2>}
            {paras.length > 0 && (
              <div className="rep-statement-copy">
                {paras.map((p, j) => (
                  <p key={j} className={j === 0 ? 'rep-statement-lead' : ''}>{p}</p>
                ))}
              </div>
            )}
            {s.cta_text && (
              <Link href={s.cta_link || '/appointments'} className="rep-btn rep-btn--line">
                <span>{s.cta_text}</span>
                <ArrowRight size={16} className="rep-btn-ico" />
              </Link>
            )}
          </div>
          {s.image && (
            <div className="rep-statement-media" data-reveal>
              <div className="rep-statement-frame">
                <div className="rep-parallax rep-statement-imgwrap">
                  <img src={s.image} alt={s.title || ''} className="rep-img rep-statement-img" loading="lazy" />
                </div>
              </div>
            </div>
          )}
        </section>
      )
    }

    /* ── POINTS: heading + icon-card grid ── */
    if (s.layout === 'points') {
      return (
        <section className="rep-points" data-reveal key={s.id || i}>
          <span className="rep-points-num" aria-hidden="true">{idx(n)}</span>
          <div className="rep-points-head">
            {s.eyebrow && (
              <span className="rep-eyebrow">
                <span className="rep-eyebrow-line" />{s.eyebrow}<span className="rep-eyebrow-line" />
              </span>
            )}
            {s.title && <h2 className="rep-points-title">{s.title}</h2>}
            {paras.length > 0 && (
              <div className="rep-points-intro">
                {paras.map((p, j) => <p key={j}>{p}</p>)}
              </div>
            )}
          </div>
          {pts.length > 0 && (
            <div className="rep-cards">
              {pts.map((p, k) => {
                const Ic = iconFor(p.icon)
                return (
                  <article className="rep-card" data-reveal key={p.id}>
                    <span className="rep-card-n" aria-hidden="true">{idx(k + 1)}</span>
                    <span className="rep-card-ic"><Ic size={22} strokeWidth={1.5} /></span>
                    {p.title && <h3 className="rep-card-t">{p.title}</h3>}
                    {p.text && <p className="rep-card-x">{p.text}</p>}
                  </article>
                )
              })}
            </div>
          )}
          {s.cta_text && (
            <div className="rep-points-cta">
              <Link href={s.cta_link || '/appointments'} className="rep-btn rep-btn--line">
                <span>{s.cta_text}</span>
                <ArrowRight size={16} className="rep-btn-ico" />
              </Link>
            </div>
          )}
        </section>
      )
    }

    /* ── SPLIT: alternating image + text with a points checklist ── */
    return (
      <article
        className={`rep-split ${s.image_side === 'right' ? 'rep-split--img-right' : 'rep-split--img-left'}`}
        data-reveal
        key={s.id || i}
      >
        <div className="rep-split-media">
          <div className="rep-split-frame">
            <div className="rep-parallax rep-split-imgwrap">
              <img src={s.image || FALLBACK_IMG} alt={s.title || ''} className="rep-img rep-split-img" loading="lazy" />
            </div>
          </div>
          <span className="rep-split-tag" aria-hidden="true">{idx(n)}</span>
        </div>

        <div className="rep-split-copy">
          {s.eyebrow && (
            <span className="rep-split-eyebrow">
              <span className="rep-split-eyebrow-n">{idx(n)}</span>
              {s.eyebrow}
            </span>
          )}
          {s.title && <h2 className="rep-split-title">{s.title}</h2>}
          {paras.length > 0 && (
            <div className="rep-split-body">
              {paras.map((p, j) => <p key={j}>{p}</p>)}
            </div>
          )}
          {pts.length > 0 && (
            <ul className="rep-checks">
              {pts.map((p) => {
                const Ic = iconFor(p.icon)
                return (
                  <li className="rep-check" key={p.id}>
                    <span className="rep-check-ic"><Ic size={17} strokeWidth={1.7} /></span>
                    <div className="rep-check-body">
                      {p.title && <span className="rep-check-t">{p.title}</span>}
                      {p.text && <p className="rep-check-x">{p.text}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {s.cta_text && (
            <Link href={s.cta_link || '/appointments'} className="rep-btn rep-btn--line">
              <span>{s.cta_text}</span>
              <ArrowRight size={16} className="rep-btn-ico" />
            </Link>
          )}
        </div>
      </article>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <main className="rep-page" ref={pageRef as any} suppressHydrationWarning>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="rep-hero">
          <div className="rep-hero-grid">
            <div className="rep-hero-copy" data-reveal>
              <p className="rep-kicker">
                <span className="rep-kicker-line" />
                {hero.eyebrow || 'Jewellery Repairs & Restoration'}
              </p>
              <h1 className="rep-hero-title">
                {hero.title} {hero.accent && <em>{hero.accent}</em>}
              </h1>
              {hero.subtitle && <p className="rep-hero-lead">{hero.subtitle}</p>}
              <div className="rep-hero-actions">
                <a href="#rep-services" className="rep-btn rep-btn--solid">
                  <span>Explore Our Services</span>
                  <ArrowDown size={16} className="rep-btn-ico rep-btn-ico--down" />
                </a>
                <Link href={closing.cta_link || '/appointments'} className="rep-btn rep-btn--line">
                  <span>{closing.cta_text || 'Book a Repair'}</span>
                  <ArrowRight size={16} className="rep-btn-ico" />
                </Link>
              </div>
            </div>

            {hero.image && (
              <div className="rep-hero-media" data-reveal>
                <span className="rep-hero-shadow" aria-hidden="true" />
                <div className="rep-hero-frame">
                  <div className="rep-parallax rep-hero-imgwrap">
                    <img src={hero.image} alt="" className="rep-img rep-hero-img" />
                  </div>
                </div>
                {hero.badge_text && (
                  <span className="rep-hero-badge">
                    <Wrench size={13} strokeWidth={1.7} /> {hero.badge_text}
                  </span>
                )}
                <span className="rep-hero-tag" aria-hidden="true">
                  <Hammer size={16} strokeWidth={1.5} />
                  <span><strong>Master</strong>Goldsmiths</span>
                </span>
              </div>
            )}
          </div>

          <div className="rep-scrollcue" aria-hidden="true">
            <span className="rep-scrollcue-tx">Scroll</span>
            <span className="rep-scrollcue-bar"><i /></span>
          </div>
        </section>

        {/* ── TRUST STATS STRIP ─────────────────────────────────── */}
        {stats.length > 0 && (
          <section className="rep-stats" data-reveal>
            <div className="rep-stats-in">
              {stats.map((st) => (
                <div className="rep-stat" key={st.id}>
                  {st.value && <span className="rep-stat-v">{st.value}</span>}
                  {st.label && <span className="rep-stat-l">{st.label}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── EDITORIAL INTRO ──────────────────────────────────── */}
        {heroIntro.length > 0 && (
          <section className="rep-intro" data-reveal>
            <div className="rep-intro-in">
              <div className="rep-intro-aside">
                <span className="rep-intro-rule" aria-hidden="true" />
                <span className="rep-intro-label">Our Workshop</span>
              </div>
              <div className="rep-intro-copy">
                {heroIntro.map((p, i) => (
                  <p key={i} className={i === 0 ? 'rep-intro-lead' : ''}>{p}</p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CONTENT SECTIONS ─────────────────────────────────── */}
        {sections.length > 0 && (
          <section className="rep-approach" id="rep-services">
            {(config.sections_eyebrow || config.sections_title) && (
              <div className="rep-head" data-reveal>
                {config.sections_eyebrow && (
                  <span className="rep-eyebrow">
                    <span className="rep-eyebrow-line" />
                    {config.sections_eyebrow}
                    <span className="rep-eyebrow-line" />
                  </span>
                )}
                {config.sections_title && (
                  <h2 className="rep-head-title">{config.sections_title}</h2>
                )}
              </div>
            )}

            <div className="rep-sections">
              {sections.map((s, i) => renderSection(s, i, i + 1))}
            </div>
          </section>
        )}

        {/* ── FULL-BLEED CLOSING CTA ────────────────────────────── */}
        {(closing.title || closing.cta_text) && (
          <section className={`rep-cta ${closing.theme === 'dark' ? 'is-dark' : 'is-accent'}`} data-reveal>
            <div className="rep-cta-bg" aria-hidden="true">
              <img src={ctaBg} alt="" className="rep-cta-bg-img" />
            </div>
            <span className="rep-cta-veil" aria-hidden="true" />
            <span className="rep-cta-glow" aria-hidden="true" />

            <div className="rep-cta-in">
              <span className="rep-cta-orn" aria-hidden="true">
                <i /><Wrench size={16} strokeWidth={1.4} /><i />
              </span>
              {closing.eyebrow && <p className="rep-cta-eyebrow">{closing.eyebrow}</p>}
              {closing.title && (
                <h2 className="rep-cta-title">
                  {closing.title} {closing.accent && <em>{closing.accent}</em>}
                </h2>
              )}
              {closing.subtitle && <p className="rep-cta-sub">{closing.subtitle}</p>}
              {closing.cta_text && (
                <div className="rep-cta-actions">
                  <Link href={closing.cta_link || '/appointments'} className="rep-cta-btn">
                    <span>{closing.cta_text}</span>
                    <ArrowRight size={18} className="rep-arrow" />
                  </Link>
                  <Link href="/custom-order" className="rep-cta-btn rep-cta-btn--ghost">
                    <span>Create a Custom Piece</span>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        <Footer />
      </main>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════
   SCOPED CSS  ·  white canvas · site theme taupe-gold accent (no black)
════════════════════════════════════════════════════════════════ */
const CSS = `
.rep-page{
  /* ── warm monochrome base (white bg + espresso ink + warm greys) ── */
  --rep-black:#1c1611;
  --rep-ink:#2c231e;
  --rep-body:#5a4f47;
  --rep-muted:#8b7d71;
  --rep-paper:#ffffff;
  --rep-paper-2:#faf7f3;
  --rep-paper-3:#f2ede8;
  --rep-line:rgba(44,35,30,.12);
  --rep-line-2:rgba(44,35,30,.20);
  --rep-line-w:rgba(255,255,255,.20);
  /* ── the one accent: SITE THEME colour — warm taupe-gold (#8F7A70) ── */
  --rep-accent:#8f7a70;
  --rep-accent-deep:#6f5a4d;
  --rep-accent-bright:#a4897b;
  --rep-accent-soft:#f2ebe5;
  --rep-accent-tint:#f8f3ee;
  --rep-accent-line:rgba(143,122,112,.34);
  /* ── type ── */
  --rep-serif:var(--font-playfair, 'Cormorant Garamond', Georgia, serif);
  --rep-display:var(--font-main, 'Bodoni Moda', Georgia, serif);
  --rep-sans:var(--font-dmsans, system-ui, sans-serif);
  --rep-e:cubic-bezier(.22,1,.36,1);
  --rep-py:0px;
  background:var(--rep-paper); color:var(--rep-body); min-height:100vh; overflow-x:clip;
}
.rep-page *{ box-sizing:border-box; }
.rep-page ::selection{ background:var(--rep-accent); color:#fff; }
.rep-page a:focus-visible,
.rep-page button:focus-visible{ outline:2px solid var(--rep-accent); outline-offset:3px; border-radius:2px; }

/* ── reveal ── */
.rep-pre{ opacity:0; transform:translateY(30px); }
.rep-in{ animation:repReveal .9s var(--rep-e) both; }
@keyframes repReveal{ from{ opacity:0; transform:translateY(30px);} to{ opacity:1; transform:none;} }

/* ── shared media: grayscale by default, colour on hover ── */
.rep-img{
  width:100%; height:100%; object-fit:cover; display:block;
  filter:grayscale(1) contrast(1.03);
  transition:filter 1s var(--rep-e), transform 1.4s var(--rep-e);
}

/* ── kicker / eyebrow ── */
.rep-kicker{
  display:inline-flex; align-items:center; gap:14px;
  font-family:var(--rep-sans); font-size:11.5px; font-weight:700; letter-spacing:.36em;
  text-transform:uppercase; color:var(--rep-accent); margin:0 0 26px;
}
.rep-kicker-line{ display:block; width:46px; height:1px; background:var(--rep-accent); opacity:.85; }
.rep-eyebrow{
  display:inline-flex; align-items:center; gap:14px;
  font-family:var(--rep-sans); font-size:11px; font-weight:700; letter-spacing:.32em;
  text-transform:uppercase; color:var(--rep-accent); margin-bottom:18px;
}
.rep-eyebrow-line{ display:block; width:34px; height:1px; background:var(--rep-accent-line); }

/* ── buttons ── */
.rep-btn{
  position:relative; display:inline-flex; align-items:center; gap:11px;
  font-family:var(--rep-sans); font-size:12px; font-weight:600; letter-spacing:.14em;
  text-transform:uppercase; text-decoration:none; cursor:pointer;
  padding:16px 32px; border-radius:0; border:1px solid transparent;
  transition:transform .35s var(--rep-e), box-shadow .35s var(--rep-e), background .3s ease, color .3s ease, border-color .3s ease;
  white-space:nowrap;
}
.rep-btn-ico{ transition:transform .35s var(--rep-e); }
.rep-btn:hover .rep-btn-ico{ transform:translateX(4px); }
.rep-btn:hover .rep-btn-ico--down{ transform:translateY(4px); }
.rep-btn--solid{ background:var(--rep-accent); color:#fff; box-shadow:0 18px 40px -20px rgba(44,35,30,.45); }
.rep-btn--solid:hover{ background:var(--rep-accent-deep); transform:translateY(-2px); box-shadow:0 26px 52px -20px rgba(44,35,30,.4); }
.rep-btn--dark{ background:var(--rep-ink); color:#fff; }
.rep-btn--dark:hover{ background:var(--rep-accent-deep); transform:translateY(-2px); }
.rep-btn--line{ background:transparent; color:var(--rep-ink); border-color:var(--rep-line-2); }
.rep-btn--line:hover{ border-color:var(--rep-accent); color:var(--rep-accent); transform:translateY(-2px); }
.rep-statement .rep-btn--line,
.rep-points .rep-btn--line,
.rep-split .rep-btn--line{ margin-top:30px; }

/* ══════════ HERO ══════════ */
.rep-hero{
  position:relative; min-height:clamp(560px,88vh,900px);
  display:flex; flex-direction:column; justify-content:center;
  padding:clamp(70px,10vh,130px) clamp(18px,4vw,64px) clamp(56px,8vh,88px);
  background:var(--rep-paper);
  border-bottom:1px solid var(--rep-line);
  overflow:hidden;
}
.rep-hero::before{
  content:''; position:absolute; inset:0; z-index:0; pointer-events:none; opacity:.55;
  background-image:linear-gradient(var(--rep-line) 1px, transparent 1px);
  background-size:100% clamp(58px,7vh,86px);
  -webkit-mask-image:linear-gradient(180deg, transparent, #000 24%, #000 76%, transparent);
          mask-image:linear-gradient(180deg, transparent, #000 24%, #000 76%, transparent);
}
.rep-hero::after{
  content:''; position:absolute; left:0; top:0; bottom:0; width:clamp(3px,.4vw,5px);
  background:var(--rep-accent); z-index:1;
}
.rep-hero-grid{
  position:relative; z-index:1; width:100%; max-width:1320px; margin:0 auto;
  display:grid; grid-template-columns:1.05fr .95fr; gap:clamp(36px,5vw,92px); align-items:center;
}
.rep-hero-copy{ position:relative; }
.rep-hero-title{
  font-family:var(--rep-display); font-size:clamp(42px,6.8vw,88px); font-weight:400; line-height:1.0;
  letter-spacing:-.018em; color:var(--rep-ink); margin:0 0 28px;
}
.rep-hero-title em{ display:block; font-family:var(--rep-serif); font-style:italic; font-weight:500; color:var(--rep-accent); margin-top:.06em; }
.rep-hero-lead{
  font-family:var(--rep-serif); font-size:clamp(19px,2.1vw,25px); font-weight:500; font-style:italic; line-height:1.45;
  color:var(--rep-body); max-width:520px; margin:0 0 38px;
}
.rep-hero-actions{ display:flex; flex-wrap:wrap; gap:14px; }

.rep-hero-media{ position:relative; }
.rep-hero-shadow{
  position:absolute; z-index:0; right:-18px; bottom:-18px; width:74%; height:74%;
  border:1px solid var(--rep-accent-line); pointer-events:none;
}
.rep-hero-frame{
  position:relative; z-index:1; border-radius:0; overflow:hidden; aspect-ratio:4/5;
  background:var(--rep-paper-3); box-shadow:0 40px 90px -46px rgba(44,35,30,.5);
}
.rep-hero-imgwrap{ position:absolute; inset:-8% 0; will-change:transform; transform:translateY(var(--rep-py)); }
.rep-hero-media:hover .rep-hero-img{ transform:scale(1.05); filter:grayscale(0) contrast(1); }
.rep-hero-badge{
  position:absolute; left:-14px; top:30px; z-index:3;
  display:inline-flex; align-items:center; gap:8px; background:#fff; color:var(--rep-accent);
  font-family:var(--rep-sans); font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  padding:12px 18px; border:1px solid var(--rep-line); box-shadow:0 16px 34px -18px rgba(44,35,30,.34);
}
.rep-hero-tag{
  position:absolute; right:-16px; bottom:26px; z-index:3;
  display:inline-flex; align-items:center; gap:11px;
  background:var(--rep-accent); color:#fff; padding:13px 18px;
  box-shadow:0 22px 46px -20px rgba(44,35,30,.45);
}
.rep-hero-tag span{ display:flex; flex-direction:column; line-height:1.25; font-family:var(--rep-sans); font-size:9px; letter-spacing:.16em; text-transform:uppercase; color:rgba(255,255,255,.72); }
.rep-hero-tag strong{ font-family:var(--rep-serif); font-size:15px; font-weight:600; letter-spacing:.02em; text-transform:none; color:#fff; }

.rep-scrollcue{ position:absolute; left:50%; bottom:24px; transform:translateX(-50%); z-index:1; display:flex; flex-direction:column; align-items:center; gap:9px; }
.rep-scrollcue-tx{ font-family:var(--rep-sans); font-size:9.5px; font-weight:700; letter-spacing:.32em; text-transform:uppercase; color:var(--rep-muted); }
.rep-scrollcue-bar{ position:relative; width:1px; height:44px; background:var(--rep-line-2); overflow:hidden; }
.rep-scrollcue-bar i{ position:absolute; top:-40%; left:0; width:100%; height:40%; background:var(--rep-accent); animation:repCue 1.9s var(--rep-e) infinite; }
@keyframes repCue{ 0%{ top:-40%;} 70%,100%{ top:100%;} }

@media(max-width:900px){
  .rep-hero{ min-height:auto; text-align:center; }
  .rep-hero::after{ display:none; }
  .rep-hero-grid{ grid-template-columns:1fr; gap:46px; }
  .rep-kicker{ justify-content:center; }
  .rep-hero-lead{ margin-left:auto; margin-right:auto; }
  .rep-hero-actions{ justify-content:center; }
  .rep-hero-media{ order:-1; }
  .rep-hero-frame{ max-width:400px; margin:0 auto; aspect-ratio:4/5; }
  .rep-hero-shadow{ display:none; }
  .rep-scrollcue{ display:none; }
  .rep-hero::before{ display:none; }
}

/* ══════════ TRUST STATS ══════════ */
.rep-stats{ padding:clamp(38px,5vw,64px) clamp(18px,4vw,64px); background:var(--rep-paper-2); border-top:1px solid var(--rep-line); border-bottom:1px solid var(--rep-line); }
.rep-stats-in{
  max-width:1120px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr);
  gap:clamp(12px,3vw,40px);
}
.rep-stat{ position:relative; text-align:center; padding:6px clamp(8px,2vw,22px); }
.rep-stat + .rep-stat::before{ content:''; position:absolute; left:0; top:14%; height:72%; width:1px; background:var(--rep-line-2); }
.rep-stat-v{ display:block; font-family:var(--rep-display); font-size:clamp(26px,3.1vw,40px); font-weight:400; line-height:1; color:var(--rep-ink); letter-spacing:-.01em; }
.rep-stat-v::after{ content:''; display:block; width:26px; height:2px; background:var(--rep-accent); margin:14px auto 0; }
.rep-stat-l{ display:block; margin-top:14px; font-family:var(--rep-sans); font-size:10.5px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--rep-muted); }
@media(max-width:720px){
  .rep-stats-in{ grid-template-columns:repeat(2,1fr); gap:30px 12px; }
  .rep-stat:nth-child(odd)::before{ display:none; }
}

/* ══════════ EDITORIAL INTRO ══════════ */
.rep-intro{ padding:clamp(66px,9vw,124px) clamp(18px,4vw,64px) clamp(20px,3vw,40px); }
.rep-intro-in{ max-width:1000px; margin:0 auto; display:grid; grid-template-columns:auto 1fr; gap:clamp(26px,4vw,60px); align-items:start; }
.rep-intro-aside{ display:flex; flex-direction:column; align-items:flex-start; gap:16px; padding-top:12px; }
.rep-intro-rule{ display:block; width:2px; height:56px; background:var(--rep-accent); }
.rep-intro-label{ font-family:var(--rep-sans); font-size:10.5px; font-weight:700; letter-spacing:.28em; text-transform:uppercase; color:var(--rep-accent); writing-mode:vertical-rl; }
.rep-intro-copy{ min-width:0; }
.rep-intro-lead{
  font-family:var(--rep-serif); font-size:clamp(23px,2.8vw,34px); font-weight:500; line-height:1.4;
  color:var(--rep-ink); margin:0 0 22px;
}
.rep-intro-copy p:not(.rep-intro-lead){
  font-family:var(--rep-sans); font-size:clamp(15px,1.5vw,16.5px); font-weight:300; line-height:1.85;
  color:var(--rep-body); margin:0 0 16px;
}
.rep-intro-copy p:last-child{ margin-bottom:0; }
@media(max-width:640px){
  .rep-intro-in{ grid-template-columns:1fr; gap:22px; }
  .rep-intro-aside{ flex-direction:row; align-items:center; gap:12px; padding-top:0; }
  .rep-intro-rule{ width:40px; height:2px; }
  .rep-intro-label{ writing-mode:horizontal-tb; }
}

/* ══════════ APPROACH WRAPPER + HEADING ══════════ */
.rep-approach{ padding:clamp(56px,8vw,110px) clamp(18px,4vw,64px) clamp(30px,5vw,60px); background:var(--rep-paper-2); border-top:1px solid var(--rep-line); }
.rep-head{ display:flex; flex-direction:column; align-items:center; text-align:center; max-width:1200px; margin:0 auto clamp(46px,7vw,86px); }
.rep-head-title{
  font-family:var(--rep-serif); font-size:clamp(32px,5vw,58px); font-weight:500; line-height:1.04;
  letter-spacing:.004em; color:var(--rep-ink); margin:0;
}
.rep-sections{ display:flex; flex-direction:column; gap:clamp(68px,10vw,128px); max-width:1200px; margin:0 auto; }

/* ══════════ STATEMENT ══════════ */
.rep-statement{ position:relative; display:flex; flex-direction:column; align-items:center; text-align:center; }
.rep-statement-num{
  position:absolute; top:-.35em; left:50%; transform:translateX(-50%); z-index:0; pointer-events:none;
  font-family:var(--rep-display); font-size:clamp(120px,20vw,240px); line-height:1; font-weight:400;
  color:var(--rep-ink); opacity:.06;
}
.rep-statement-in{ position:relative; z-index:1; max-width:820px; }
.rep-orn{ display:inline-flex; align-items:center; gap:14px; color:var(--rep-accent); margin-bottom:22px; }
.rep-orn i{ display:block; width:46px; height:1px; background:linear-gradient(90deg, transparent, var(--rep-accent)); }
.rep-orn i:last-child{ background:linear-gradient(90deg, var(--rep-accent), transparent); }
.rep-statement-eyebrow{ font-family:var(--rep-sans); font-size:11px; font-weight:700; letter-spacing:.32em; text-transform:uppercase; color:var(--rep-accent); margin:0 0 16px; }
.rep-statement-title{
  font-family:var(--rep-serif); font-size:clamp(30px,4.6vw,54px); font-weight:500; line-height:1.08;
  color:var(--rep-ink); margin:0 0 26px;
}
.rep-statement-lead{
  font-family:var(--rep-serif); font-size:clamp(19px,2.2vw,26px); font-weight:500; line-height:1.5; font-style:italic;
  color:var(--rep-accent-deep); margin:0 0 20px;
}
.rep-statement-copy p:not(.rep-statement-lead){
  font-family:var(--rep-sans); font-size:clamp(15px,1.5vw,16.5px); font-weight:300; line-height:1.85; color:var(--rep-body);
  margin:0 auto 16px; max-width:640px;
}
.rep-statement-copy p:last-child{ margin-bottom:0; }
.rep-statement-media{ width:100%; max-width:1040px; margin-top:clamp(38px,5vw,62px); }
.rep-statement-frame{
  position:relative; border-radius:0; overflow:hidden; aspect-ratio:21/9;
  background:var(--rep-paper-3); box-shadow:0 40px 90px -50px rgba(44,35,30,.5);
}
.rep-statement-imgwrap{ position:absolute; inset:-8% 0; will-change:transform; transform:translateY(var(--rep-py)); }
.rep-statement-media:hover .rep-statement-img{ transform:scale(1.04); filter:grayscale(0) contrast(1); }
@media(max-width:640px){ .rep-statement-frame{ aspect-ratio:4/3; } }

/* ══════════ SPLIT ══════════ */
.rep-split{ display:grid; grid-template-columns:1fr 1fr; align-items:center; gap:clamp(32px,5vw,92px); }
.rep-split--img-left .rep-split-media{ order:1; }
.rep-split--img-left .rep-split-copy{ order:2; }
.rep-split--img-right .rep-split-media{ order:2; }
.rep-split--img-right .rep-split-copy{ order:1; }
.rep-split-media{ position:relative; }
.rep-split-media::before{
  content:''; position:absolute; z-index:0; width:70%; height:70%; border:1px solid var(--rep-accent-line); pointer-events:none;
}
.rep-split--img-left .rep-split-media::before{ right:-16px; bottom:-16px; }
.rep-split--img-right .rep-split-media::before{ left:-16px; bottom:-16px; }
.rep-split-frame{
  position:relative; z-index:1; border-radius:0; overflow:hidden; aspect-ratio:4/5;
  background:var(--rep-paper-3); box-shadow:0 34px 76px -44px rgba(44,35,30,.5);
}
.rep-split-imgwrap{ position:absolute; inset:-8% 0; will-change:transform; transform:translateY(var(--rep-py)); }
.rep-split:hover .rep-split-img{ transform:scale(1.05); filter:grayscale(0) contrast(1); }
.rep-split-tag{
  position:absolute; z-index:2; top:-16px; display:inline-flex; align-items:center; justify-content:center;
  min-width:56px; height:56px; padding:0 8px; background:var(--rep-accent); color:#fff;
  font-family:var(--rep-display); font-size:22px; font-weight:400; letter-spacing:.02em;
  box-shadow:0 18px 40px -18px rgba(44,35,30,.4);
}
.rep-split--img-left .rep-split-tag{ right:-14px; }
.rep-split--img-right .rep-split-tag{ left:-14px; }

.rep-split-copy{ position:relative; min-width:0; padding:clamp(6px,1vw,16px) 0; }
.rep-split-eyebrow{ display:flex; align-items:center; gap:12px; font-family:var(--rep-sans); font-size:11px; font-weight:700; letter-spacing:.3em; text-transform:uppercase; color:var(--rep-accent); margin-bottom:16px; }
.rep-split-eyebrow-n{ font-family:var(--rep-display); font-size:15px; letter-spacing:0; color:var(--rep-accent); opacity:.5; }
.rep-split-title{
  font-family:var(--rep-serif); font-size:clamp(28px,3.7vw,46px); font-weight:600; line-height:1.08;
  color:var(--rep-ink); margin:0 0 20px;
}
.rep-split-body p{
  font-family:var(--rep-sans); font-size:clamp(14.5px,1.5vw,16.5px); font-weight:300; line-height:1.9;
  color:var(--rep-body); margin:0 0 16px; max-width:560px;
}
.rep-split-body p:last-child{ margin-bottom:0; }

/* checklist */
.rep-checks{ list-style:none; margin:28px 0 0; padding:0; display:flex; flex-direction:column; gap:2px; }
.rep-check{ display:flex; align-items:flex-start; gap:16px; padding:16px 0; border-top:1px solid var(--rep-line); }
.rep-check:last-child{ border-bottom:1px solid var(--rep-line); }
.rep-check-ic{
  flex-shrink:0; width:42px; height:42px; border-radius:0; display:inline-flex; align-items:center; justify-content:center;
  background:var(--rep-accent-soft); color:var(--rep-accent); border:1px solid var(--rep-accent-line);
}
.rep-check-body{ min-width:0; padding-top:2px; }
.rep-check-t{ display:block; font-family:var(--rep-serif); font-size:clamp(16px,1.7vw,19px); font-weight:600; color:var(--rep-ink); margin-bottom:3px; }
.rep-check-x{ font-family:var(--rep-sans); font-size:13.5px; font-weight:300; line-height:1.65; color:var(--rep-body); margin:0; max-width:440px; }

@media(max-width:900px){
  .rep-split{ grid-template-columns:1fr; gap:44px; }
  .rep-split--img-left .rep-split-media, .rep-split--img-right .rep-split-media{ order:1; }
  .rep-split--img-left .rep-split-copy, .rep-split--img-right .rep-split-copy{ order:2; }
  .rep-split-frame{ max-width:480px; margin:0 auto; }
  .rep-split-media::before{ display:none; }
  .rep-split--img-left .rep-split-tag, .rep-split--img-right .rep-split-tag{ right:14px; left:auto; }
  .rep-split-copy{ text-align:center; }
  .rep-split-eyebrow{ justify-content:center; }
  .rep-split-body p{ margin-left:auto; margin-right:auto; }
  .rep-checks{ text-align:left; max-width:440px; margin-left:auto; margin-right:auto; }
}

/* ══════════ POINTS GRID ══════════ */
.rep-points{ position:relative; display:flex; flex-direction:column; align-items:center; }
.rep-points-num{
  position:absolute; top:-.42em; left:50%; transform:translateX(-50%); z-index:0; pointer-events:none;
  font-family:var(--rep-display); font-size:clamp(120px,20vw,240px); line-height:1; font-weight:400;
  color:var(--rep-ink); opacity:.06;
}
.rep-points-head{ position:relative; z-index:1; text-align:center; max-width:760px; margin:0 auto clamp(36px,5vw,56px); display:flex; flex-direction:column; align-items:center; }
.rep-points-title{ font-family:var(--rep-serif); font-size:clamp(28px,4.2vw,50px); font-weight:500; line-height:1.06; color:var(--rep-ink); margin:0; }
.rep-points-intro{ margin-top:18px; }
.rep-points-intro p{ font-family:var(--rep-sans); font-size:clamp(14.5px,1.5vw,16px); font-weight:300; line-height:1.8; color:var(--rep-body); margin:0 auto; max-width:600px; }
.rep-cards{ width:100%; display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:0; border:1px solid var(--rep-line); background:var(--rep-line); }
.rep-card{
  position:relative; background:var(--rep-paper); border:0;
  padding:clamp(26px,2.6vw,38px) clamp(24px,2.3vw,32px);
  transition:background .35s ease, transform .4s var(--rep-e);
  overflow:hidden;
}
.rep-card::before{ content:''; position:absolute; left:0; top:0; height:100%; width:3px; background:var(--rep-accent); transform:scaleY(0); transform-origin:top; transition:transform .45s var(--rep-e); }
.rep-card:hover{ background:var(--rep-accent-tint); }
.rep-card:hover::before{ transform:scaleY(1); }
.rep-card-n{ position:absolute; top:clamp(20px,2vw,28px); right:clamp(22px,2.2vw,30px); font-family:var(--rep-display); font-size:15px; color:var(--rep-accent); opacity:.4; letter-spacing:.02em; }
.rep-card-ic{
  display:inline-flex; align-items:center; justify-content:center; width:54px; height:54px; border-radius:0;
  background:var(--rep-accent-soft); color:var(--rep-accent); border:1px solid var(--rep-accent-line); margin-bottom:22px;
}
.rep-card-t{ font-family:var(--rep-serif); font-size:clamp(19px,2vw,23px); font-weight:600; line-height:1.2; color:var(--rep-ink); margin:0 0 10px; }
.rep-card-x{ font-family:var(--rep-sans); font-size:14px; font-weight:300; line-height:1.75; color:var(--rep-body); margin:0; }
.rep-points-cta{ margin-top:clamp(32px,4vw,50px); }

/* ══════════ FULL-BLEED CTA ══════════ */
.rep-cta{ position:relative; overflow:hidden; isolation:isolate; padding:clamp(96px,15vw,190px) clamp(20px,5vw,64px); }
.rep-cta-bg{ position:absolute; inset:0; z-index:-3; }
.rep-cta-bg-img{ width:100%; height:100%; object-fit:cover; object-position:center; transform:scale(1.08); filter:grayscale(1) contrast(1.05); }
.rep-cta-veil{ position:absolute; inset:0; z-index:-2; }
.rep-cta.is-accent .rep-cta-veil{ background:linear-gradient(135deg, rgba(44,35,30,.90), rgba(111,90,77,.82) 52%, rgba(28,22,17,.93)); }
.rep-cta.is-dark .rep-cta-veil{ background:linear-gradient(135deg, rgba(28,22,17,.94), rgba(44,35,30,.9)); }
.rep-cta-glow{ position:absolute; inset:0; z-index:-1; pointer-events:none;
  background:radial-gradient(46% 60% at 82% 16%, rgba(196,170,150,.20), transparent 60%),
             radial-gradient(46% 60% at 10% 96%, rgba(255,255,255,.06), transparent 60%); }
.rep-cta-in{ position:relative; z-index:1; max-width:800px; margin:0 auto; text-align:center; }
.rep-cta-orn{ display:inline-flex; align-items:center; gap:14px; color:rgba(245,240,232,.75); margin-bottom:26px; }
.rep-cta-orn i{ display:block; width:46px; height:1px; background:linear-gradient(90deg, transparent, rgba(245,240,232,.55)); }
.rep-cta-orn i:last-child{ background:linear-gradient(90deg, rgba(245,240,232,.55), transparent); }
.rep-cta-eyebrow{ font-family:var(--rep-sans); font-size:11.5px; font-weight:700; letter-spacing:.34em; text-transform:uppercase; color:rgba(245,240,232,.82); margin:0 0 20px; }
.rep-cta-title{ font-family:var(--rep-serif); font-size:clamp(38px,6vw,72px); font-weight:500; line-height:1.05; color:#fff; margin:0 0 24px; letter-spacing:.004em; }
.rep-cta-title em{ font-style:italic; color:#efe4d7; }
.rep-cta-sub{ font-family:var(--rep-sans); font-size:clamp(15px,1.6vw,17px); font-weight:300; line-height:1.8; color:rgba(255,255,255,.88); max-width:560px; margin:0 auto 42px; }
.rep-cta-actions{ display:flex; flex-wrap:wrap; gap:16px; justify-content:center; }
.rep-cta-btn{
  display:inline-flex; align-items:center; gap:11px; background:#fff; color:var(--rep-ink); text-decoration:none;
  font-family:var(--rep-sans); font-size:12.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
  padding:18px 42px; border-radius:0; border:1px solid transparent;
  transition:transform .35s var(--rep-e), box-shadow .35s var(--rep-e), background .3s ease, color .3s ease;
  box-shadow:0 20px 46px -18px rgba(0,0,0,.55);
}
.rep-cta-btn:hover{ transform:translateY(-3px); background:var(--rep-accent); color:#fff; box-shadow:0 28px 56px -18px rgba(0,0,0,.6); }
.rep-cta-btn--ghost{ background:transparent; color:#fff; border-color:rgba(255,255,255,.4); box-shadow:none; }
.rep-cta-btn--ghost:hover{ background:rgba(255,255,255,.1); border-color:#fff; color:#fff; }
.rep-arrow{ transition:transform .35s var(--rep-e); }
.rep-cta-btn:hover .rep-arrow{ transform:translateX(5px); }

@media (prefers-reduced-motion: reduce){
  .rep-page *{ transition-duration:.001ms !important; animation-duration:.001ms !important; }
  .rep-pre{ opacity:1 !important; transform:none !important; }
  .rep-parallax{ transform:none !important; }
  .rep-img{ filter:grayscale(1) contrast(1.03) !important; }
}
`
