'use client'

import { useEffect, useState } from 'react'

const CSS = `
.fab-top-wrap {
  position: fixed;
  right: 24px;
  bottom: 28px;
  z-index: 99999;
  pointer-events: none;
}
.fab-top-wrap.visible { pointer-events: auto; }

.fab-top-btn {
  position: relative;
  width: 34px;
  height: 86px;
  border-radius: 100px;
  border: 1px solid rgba(var(--c-accent-rgb, 143, 122, 112), 0.35);
  background: rgba(12, 11, 9, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 10px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px) scale(0.9);
  transition:
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.3s,
    box-shadow 0.3s,
    background-color 0.3s;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}
.fab-top-wrap.visible .fab-top-btn {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.fab-top-btn:hover {
  border-color: var(--c-accent, #8F7A70);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.8),
    0 0 15px rgba(var(--c-accent-rgb, 143, 122, 112), 0.3);
  background: rgba(20, 18, 16, 0.98);
}
.fab-top-chevron-wrap {
  color: var(--c-accent, #8F7A70);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fab-top-btn:hover .fab-top-chevron-wrap {
  animation: chevronBob 1.5s ease-in-out infinite alternate;
}
@keyframes chevronBob {
  0%   { transform: translateY(-1px); }
  100% { transform: translateY(-6px); }
}
.fab-top-track {
  position: relative;
  width: 1.5px; height: 32px;
  background: rgba(var(--c-accent-rgb, 143, 122, 112), 0.2);
  margin: 6px 0;
}
.fab-top-track-fill {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: var(--c-accent, #8F7A70);
  transition: height 0.1s linear;
  box-shadow: 0 0 8px rgba(var(--c-accent-rgb, 143, 122, 112), 0.6);
}
.fab-top-track-dot {
  position: absolute;
  left: 50%;
  width: 6px; height: 6px;
  background: #ffffff;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  transition: bottom 0.15s linear;
  box-shadow: 0 0 12px #ffffff, 0 0 20px var(--c-accent, #8F7A70);
}
.fab-top-pct {
  font-family: 'Montserrat', sans-serif;
  font-size: 8.5px; font-weight: 700; letter-spacing: 0.05em;
  color: rgba(255,255,255,0.6);
  transition: color 0.3s;
}
.fab-top-btn:hover .fab-top-pct { color: var(--c-accent, #8F7A70); }
.fab-top-btn:active {
  transform: scale(0.92) !important;
  transition: transform 0.12s cubic-bezier(0.23, 1, 0.32, 1) !important;
}
.fab-top-tip {
  position: absolute;
  right: calc(100% + 12px);
  top: 50%; transform: translateY(-50%) translateX(-4px);
  white-space: nowrap;
  font-size: 9px; font-weight: 400; letter-spacing: .16em; text-transform: uppercase;
  color: rgba(245,240,232,.7);
  background: rgba(10,8,5,.95);
  border: 1px solid rgba(var(--c-accent-rgb, 143, 122, 112),.2);
  padding: 6px 12px;
  opacity: 0; pointer-events: none;
  transition: opacity .22s, transform .22s cubic-bezier(.23,1,.32,1);
}
.fab-top-tip::after {
  content: '';
  position: absolute; right: -5px; top: 50%; transform: translateY(-50%);
  width: 0; height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 5px solid rgba(10,8,5,.95);
}
.fab-top-wrap:hover .fab-top-tip {
  opacity: 1; transform: translateY(-50%) translateX(0);
}

@media (max-width: 1023px) {
  .fab-top-wrap {
    right: 16px;
    bottom: calc(72px + 30px + env(safe-area-inset-bottom, 0px));
  }
}
@media (max-width: 640px) {
  .fab-top-wrap {
    display: none !important;
  }
}
`

export default function ScrollToTop() {
  const [showTop, setShowTop] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setShowTop(scrolled > 240)
      setScrollPct(total > 0 ? Math.min(scrolled / total, 1) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTop = () => {
    // Glide through Lenis when it's running (native smooth-scroll would
    // fight its animation loop); otherwise fall back to the browser.
    const lenis = (window as any).__lenis
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { duration: 1.4 })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className={`fab-top-wrap${showTop ? ' visible' : ''}`}>
        <button
          aria-label="Back to top"
          className="fab-top-btn"
          onClick={scrollTop}
        >
          <div className="fab-top-chevron-wrap">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="fab-top-track">
            <div className="fab-top-track-fill" style={{ height: `${scrollPct * 100}%` }} />
            <div className="fab-top-track-dot" style={{ bottom: `${scrollPct * 100}%` }} />
          </div>
          <div className="fab-top-pct">
            {String(Math.round(scrollPct * 100)).padStart(2, '0')}
          </div>
        </button>
        <span className="fab-top-tip">Back to top</span>
      </div>
    </>
  )
}
