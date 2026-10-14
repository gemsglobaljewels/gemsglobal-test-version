'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/* ── Site-wide buttery smooth scrolling (Lenis) ──────────────────────────
   Mounted once in ClientProviders, so every page scrolls the same:
   wheel glides with an expo-out ease, touch stays native, in-page anchors
   glide too. Respects prefers-reduced-motion (no smoothing then).
   The live instance is exposed as window.__lenis so one-off jumps
   (e.g. Back-to-top) can glide through it instead of fighting it. */
declare global {
  interface Window {
    __lenis?: { scrollTo: (to: number | string, opts?: Record<string, unknown>) => void } | undefined
  }
}

export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: true,
    })
    window.__lenis = lenis as unknown as Window['__lenis']

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      window.__lenis = undefined
    }
  }, [])

  return null
}
