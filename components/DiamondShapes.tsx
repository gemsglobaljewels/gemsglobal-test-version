"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { groupByFamily, categoryFamily, type CategoryRef } from "@/lib/categoryScope";

interface ShapeItem {
  key: string;
  name: string;
  sub?: string;
  image?: string;
  img?: string;
  is_enabled?: boolean;
  position?: number;
  /** Category UUIDs this shape is limited to (empty = every category). */
  category_ids?: string[];
  [key: string]: any;
}

/* Fallback glyphs — crisp inline SVG diamond outlines used whenever a shape
   has no admin-uploaded photo. The old hotlinked Unsplash fallbacks 404'd
   (pear, princess, emerald, radiant, asscher), leaving broken slots, so
   nothing here depends on the network. Uploading a real photo in
   Admin → Diamond Shapes replaces the glyph automatically. */
function ShapeGlyph({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" className="ds-shape-svg" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const SHAPE_ICONS: Record<string, React.ReactNode> = {
  round: (<ShapeGlyph><circle cx="50" cy="50" r="30" /><circle cx="50" cy="50" r="14" /><path d="M50 12v6M50 82v6M12 50h6M82 50h6" /></ShapeGlyph>),
  oval: (<ShapeGlyph><ellipse cx="50" cy="50" rx="21" ry="32" /><ellipse cx="50" cy="50" rx="11" ry="20" /></ShapeGlyph>),
  cushion: (<ShapeGlyph><rect x="24" y="24" width="52" height="52" rx="15" /><rect x="35" y="35" width="30" height="30" rx="8" /></ShapeGlyph>),
  princess: (<ShapeGlyph><rect x="26" y="26" width="48" height="48" /><rect x="37" y="37" width="26" height="26" /><path d="M26 26l11 11M74 26l-11 11M26 74l11-11" /></ShapeGlyph>),
  emerald: (<ShapeGlyph><path d="M38 22h24l16 16v24l-16 16H38l-16-16V38Z" /><path d="M44 32h12l8 8v20l-8 8H44l-8-8V40Z" /></ShapeGlyph>),
  asscher: (<ShapeGlyph><rect x="28" y="28" width="44" height="44" /><rect x="38" y="38" width="24" height="24" /><rect x="46" y="46" width="8" height="8" /></ShapeGlyph>),
  marquise: (<ShapeGlyph><path d="M50 14C67 33 67 67 50 86 33 67 33 33 50 14Z" /><path d="M50 26v48" /></ShapeGlyph>),
  pear: (<ShapeGlyph><path d="M50 14c13 15 22 28 22 42a22 22 0 1 1-44 0c0-14 9-27 22-42Z" /><path d="M50 30v36" /></ShapeGlyph>),
  heart: (<ShapeGlyph><path d="M50 78C30 62 20 50 20 38c0-12 10-18 18-18 6 0 10 4 12 8 2-4 6-8 12-8 8 0 18 6 18 18 0 12-10 24-30 40Z" /></ShapeGlyph>),
  radiant: (<ShapeGlyph><path d="M30 24h40l8 8v36l-8 8H30l-8-8V32Z" /><path d="M30 24l12 12M70 24L58 36M30 76l12-12M70 76L58 64" /></ShapeGlyph>),
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

/* One section: desktop row + its own mobile carousel / dots. */

/* Category-scoped shape link: a shape clicked inside the "Bracelets" box must
   list bracelet rounds, not every round in the catalogue. The box resolves to
   the real categor(ies) behind it through the shape's own category_ids, so a
   shape living in two boxes (e.g. Asscher in Bracelets AND Diamonds) scopes
   correctly in each. Falls back to the shape-only link whenever the box maps
   to anything but exactly one category (multi-category families, unscoped
   "Featured" rows) — never a dead restrictive link. */
function shapeHref(shape: ShapeItem, family: string, categories: CategoryRef[]): string {
  const shapeLink = `/collection?shape=${shape.key}`;
  const nameOf = new Map((categories || []).map((c) => [String(c.id), String(c.name || '')]));
  const own = (Array.isArray(shape.category_ids) ? shape.category_ids : []).map(String);
  // Ids of THIS box: the shape's own categories that belong to this family.
  let scope = own.filter((id) => categoryFamily(nameOf.get(id) || '') === family);
  // Defensive (stale category list): fall back to any known own categories.
  if (scope.length === 0) scope = own.filter((id) => nameOf.has(id));
  const names = [...new Set(scope.map((id) => nameOf.get(id) || '').filter(Boolean))];
  if (names.length === 1) {
    return `/collection?category=${encodeURIComponent(names[0])}&shape=${shape.key}`;
  }
  return shapeLink;
}

function ShapeBlock({ shapes, heading, family, categories }: { shapes: ShapeItem[]; heading?: string; family: string; categories: CategoryRef[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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

  if (total === 0) return null;

  return (
    <div className="ds-block">
      {heading && <h3 className="ds-sec-title home-sec-title">{heading}</h3>}

      {/* ── Desktop: all shapes in one row ── */}
      <div className="ds-desktop-row">
        {shapes.map((s, i) => (
          <Link
            key={s.key}
            href={shapeHref(s, family, categories)}
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
                  SHAPE_ICONS[s.key] || <div className="ds-placeholder">◆</div>
                )}
              </div>
            </div>
            <div className="ds-labels">
              <span className="ds-name home-item-name">{s.name.toUpperCase()}</span>
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
                href={shapeHref(s, family, categories)}
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
                      SHAPE_ICONS[s.key] || (
                        <div
                          className="ds-placeholder"
                          style={{ fontSize: 64 }}
                        >
                          ◆
                        </div>
                      )
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
        <span className="ds-mobile-name home-item-name">{shapes[current].name}</span>
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
    </div>
  );
}

export default function DiamondShapes({
  initialDiamondShapes,
  categories,
}: {
  initialDiamondShapes: ShapeItem[];
  /** Category rows used to title sections when a shape is category-scoped. */
  categories?: CategoryRef[];
}) {
  const raw =
    initialDiamondShapes?.length > 0
      ? initialDiamondShapes.filter((s) => s.is_enabled !== false)
      : DEFAULT_SHAPES;

  const shapes = raw.map((s) => ({
    ...s,
    // Admin photo wins; otherwise the crisp inline glyph (never a dead hotlink).
    image: s.image || s.img || "",
  }));

  // A shape is a stone cut, so by default every category shares one row and
  // nothing looks different. If admin scopes shapes (Admin → Diamond Shapes)
  // they split into sections — same grouping the Styles block uses.
  const sections = groupByFamily(shapes, categories || []);
  if (sections.length === 0) return null;
  const multi = sections.length > 1;

  return (
    <>
      <style>{CSS}</style>
      <section className="ds-root">
        <div className="ds-head">
          <p className="ds-eyebrow home-sec-title">Explore Shapes</p>
          <p className="ds-desc home-sec-desc">
            Discover our extraordinary collection of diamonds categorized by
            shape.
            <br />
            Find your ideal cut, from round to oval, to suit your style.
          </p>
        </div>

        {sections.map((sec) => (
          <ShapeBlock
            key={sec.title}
            shapes={sec.rows}
            family={sec.title}
            categories={categories || []}
            heading={sec.title === "Featured" && !multi
              ? undefined
              : sec.title === "Featured" ? "Featured Shapes" : sec.title}
          />
        ))}
      </section>
    </>
  );
}

const CSS = `
/* No panel: the section sits straight on the page — same treatment as the
   Styles widget above (background / border / radius / shadow all removed).
   Spacing comes from the margins below, not from box padding. */
.ds-root {
  width: min(1240px, calc(100% - clamp(24px, 5vw, 64px)));
  margin: clamp(48px,6vw,80px) auto;
  font-family: var(--font-main, 'Cormorant Garamond', Georgia, serif);
}

/* ── Header (eyebrow typography comes from the shared .home-sec-title) ── */
.ds-head { text-align: center; margin-bottom: clamp(24px, 3vw, 40px); }
.ds-eyebrow {
  display: block;
  margin: 0;
}
/* Detail text uses the shared .home-sec-desc (font/color/spacing) */

/* ── Per-category section heading (same shared look as every block title) ── */
.ds-block + .ds-block { margin-top: 48px; }
.ds-sec-title {
  margin: 0 0 22px;
  text-align: center;
}

/* ═══════════════════════════════
   DESKTOP ROW
═══════════════════════════════ */
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

/* fallback diamond glyphs — used only when a shape has no admin photo */
.ds-shape-svg {
  width: 68%; height: 68%; color: #9a8a76;
  transition: transform .36s cubic-bezier(.16,1,.3,1), color .26s ease;
}
.ds-item:hover .ds-shape-svg { transform: scale(1.12); color: #C9A96E; }
.ds-slide-img-wrap .ds-shape-svg { width: 120px; height: 120px; }

.ds-labels {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.ds-name {
  white-space: nowrap;
  transition: color .24s ease;
}
.ds-item:hover .ds-name { color: #C9A96E; }
.ds-sub {
  font-size: clamp(8px, .65vw, 10px);
  color: #555;
  white-space: nowrap;
  opacity: 0;
  transition: opacity .26s ease;
}
.ds-item:hover .ds-sub { opacity: 1; }

/* ═══════════════════════════════
   MOBILE SLIDER
═══════════════════════════════ */
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
  font-size: 22px; color: #111;
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
  margin: 0;
}
.ds-mobile-sub {
  font-size: 13px;
  color: #555;
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
.ds-dot--active { width: 22px; border-radius: 4px; background: #111; }

/* ═══════════════════════════════
   RESPONSIVE
═══════════════════════════════ */
@media (max-width: 768px) {
  .ds-desktop-row { display: none; }
  .ds-mobile-slider { display: flex; }
  .ds-mobile-label { display: flex; }
  .ds-dots { display: flex; }
  .ds-root {
    width: calc(100% - 24px);
  }
  /* Heading + detail sizes come from the shared homepage classes */
  .ds-block + .ds-block { margin-top: 30px; }
}
`;
