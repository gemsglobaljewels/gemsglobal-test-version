'use client'

/**
 * Public /size-guide page — the comprehensive Ring + Bracelet + Diamond sizing
 * guide. DISTINCT from the ring-only /ring-size-guide page. Entirely driven by
 * the admin-managed `size_guide` singleton (hero + dynamic sections), fetched
 * from /api/size-guide. Every optional field is guarded so the page renders
 * gracefully whether or not the admin has uploaded media yet.
 *
 * Design: same warm ivory / taupe-gold marketing theme as /about and the legal
 * pages — scoped CSS under `.sgx`, fluid clamp() type, framer-motion reveals
 * that fully honour prefers-reduced-motion. A fixed chapter rail tracks the
 * active section on large screens; the hero anchor chips cover everything else.
 * A print stylesheet is included because the guide's own steps tell customers
 * to cut out the printed sizer strips.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Ruler, Hand, Scissors, Table2, BadgeCheck, Scale, Gem, Diamond, Eye,
  Search, Target, Sparkles, Circle, Info, PencilRuler,
  Printer, ArrowRight, ArrowDown, PlayCircle,
} from 'lucide-react'
import { DEFAULT_SIZE_GUIDE, type SizeGuideDoc } from '@/lib/sizeGuide'

// Resolve a stored tip icon name → lucide component. Kept in sync with
// ALLOWED_TIP_ICONS in lib/sizeGuide.ts; unknown names fall back to Ruler.
const ICONS: Record<string, any> = {
  Ruler, Hand, Scissors, Table2, BadgeCheck, Scale, Gem, Diamond, Eye,
  Search, Target, Sparkles, Circle, Info, PencilRuler,
}

const num = (i: number) => String(i + 1).padStart(2, '0')

/** Render a title with its final word in the gradient-italic accent style. */
function AccentedTitle({ text, className }: { text: string; className: string }) {
  const words = String(text || '').trim().split(/\s+/)
  if (words.length < 2) return <h1 className={className}>{text}</h1>
  const last = words.pop() as string
  return (
    <h1 className={className}>
      {words.join(' ')} <span className="gemtxt">{last}</span>
    </h1>
  )
}

export default function SizeGuidePage() {
  const [doc, setDoc] = useState<SizeGuideDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<string>('')
  const reduce = useReducedMotion()

  useEffect(() => {
    let alive = true
    fetch('/api/size-guide', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (alive) setDoc(j) })
      .catch(() => { if (alive) setDoc(DEFAULT_SIZE_GUIDE) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const hero = doc?.hero ?? DEFAULT_SIZE_GUIDE.hero
  const sections = doc?.sections ?? []

  // Scroll-spy for the fixed chapter rail. Re-registered whenever the section
  // list changes; the band keeps whichever section owns the viewport middle.
  useEffect(() => {
    if (sections.length === 0) return
    const els = sections
      .map((s) => document.getElementById(`section-${s.id}`))
      .filter(Boolean) as HTMLElement[]
    if (els.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting)
        if (hit.length > 0) setActive(hit[0].target.id.replace('section-', ''))
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections.length, doc])

  const fadeUp = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-70px' as const },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
      }

  const onPrint = useCallback(() => {
    if (typeof window !== 'undefined') window.print()
  }, [])

  const onImage = !!hero.background_url

  return (
    <>
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <div className="sgx" suppressHydrationWarning>
        <main>
          {/* ══════════ HERO ══════════ */}
          <section className={`sgx-hero${onImage ? ' has-img' : ''}`}>
            {onImage && (
              <div className="sgx-hero-bg">
                <img src={hero.background_url} alt="" />
                <span className="sgx-hero-veil" />
              </div>
            )}

            <div className="sgx-shell sgx-hero-in">
              {hero.eyebrow && (
                <motion.div
                  className="sgx-eyebrow center"
                  initial={reduce ? undefined : { opacity: 0, y: 12 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="ln" />
                  <span className="tag">{hero.eyebrow}</span>
                  <span className="ln" />
                </motion.div>
              )}

              <motion.div
                initial={reduce ? undefined : { opacity: 0, y: 22 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
              >
                <AccentedTitle text={hero.title} className="sgx-hero-h" />
              </motion.div>

              {hero.subtitle && (
                <motion.p
                  className="sgx-hero-p"
                  initial={reduce ? undefined : { opacity: 0, y: 18 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
                >
                  {hero.subtitle}
                </motion.p>
              )}

              {/* Anchor chips — jump to each chart */}
              {sections.length > 0 && (
                <motion.nav
                  className="sgx-chips"
                  aria-label="Size charts"
                  initial={reduce ? undefined : { opacity: 0, y: 18 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
                >
                  {sections.map((s, i) => (
                    <a key={s.id} href={`#section-${s.id}`} className="sgx-chip">
                      <span className="n">{num(i)}</span>
                      <span className="t">{s.title || 'Chart'}</span>
                      <ArrowDown size={13} strokeWidth={2} className="ar" />
                    </a>
                  ))}
                </motion.nav>
              )}
            </div>
          </section>

          {/* ══════════ CHAPTER RAIL (desktop) ══════════ */}
          {sections.length > 1 && (
            <nav className="sgx-rail" aria-label="Jump to chart">
              <ul>
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#section-${s.id}`}
                      className={active === s.id ? 'on' : undefined}
                      aria-current={active === s.id ? 'true' : undefined}
                    >
                      <span className="dot" />
                      <span className="lb">
                        <b>{num(i)}</b>
                        {s.title || 'Chart'}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* ══════════ SKELETON ══════════ */}
          {loading && sections.length === 0 && (
            <section className="sgx-sec">
              <div className="sgx-shell">
                <div className="sgx-skel-head">
                  <span className="sk sk-a" />
                  <span className="sk sk-b" />
                </div>
                <div className="sgx-skel-grid">
                  <span className="sk sk-fig" />
                  <div className="sgx-skel-stack">
                    <span className="sk sk-row" />
                    <span className="sk sk-row" />
                    <span className="sk sk-row" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ══════════ SECTIONS ══════════ */}
          {sections.map((s, i) => {
            const alt = i % 2 === 1
            const flip = i % 2 === 1
            const tips = s.tips ?? []
            const steps = s.steps ?? []
            const hasBand = !!s.image_url || tips.length > 0

            return (
              <section
                key={s.id}
                id={`section-${s.id}`}
                className={`sgx-sec${alt ? ' alt' : ''}`}
              >
                <div className="sgx-shell">
                  {/* ── heading ── */}
                  <motion.header className="sgx-sec-head" {...fadeUp}>
                    <div className="sgx-sec-num">
                      <span className="ln" />
                      <span className="n">{num(i)}</span>
                      <span className="ln" />
                    </div>
                    <h2 className="sgx-h2">{s.title}</h2>
                    {s.subtitle && <p className="sgx-lead">{s.subtitle}</p>}
                  </motion.header>

                  {/* ── illustration + tips ── */}
                  {hasBand && (
                    <div
                      className={`sgx-band${flip ? ' flip' : ''}${
                        !s.image_url ? ' no-img' : ''
                      }${tips.length === 0 ? ' no-tips' : ''}`}
                    >
                      {s.image_url && (
                        <motion.figure
                          className="sgx-fig"
                          initial={reduce ? undefined : { opacity: 0, x: flip ? 28 : -28 }}
                          whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: '-70px' }}
                          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="sgx-fig-frame">
                            <img src={s.image_url} alt={s.title || 'Size chart'} loading="lazy" />
                          </div>
                          <figcaption className="sgx-fig-tag">
                            <span className="t">{s.title || 'Chart'}</span>
                            <span className="s">Reference</span>
                          </figcaption>
                        </motion.figure>
                      )}

                      {tips.length > 0 && (
                        <ul className="sgx-tips">
                          {tips.map((t, ti) => {
                            const Icon = ICONS[t.icon] || Ruler
                            return (
                              <motion.li
                                key={t.id}
                                className="sgx-tip"
                                initial={reduce ? undefined : { opacity: 0, y: 20 }}
                                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{
                                  duration: 0.55,
                                  ease: [0.22, 1, 0.36, 1],
                                  delay: ti * 0.07,
                                }}
                              >
                                <span className="ic">
                                  <Icon size={20} strokeWidth={1.5} />
                                </span>
                                <div className="bd">
                                  {t.title && <h3>{t.title}</h3>}
                                  {t.text && <p>{t.text}</p>}
                                </div>
                              </motion.li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* ── steps ── */}
                  {steps.length > 0 && (
                    <div className="sgx-steps-wrap">
                      <motion.div className="sgx-divider" {...fadeUp}>
                        <span className="ln" />
                        <span className="tx">Step by step</span>
                        <span className="ln" />
                      </motion.div>

                      <ol className="sgx-steps" style={{ ['--n' as any]: Math.min(steps.length, 3) }}>
                        {steps.map((st, si) => (
                          <motion.li
                            key={st.id}
                            className="sgx-step"
                            initial={reduce ? undefined : { opacity: 0, y: 20 }}
                            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{
                              duration: 0.55,
                              ease: [0.22, 1, 0.36, 1],
                              delay: si * 0.07,
                            }}
                          >
                            <div className="sgx-step-top">
                              <span className="sgx-step-n">{si + 1}</span>
                              <span className="sgx-step-ghost">{num(si)}</span>
                            </div>
                            {st.image_url && (
                              <div className="sgx-step-img">
                                <img src={st.image_url} alt="" loading="lazy" />
                              </div>
                            )}
                            {st.text && <p>{st.text}</p>}
                          </motion.li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* ── video ── */}
                  {s.video_url && (
                    <motion.div className="sgx-video" {...fadeUp}>
                      <div className="sgx-video-head">
                        <PlayCircle size={16} strokeWidth={1.6} />
                        <span>Watch how it&rsquo;s done</span>
                      </div>
                      <div className="sgx-video-frame">
                        {s.video_type === 'embed' ? (
                          <iframe
                            src={s.video_url}
                            title={`${s.title || 'Size guide'} video`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video controls playsInline preload="metadata" src={s.video_url}>
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>
            )
          })}

          {/* ══════════ CLOSING CTA ══════════ */}
          {!loading && sections.length > 0 && (
            <section className="sgx-cta-wrap">
              <div className="sgx-shell">
                <motion.div className="sgx-cta" {...fadeUp}>
                  <span className="sgx-cta-mk">
                    <Ruler size={26} strokeWidth={1.4} />
                  </span>
                  <h2 className="sgx-cta-h">
                    Still between two <span className="gemtxt">sizes?</span>
                  </h2>
                  <p className="sgx-cta-p">
                    Our team sizes pieces by hand every day. Tell us what you are measuring
                    and we will recommend the fit that sits best — before you order.
                  </p>
                  <div className="sgx-cta-actions">
                    <Link href="/contact-us" className="sgx-btn sgx-btn-p">
                      <span>Talk to a specialist</span>
                      <ArrowRight size={15} strokeWidth={2.1} className="ico" />
                    </Link>
                    <Link href="/shop" className="sgx-btn sgx-btn-o">
                      Browse the collection
                    </Link>
                  </div>
                </motion.div>
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════
   SCOPED CSS · warm ivory canvas · taupe-gold accent
   Mirrors the token set used by /about (.abx) and the legal pages.
════════════════════════════════════════════════════════════════ */
const CSS = `
.sgx{
  --w:#FFFFFF; --iv:#FDFCF9; --cr:#F8F4EE; --wa:#EFE9DF; --bd:#ECE5DA; --bd2:#E2D9CB;
  --a:#8C7456; --a2:#A8916F; --a3:#C9B68F;
  --al:rgba(140,116,86,.10); --am:rgba(140,116,86,.22);
  --ink:#3A2E22; --mu:rgba(58,46,34,.56); --fa:rgba(58,46,34,.40); --li:rgba(58,46,34,.08);
  --serif:var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
  --display:var(--font-main,var(--font-bodoni)),'Bodoni Moda',Georgia,serif;
  --sans:var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;
  --e:cubic-bezier(.22,1,.36,1);
  --spring:cubic-bezier(.34,1.56,.64,1);
  --grad:linear-gradient(135deg,var(--a),var(--a2));
  --gtxt:linear-gradient(120deg,var(--a3),var(--a) 50%,var(--a2));
  --soft:0 30px 70px -32px rgba(58,46,34,.30);
  --soft2:0 16px 44px -24px rgba(58,46,34,.24);
  background:var(--iv); color:var(--ink); font-family:var(--sans);
  min-height:100vh; position:relative; overflow-x:clip;
}
.sgx *{ box-sizing:border-box; }
.sgx ::selection{ background:var(--am); color:var(--ink); }
.sgx a{ text-decoration:none; color:inherit; }
.sgx :focus-visible{ outline:2px solid var(--a); outline-offset:3px; border-radius:6px; }
.sgx img{ display:block; max-width:100%; }
.sgx .gemtxt{
  font-style:italic; color:transparent;
  background:var(--gtxt); -webkit-background-clip:text; background-clip:text;
}
.sgx-shell{ max-width:1240px; margin:0 auto; padding:0 clamp(20px,4vw,48px); }

/* shared eyebrow */
.sgx-eyebrow{ display:inline-flex; align-items:center; gap:12px; margin-bottom:20px; }
.sgx-eyebrow .ln{ width:38px; height:1px; background:linear-gradient(90deg,transparent,var(--a3)); }
.sgx-eyebrow .ln:last-child{ background:linear-gradient(90deg,var(--a3),transparent); }
.sgx-eyebrow .tag{
  font-size:10px; font-weight:600; letter-spacing:.34em; text-transform:uppercase; color:var(--a);
  white-space:nowrap;
}
.sgx-eyebrow.center{ justify-content:center; }

/* ══════════ HERO ══════════ */
.sgx-hero{
  position:relative; overflow:hidden; text-align:center;
  padding:clamp(76px,11vw,142px) 0 clamp(58px,8vw,96px);
  border-bottom:1px solid var(--bd);
}
.sgx-hero::before{
  content:''; position:absolute; top:-38%; left:50%; transform:translateX(-50%);
  width:min(880px,120%); height:min(880px,120%); border-radius:50%;
  background:radial-gradient(circle,var(--al),transparent 68%);
  pointer-events:none; z-index:0;
}
.sgx-hero-bg{ position:absolute; inset:0; z-index:0; }
.sgx-hero-bg img{ width:100%; height:100%; object-fit:cover; }
.sgx-hero-veil{
  position:absolute; inset:0;
  background:linear-gradient(180deg,rgba(38,29,20,.72),rgba(38,29,20,.60) 45%,rgba(38,29,20,.80));
}
.sgx-hero-in{ position:relative; z-index:1; max-width:820px; }
.sgx-hero-h{
  font-family:var(--display); font-weight:400;
  font-size:clamp(38px,6.4vw,82px); line-height:1.04; letter-spacing:-.014em;
  color:var(--ink); margin:0;
}
.sgx-hero-h .gemtxt{ font-family:var(--serif); font-weight:500; }
.sgx-hero-p{
  margin:clamp(20px,2.6vw,30px) auto 0; max-width:36em;
  font-size:clamp(14.5px,1.35vw,17.5px); font-weight:300; line-height:1.85; color:var(--mu);
}

/* hero on a photo — flip to light ink */
.sgx-hero.has-img::before{ display:none; }
.sgx-hero.has-img .sgx-hero-h{ color:#FFF9F0; }
.sgx-hero.has-img .sgx-hero-p{ color:rgba(253,250,245,.80); }
.sgx-hero.has-img .sgx-eyebrow .tag{ color:var(--a3); }
.sgx-hero.has-img .sgx-eyebrow .ln{ background:linear-gradient(90deg,transparent,var(--a3)); }
.sgx-hero.has-img .sgx-eyebrow .ln:last-child{ background:linear-gradient(90deg,var(--a3),transparent); }
.sgx-hero.has-img .sgx-chip{
  background:rgba(255,255,255,.09); border-color:rgba(255,249,240,.26); color:#FFF9F0;
  backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
}
.sgx-hero.has-img .sgx-chip .n{ color:var(--a3); }
.sgx-hero.has-img .sgx-chip:hover{ background:var(--grad); border-color:transparent; color:#fff; }
.sgx-hero.has-img .sgx-print{ color:rgba(253,250,245,.74); border-color:rgba(255,249,240,.24); }
.sgx-hero.has-img .sgx-print:hover{ color:#FFF9F0; border-color:var(--a3); }

/* anchor chips */
.sgx-chips{
  margin-top:clamp(30px,3.6vw,44px);
  display:flex; flex-wrap:wrap; justify-content:center; gap:12px;
}
.sgx-chip{
  display:inline-flex; align-items:center; gap:10px;
  padding:12px 20px; border-radius:50px;
  background:var(--w); border:1px solid var(--bd2); color:var(--ink);
  font-size:12px; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
  transition:transform .34s var(--spring),box-shadow .34s var(--e),border-color .3s,background .3s,color .3s;
  min-height:46px;
}
.sgx-chip .n{ font-family:var(--serif); font-size:14px; font-weight:600; letter-spacing:.02em; color:var(--a); font-style:italic; }
.sgx-chip .ar{ opacity:0; transform:translateY(-3px); transition:opacity .28s,transform .28s var(--e); }
.sgx-chip:hover{ transform:translateY(-3px); box-shadow:var(--soft2); border-color:var(--a2); }
.sgx-chip:hover .ar{ opacity:1; transform:translateY(0); }

/* print action */
.sgx-print{
  margin-top:clamp(22px,2.4vw,30px);
  display:inline-flex; align-items:center; gap:9px; cursor:pointer;
  background:transparent; border:1px solid var(--bd2); border-radius:50px;
  padding:10px 20px; min-height:42px;
  font-family:var(--sans); font-size:10.5px; font-weight:600; letter-spacing:.2em;
  text-transform:uppercase; color:var(--mu);
  transition:color .3s,border-color .3s,transform .3s var(--e);
}
.sgx-print:hover{ color:var(--a); border-color:var(--a2); transform:translateY(-2px); }

/* ══════════ CHAPTER RAIL ══════════ */
.sgx-rail{ display:none; }
@media(min-width:1400px){
  .sgx-rail{
    display:block; position:fixed; left:clamp(16px,2.2vw,40px); top:50%;
    transform:translateY(-50%); z-index:40;
  }
  .sgx-rail ul{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:4px; }
  .sgx-rail a{
    display:flex; align-items:center; gap:14px; padding:9px 0;
    color:var(--fa); transition:color .3s var(--e);
  }
  .sgx-rail .dot{
    width:9px; height:9px; border-radius:50%; flex-shrink:0;
    background:var(--w); border:1.5px solid var(--bd2);
    transition:all .4s var(--spring);
  }
  .sgx-rail .lb{
    font-size:10.5px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
    display:flex; align-items:center; gap:8px; white-space:nowrap;
    opacity:0; transform:translateX(-6px);
    transition:opacity .34s var(--e),transform .34s var(--e);
  }
  .sgx-rail .lb b{ font-family:var(--serif); font-style:italic; font-weight:600; color:var(--a3); }
  .sgx-rail:hover .lb{ opacity:1; transform:translateX(0); }
  .sgx-rail a:hover{ color:var(--ink); }
  .sgx-rail a:hover .dot{ border-color:var(--a2); }
  .sgx-rail a.on{ color:var(--ink); }
  .sgx-rail a.on .dot{ background:var(--grad); border-color:transparent; box-shadow:0 0 0 5px var(--al); }
  .sgx-rail a.on .lb{ opacity:1; transform:translateX(0); }
}

/* ══════════ SECTIONS ══════════ */
.sgx-sec{
  position:relative; scroll-margin-top:clamp(78px,10vw,104px);
  padding:clamp(64px,8.5vw,116px) 0;
  border-bottom:1px solid var(--bd);
}
.sgx-sec.alt{ background:var(--cr); }
.sgx-sec-head{ max-width:760px; margin:0 auto; text-align:center; }
.sgx-sec-num{ display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:18px; }
.sgx-sec-num .ln{ width:clamp(28px,5vw,54px); height:1px; background:var(--bd2); }
.sgx-sec-num .n{
  font-family:var(--serif); font-style:italic; font-size:clamp(19px,2.2vw,26px); font-weight:500;
  color:transparent; background:var(--gtxt); -webkit-background-clip:text; background-clip:text;
  line-height:1;
}
.sgx-h2{
  font-family:var(--serif); font-weight:300;
  font-size:clamp(30px,4.6vw,56px); line-height:1.1; letter-spacing:-.005em;
  color:var(--ink); margin:0;
}
.sgx-lead{
  margin:clamp(16px,2vw,22px) auto 0; max-width:34em;
  font-size:clamp(14px,1.3vw,16.5px); font-weight:300; line-height:1.8; color:var(--mu);
}

/* ── illustration + tips band ── */
.sgx-band{
  margin-top:clamp(42px,5.5vw,74px);
  display:grid; grid-template-columns:1fr 1fr;
  gap:clamp(32px,4.4vw,70px); align-items:center;
}
.sgx-band.flip .sgx-fig{ order:2; }
.sgx-band.no-img{ grid-template-columns:1fr; }
.sgx-band.no-tips{ grid-template-columns:minmax(0,760px); justify-content:center; }
.sgx-band.no-img .sgx-tips{
  display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(16px,1.8vw,24px);
  max-width:1100px; margin:0 auto;
}

/* figure */
.sgx-fig{ position:relative; margin:0; }
.sgx-fig-frame{
  position:relative; overflow:hidden; border-radius:20px;
  border:1px solid var(--bd); background:var(--wa); box-shadow:var(--soft);
}
.sgx-fig-frame img{
  width:100%; height:100%; object-fit:cover;
  transition:transform 1.1s var(--e);
}
.sgx-fig:hover .sgx-fig-frame img{ transform:scale(1.045); }
.sgx-fig-tag{
  position:absolute; left:18px; bottom:18px; z-index:2;
  background:var(--w); border:1px solid var(--bd); border-radius:12px;
  padding:11px 17px; box-shadow:var(--soft2);
}
.sgx-fig-tag .t{
  display:block; font-family:var(--serif); font-size:17px; font-weight:500; color:var(--ink); line-height:1;
}
.sgx-fig-tag .s{
  display:block; margin-top:5px; font-size:8.5px; font-weight:600;
  letter-spacing:.2em; text-transform:uppercase; color:var(--a);
}

/* tips */
.sgx-tips{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:clamp(14px,1.6vw,20px); }
.sgx-tip{
  display:flex; gap:clamp(14px,1.6vw,20px); align-items:flex-start;
  background:var(--w); border:1px solid var(--bd); border-radius:16px;
  padding:clamp(20px,2.3vw,28px);
  transition:transform .42s var(--e),box-shadow .42s var(--e),border-color .3s;
}
.sgx-tip:hover{ transform:translateY(-4px); box-shadow:var(--soft2); border-color:var(--bd2); }
.sgx-tip .ic{
  width:48px; height:48px; border-radius:13px; flex-shrink:0;
  display:grid; place-items:center;
  color:var(--a); background:var(--al); border:1px solid var(--am);
  transition:transform .5s var(--spring),background .4s,color .4s,border-color .4s;
}
.sgx-tip:hover .ic{ background:var(--grad); color:var(--w); border-color:transparent; transform:rotate(-6deg) scale(1.05); }
.sgx-tip .bd{ min-width:0; }
.sgx-tip h3{
  font-family:var(--serif); font-size:clamp(19px,1.9vw,23px); font-weight:500;
  color:var(--ink); margin:0 0 7px; line-height:1.15;
}
.sgx-tip p{ margin:0; font-size:13.5px; font-weight:300; line-height:1.72; color:var(--mu); }

/* ── steps ── */
.sgx-steps-wrap{ margin-top:clamp(48px,6vw,84px); }
.sgx-divider{ display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:clamp(26px,3vw,40px); }
.sgx-divider .ln{ flex:1; max-width:120px; height:1px; background:linear-gradient(90deg,transparent,var(--bd2)); }
.sgx-divider .ln:last-child{ background:linear-gradient(90deg,var(--bd2),transparent); }
.sgx-divider .tx{
  font-size:10px; font-weight:600; letter-spacing:.3em; text-transform:uppercase; color:var(--a);
  white-space:nowrap;
}
.sgx-steps{
  list-style:none; margin:0; padding:0;
  display:grid; grid-template-columns:repeat(var(--n,3),minmax(0,1fr));
  gap:clamp(16px,2vw,26px);
}
.sgx-step{
  position:relative; overflow:hidden;
  background:var(--w); border:1px solid var(--bd); border-radius:18px;
  padding:clamp(22px,2.4vw,30px);
  display:flex; flex-direction:column;
  transition:transform .45s var(--e),box-shadow .45s var(--e),border-color .3s;
}
.sgx-step::after{
  content:''; position:absolute; left:0; top:0; width:100%; height:3px;
  background:var(--grad); transform:scaleX(0); transform-origin:left;
  transition:transform .5s var(--e);
}
.sgx-step:hover{ transform:translateY(-6px); box-shadow:var(--soft); border-color:var(--bd2); }
.sgx-step:hover::after{ transform:scaleX(1); }
.sgx-step-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.sgx-step-n{
  width:38px; height:38px; border-radius:11px; flex-shrink:0;
  display:grid; place-items:center;
  background:var(--grad); color:var(--w);
  font-family:var(--sans); font-size:13px; font-weight:700;
  box-shadow:0 12px 26px -14px rgba(140,116,86,.85);
}
.sgx-step-ghost{
  font-family:var(--serif); font-size:clamp(34px,4vw,48px); font-weight:300; line-height:.8;
  color:var(--bd2);
}
.sgx-step-img{
  margin-bottom:18px; border-radius:12px; overflow:hidden;
  border:1px solid var(--bd); background:var(--wa);
}
.sgx-step-img img{ width:100%; height:clamp(150px,18vw,190px); object-fit:cover; transition:transform .9s var(--e); }
.sgx-step:hover .sgx-step-img img{ transform:scale(1.05); }
.sgx-step p{ margin:0; font-size:13.5px; font-weight:300; line-height:1.72; color:var(--mu); }

/* ── video ── */
.sgx-video{ margin-top:clamp(46px,6vw,80px); }
.sgx-video-head{
  display:flex; align-items:center; justify-content:center; gap:9px; margin-bottom:18px;
  font-size:10px; font-weight:600; letter-spacing:.28em; text-transform:uppercase; color:var(--a);
}
.sgx-video-frame{
  position:relative; overflow:hidden; border-radius:20px;
  border:1px solid var(--bd); background:#241C14; box-shadow:var(--soft);
  max-width:1000px; margin:0 auto;
}
.sgx-video-frame iframe,
.sgx-video-frame video{
  display:block; width:100%; aspect-ratio:16/9; border:0; background:#241C14;
}

/* ══════════ SKELETON ══════════ */
.sgx-skel-head{ display:flex; flex-direction:column; align-items:center; gap:14px; }
.sgx-skel-grid{
  margin-top:clamp(38px,5vw,64px);
  display:grid; grid-template-columns:1fr 1fr; gap:clamp(30px,4vw,60px); align-items:center;
}
.sgx-skel-stack{ display:flex; flex-direction:column; gap:16px; }
.sgx .sk{
  display:block; border-radius:12px;
  background:linear-gradient(90deg,var(--wa) 0%,var(--cr) 50%,var(--wa) 100%);
  background-size:200% 100%; animation:sgx-sh 1.5s ease-in-out infinite;
}
.sgx .sk-a{ width:min(420px,80%); height:clamp(34px,4vw,50px); }
.sgx .sk-b{ width:min(560px,92%); height:16px; }
.sgx .sk-fig{ width:100%; aspect-ratio:4/3; border-radius:20px; }
.sgx .sk-row{ width:100%; height:92px; border-radius:16px; }
@keyframes sgx-sh{ 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

/* ══════════ CTA ══════════ */
.sgx-cta-wrap{ padding:clamp(64px,8.5vw,116px) 0; }
.sgx-cta{
  position:relative; overflow:hidden; text-align:center;
  background:var(--w); border:1px solid var(--bd); border-radius:26px;
  box-shadow:var(--soft);
  padding:clamp(44px,6.5vw,92px) clamp(26px,5vw,72px);
}
.sgx-cta::before{
  content:''; position:absolute; top:-30%; left:50%; transform:translateX(-50%);
  width:min(720px,90%); height:60%;
  background:radial-gradient(ellipse at center,var(--al),transparent 70%); pointer-events:none;
}
.sgx-cta-mk{
  position:relative; width:64px; height:64px; border-radius:18px; margin:0 auto 26px;
  display:grid; place-items:center; color:var(--w); background:var(--grad);
  box-shadow:0 18px 36px -16px rgba(140,116,86,.8);
}
.sgx-cta-h{
  position:relative; font-family:var(--serif); font-weight:300;
  font-size:clamp(30px,4.4vw,54px); line-height:1.08; color:var(--ink); margin:0 0 18px;
}
.sgx-cta-h .gemtxt{ font-weight:500; }
.sgx-cta-p{
  position:relative; max-width:34em; margin:0 auto 36px;
  font-size:clamp(14px,1.3vw,17px); font-weight:300; line-height:1.8; color:var(--mu);
}
.sgx-cta-actions{ position:relative; display:flex; flex-wrap:wrap; gap:14px; justify-content:center; }
.sgx-btn{
  display:inline-flex; align-items:center; gap:9px;
  padding:15px 30px; border-radius:50px; cursor:pointer; min-height:48px;
  font-family:var(--sans); font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
  transition:transform .3s var(--spring),box-shadow .3s var(--e),filter .25s,border-color .3s,color .3s;
}
.sgx-btn-p{ background:var(--grad); color:var(--w); border:1px solid transparent; box-shadow:0 14px 30px -14px rgba(140,116,86,.7); }
.sgx-btn-p:hover{ transform:translateY(-2px); filter:brightness(1.05); }
.sgx-btn-p .ico{ transition:transform .35s var(--e); }
.sgx-btn-p:hover .ico{ transform:translateX(4px); }
.sgx-btn-o{ background:var(--w); color:var(--ink); border:1px solid var(--bd2); }
.sgx-btn-o:hover{ transform:translateY(-2px); border-color:var(--a2); color:var(--a); }

/* ══════════ RESPONSIVE ══════════ */
@media(max-width:1023px){
  .sgx{ padding-bottom:108px; } /* clear the floating bottom pill-nav */
}
@media(max-width:980px){
  .sgx-band{ grid-template-columns:1fr; gap:clamp(28px,5vw,44px); }
  .sgx-band.flip .sgx-fig{ order:0; }
  .sgx-fig{ max-width:560px; width:100%; margin:0 auto; }
  .sgx-band.no-img .sgx-tips{ grid-template-columns:1fr 1fr; }
  .sgx-steps{ grid-template-columns:repeat(2,minmax(0,1fr)); }
}
@media(max-width:680px){
  .sgx-band.no-img .sgx-tips{ grid-template-columns:1fr; }
  .sgx-steps{ grid-template-columns:1fr; }
  .sgx-chips{ gap:10px; }
  .sgx-chip{ padding:11px 16px; font-size:11px; letter-spacing:.08em; }
  .sgx-tip{ gap:14px; padding:20px; }
  .sgx-tip .ic{ width:42px; height:42px; border-radius:11px; }
  .sgx-fig-tag{ left:12px; bottom:12px; padding:9px 14px; }
  .sgx-cta-actions .sgx-btn{ width:100%; justify-content:center; }
}
@media(max-width:420px){
  .sgx-chip .n{ display:none; }
  .sgx-step-top{ margin-bottom:14px; }
}
@media(prefers-reduced-motion:reduce){
  .sgx *{ transition-duration:.01ms!important; animation-duration:.01ms!important; }
}

/* ══════════ PRINT ══════════
   The guide's own steps tell customers to cut out printed sizer strips, so the
   page has to survive a trip through the printer: drop chrome, flatten colour,
   keep each chart on its own sheet. */
@media print{
  .sgx{ background:#fff; padding-bottom:0; }
  .sgx-hero::before,.sgx-hero-bg,.sgx-rail,.sgx-print,.sgx-chips,
  .sgx-video,.sgx-cta-wrap{ display:none!important; }
  .sgx-hero{ padding:0 0 18px; border-bottom:1px solid #ccc; }
  .sgx-hero.has-img .sgx-hero-h{ color:#000; }
  .sgx-hero.has-img .sgx-hero-p{ color:#333; }
  .sgx-hero-h{ font-size:26pt; }
  .sgx-hero-p{ font-size:10pt; }
  .sgx-sec{ break-inside:avoid; page-break-inside:avoid; padding:20px 0; background:#fff!important; }
  .sgx-sec + .sgx-sec{ break-before:page; page-break-before:always; }
  .sgx-h2{ font-size:19pt; }
  .sgx-tip,.sgx-step{ box-shadow:none!important; border:1px solid #ddd; break-inside:avoid; page-break-inside:avoid; }
  .sgx-tip .ic,.sgx-step-n{ background:#eee!important; color:#333!important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .sgx-steps{ grid-template-columns:repeat(3,1fr); }
  .sgx-fig-frame{ box-shadow:none!important; }
}
`
