"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Image from "next/image";

// ─── SLIDES DATA ────────────────────────────────────────────────
interface Slide {
  type: "image" | "video";
  src: string;
  poster?: string;
  tag?: string;
  kicker?: string;
  line1?: string;
  line2?: string;
  accent?: string;
  cta_text?: string;
  cta_link?: string;
  meta?: string;
}

// ─── COMPONENT ──────────────────────────────────────────────────
export default function LuxuryHero({ initialHeroData = null as any }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Section ref + scroll progress drive the parallax/scroll-out effect below.
  const heroRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Background drifts + slowly zooms as the page scrolls past the hero.
  const bgY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 110]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, prefersReducedMotion ? 1 : 1.16]);
  // Foreground text/CTA fades + lifts out a little faster than the bg, so it
  // clears before the next section arrives.
  const contentY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 64]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  // Fetch CMS data
  useEffect(() => {
    if (initialHeroData) {
      // Handle both single slide and slides array
      if (initialHeroData.slides && initialHeroData.slides.length > 0) {
        setSlides(initialHeroData.slides);
      } else {
        setSlides([initialHeroData]);
      }
      return;
    }
    fetch("/api/admin/hero")
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          if (d.slides && d.slides.length > 0) {
            setSlides(d.slides);
          } else {
            setSlides([d]);
          }
        }
      })
      .catch(() => { });
  }, [initialHeroData]);

  // Auto-slide
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const s = slides[currentIndex];

  // ── Framer variants ──
  const imgVariants = {
    enter: { opacity: 0, scale: 1.08 },
    center: {
      opacity: 1, scale: 1,
      transition: { duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: {
      opacity: 0, scale: 1.03,
      transition: { duration: 0.55, ease: [0.4, 0, 0.6, 1] },
    },
  };

  // GPU-composited entrance only (opacity + transform). The previous version
  // animated `filter: blur()` on every text element, which Lighthouse flags
  // as a non-composited animation — it forces paint on the main thread
  // instead of just the compositor. Dropping it keeps the same fade/rise
  // feel for a fraction of the cost.
  const makeTextVar = (delay: number, yIn: number = 28) => ({
    enter: { opacity: 0, y: yIn },
    center: {
      opacity: 1, y: 0,
      transition: { duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0, y: -12,
      transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
    },
  });

  // Simple opacity-only fallback for reduced-motion visitors.
  const noMotionVar = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const tagVar = prefersReducedMotion ? noMotionVar : makeTextVar(0.08, 12);
  const l1Var = prefersReducedMotion ? noMotionVar : makeTextVar(0.20, 24);
  const l2Var = prefersReducedMotion ? noMotionVar : makeTextVar(0.30, 32);
  const accVar = prefersReducedMotion ? noMotionVar : {
    enter: { opacity: 0, y: 48, skewX: 2 },
    center: {
      opacity: 1, y: 0, skewX: 0,
      transition: { duration: 0.90, delay: 0.40, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0, y: -12,
      transition: { duration: 0.22 },
    },
  };
  const metaVar = prefersReducedMotion ? noMotionVar : makeTextVar(0.54, 10);
  const ctaVar = prefersReducedMotion ? noMotionVar : makeTextVar(0.64, 18);

  // Scroll-into-view entrance wrapper — fires when the hero's content block
  // scrolls into the viewport (mount OR later scroll, since this section
  // may sit mid-page rather than always being the first thing visible).
  const sectionEntranceVariants = prefersReducedMotion
    ? {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
    }
    : {
      hidden: { opacity: 0, y: 32 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
      },
    };

  if (!s) return null; // Render nothing if no hero data

  return (
    <>
      <style>{CSS}</style>

      <section
        ref={heroRef}
        className="lh"
        aria-label="Hero section"
      >
        {/* ═══ FULL-BLEED IMAGE STACK (parallax on scroll) ═══ */}
        <motion.div className="lh-stage" aria-hidden="true" style={{ y: bgY, scale: bgScale }}>
          <AnimatePresence mode="sync">
            <motion.div
              key={`img-${currentIndex}`}
              variants={imgVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="lh-stage__frame"
            >
              {s.type === "video" ? (
                <video
                  className="lh-stage__media"
                  autoPlay muted loop playsInline
                  poster={s.poster || undefined}
                  preload="metadata"
                  width={1920}
                  height={1080}
                >
                  <source src={s.src} type="video/mp4" />
                </video>
              ) : (
                <Image
                  src={s.src} alt="" fill
                  priority={currentIndex === 0}
                  sizes="100vw"
                  quality={90}
                  className="lh-stage__media"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Cinematic gradient overlay — bottom-weighted for text legibility */}
          <div className="lh-overlay" />
          {/* Subtle vignette edges */}
          <div className="lh-vignette" />
        </motion.div>

        {/* ═══ CONTENT LAYER (fades/lifts out on scroll) ═══ */}
        <motion.div className="lh-content" style={{ y: contentY, opacity: contentOpacity }}>

          {/* Scroll-into-view entrance wrapper */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionEntranceVariants}
            style={{ display: "flex", flexDirection: "column", flex: 1, width: "100%" }}
          >

            {/* Top bar */}
            {(s.kicker || s.tag) ? (
              <div className="lh-topbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`tag-${currentIndex}`}
                    variants={tagVar}
                    initial="enter" animate="center" exit="exit"
                  >
                    <div className="lh-kicker" role="status">
                      {s.kicker && <><span className="lh-kicker__dot" aria-hidden="true" /><span className="lh-kicker__text">{s.kicker}</span></>}
                      {s.kicker && s.tag && <span className="lh-kicker__sep" aria-hidden="true">·</span>}
                      {s.tag && <span className="lh-kicker__text">{s.tag}</span>}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : null}

            {/* Center / bottom hero text */}
            <div className="lh-hero-text">

              {(s.line1 || s.line2 || s.accent) && (
                <h1 className="lh-headline">
                  {s.line1 && (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`l1-${currentIndex}`}
                        variants={l1Var}
                        initial="enter" animate="center" exit="exit"
                        className="lh-h__sm"
                      >
                        {s.line1}
                      </motion.span>
                    </AnimatePresence>
                  )}

                  {s.line2 && (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`l2-${currentIndex}`}
                        variants={l2Var}
                        initial="enter" animate="center" exit="exit"
                        className="lh-h__md"
                      >
                        {s.line2}
                      </motion.span>
                    </AnimatePresence>
                  )}

                  {s.accent && (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`acc-${currentIndex}`}
                        variants={accVar}
                        initial="enter" animate="center" exit="exit"
                        className="lh-h__accent"
                      >
                        {s.accent}
                      </motion.span>
                    </AnimatePresence>
                  )}
                </h1>
              )}

              {(s.meta || (s.cta_text && s.cta_text.trim())) && (
                <div className="lh-body">
                  {s.meta && (
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`meta-${currentIndex}`}
                        variants={metaVar}
                        initial="enter" animate="center" exit="exit"
                        className="lh-meta"
                      >
                        {s.meta}
                      </motion.p>
                    </AnimatePresence>
                  )}

                  {s.cta_text && s.cta_text.trim() && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`cta-${currentIndex}`}
                        variants={ctaVar}
                        initial="enter" animate="center" exit="exit"
                      >
                        <a href={s.cta_link} className="lh-btn" aria-label={s.cta_text}>
                          <span className="lh-btn__fill" aria-hidden="true" />
                          <span className="lh-btn__label">{s.cta_text}</span>
                          <svg className="lh-btn__arrow" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                            <path d="M2 6.5h9M8 3l3.5 3.5L8 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* ═══ PAGINATION (only if multiple slides) ═══ */}
        {slides.length > 1 && (
          <div className="lh-pagination">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`lh-pagination__dot ${idx === currentIndex ? 'lh-pagination__dot--active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </section>
    </>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,500;1,600&family=Jost:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap');

/* ───────────────────────────────────────────
   TOKENS
─────────────────────────────────────────── */
:where(.lh) {
  --gold:       #C9A96E;
  --gold-lt:    #E2B96A;
  --gold-dk:    #9A6E2A;
  --white:      #FFFFFF;
  --white-70:   rgba(255,255,255,.70);
  --white-45:   rgba(255,255,255,.45);
  --white-28:   rgba(255,255,255,.28);
  --white-14:   rgba(255,255,255,.14);
  --ease-out:   cubic-bezier(.16,1,.3,1);
  --ease-in:    cubic-bezier(.4,0,1,1);
  --ease-std:   cubic-bezier(.25,.46,.45,.94);
}

/* ───────────────────────────────────────────
   KEYFRAMES
─────────────────────────────────────────── */
@keyframes lh-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.6)} }
@keyframes lh-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }

/* ───────────────────────────────────────────
   SECTION ROOT
   Capped well under full-viewport height on every breakpoint — this is a
   hero band, not a takeover screen. clamp() keeps it from ever hitting
   100dvh while still feeling generous on tall monitors.
─────────────────────────────────────────── */
.lh {
  position: relative;
  width: 100%;
  height: clamp(440px, 80dvh, 760px);
  overflow: hidden;
  background: #0c0a09;
}

/* ───────────────────────────────────────────
   FULL-BLEED IMAGE STAGE
─────────────────────────────────────────── */
.lh-stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  will-change: transform;
}

.lh-stage__frame {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}

.lh-stage__media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

/* Cinematic gradient — heavy at bottom for text, subtle at top.
   Bottom stops darkened (.8→.88, .9→.96) for a stronger blend into
   whatever section follows the hero. */
.lh-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(
      to bottom,
      rgba(10,8,6,.2) 0%,
      rgba(10,8,6,.08) 30%,
      rgba(10,8,6,.05) 50%,
      rgba(10,8,6,.5) 70%,
      rgba(10,8,6,.88) 88%,
      rgba(10,8,6,.96) 100%
    );
  pointer-events: none;
}

/* Edge vignette for depth — bottom stop darkened (.4→.55) to match the
   overlay's stronger bottom blend. */
.lh-vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    radial-gradient(ellipse 120% 100% at 50% 100%, transparent 45%, rgba(10,8,6,.55) 100%);
  pointer-events: none;
}

/* ───────────────────────────────────────────
   CONTENT LAYER
─────────────────────────────────────────── */
.lh-content {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  will-change: transform, opacity;
}
.lh-content > * { pointer-events: auto; }

/* ── TOP BAR ── */
.lh-topbar {
  padding: clamp(20px, 3vw, 36px) clamp(24px, 5vw, 72px);
}

/* Kicker badge — darkened background so the white label stays legible
   regardless of how bright the slide photo behind it is (contrast fix) */
.lh-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px 7px 11px;
  background: rgba(10,8,6,.42);
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 100px;
  width: fit-content;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.lh-kicker__dot {
  display: block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--gold);
  flex-shrink: 0;
  animation: lh-pulse 2.6s ease-in-out infinite;
}
.lh-kicker__text {
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  letter-spacing: .30em;
  text-transform: uppercase;
  color: var(--white-70);
  font-weight: 400;
}
.lh-kicker__sep { color: rgba(201,169,110,.55); font-size: 10px; }

/* ── HERO TEXT (grows to fill space, aligns bottom) ── */
.lh-hero-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 clamp(24px, 5vw, 72px) clamp(16px, 2.5vw, 28px);
  gap: clamp(14px, 2vw, 22px);
}

/* Headline — now a real <h1>, so reset the default heading margin */
.lh-headline {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
}

.lh-h__sm {
  display: block;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(18px, 2.2vw, 38px);
  font-weight: 300;
  line-height: 1.2;
  color: var(--white-45);
  letter-spacing: .02em;
}
.lh-h__md {
  display: block;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(34px, 4.5vw, 76px);
  font-weight: 400;
  line-height: 1.04;
  color: var(--white);
  letter-spacing: -.01em;
  margin-top: clamp(2px, 0.3vw, 6px);
  text-shadow: 0 2px 32px rgba(0,0,0,.30);
}
.lh-h__accent {
  display: inline-block;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-weight: 600;
  font-size: clamp(52px, 7.5vw, 128px);
  line-height: .86;
  letter-spacing: -.04em;
  margin-top: clamp(2px, 0.2vw, 6px);
  /* Static gold gradient with a single shimmer sweep on entrance instead of
     an infinite loop — quieter, and removes a continuously-running
     background-position animation (the other big non-composited offender
     in the Lighthouse report) */
  background: linear-gradient(
    115deg,
    #B8893A 0%,
    #E2B96A 25%,
    #C9A96E 48%,
    #D4A85A 62%,
    #9A6E2A 82%,
    #C9A96E 100%
  );
  background-size: 280% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: lh-shimmer 1.6s ease-out 1.1s 1 both;
}

/* Meta + CTA */
.lh-body {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2.5vw, 36px);
  flex-wrap: wrap;
}

.lh-meta {
  margin: 0;
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--white-45);
  font-weight: 300;
}

/* Button — glass outline style on dark */
.lh-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 28px;
  font-family: 'Jost', sans-serif;
  font-size: 9.5px;
  letter-spacing: .28em;
  text-transform: uppercase;
  font-weight: 500;
  color: var(--white);
  text-decoration: none;
  border: 1px solid rgba(201,169,110,.55);
  border-radius: 3px;
  overflow: hidden;
  background: rgba(201,169,110,.10);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: color .36s, border-color .36s, transform .22s, box-shadow .28s, background .36s;
  cursor: pointer;
  width: fit-content;
}
.lh-btn__fill {
  position: absolute;
  inset: 0;
  background: var(--gold);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .44s var(--ease-out);
  z-index: 0;
}
.lh-btn__label,
.lh-btn__arrow {
  position: relative;
  z-index: 1;
  transition: transform .3s;
}
.lh-btn:hover {
  color: #1A1209;
  border-color: var(--gold);
  transform: translateY(-1px);
  box-shadow: 0 12px 36px rgba(201,169,110,.28);
  background: transparent;
}
.lh-btn:hover .lh-btn__fill  { transform: scaleX(1); }
.lh-btn:hover .lh-btn__arrow { transform: translateX(4px); }
.lh-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

/* ───────────────────────────────────────────
   PAGINATION
─────────────────────────────────────────── */
.lh-pagination {
  position: absolute;
  bottom: clamp(20px, 3vw, 36px);
  right: clamp(24px, 5vw, 72px);
  z-index: 4;
  display: flex;
  gap: 10px;
  align-items: center;
}
.lh-pagination__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--white-28);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}
.lh-pagination__dot:hover {
  background: var(--white-45);
}
.lh-pagination__dot:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
.lh-pagination__dot--active {
  background: var(--gold);
  width: 24px;
  border-radius: 4px;
}

/* ───────────────────────────────────────────
   RESPONSIVE
─────────────────────────────────────────── */
@media (max-width: 768px) {
  .lh { height: clamp(420px, 72dvh, 620px); }
  .lh-topbar { padding: 18px 18px; }
  .lh-hero-text {
    padding: 0 18px clamp(12px, 3vw, 20px);
    gap: 10px;
  }
  .lh-h__sm     { font-size: clamp(15px, 4.5vw, 24px); }
  .lh-h__md     { font-size: clamp(28px, 8vw, 48px); }
  .lh-h__accent { font-size: clamp(44px, 13vw, 80px); }
  .lh-body      { flex-direction: column; align-items: flex-start; gap: 12px; }
  .lh-meta      { font-size: 8px; }
  .lh-btn       { padding: 11px 22px; font-size: 8.5px; }
  .lh-pagination { right: 18px; bottom: 18px; }
}

@media (max-width: 430px) {
  .lh { height: clamp(380px, 68dvh, 560px); }
  .lh-topbar   { padding: 14px 14px; }
  .lh-hero-text { padding: 0 14px clamp(10px, 2.5vw, 16px); }
  .lh-h__sm     { font-size: clamp(14px, 5vw, 20px); }
  .lh-h__md     { font-size: clamp(24px, 9vw, 40px); }
  .lh-h__accent { font-size: clamp(40px, 14.5vw, 68px); }
  .lh-pagination { right: 14px; bottom: 14px; }
}

/* Landscape / short screens */
@media (max-height: 520px) and (orientation: landscape) {
  .lh-h__sm     { font-size: 16px; }
  .lh-h__md     { font-size: 28px; }
  .lh-h__accent { font-size: 52px; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .lh-h__accent {
    animation: none;
    background: var(--gold);
    -webkit-text-fill-color: var(--gold);
  }
  .lh-kicker__dot  { animation: none; }
}
`;