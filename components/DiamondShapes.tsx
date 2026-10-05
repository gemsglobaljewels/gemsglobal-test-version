"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";

interface ShapeItem {
  key: string;
  name: string;
  sub?: string;
  image?: string;
  img?: string;
  is_enabled?: boolean;
  position?: number;
  [key: string]: any;
}

const SHAPE_IMAGES: Record<string, string> = {
  round:
    "https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=400&h=400&q=90&fit=crop&auto=format",
  cushion:
    "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&h=400&q=90&fit=crop&auto=format",
  princess:
    "https://images.unsplash.com/photo-1599459183200-59c7687a0c70?w=400&h=400&q=90&fit=crop&auto=format",
  emerald:
    "https://images.unsplash.com/photo-1630699144867-df71a60bae5f?w=400&h=400&q=90&fit=crop&auto=format",
  oval: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&q=90&fit=crop&auto=format",
  marquise:
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&q=90&fit=crop&auto=format",
  pear: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=400&h=400&q=90&fit=crop&auto=format",
  heart:
    "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&h=400&q=90&fit=crop&auto=format",
  radiant:
    "https://images.unsplash.com/photo-1630699144867-df71a60bae5f?w=400&h=400&q=90&fit=crop&auto=format",
  asscher:
    "https://images.unsplash.com/photo-1599459183200-59c7687a0c70?w=400&h=400&q=90&fit=crop&auto=format",
};

const DEFAULT_SHAPES: ShapeItem[] = [
  { key: "round", name: "Round", sub: "Classic brilliance" },
  { key: "cushion", name: "Cushion", sub: "Soft & romantic" },
  { key: "princess", name: "Princess", sub: "Modern & bold" },
  { key: "emerald", name: "Emerald", sub: "Elegant step-cut" },
  { key: "oval", name: "Oval", sub: "Elongated sparkle" },
  { key: "marquise", name: "Marquise", sub: "Regal & elongated" },
  { key: "pear", name: "Pear", sub: "Teardrop beauty" },
  { key: "heart", name: "Heart", sub: "Symbol of love" },
  { key: "radiant", name: "Radiant", sub: "Vibrant brilliance" },
  { key: "asscher", name: "Asscher", sub: "Vintage step-cut" },
];

export default function DiamondShapes({
  initialDiamondShapes,
}: {
  initialDiamondShapes: ShapeItem[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const raw =
    initialDiamondShapes?.length > 0
      ? initialDiamondShapes.filter((s) => s.is_enabled !== false)
      : DEFAULT_SHAPES;

  const shapes = raw.map((s) => ({
    ...s,
    image: s.image || s.img || SHAPE_IMAGES[s.key] || "",
  }));

  const total = shapes.length;

  const goTo = useCallback(
    (idx: number) => {
      const n = (idx + total) % total;
      setCurrent(n);
    },
    [total],
  );

  useEffect(() => {
    autoRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 2500);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [total]);

  const resetAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 2500);
  };

  const handlePrev = () => {
    goTo(current - 1);
    resetAuto();
  };
  const handleNext = () => {
    goTo(current + 1);
    resetAuto();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    const dist = touchStartX.current - touchEndX.current;
    if (dist > 50) {
      goTo(current + 1);
      resetAuto();
    } else if (dist < -50) {
      goTo(current - 1);
      resetAuto();
    }
  };

  if (shapes.length === 0) return null;

  return (
    <>
      <style>{CSS}</style>
      <section className="ds-root">
        <div className="ds-head">
          <p className="ds-eyebrow">Explore Shapes</p>
          <p className="ds-desc">
            Discover our extraordinary collection of diamonds categorized by
            shape.
            <br />
            Find your ideal cut, from round to oval, to suit your style.
          </p>
        </div>

        {/* ── Desktop: all shapes in one row ── */}
        <div className="ds-desktop-row">
          {shapes.map((s, i) => (
            <Link
              key={s.key}
              href={`/collection?shape=${s.key}`}
              className="ds-item"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* WHITE bg wrapper so mix-blend-mode:multiply removes the gray box */}
              <div className="ds-img-outer">
                <div className="ds-img-wrap">
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.name}
                      className="ds-img"
                      loading={i < 5 ? "eager" : "lazy"}
                      decoding="async"
                      width={180}
                      height={180}
                    />
                  ) : (
                    <div className="ds-placeholder">◆</div>
                  )}
                </div>
              </div>
              <div className="ds-labels">
                <span className="ds-name">{s.name.toUpperCase()}</span>
                {s.sub && <span className="ds-sub">{s.sub}</span>}
              </div>
            </Link>
          ))}
        </div>

        {/* ── Mobile: slider ── */}
        <div
          className="ds-mobile-slider"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className="ds-arrow ds-arrow-l"
            onClick={handlePrev}
            aria-label="Previous"
          >
            ‹
          </button>

          <div className="ds-slider-viewport">
            {shapes.map((s, idx) => {
              const diff = (((idx - current) % total) + total) % total;
              const rel = diff > total / 2 ? diff - total : diff;
              const isActive = rel === 0;
              const isNext = rel === 1;
              const isPrev = rel === -1;

              return (
                <Link
                  key={s.key}
                  href={`/collection?shape=${s.key}`}
                  className="ds-slide"
                  style={{
                    transform: isActive
                      ? "translateX(-50%) scale(1)"
                      : isPrev
                        ? "translateX(calc(-50% - 180px)) scale(0.62)"
                        : isNext
                          ? "translateX(calc(-50% + 180px)) scale(0.62)"
                          : `translateX(calc(-50% + ${rel * 180}px)) scale(0.4)`,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.45 : 0,
                    zIndex: isActive ? 3 : isPrev || isNext ? 2 : 0,
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                  tabIndex={isActive ? 0 : -1}
                >
                  {/* WHITE bg so multiply removes gray */}
                  <div className="ds-slide-img-outer">
                    <div className="ds-slide-img-wrap">
                      {s.image ? (
                        <img
                          src={s.image}
                          alt={s.name}
                          className="ds-slide-img"
                          loading="eager"
                          decoding="async"
                        />
                      ) : (
                        <div
                          className="ds-placeholder"
                          style={{ fontSize: 64 }}
                        >
                          ◆
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <button
            className="ds-arrow ds-arrow-r"
            onClick={handleNext}
            aria-label="Next"
          >
            ›
          </button>
        </div>

        {/* Mobile label */}
        <div className="ds-mobile-label">
          <span className="ds-mobile-name">{shapes[current].name}</span>
          {shapes[current].sub && (
            <span className="ds-mobile-sub">{shapes[current].sub}</span>
          )}
        </div>

        {/* Dots */}
        <div className="ds-dots">
          {shapes.map((_, i) => (
            <button
              key={i}
              className={`ds-dot ${i === current ? "ds-dot--active" : ""}`}
              onClick={() => {
                goTo(i);
                resetAuto();
              }}
              aria-label={`Shape ${i + 1}`}
            />
          ))}
        </div>
      </section>
    </>
  );
}

const CSS = `
.ds-root {
  padding: 56px 0 48px;
  font-family: var(--font-main, 'Cormorant Garamond', Georgia, serif);
  width: 100%;
}

/* ── Header ── */
.ds-head { text-align: center; margin-bottom: 48px; }
.ds-eyebrow {
  display: block;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: .55em;
  text-transform: uppercase;
  color: #1a2e4a;
  margin-bottom: 18px;
}
.ds-desc {
  font-size: 14px;
  color: #3a4f6e;
  line-height: 1.9;
  font-weight: 300;
}

/* ═══════════════════════════════════════
   DESKTOP ROW
═══════════════════════════════════════ */
.ds-desktop-row {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0 clamp(16px, 3vw, 48px);
}
.ds-item {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  padding: 0 clamp(4px, .5vw, 8px);
  cursor: pointer;
}

/* 
  GRAY BOX FIX:
  The diamond images have a gray/beige bg baked in.
  Fix: wrap in a #ffffff div, apply mix-blend-mode:multiply on <img>
  multiply blends gray against white → white (gray disappears)
  The outer wrapper clips to the image shape visually.
*/
.ds-img-outer {
  /* Match the site section bg so blended white doesn't stand out */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
}
.ds-img-wrap {
  width: clamp(80px, 10vw, 130px);
  height: clamp(80px, 10vw, 130px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
}
.ds-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* multiply: gray img bg * white parent = white → gray disappears */
  mix-blend-mode: multiply;
  transition: transform .36s cubic-bezier(.16,1,.3,1);
  display: block;
}
.ds-item:hover .ds-img { transform: scale(1.2); }

.ds-placeholder { font-size: 48px; color: #C9A96E; opacity: 0.4; }

.ds-labels {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.ds-name {
  font-size: clamp(8px, .75vw, 11px);
  font-weight: 500;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: #1a2e4a;
  white-space: nowrap;
  transition: color .24s ease;
}
.ds-item:hover .ds-name { color: #C9A96E; }
.ds-sub {
  font-size: clamp(8px, .65vw, 10px);
  color: #5a7090;
  white-space: nowrap;
  opacity: 0;
  transition: opacity .26s ease;
}
.ds-item:hover .ds-sub { opacity: 1; }

/* ═══════════════════════════════════════
   MOBILE SLIDER
═══════════════════════════════════════ */
.ds-mobile-slider {
  display: none;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 300px;
  width: 100%;
  overflow: hidden;
}
/* Fade edges */
.ds-mobile-slider::before,
.ds-mobile-slider::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  width: 22%;
  z-index: 6;
  pointer-events: none;
}


/* All slides absolutely centered */
.ds-slider-viewport {
  position: relative;
  width: 100%;
  height: 100%;
}
.ds-slide {
  position: absolute;
  left: 50%;
  top: 50%;
  margin-top: -120px;
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: transform .45s cubic-bezier(.16,1,.3,1), opacity .45s ease;
  will-change: transform, opacity;
}
/* SAME gray-box fix for mobile: white bg circle + multiply */
.ds-slide-img-outer {
  border-radius: 50%;
}
.ds-slide-img-wrap {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ds-slide-img {
  width: 88%;
  height: 88%;
  object-fit: contain;
  mix-blend-mode: multiply;
  display: block;
}

/* Arrows */
.ds-arrow {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  z-index: 10;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(250,249,246,0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(26,46,74,.18);
  border-radius: 50%;
  cursor: pointer;
  font-size: 22px; color: #1a2e4a;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  transition: all .22s ease;
  -webkit-tap-highlight-color: transparent;
}
.ds-arrow:active { background: rgba(201,169,110,.15); border-color: #C9A96E; color: #C9A96E; }
.ds-arrow-l { left: 12px; }
.ds-arrow-r { right: 12px; }

/* Mobile label */
.ds-mobile-label {
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-top: 16px;
  min-height: 52px;
}
.ds-mobile-name {
  font-size: 22px;
  font-weight: 400;
  color: #1a2e4a;
  letter-spacing: .08em;
}
.ds-mobile-sub {
  font-size: 13px;
  color: #5a7090;
  text-align: center;
  line-height: 1.6;
  padding: 0 32px;
}

/* Dots */
.ds-dots {
  display: none;
  justify-content: center;
  gap: 7px;
  margin-top: 18px;
}
.ds-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #d0d9e4;
  border: none; padding: 0;
  cursor: pointer;
  transition: all .24s ease;
  -webkit-tap-highlight-color: transparent;
}
.ds-dot--active { width: 22px; border-radius: 4px; background: #1a2e4a; }

/* ═══════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════ */
@media (max-width: 768px) {
  .ds-desktop-row { display: none; }
  .ds-mobile-slider { display: flex; }
  .ds-mobile-label { display: flex; }
  .ds-dots { display: flex; }
  .ds-root { padding: 48px 0 40px; }
  .ds-eyebrow { font-size: 9px; letter-spacing: .42em; }
  .ds-desc { font-size: 13px; padding: 0 24px; }
}
`;
