'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'

interface StyleItem {
  key: string
  name: string
  sub?: string
  desc?: string
  image?: string
  position?: number
  is_enabled?: boolean
  [key: string]: unknown
}

const FALLBACK: StyleItem[] = [
  { key: 'three-stone', name: 'Three Stone', sub: 'Classic elegance', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=900&q=90&fit=crop' },
  { key: 'solitaire', name: 'Solitaire', sub: 'Timeless beauty', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=900&q=90&fit=crop' },
  { key: 'pave', name: 'Pavé', sub: 'Sparkling luxury', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=900&q=90&fit=crop' },
  { key: 'rose-gold', name: 'Rose Gold', sub: 'Warm & romantic', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=900&q=90&fit=crop' },
  { key: 'platinum', name: 'Platinum', sub: 'Precious white', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&h=900&q=90&fit=crop' },
]

export default function RingsByStyle({ initialStyles }: { initialStyles?: StyleItem[] }) {
  const styles = initialStyles?.length
    ? initialStyles.filter(s => s.is_enabled !== false)
    : FALLBACK
  const total = styles.length

  const [current, setCurrent] = useState(0)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const goTo = useCallback((idx: number) => {
    if (!total) return
    setCurrent(((idx % total) + total) % total)
  }, [total])

  const resetAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current)
    autoRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 2500)
  }, [total])

  useEffect(() => {
    if (!total) return
    autoRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 2500)
    return () => { if (autoRef.current) clearTimeout(autoRef.current) }
  }, [total])

  const handlePrev = () => { goTo(current - 1); resetAuto() }
  const handleNext = () => { goTo(current + 1); resetAuto() }

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX }
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX }
  const handleTouchEnd = () => {
    const dist = touchStartX.current - touchEndX.current
    if (dist > 50) { goTo(current + 1); resetAuto() }
    else if (dist < -50) { goTo(current - 1); resetAuto() }
  }

  if (!total) return null

  return (
    <section className="rbs-root">
      <style>{CSS}</style>

      {/* ── Title ── */}
      <p className="rbs-title">Rings By Style</p>

      {/* ════════ DESKTOP ════════ */}
      <div className="rbs-desktop">
        {styles.map(style => (
          <Link
            key={style.key}
            href={`/collection?style=${style.key}`}
            className="rbs-col"
          >
            <div className="rbs-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={style.image || ''}
                alt={style.name}
                className="rbs-img"
                loading="lazy"
                draggable={false}
              />
            </div>
            <div className="rbs-labels">
              <span className="rbs-lbl">{style.name.toUpperCase()}</span>
              {style.sub && <span className="rbs-sub">{style.sub}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* ════════ MOBILE ════════ */}
      <div
        className="rbs-mobile"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button className="rbs-arrow rbs-arrow-l" onClick={handlePrev} aria-label="Previous">‹</button>

        <div className="rbs-slider-viewport">
          {styles.map((style, idx) => {
            const diff = ((idx - current) % total + total) % total
            const rel = diff > total / 2 ? diff - total : diff
            const isActive = rel === 0
            const isNext = rel === 1
            const isPrev = rel === -1

            return (
              <Link
                key={style.key}
                href={`/collection?style=${style.key}`}
                className="rbs-slide"
                style={{
                  transform: isActive
                    ? 'translateX(-50%) scale(1)'
                    : isPrev
                      ? 'translateX(calc(-50% - 180px)) scale(0.62)'
                      : isNext
                        ? 'translateX(calc(-50% + 180px)) scale(0.62)'
                        : `translateX(calc(-50% + ${rel * 180}px)) scale(0.4)`,
                  opacity: isActive ? 1 : (isPrev || isNext) ? 0.45 : 0,
                  zIndex: isActive ? 3 : (isPrev || isNext) ? 2 : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
                tabIndex={isActive ? 0 : -1}
              >
                <div className="rbs-slide-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={style.image || ''}
                    alt={style.name}
                    className="rbs-slide-img"
                    loading="eager"
                    draggable={false}
                  />
                </div>
              </Link>
            )
          })}
        </div>

        <button className="rbs-arrow rbs-arrow-r" onClick={handleNext} aria-label="Next">›</button>
      </div>

      {/* Mobile label */}
      <div className="rbs-mobile-label">
        <span className="rbs-mobile-name">{styles[current].name}</span>
        {styles[current].sub && <span className="rbs-mobile-sub">{styles[current].sub}</span>}
      </div>

      {/* Dots (mobile only) */}
      <div className="rbs-dots">
        {styles.map((_, i) => (
          <button
            key={i}
            className={`rbs-dot${i === current ? ' rbs-dot--on' : ''}`}
            onClick={() => { goTo(i); resetAuto() }}
            aria-label={`Style ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════ */
const CSS = `

/* ── Root ── */
.rbs-root {
  width: 100%;
  overflow: hidden;
  padding: 0 0 48px;
}

/* ── Title ── */
.rbs-title {
  margin: 0;
  padding: 56px 0 0;
  text-align: center;
  font-family: var(--font-main, 'Cormorant Garamond', Georgia, serif);
  font-size: 15px;
  font-weight: 400;
  letter-spacing: .55em;
  text-transform: uppercase;
  color: #1a2e4a;
  margin-bottom: 48px;
}

/* ════════════════════════════════════════
   DESKTOP
════════════════════════════════════════ */
.rbs-desktop {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: nowrap;
  gap: clamp(8px, 1.6vw, 28px);
  /* vertical breathing room so the hover zoom is never clipped by root overflow */
  padding: 20px clamp(16px, 3vw, 48px);
}

.rbs-col {
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  z-index: 1;
  transition: z-index 0s;
}
/* lift the hovered column above its neighbours so the scaled image is never covered/cut */
.rbs-col:hover { z-index: 5; }

/* Image wrapper */
.rbs-img-wrap {
  width: clamp(120px, 16vw, 200px);
  height: clamp(160px, 21.3vw, 266px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.rbs-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  transition: transform .36s cubic-bezier(.16,1,.3,1);
  transform-origin: center center;
}

.rbs-col:hover .rbs-img { transform: scale(1.14); }

.rbs-labels {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rbs-lbl {
  font-size: clamp(8px, .75vw, 11px);
  font-weight: 500;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: #1a2e4a;
  white-space: nowrap;
  transition: color .24s ease;
}

.rbs-col:hover .rbs-lbl { color: #C9A96E; }

.rbs-sub {
  font-size: clamp(8px, .65vw, 10px);
  color: #5a7090;
  white-space: nowrap;
  opacity: 0;
  transition: opacity .26s ease;
}

.rbs-col:hover .rbs-sub { opacity: 1; }

/* ════════════════════════════════════════
   MOBILE CAROUSEL
════════════════════════════════════════ */
.rbs-mobile {
  display: none;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 300px;
  width: 100%;
  overflow: hidden;
}

.rbs-slider-viewport {
  position: relative;
  width: 100%;
  height: 100%;
}

.rbs-slide {
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

.rbs-slide-img-wrap {
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.rbs-slide-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* Arrows */
.rbs-arrow {
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

.rbs-arrow:active { background: rgba(201,169,110,.15); border-color: #C9A96E; color: #C9A96E; }
.rbs-arrow-l { left: 12px; }
.rbs-arrow-r { right: 12px; }

/* Mobile label */
.rbs-mobile-label {
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-top: 16px;
  min-height: 52px;
}

.rbs-mobile-name {
  font-size: 22px;
  font-weight: 400;
  color: #1a2e4a;
  letter-spacing: .08em;
}

.rbs-mobile-sub {
  font-size: 13px;
  color: #5a7090;
  text-align: center;
  line-height: 1.6;
  padding: 0 32px;
}

/* Dots */
.rbs-dots {
  display: none;
  justify-content: center;
  gap: 7px;
  margin-top: 18px;
}

.rbs-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #d0d9e4;
  border: none; padding: 0;
  cursor: pointer;
  transition: all .24s ease;
  -webkit-tap-highlight-color: transparent;
}

.rbs-dot--on { width: 22px; border-radius: 4px; background: #1a2e4a; }

/* ════════════════════════════════════════
   RESPONSIVE BREAKPOINTS
════════════════════════════════════════ */
@media (max-width: 768px) {
  .rbs-desktop { display: none; }
  .rbs-mobile  { display: flex; }
  .rbs-mobile-label { display: flex; }
  .rbs-dots    { display: flex; }
  .rbs-root { padding: 0 0 40px; }
  .rbs-title { font-size: 12px; letter-spacing: .42em; padding: 48px 0 0; margin-bottom: 0; }
}
`
