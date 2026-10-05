"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

interface ProductSliderProps {
  products?: any[];
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  /** autoplay interval (ms) — desktop only */
  interval?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function ProductSlider({
  products = [],
  title = "New Arrivals",
  subtitle = "Handcrafted pieces, curated for you",
  showHeader = true,
  interval = 4800,
}: ProductSliderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  /* ─── responsive + measured sizing ───────────────────────── */
  const [current, setCurrent] = useState(0);
  const [perView, setPerView] = useState(4);
  const [dims, setDims] = useState({ cw: 0, iw: 0 }); // container width, item width
  const [isMobile, setIsMobile] = useState(false);

  /* ─── interaction refs (no re-render) ────────────────────── */
  const paused = useRef(false);
  const dragging = useRef(false);
  const dragMoved = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const dirLock = useRef<"h" | "v" | null>(null);
  const baseTranslate = useRef(0);
  const reduced = useRef(false);
  const inView = useRef(true);

  const count = products.length;
  const pageCount = Math.max(1, Math.ceil(count / perView));
  const maxTranslate = Math.max(0, dims.iw * count - dims.cw);
  const translateFor = (p: number) => Math.min(p * dims.cw, maxTranslate);

  /* ─── measure ────────────────────────────────────────────── */
  useEffect(() => {
    const measure = () => {
      const w = viewportRef.current?.clientWidth || 0;
      const vw = window.innerWidth;
      setIsMobile(vw < 768);
      let pv: number;
      if (vw < 560) pv = 1;
      else if (vw < 900) pv = 2;
      else if (vw < 1280) pv = 3;
      else pv = 4;
      setPerView(pv);
      setDims({ cw: w, iw: w > 0 ? w / pv : 0 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* ─── prefers-reduced-motion ─────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    const on = () => { reduced.current = mq.matches; };
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  /* ─── pause when off-screen ──────────────────────────────── */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => { inView.current = e.isIntersecting; },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ─── keep current page valid ────────────────────────────── */
  useEffect(() => {
    setCurrent((c) => Math.min(c, pageCount - 1));
  }, [pageCount]);

  /* ─── apply transform on page / size change ──────────────── */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = "transform .7s cubic-bezier(.22,1,.36,1)";
    el.style.transform = `translate3d(${-translateFor(current)}px,0,0)`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, dims.cw, dims.iw, count]);

  /* ─── autoplay (desktop only) ────────────────────────────── */
  useEffect(() => {
    if (isMobile || pageCount <= 1) return;
    const id = setInterval(() => {
      if (
        paused.current ||
        dragging.current ||
        reduced.current ||
        !inView.current ||
        (typeof document !== "undefined" && document.hidden)
      ) return;
      setCurrent((c) => (c + 1) % pageCount);
    }, interval);
    return () => clearInterval(id);
  }, [isMobile, pageCount, interval]);

  /* ─── hover pause ────────────────────────────────────────── */
  const handleEnter = () => { paused.current = true; };
  const handleLeave = () => {
    paused.current = false;
    if (dragging.current) finishDrag();
  };

  /* ─── drag / swipe ───────────────────────────────────────── */
  const onDown = (x: number, y: number) => {
    if (pageCount <= 1) return;
    dragging.current = true;
    dragMoved.current = false;
    startX.current = x;
    startY.current = y;
    dirLock.current = null;
    baseTranslate.current = translateFor(current);
    const el = trackRef.current;
    if (el) el.style.transition = "none";
  };

  const onMove = (x: number, y: number, e?: React.TouchEvent) => {
    if (!dragging.current) return;
    const dx = x - startX.current;
    const dy = y - startY.current;
    if (!dirLock.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      dirLock.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (dirLock.current !== "h") return;
    e?.preventDefault();
    if (Math.abs(dx) > 4) dragMoved.current = true;
    let live = baseTranslate.current - dx;
    if (live < 0) live = live * 0.35;
    else if (live > maxTranslate) live = maxTranslate + (live - maxTranslate) * 0.35;
    const el = trackRef.current;
    if (el) el.style.transform = `translate3d(${-live}px,0,0)`;
  };

  const finishDrag = (x?: number) => {
    if (!dragging.current) return;
    dragging.current = false;
    dirLock.current = null;
    const el = trackRef.current;
    if (el) el.style.transition = "transform .7s cubic-bezier(.22,1,.36,1)";

    let target = current;
    if (typeof x === "number" && dragMoved.current) {
      const dx = x - startX.current;
      const threshold = Math.max(40, dims.cw * 0.12);
      if (dx <= -threshold) target = Math.min(current + 1, pageCount - 1);
      else if (dx >= threshold) target = Math.max(current - 1, 0);
    }
    if (target === current) {
      if (el) el.style.transform = `translate3d(${-translateFor(current)}px,0,0)`;
    } else {
      setCurrent(target);
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragMoved.current) {
      e.preventDefault();
      e.stopPropagation();
      dragMoved.current = false;
    }
  };

  const go = (dir: number) => setCurrent((c) => (c + dir + pageCount) % pageCount);

  /* ─── empty state ────────────────────────────────────────── */
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div style={{ width: 48, height: 1, background: "var(--c-accent,#8F7A70)", opacity: 0.4 }} />
        <p style={{ fontSize: "10px", letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--c-text,#2C231E)", opacity: 0.4 }}>
          No pieces available
        </p>
        <div style={{ width: 48, height: 1, background: "var(--c-accent,#8F7A70)", opacity: 0.4 }} />
      </div>
    );
  }

  const itemWidth = dims.iw > 0 ? `${dims.iw}px` : `${100 / count}%`;
  const trackWidth = dims.iw > 0 ? `${dims.iw * count}px` : `${(count / perView) * 100}%`;

  return (
    <div className="ps-root">
      {/* ══════════════ HEADER ══════════════ */}
      {showHeader && (
        <div className="ps-head">
          <div className="ps-eyebrow">
            <span className="ps-eyebrow-line" />
            <span className="ps-eyebrow-text">Collection</span>
          </div>
          <h2 className="ps-title">{title}</h2>
          <p className="ps-sub">{subtitle}</p>
        </div>
      )}

      {/* ══════════════ VIEWPORT ══════════════ */}
      <div
        ref={viewportRef}
        className="ps-viewport"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClickCapture={onClickCapture}
        onMouseDown={(e) => { e.preventDefault(); onDown(e.clientX, e.clientY); }}
        onMouseMove={(e) => onMove(e.clientX, e.clientY)}
        onMouseUp={(e) => finishDrag(e.clientX)}
        onTouchStart={(e) => onDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => onMove(e.touches[0].clientX, e.touches[0].clientY, e)}
        onTouchEnd={(e) => finishDrag(e.changedTouches[0]?.clientX)}
        style={{ cursor: pageCount > 1 ? "grab" : "default", touchAction: "pan-y" }}
      >
        <div ref={trackRef} className="ps-track" style={{ width: trackWidth }}>
          {products.map((product, idx) => (
            <div key={product.id ?? idx} className="ps-item" style={{ width: itemWidth }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ PREMIUM PAGINATION ══════════════ */}
      {pageCount > 1 && (
        <div className="ps-controls">
          <button className="ps-arrow" onClick={() => go(-1)} aria-label="Previous">
            <ChevronLeft size={18} strokeWidth={1.8} />
          </button>

          <div className="ps-progress">
            <div className="ps-bar">
              <div className="ps-bar-fill" style={{ width: `${((current + 1) / pageCount) * 100}%` }} />
            </div>
            <div className="ps-count">
              <span className="ps-cur">{pad(current + 1)}</span>
              <span className="ps-sep">/</span>
              <span className="ps-tot">{pad(pageCount)}</span>
            </div>
          </div>

          <button className="ps-arrow" onClick={() => go(1)} aria-label="Next">
            <ChevronRight size={18} strokeWidth={1.8} />
          </button>
        </div>
      )}

      <style jsx>{`
        .ps-root { width: 100%; font-family: var(--font-main, 'Cormorant Garamond', Georgia, serif); }

        .ps-head { position: relative; margin-bottom: 38px; padding-bottom: 22px; }
        .ps-head::after {
          content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 1px;
          background: linear-gradient(90deg, var(--c-accent, #8F7A70) 0%, rgba(143,122,112,0.14) 40%, transparent 100%);
        }
        .ps-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .ps-eyebrow-line { width: 26px; height: 1.5px; background: var(--c-accent, #8F7A70); }
        .ps-eyebrow-text { font-size: 9px; letter-spacing: 0.42em; text-transform: uppercase; color: var(--c-accent, #8F7A70); font-weight: 700; }
        .ps-title { margin: 0 0 6px; font-weight: 300; font-size: clamp(2rem, 4vw, 3rem); color: var(--c-text, #2C231E); line-height: 1; letter-spacing: -0.03em; }
        .ps-sub { margin: 0; font-size: 0.85rem; color: var(--c-text, #2C231E); opacity: 0.45; font-style: italic; }

        .ps-viewport {
          position: relative; width: 100%; overflow: hidden;
          padding: 22px 0; margin: -22px 0;
        }
        .ps-track { display: flex; will-change: transform; user-select: none; -webkit-user-select: none; }
        .ps-item { flex-shrink: 0; }

        .ps-controls { display: flex; align-items: center; gap: clamp(16px, 3vw, 34px); margin-top: 30px; }
        .ps-arrow {
          flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(var(--c-accent-rgb, 143,122,112), 0.4);
          background: transparent; color: var(--c-accent, #8F7A70); cursor: pointer;
          transition: background .3s ease, color .3s ease, transform .25s ease, box-shadow .3s ease, border-color .3s ease;
        }
        .ps-arrow:hover {
          background: var(--c-accent, #8F7A70); color: #fff; border-color: var(--c-accent, #8F7A70);
          transform: translateY(-2px); box-shadow: 0 14px 28px -10px rgba(var(--c-accent-rgb, 143,122,112), 0.55);
        }
        .ps-arrow:active { transform: translateY(0); }

        .ps-progress { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 13px; min-width: 0; }
        .ps-bar { width: 100%; max-width: 440px; height: 2px; border-radius: 100px; background: rgba(var(--c-text-rgb, 44,35,30), 0.12); overflow: hidden; }
        .ps-bar-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, rgba(var(--c-accent-rgb, 143,122,112), 0.45), var(--c-accent, #8F7A70)); transition: width .7s cubic-bezier(.22,1,.36,1); }
        .ps-count { display: flex; align-items: baseline; gap: 7px; font-family: var(--font-main, serif); letter-spacing: 0.06em; }
        .ps-cur { font-size: 19px; font-weight: 700; color: var(--c-accent, #8F7A70); }
        .ps-sep { font-size: 13px; color: rgba(var(--c-text-rgb, 44,35,30), 0.3); }
        .ps-tot { font-size: 13px; color: rgba(var(--c-text-rgb, 44,35,30), 0.42); font-weight: 600; }

        @media (max-width: 560px) {
          .ps-controls { gap: 14px; margin-top: 22px; }
          .ps-arrow { width: 42px; height: 42px; }
          .ps-cur { font-size: 17px; }
        }
      `}</style>
    </div>
  );
}
