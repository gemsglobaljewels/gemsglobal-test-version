'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowDown, Gem, Sparkles } from 'lucide-react'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import { CraftsmanshipConfig } from '@/lib/craftsmanship'

/* ════════════════════════════════════════════════════════════════
   CRAFTSMANSHIP — public editorial page (2.0)
   Cinematic, luxury, magazine-grade. Warm ivory canvas, taupe accent,
   deep-espresso ink, Bodoni/Cormorant serifs. Driven entirely by an
   admin-editable CraftsmanshipConfig: cinematic hero, editorial intro,
   reorderable alternating image/text "process" blocks with ghost numerals,
   and a full-bleed image CTA. All styles scoped `.cr-`.
════════════════════════════════════════════════════════════════ */

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1000&h=1200&fit=crop&q=85'

/** Split a textarea value into paragraphs on blank lines. */
const toParagraphs = (text: string) =>
  String(text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

export default function CraftsmanshipContent({
  config,
}: {
  config: CraftsmanshipConfig
}) {
  const { hero, closing } = config
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

    /* reveal */
    if (!reduce && 'IntersectionObserver' in window) {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('.cr-page [data-reveal]')
      )
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('cr-in')
              e.target.classList.remove('cr-pre')
              io.unobserve(e.target)
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      )
      for (const el of els) {
        if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
          el.classList.add('cr-pre')
          io.observe(el)
        }
      }

      /* parallax */
      const media = Array.from(document.querySelectorAll<HTMLElement>('.cr-parallax'))
      let raf = 0
      const onScroll = () => {
        if (raf) return
        raf = requestAnimationFrame(() => {
          const vh = window.innerHeight
          for (const m of media) {
            const r = m.getBoundingClientRect()
            if (r.bottom < 0 || r.top > vh) continue
            const p = (r.top + r.height / 2 - vh / 2) / vh // -0.5..0.5
            m.style.setProperty('--cr-py', `${(-p * 26).toFixed(1)}px`)
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

  return (
    <>
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <main className="cr-page" ref={pageRef as any} suppressHydrationWarning>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="cr-hero">
          <div className="cr-hero-grid">
            <div className="cr-hero-copy" data-reveal>
              <p className="cr-kicker">
                <span className="cr-kicker-line" />
                {hero.eyebrow || 'The Atelier'}
              </p>
              <h1 className="cr-hero-title">
                {hero.title} {hero.accent && <em>{hero.accent}</em>}
              </h1>
              {hero.subtitle && <p className="cr-hero-lead">{hero.subtitle}</p>}
              <div className="cr-hero-actions">
                <a href="#cr-process" className="cr-btn cr-btn--dark">
                  <span>Explore the Process</span>
                  <ArrowDown size={16} className="cr-btn-ico cr-btn-ico--down" />
                </a>
                {closing.cta_text && (
                  <Link href={closing.cta_link || '/appointments'} className="cr-btn cr-btn--line">
                    <span>{closing.cta_text}</span>
                    <ArrowRight size={16} className="cr-btn-ico" />
                  </Link>
                )}
              </div>
            </div>

            {hero.image && (
              <div className="cr-hero-media" data-reveal>
                <div className="cr-hero-frame">
                  <div className="cr-parallax cr-hero-imgwrap">
                    <img src={hero.image} alt="" className="cr-hero-img" />
                  </div>
                  <span className="cr-hero-inline" aria-hidden="true" />
                </div>
                <span className="cr-hero-badge">
                  <Gem size={13} strokeWidth={1.6} /> Handcrafted in-house
                </span>
                <span className="cr-hero-seal" aria-hidden="true">
                  <span>Est.</span>
                  <strong>Bespoke</strong>
                  <span>Atelier</span>
                </span>
              </div>
            )}
          </div>

          <div className="cr-scrollcue" aria-hidden="true">
            <span className="cr-scrollcue-tx">Scroll</span>
            <span className="cr-scrollcue-bar"><i /></span>
          </div>
        </section>

        {/* ── EDITORIAL INTRO ──────────────────────────────────── */}
        {heroIntro.length > 0 && (
          <section className="cr-intro" data-reveal>
            <div className="cr-intro-in">
              <span className="cr-intro-mark" aria-hidden="true"><Sparkles size={18} strokeWidth={1.4} /></span>
              <div className="cr-intro-copy">
                {heroIntro.map((p, i) => (
                  <p key={i} className={i === 0 ? 'cr-intro-lead' : ''}>{p}</p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── ALTERNATING PROCESS BLOCKS ───────────────────────── */}
        {sections.length > 0 && (
          <section className="cr-process" id="cr-process">
            {(config.sections_eyebrow || config.sections_title) && (
              <div className="cr-head" data-reveal>
                {config.sections_eyebrow && (
                  <span className="cr-head-eyebrow">
                    <span className="cr-head-eyebrow-line" />
                    {config.sections_eyebrow}
                    <span className="cr-head-eyebrow-line" />
                  </span>
                )}
                {config.sections_title && (
                  <h2 className="cr-head-title">{config.sections_title}</h2>
                )}
              </div>
            )}

            <div className="cr-blocks">
              {sections.map((s, i) => {
                const paras = toParagraphs(s.body)
                return (
                  <article
                    key={s.id || i}
                    className={`cr-block ${
                      s.image_side === 'right' ? 'cr-block--img-right' : 'cr-block--img-left'
                    }`}
                    data-reveal
                  >
                    <div className="cr-block-media">
                      <div className="cr-block-frame">
                        <div className="cr-parallax cr-block-imgwrap">
                          <img
                            src={s.image || FALLBACK_IMG}
                            alt={s.title || ''}
                            className="cr-block-img"
                            loading="lazy"
                          />
                        </div>
                        <span className="cr-block-inline" aria-hidden="true" />
                      </div>
                      <span className="cr-block-num" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="cr-block-copy">
                      <span className="cr-block-step" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')} <i /> {String(sections.length).padStart(2, '0')}
                      </span>
                      {s.eyebrow && <span className="cr-block-eyebrow">{s.eyebrow}</span>}
                      {s.title && <h3 className="cr-block-title">{s.title}</h3>}
                      {paras.length > 0 && (
                        <div className="cr-block-body">
                          {paras.map((p, j) => (
                            <p key={j}>{p}</p>
                          ))}
                        </div>
                      )}
                      {s.cta_text && (
                        <Link
                          href={s.cta_link || '/collection'}
                          className="cr-btn cr-btn--outline"
                        >
                          <span>{s.cta_text}</span>
                          <ArrowRight size={16} className="cr-btn-ico" />
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* ── FULL-BLEED CLOSING CTA ────────────────────────────── */}
        {(closing.title || closing.cta_text) && (
          <section className={`cr-cta ${closing.theme === 'dark' ? 'is-dark' : 'is-accent'}`} data-reveal>
            <div className="cr-cta-bg" aria-hidden="true">
              <img src={ctaBg} alt="" className="cr-cta-bg-img" />
            </div>
            <span className="cr-cta-veil" aria-hidden="true" />
            <span className="cr-cta-glow" aria-hidden="true" />

            <div className="cr-cta-in">
              <span className="cr-cta-orn" aria-hidden="true">
                <i /><Gem size={16} strokeWidth={1.3} /><i />
              </span>
              {closing.eyebrow && <p className="cr-cta-eyebrow">{closing.eyebrow}</p>}
              {closing.title && (
                <h2 className="cr-cta-title">
                  {closing.title} {closing.accent && <em>{closing.accent}</em>}
                </h2>
              )}
              {closing.subtitle && <p className="cr-cta-sub">{closing.subtitle}</p>}
              {closing.cta_text && (
                <div className="cr-cta-actions">
                  <Link href={closing.cta_link || '/appointments'} className="cr-cta-btn">
                    <span>{closing.cta_text}</span>
                    <ArrowRight size={18} className="cr-arrow" />
                  </Link>
                  <Link href="/custom-order" className="cr-cta-btn cr-cta-btn--ghost">
                    <span>Start a Custom Piece</span>
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
   SCOPED CSS  ·  ivory canvas, taupe accent, espresso ink
════════════════════════════════════════════════════════════════ */
const CSS = `
.cr-page{
  --cr-ink:#211913;
  --cr-body:#5a4f47;
  --cr-muted:#8b7d71;
  --cr-accent:#a98a72;
  --cr-accent-deep:#7c6250;
  --cr-line:rgba(33,25,19,.10);
  --cr-line-2:rgba(33,25,19,.16);
  --cr-ivory:#f7f2ec;
  --cr-ivory-2:#efe7dd;
  --cr-cream:#fbf8f4;
  --cr-serif:var(--font-playfair, 'Cormorant Garamond', Georgia, serif);
  --cr-display:var(--font-main, 'Bodoni Moda', Georgia, serif);
  --cr-sans:var(--font-dmsans, system-ui, sans-serif);
  --cr-e:cubic-bezier(.22,1,.36,1);
  --cr-shadow:0 34px 90px -40px rgba(33,25,19,.55);
  --cr-py:0px;
  background:var(--cr-cream); color:var(--cr-body); min-height:100vh; overflow-x:clip;
}
.cr-page *{ box-sizing:border-box; }

/* ── reveal ── */
.cr-pre{ opacity:0; transform:translateY(34px); }
.cr-in{ animation:crReveal .95s var(--cr-e) both; }
@keyframes crReveal{ from{ opacity:0; transform:translateY(34px);} to{ opacity:1; transform:none;} }

/* ── kicker ── */
.cr-kicker{
  display:inline-flex; align-items:center; gap:14px;
  font-family:var(--cr-sans); font-size:11.5px; font-weight:700; letter-spacing:.36em;
  text-transform:uppercase; color:var(--cr-accent); margin:0 0 26px;
}
.cr-kicker-line{ display:block; width:44px; height:1px; background:var(--cr-accent); opacity:.6; }

/* ── buttons ── */
.cr-btn{
  position:relative; display:inline-flex; align-items:center; gap:11px;
  font-family:var(--cr-sans); font-size:12px; font-weight:600; letter-spacing:.13em;
  text-transform:uppercase; text-decoration:none; cursor:pointer;
  padding:16px 32px; border-radius:999px; border:1px solid transparent;
  transition:transform .35s var(--cr-e), box-shadow .35s var(--cr-e), background .3s ease, color .3s ease, border-color .3s ease;
  white-space:nowrap;
}
.cr-btn-ico{ transition:transform .35s var(--cr-e); }
.cr-btn:hover .cr-btn-ico{ transform:translateX(4px); }
.cr-btn:hover .cr-btn-ico--down{ transform:translateY(4px); }
.cr-btn--dark{ background:var(--cr-ink); color:#fff; box-shadow:0 18px 38px -18px rgba(33,25,19,.6); }
.cr-btn--dark:hover{ background:var(--cr-accent-deep); transform:translateY(-2px); box-shadow:0 26px 50px -18px rgba(124,98,80,.6); }
.cr-btn--line{ background:transparent; color:var(--cr-ink); border-color:var(--cr-line-2); }
.cr-btn--line:hover{ border-color:var(--cr-accent); color:var(--cr-accent-deep); transform:translateY(-2px); }
.cr-btn--outline{ background:transparent; color:var(--cr-ink); border-color:var(--cr-line-2); margin-top:30px; }
.cr-btn--outline:hover{ border-color:var(--cr-accent); color:var(--cr-accent-deep); transform:translateY(-2px); box-shadow:var(--shadow-md); }

/* ══════════ HERO ══════════ */
.cr-hero{
  position:relative; min-height:clamp(600px,92vh,940px);
  display:flex; flex-direction:column; justify-content:center;
  padding:clamp(90px,12vh,150px) clamp(18px,4vw,64px) clamp(60px,8vh,90px);
  background:
    radial-gradient(52% 48% at 82% 18%, rgba(169,138,114,.16), transparent 66%),
    linear-gradient(180deg, var(--cr-cream) 0%, var(--cr-ivory) 100%);
  border-bottom:1px solid var(--cr-line);
  overflow:hidden;
}
.cr-hero::before{
  content:''; position:absolute; inset:0; z-index:0; pointer-events:none; opacity:.5;
  background-image:linear-gradient(var(--cr-line) 1px, transparent 1px);
  background-size:100% clamp(56px,7vh,84px);
  -webkit-mask-image:linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent);
          mask-image:linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent);
}
.cr-hero-grid{
  position:relative; z-index:1; width:100%; max-width:1320px; margin:0 auto;
  display:grid; grid-template-columns:1.04fr .96fr; gap:clamp(36px,5vw,90px); align-items:center;
}
.cr-hero-copy{ position:relative; }
.cr-hero-title{
  font-family:var(--cr-display); font-size:clamp(42px,6.6vw,86px); font-weight:400; line-height:1.0;
  letter-spacing:-.016em; color:var(--cr-ink); margin:0 0 28px;
}
.cr-hero-title em{ display:block; font-family:var(--cr-serif); font-style:italic; font-weight:500; color:var(--cr-accent); margin-top:.08em; }
.cr-hero-lead{
  font-family:var(--cr-serif); font-size:clamp(19px,2.1vw,25px); font-weight:500; font-style:italic; line-height:1.45;
  color:var(--cr-accent-deep); max-width:520px; margin:0 0 38px;
}
.cr-hero-actions{ display:flex; flex-wrap:wrap; gap:14px; }

.cr-hero-media{ position:relative; }
.cr-hero-frame{
  position:relative; border-radius:clamp(180px,22vw,260px) clamp(180px,22vw,260px) clamp(18px,2vw,28px) clamp(18px,2vw,28px);
  overflow:hidden; aspect-ratio:4/5; box-shadow:var(--cr-shadow); background:var(--cr-ivory-2);
}
.cr-hero-imgwrap{ position:absolute; inset:-8% 0; will-change:transform; transform:translateY(var(--cr-py)); }
.cr-hero-img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform 1.4s var(--cr-e); }
.cr-hero-media:hover .cr-hero-img{ transform:scale(1.05); }
.cr-hero-inline{ position:absolute; inset:14px; border:1px solid rgba(255,255,255,.42); border-radius:inherit; pointer-events:none; z-index:2; }
.cr-hero-badge{
  position:absolute; left:-14px; top:34px; z-index:3;
  display:inline-flex; align-items:center; gap:8px; background:#fff; color:var(--cr-accent-deep);
  font-family:var(--cr-sans); font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  padding:12px 18px; border-radius:999px; border:1px solid var(--cr-line-2); box-shadow:0 16px 34px -16px rgba(33,25,19,.42);
}
.cr-hero-seal{
  position:absolute; right:-18px; bottom:-18px; z-index:3;
  width:clamp(92px,10vw,116px); height:clamp(92px,10vw,116px); border-radius:50%;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
  background:var(--cr-ink); color:#f3e9df; text-align:center;
  box-shadow:0 20px 44px -18px rgba(33,25,19,.6);
  font-family:var(--cr-sans); text-transform:uppercase; letter-spacing:.18em;
}
.cr-hero-seal span{ font-size:8.5px; opacity:.72; }
.cr-hero-seal strong{ font-family:var(--cr-serif); font-size:clamp(15px,1.6vw,18px); font-weight:600; letter-spacing:.04em; text-transform:none; color:#fff; }

.cr-scrollcue{ position:absolute; left:50%; bottom:26px; transform:translateX(-50%); z-index:1; display:flex; flex-direction:column; align-items:center; gap:9px; }
.cr-scrollcue-tx{ font-family:var(--cr-sans); font-size:9.5px; font-weight:700; letter-spacing:.32em; text-transform:uppercase; color:var(--cr-muted); }
.cr-scrollcue-bar{ position:relative; width:1px; height:44px; background:var(--cr-line-2); overflow:hidden; }
.cr-scrollcue-bar i{ position:absolute; top:-40%; left:0; width:100%; height:40%; background:var(--cr-accent); animation:crCue 1.9s var(--cr-e) infinite; }
@keyframes crCue{ 0%{ top:-40%;} 70%,100%{ top:100%;} }

@media(max-width:900px){
  .cr-hero{ min-height:auto; text-align:center; }
  .cr-hero-grid{ grid-template-columns:1fr; gap:46px; }
  .cr-kicker{ justify-content:center; }
  .cr-hero-lead{ margin-left:auto; margin-right:auto; }
  .cr-hero-actions{ justify-content:center; }
  .cr-hero-media{ order:-1; }
  .cr-hero-frame{ max-width:400px; margin:0 auto; aspect-ratio:4/5; }
  .cr-scrollcue{ display:none; }
  .cr-hero::before{ display:none; }
}

/* ══════════ EDITORIAL INTRO ══════════ */
.cr-intro{ padding:clamp(64px,9vw,120px) clamp(18px,4vw,64px) clamp(24px,4vw,48px); }
.cr-intro-in{ max-width:900px; margin:0 auto; display:flex; gap:clamp(22px,3vw,44px); align-items:flex-start; }
.cr-intro-mark{
  flex-shrink:0; width:54px; height:54px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;
  color:var(--cr-accent-deep); background:var(--cr-ivory); border:1px solid var(--cr-line); margin-top:6px;
}
.cr-intro-copy{ min-width:0; }
.cr-intro-lead{
  font-family:var(--cr-serif); font-size:clamp(22px,2.7vw,32px); font-weight:500; line-height:1.4;
  color:var(--cr-ink); margin:0 0 22px;
}
.cr-intro-copy p:not(.cr-intro-lead){
  font-family:var(--cr-sans); font-size:clamp(15px,1.5vw,16.5px); font-weight:300; line-height:1.85;
  color:var(--cr-body); margin:0 0 16px;
}
.cr-intro-copy p:last-child{ margin-bottom:0; }
@media(max-width:640px){ .cr-intro-in{ flex-direction:column; align-items:center; text-align:center; gap:20px; } }

/* ══════════ PROCESS HEADING ══════════ */
.cr-process{ padding:clamp(40px,6vw,80px) clamp(18px,4vw,64px) clamp(60px,8vw,110px); }
.cr-process > *{ max-width:1200px; margin-left:auto; margin-right:auto; }
.cr-head{ display:flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:clamp(48px,6vw,80px); }
.cr-head-eyebrow{
  display:inline-flex; align-items:center; gap:14px;
  font-family:var(--cr-sans); font-size:11px; font-weight:700; letter-spacing:.34em;
  text-transform:uppercase; color:var(--cr-accent); margin-bottom:18px;
}
.cr-head-eyebrow-line{ display:block; width:34px; height:1px; background:var(--cr-accent); opacity:.55; }
.cr-head-title{
  font-family:var(--cr-serif); font-size:clamp(32px,5vw,58px); font-weight:500; line-height:1.04;
  letter-spacing:.004em; color:var(--cr-ink); margin:0;
}

/* ══════════ ALTERNATING BLOCKS ══════════ */
.cr-blocks{ display:flex; flex-direction:column; gap:clamp(64px,9vw,128px); }
.cr-block{
  display:grid; grid-template-columns:1fr 1fr; align-items:center;
  gap:clamp(32px,5vw,88px);
}
.cr-block--img-left .cr-block-media{ order:1; }
.cr-block--img-left .cr-block-copy{ order:2; }
.cr-block--img-right .cr-block-media{ order:2; }
.cr-block--img-right .cr-block-copy{ order:1; }

.cr-block-media{ position:relative; }
.cr-block-frame{
  position:relative; border-radius:clamp(16px,1.8vw,26px); overflow:hidden;
  aspect-ratio:4/5; background:var(--cr-ivory-2); box-shadow:0 30px 70px -38px rgba(33,25,19,.6);
}
.cr-block-imgwrap{ position:absolute; inset:-8% 0; will-change:transform; transform:translateY(var(--cr-py)); }
.cr-block-img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform 1.3s var(--cr-e); }
.cr-block:hover .cr-block-img{ transform:scale(1.06); }
.cr-block-inline{ position:absolute; inset:13px; border:1px solid rgba(255,255,255,.30); border-radius:inherit; pointer-events:none; z-index:2; }
.cr-block-num{
  position:absolute; bottom:-30px; z-index:2;
  font-family:var(--cr-display); font-size:clamp(90px,13vw,190px); font-weight:400; line-height:.8;
  color:var(--cr-accent); opacity:.16; letter-spacing:-.04em; pointer-events:none;
}
.cr-block--img-left .cr-block-num{ right:-14px; }
.cr-block--img-right .cr-block-num{ left:-14px; }

.cr-block-copy{ position:relative; min-width:0; padding:clamp(6px,1vw,16px) 0; }
.cr-block-step{
  display:inline-flex; align-items:center; gap:9px; font-family:var(--cr-sans);
  font-size:11px; font-weight:700; letter-spacing:.2em; color:var(--cr-muted); margin-bottom:20px;
}
.cr-block-step i{ display:block; width:26px; height:1px; background:var(--cr-line-2); }
.cr-block-eyebrow{
  display:block; font-family:var(--cr-sans); font-size:11px; font-weight:700;
  letter-spacing:.3em; text-transform:uppercase; color:var(--cr-accent); margin-bottom:14px;
}
.cr-block-title{
  font-family:var(--cr-serif); font-size:clamp(28px,3.7vw,46px); font-weight:600; line-height:1.08;
  color:var(--cr-ink); margin:0 0 22px;
}
.cr-block-body p{
  font-family:var(--cr-sans); font-size:clamp(14.5px,1.5vw,16.5px); font-weight:300; line-height:1.9;
  color:var(--cr-body); margin:0 0 18px; max-width:540px;
}
.cr-block-body p:last-child{ margin-bottom:0; }

@media(max-width:900px){
  .cr-block{ grid-template-columns:1fr; gap:28px; }
  .cr-block--img-left .cr-block-media,
  .cr-block--img-right .cr-block-media{ order:1; }
  .cr-block--img-left .cr-block-copy,
  .cr-block--img-right .cr-block-copy{ order:2; }
  .cr-block-frame{ max-width:480px; margin:0 auto; }
  .cr-block-copy{ text-align:center; }
  .cr-block-step{ justify-content:center; }
  .cr-block-body p{ margin-left:auto; margin-right:auto; }
  .cr-block-num{ font-size:96px; bottom:-20px; }
  .cr-block--img-left .cr-block-num,
  .cr-block--img-right .cr-block-num{ right:8px; left:auto; }
}

/* ══════════ FULL-BLEED CTA ══════════ */
.cr-cta{
  position:relative; overflow:hidden; isolation:isolate;
  padding:clamp(96px,15vw,190px) clamp(20px,5vw,64px);
}
.cr-cta-bg{ position:absolute; inset:0; z-index:-3; }
.cr-cta-bg-img{ width:100%; height:100%; object-fit:cover; object-position:center; transform:scale(1.08); filter:saturate(.9); }
.cr-cta-veil{ position:absolute; inset:0; z-index:-2; }
.cr-cta.is-accent .cr-cta-veil{ background:linear-gradient(135deg, rgba(60,44,33,.9), rgba(124,98,80,.86) 55%, rgba(45,33,25,.94)); }
.cr-cta.is-dark   .cr-cta-veil{ background:linear-gradient(135deg, rgba(24,17,12,.94), rgba(33,25,19,.9)); }
.cr-cta-glow{ position:absolute; inset:0; z-index:-1; pointer-events:none;
  background:radial-gradient(46% 60% at 82% 16%, rgba(255,236,214,.20), transparent 60%),
             radial-gradient(46% 60% at 10% 96%, rgba(255,255,255,.08), transparent 60%); }
.cr-cta-in{ position:relative; z-index:1; max-width:800px; margin:0 auto; text-align:center; }
.cr-cta-orn{ display:inline-flex; align-items:center; gap:14px; color:rgba(255,236,214,.72); margin-bottom:26px; }
.cr-cta-orn i{ display:block; width:44px; height:1px; background:linear-gradient(90deg, transparent, rgba(255,236,214,.6)); }
.cr-cta-orn i:last-child{ background:linear-gradient(90deg, rgba(255,236,214,.6), transparent); }
.cr-cta-eyebrow{ font-family:var(--cr-sans); font-size:11.5px; font-weight:700; letter-spacing:.34em; text-transform:uppercase; color:rgba(255,236,214,.82); margin:0 0 20px; }
.cr-cta-title{ font-family:var(--cr-serif); font-size:clamp(38px,6vw,72px); font-weight:500; line-height:1.05; color:#fff; margin:0 0 24px; letter-spacing:.004em; }
.cr-cta-title em{ font-style:italic; color:#f2ddc6; }
.cr-cta-sub{ font-family:var(--cr-sans); font-size:clamp(15px,1.6vw,17px); font-weight:300; line-height:1.8; color:rgba(255,255,255,.86); max-width:560px; margin:0 auto 42px; }
.cr-cta-actions{ display:flex; flex-wrap:wrap; gap:16px; justify-content:center; }
.cr-cta-btn{
  display:inline-flex; align-items:center; gap:11px; background:#fff; color:var(--cr-ink); text-decoration:none;
  font-family:var(--cr-sans); font-size:12.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
  padding:18px 42px; border-radius:999px; transition:transform .35s var(--cr-e), box-shadow .35s var(--cr-e), background .3s ease, color .3s ease;
  box-shadow:0 20px 46px -18px rgba(0,0,0,.55);
}
.cr-cta-btn:hover{ transform:translateY(-3px); box-shadow:0 28px 56px -18px rgba(0,0,0,.6); }
.cr-cta-btn--ghost{ background:transparent; color:#fff; border:1px solid rgba(255,255,255,.4); box-shadow:none; }
.cr-cta-btn--ghost:hover{ background:rgba(255,255,255,.1); border-color:#fff; }
.cr-arrow{ transition:transform .35s var(--cr-e); }
.cr-cta-btn:hover .cr-arrow{ transform:translateX(5px); }

@media (prefers-reduced-motion: reduce){
  .cr-page *{ transition-duration:.001ms !important; animation-duration:.001ms !important; }
  .cr-pre{ opacity:1 !important; transform:none !important; }
  .cr-parallax{ transform:none !important; }
}
`
