'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────── */
interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  tag?: string | null;
}

/* Fallback slug from the display name, in case a row has none. */
function nameToSlug(name: string) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* ─── Fallback data ──────────────────────────────── */
const FALLBACK: Category[] = [
  {
    id: 1,
    name: 'Engagement Rings',
    slug: 'engagement-rings',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&h=700&q=85&fit=crop',
  },
  {
    id: 2,
    name: 'Wedding Bands',
    slug: 'wedding-bands',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&h=700&q=85&fit=crop',
  },
  {
    id: 3,
    name: 'Fine Jewelry',
    slug: 'fine-jewelry',
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=700&h=700&q=85&fit=crop',
  },
  {
    id: 4,
    name: 'Eternity Rings',
    slug: 'eternity-rings',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=700&h=700&q=85&fit=crop',
  },
];

/* ════════════════════════════════════════════════════
   Component
════════════════════════════════════════════════════ */
export default function ShopByCategory({ initialCategories }: { initialCategories?: Category[] }) {
  // Seed with server-fetched categories so the REAL images are in the first paint —
  // no fallback flash on render/refresh. FALLBACK is only used if the server passed nothing.
  const hasInitial = Array.isArray(initialCategories) && initialCategories.length > 0;
  const [cats, setCats] = useState<Category[]>(hasInitial ? initialCategories! : FALLBACK);

  /* Drag-to-scroll state — mouse only (touch uses native overflow scrolling).
     No pointer capture: capturing retargets the subsequent click away from
     the <Link>, silently killing tap navigation on touch devices. */
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, moved: false, startX: 0, startY: 0, scrollLeft: 0 });

  /* Fetch real categories — skipped when the server already provided them,
     so we never overwrite good initial data with a flash. */
  useEffect(() => {
    if (hasInitial) return;
    fetch('/api/categories?home=true')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data) || !data.length) return;
        setCats(
          data.map((c: Record<string, unknown>, i: number) => ({
            id: Number(c.id) || i + 1,
            name: String(c.name || ''),
            slug: String(c.slug || String(c.name || '').toLowerCase().replace(/\s+/g, '-')),
            image: String(c.image_url || FALLBACK[0].image),
            tag: c.tag ? String(c.tag) : null,
          }))
        );
      })
      .catch(() => { });
  }, []);

  /* ── Pointer drag handlers ──────────────────────── */
  /* ── Pointer drag handlers (mouse only) ────────────────────────
     A tap counts as a drag only past 10px of mostly-horizontal movement;
     anything less falls through to the <Link>'s native navigation, which
     works even before hydration. No pointer capture: capturing retargets
     the subsequent click away from the <Link>, silently killing taps
     (especially touch). Touch uses native overflow scrolling. */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const el = trackRef.current;
    if (!el) return;
    dragState.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const st = dragState.current;
    const el = trackRef.current;
    if (!st.active || !el || e.pointerType !== 'mouse') return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.moved && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      st.moved = true;
    }
    if (st.moved) {
      el.scrollLeft = st.scrollLeft - dx;
    }
  }, []);

  const endDrag = useCallback(() => {
    dragState.current.active = false;
    dragState.current.moved = false;
  }, []);

  const onCardClick = useCallback((e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
      dragState.current.moved = false;
    }
  }, []);

  return (
    <section className="sbc2-root">
      <style>{CSS}</style>

      {/* ── Title ── */}
      <p className="sbc2-title home-sec-title">Shop by Category</p>

      {/* ── Drag-scroll track ── */}
      <div
        ref={trackRef}
        className="sbc2-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {cats.map((cat) => (
          <Link
            key={cat.id}
            href={`/collection/${cat.slug || nameToSlug(cat.name)}`}
            className="sbc2-card"
            aria-label={`Shop ${cat.name}`}
            draggable={false}
            onClick={onCardClick}
          >
            {/* Image area */}
            <div className="sbc2-img-box">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 600px) 72vw, (max-width: 1024px) 40vw, 25vw"
                className="sbc2-img"
                draggable={false}
                priority={cat.id <= 2}
              />
            </div>

            {/* Text area */}
            <div className="sbc2-info">
              <p className="sbc2-name home-item-name">{cat.name}</p>
              <span className="sbc2-cta">
                SHOP NOW
                <svg
                  className="sbc2-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════
   CSS — scoped to sbc2- prefix, zero conflicts
════════════════════════════════════════════════════ */
const CSS = `
/* ── Root (same vertical rhythm as every homepage block) ── */
.sbc2-root {
  width: 100%;
  background: #fff;
  padding: clamp(48px,6vw,80px) clamp(16px, 3vw, 48px);
  box-sizing: border-box;
}

/* ── Title (typography comes from the shared .home-sec-title; layout only) ── */
.sbc2-title {
  margin: 0;
  padding: 0;
  margin-bottom: 40px;
}

/* Responsive title on mobile */
@media (max-width: 768px) {
  .sbc2-title {
    margin-bottom: 32px;
  }
}

/* ── Scroll track ──
   Desktop: horizontal flex that wraps into equal columns
   Mobile:  horizontal scroll strip
*/
.sbc2-track {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: clamp(10px, 1.2vw, 16px);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(24px, 4vw, 60px);
  box-sizing: border-box;
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
}

/* Desktop slider if more than 5 items */
.sbc2-track:has(.sbc2-card:nth-child(6)) {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0 clamp(24px, 4vw, 60px) 8px;
  scroll-behavior: smooth;
  scroll-padding-inline-start: clamp(24px, 4vw, 60px);
}

.sbc2-track::-webkit-scrollbar {
  display: none;
}

/* ── Card ── */
.sbc2-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: clamp(12px, 1.4vw, 20px);
  background: #EDE8DF;
  overflow: hidden;
  cursor: pointer;
  outline: none;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  -webkit-user-drag: none;
  flex-shrink: 0;
}

/* Fixed width for slider cards */
.sbc2-track:has(.sbc2-card:nth-child(6)) .sbc2-card {
  width: clamp(180px, 14vw, 220px);
  scroll-snap-align: start;
}
.sbc2-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.10);
  transform: translateY(-2px);
}
.sbc2-card:focus-visible {
  box-shadow: 0 0 0 3px #C4965A;
}

/* ── Image box ── */
.sbc2-img-box {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}
.sbc2-img {
  object-fit: cover;
  object-position: center 20%;
  transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}
.sbc2-card:hover .sbc2-img {
  transform: scale(1.05);
}

/* ── Info block ── */
.sbc2-info {
  padding: clamp(8px, 1vw, 12px) clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px);
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: #EDE8DF;
}

/* Category name (typography comes from the shared .home-item-name) */
.sbc2-name {
  margin: 0;
  line-height: 1.2;
}

/* Shop Now CTA */
.sbc2-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-family: var(--font-dmsans),'DM Sans',system-ui,sans-serif;
  font-size: clamp(9px, 0.8vw, 11px);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #111;
  text-decoration: none;
  transition: gap 0.3s ease;
}
.sbc2-card:hover .sbc2-cta {
  gap: 8px;
}
.sbc2-chevron {
  flex-shrink: 0;
  color: #111;
  transition: transform 0.3s ease;
}
.sbc2-card:hover .sbc2-chevron {
  transform: translateX(3px);
}

/* ══════════════ RESPONSIVE ══════════════ */

/* Mobile: horizontal drag-scroll strip */
@media (max-width: 768px) {
  .sbc2-track {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 16px;
    padding: 0 24px 16px;
    scroll-padding-inline-start: 24px;
    /* hide scrollbar */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .sbc2-track::-webkit-scrollbar {
    display: none;
  }
  /* Remove empty space */
  .sbc2-track::before {
    display: none;
  }
  .sbc2-card {
    width: calc(100vw - 80px);
    min-width: 220px;
    max-width: 260px;
    scroll-snap-align: center;
    flex-shrink: 0;
  }
}

/* Very small phones */
@media (max-width: 360px) {
  .sbc2-track {
    padding: 0 20px 16px;
    gap: 12px;
    scroll-padding-inline-start: 20px;
  }
  .sbc2-card {
    width: calc(100vw - 72px);
    min-width: 200px;
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .sbc2-img,
  .sbc2-card,
  .sbc2-chevron,
  .sbc2-cta {
    transition: none !important;
    animation: none !important;
  }
}
`;
