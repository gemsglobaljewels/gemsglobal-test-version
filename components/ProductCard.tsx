'use client';
import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Heart,
  ShoppingBag,
  X,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Gem,
  Eye,
} from 'lucide-react';
import {
  getUser,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from '@/lib/authStore';
import { useToast } from '@/hooks/use-toast';
import { Price } from '@/components/Price';
import { isDisplayableImageUrl } from '@/lib/video';

/* ─── types ───────────────────────────────────────────────────── */
export interface MetalOption {
  metal_name: string;
  price_modifier: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryHierarchy?: string[];
  price: number;
  rating: number;
  reviews: number;
  badge: string | null;
  material: string;
  image: string;
  hoverImage: string;
  thirdImage: string;
  allImages: string[];
  top3: string[];
  slug: string;
  description: string;
  stock_quantity: number;
  metal_options: MetalOption[];
  carat_options?: any[];
  variant_prices?: Array<{ metal_key: string; carat_key: string; price_modifier: number }>;
  size_options?: any[];
  _isMapped: boolean;
  images?: string[];
  product_images?: string[];
  gallery?: string[];
  image_url?: string;
  thumbnail?: string;
  categories?: { name: string };
  is_featured?: boolean;
  discount_percent?: number;
  label?: string | null;
}

/* ─── helpers ─────────────────────────────────────────────────── */
const R2_URL = 'https://pub-5f3798d6e2094791979a906bcf260a07.r2.dev';
const PLACEHOLDER = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80';

/* Pricing + variant helpers live in @/lib/variantPricing (dependency-free so
   admin pages can import them without pulling this 1800-line component).
   Re-exported here so every existing `from '@/components/ProductCard'`
   import keeps working. */
import {
  normalizeDiscount,
  salePrice,
  optionDisplayName,
  hasVariantOptions,
  startingRetailPrice,
  isSellableProduct,
  configuredRetailPrice,
  defaultVariantSelection,
} from '@/lib/variantPricing';
export {
  normalizeDiscount,
  salePrice,
  optionDisplayName,
  hasVariantOptions,
  startingRetailPrice,
  isSellableProduct,
  configuredRetailPrice,
  defaultVariantSelection,
};

export function isDisplayableImage(url: string | any): boolean {
  if (!url) return false;
  let s = url;
  if (typeof url !== 'string') {
    try { s = JSON.stringify(url); } catch (e) { return false; }
  }
  // Single source of truth (lib/video): excludes video of every kind
  // (files, Drive, YouTube, Vimeo) and 3D models so they never render
  // as broken gallery/card layers.
  return isDisplayableImageUrl(s);
}

export function optimizeImageUrl(url: string | any): string {
  if (!url) return PLACEHOLDER;
  let finalUrl = url;
  if (typeof url !== 'string') {
    try { finalUrl = String(url); } catch (e) { return url; }
  }
  if (!finalUrl.startsWith('http') && !finalUrl.startsWith('data:') && !finalUrl.startsWith('/')) {
    finalUrl = `${R2_URL}/${finalUrl.replace(/^\//, '')}`;
  }
  if (finalUrl.includes('images.unsplash.com')) {
    const cleanUrl = finalUrl.split('?')[0];
    return `${cleanUrl}?w=800&q=80&fit=crop&auto=format`;
  }
  return finalUrl;
}

export function mapApiProduct(p: any, allCategories?: any[]): Product | null {
  if (!p) return null;
  if (p._isMapped) return p;
  const parseImgs = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : [val]; }
      catch (e) { return [val]; }
    }
    return [val];
  };

  // Get category hierarchy
  let categoryHierarchy: string[] = [];
  let categoryName = p.category || (p.categories?.name) || 'Fine Jewelry';
  if (allCategories && p.categories) {
    let current = p.categories;
    categoryHierarchy = [current.name];
    while (current?.parent_category_id) {
      const parent = allCategories.find(c => c.id === current.parent_category_id);
      if (parent) {
        categoryHierarchy.unshift(parent.name);
        current = parent;
      } else break;
    }
    // Show just the most specific category instead of joining
    if (categoryHierarchy.length > 0) {
      categoryName = categoryHierarchy[categoryHierarchy.length - 1];
    }
  }

  const allPossibleImgs = [
    p.image, p.hoverImage, p.thirdImage, p.image_url, p.thumbnail,
    ...parseImgs(p.images), ...parseImgs(p.product_images),
    ...parseImgs(p.gallery), ...parseImgs(p.allImages)
  ].filter(Boolean).filter(isDisplayableImage);
  const uniqueImgs = [...new Set(allPossibleImgs)];
  const top3 = [...uniqueImgs];
  if (top3.length === 0) top3.push(PLACEHOLDER);
  while (top3.length < 3) top3.push(top3[top3.length % uniqueImgs.length] || PLACEHOLDER);
  return {
    id: p.id,
    name: p.name || 'Exquisite Piece',
    category: categoryName,
    categoryHierarchy,
    price: Number(p.price || 0),
    rating: Number(p.rating) || 0,
    reviews: Number(p.reviews) || 0,
    // Explicit marketing label wins; then any legacy badge; then the featured fallback.
    badge: (p.label && String(p.label).trim()) || p.badge || (p.is_featured ? 'Limited' : null),
    material: p.metal || p.material || 'Premium Gold',
    image: top3[0],
    hoverImage: top3[1],
    thirdImage: top3[2],
    allImages: uniqueImgs.length > 0 ? uniqueImgs : [top3[0]],
    top3: top3.slice(0, 3),
    slug: p.slug || p.id,
    description: p.description || '',
    stock_quantity: p.stock_quantity ?? 10,
    metal_options: p.metal_options || [],
    carat_options: p.carat_options || [],
    variant_prices: (Array.isArray(p.variant_prices) ? p.variant_prices : []).map((v: any) => ({
      metal_key: v.metal_key,
      carat_key: v.carat_key,
      price_modifier: Number(v.price_modifier) || 0,
    })),
    size_options: p.size_options || [],
    discount_percent: normalizeDiscount(p.discount_percent),
    label: (p.label && String(p.label).trim()) || null,
    _isMapped: true,
  };
}

/* Swatch gradient for a metal-option name (quick view). */
function metalSwatchBg(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('rose')) return 'linear-gradient(135deg,#D9A08A,#B67862)';
  if (n.includes('white') || n.includes('silver') || n.includes('platin')) return 'linear-gradient(135deg,#D8D8D6,#ABABA9)';
  return 'linear-gradient(135deg,#D9B36A,#B98F45)';
}

/* ─── Stars — classic gold five-point stars, half-fill aware ─── */
interface StarsProps {
  n?: number | string;
  size?: 'sm' | 'lg';
  light?: boolean;
}

const STAR_PATH = 'M8 1.4l2.02 4.1 4.53.66-3.28 3.2.78 4.51L8 11.74l-4.05 2.13.78-4.51-3.28-3.2 4.53-.66L8 1.4z';

export const Stars = memo(({ n = 5, size = 'sm', light = false }: StarsProps) => {
  const d = size === 'lg' ? 15 : 12;
  const rating = Math.max(0, Math.min(5, Number(n) || 5));
  const on = light ? '#FFFFFF' : '#C9A15D';
  const off = light ? 'rgba(255,255,255,0.28)' : '#E7DECD';
  return (
    <div style={{ display: 'flex', gap: size === 'lg' ? 3 : 2, alignItems: 'center' }} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <span key={i} style={{ position: 'relative', width: d, height: d, flexShrink: 0, display: 'inline-block' }}>
            <svg width={d} height={d} viewBox="0 0 16 16" style={{ position: 'absolute', inset: 0, display: 'block' }}>
              <path d={STAR_PATH} fill={off} />
            </svg>
            {fill > 0 && (
              <span style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${fill * 100}%`, overflow: 'hidden' }}>
                <svg width={d} height={d} viewBox="0 0 16 16" style={{ display: 'block' }}>
                  <path d={STAR_PATH} fill={on} />
                </svg>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
});
Stars.displayName = 'Stars';

/* Self-drawing check mark for the "ADDED" roll. */
const CheckDraw = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      className="gvc-check"
      d="M2.5 8.5 L6.5 12.5 L13.5 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={24}
    />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   QUICK VIEW MODAL  ·  "L'ÉCRIN"  — the jewel box opens
   — Porcelain-white dialog rising through a warm frosted dusk
   — Entrance: clip-path iris reveal + inner gold frame breathing
     into place + a champagne hairline drawing across the top
   — Left: warm gallery-paper plate; photos melt in via multiply
     blend over a plinth shadow; silk-slide gallery (pure class-swap
     transitions — interruption-proof) with a film-slate counter
   — Right: porcelain details pane, cascading entrance, metal
     swatch dots, hairline size cells, espresso-ink CTA
   — Esc closes · body scroll locked · reduced-motion safe
═══════════════════════════════════════════════════════════════ */
interface QuickViewModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onAdd: (qty: number, size: string, metal: string, carat?: string) => void;
  wished: boolean;
  onWish: (e?: React.MouseEvent) => void;
}

const MODAL_CSS = `
  .qve-overlay {
    --porcelain:#FFFDF9; --paper:#F5F0E7; --paper-edge:rgba(31,24,16,.13);
    --ink:#1F1811; --ink-2:#3A2E20; --ink-soft:#57493A; --muted:#9B8C77;
    --gold:#B08D57; --gold-hi:#D9BC8C; --gold-deep:#8C6D3F;
    --hairline:rgba(31,24,16,.1);
    --ground:rgba(31,24,16,.1);
    --serif:var(--font-dmsans),'DM Sans',system-ui,sans-serif;
    --disp:var(--font-dmsans),'DM Sans',system-ui,sans-serif;
    --sans:var(--font-dmsans),'DM Sans',system-ui,sans-serif;
    --e-lux:cubic-bezier(.19,1,.22,1);
    --e-silk:cubic-bezier(.33,0,.15,1);

    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    padding: clamp(12px, 3vw, 48px);
    background: rgba(26,20,13,.52);
    -webkit-backdrop-filter: blur(16px) saturate(.85); backdrop-filter: blur(16px) saturate(.85);
    animation: qveFade .34s var(--e-silk) both;
    overscroll-behavior: contain;
  }
  @keyframes qveFade { from { opacity: 0; } to { opacity: 1; } }

  .qve-dialog {
    position: relative; width: min(92vw, 960px); max-height: 88vh;
    display: grid; grid-template-columns: 1.06fr 1fr; overflow: hidden;
    background: var(--porcelain);
    border-radius: 4px;
    box-shadow: 0 60px 120px -30px rgba(15,10,5,.55), 0 24px 48px -24px rgba(15,10,5,.4);
    animation: qveIris .6s var(--e-lux) .05s both;
    font-family: var(--sans);
  }
  @keyframes qveIris {
    from { opacity: 0; transform: translateY(22px) scale(.965); clip-path: inset(5% 7% 5% 7% round 10px); }
    to   { opacity: 1; transform: none; clip-path: inset(0 0 0 0 round 4px); }
  }
  /* inner gold frame breathes into place */
  .qve-dialog::after {
    content: ''; position: absolute; inset: 9px; z-index: 30; pointer-events: none;
    border: 1px solid rgba(176,141,87,.34); border-radius: 2px;
    opacity: 0; transform: scale(1.015);
    animation: qveFrame .8s var(--e-lux) .3s forwards;
  }
  @keyframes qveFrame { to { opacity: 1; transform: none; } }
  /* champagne hairline draws along the top edge */
  .qve-dialog::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; z-index: 31;
    background: linear-gradient(90deg, transparent, var(--gold-hi), transparent);
    transform: scaleX(0);
    animation: qveLine .8s var(--e-lux) .28s forwards;
  }
  @keyframes qveLine { to { transform: scaleX(1); } }

  .qve-handle { display: none; }

  .qve-close {
    position: absolute; top: 16px; right: 16px; z-index: 40;
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,253,249,.85); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
    border: 1px solid var(--hairline); color: var(--ink-soft); cursor: pointer;
    transition: color .3s ease, border-color .3s ease, background .3s ease, transform .5s var(--e-lux);
  }
  .qve-close:hover { color: var(--porcelain); background: var(--ink); border-color: var(--ink); transform: rotate(90deg); }
  .qve-close:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 2px; }

  /* ── Gallery — the paper plate ── */
  .qve-gallery { position: relative; min-width: 0; display: flex; flex-direction: column; background: var(--paper); }
  .qve-stage { position: relative; flex: 1; min-height: 340px; overflow: hidden; isolation: isolate; }
  .qve-plinth {
    position: absolute; left: 24%; right: 24%; bottom: 9%; height: 14px; z-index: 0;
    border-radius: 50%; background: radial-gradient(ellipse, var(--ground) 0%, transparent 70%);
    filter: blur(6px); pointer-events: none;
  }
  /* silk-slide layers — blur-through crossfade, direction emergent */
  .qve-layer {
    position: absolute; inset: 6% 8% 8%; z-index: 1;
    mix-blend-mode: multiply; pointer-events: none;
    transition: opacity .6s var(--e-silk), transform 1s var(--e-lux), filter .6s var(--e-silk);
  }
  .qve-layer.is-active { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
  .qve-layer.is-prev   { opacity: 0; transform: translateX(-6%) scale(.985); filter: blur(9px); }
  .qve-layer.is-next   { opacity: 0; transform: translateX(6%) scale(.985); filter: blur(9px); }
  .qve-veil {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    background: radial-gradient(120% 100% at 50% 30%, transparent 55%, var(--paper-edge) 100%);
    mix-blend-mode: multiply;
  }
  .qve-toplight {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    background: linear-gradient(180deg, rgba(255,255,255,.5), transparent 26%);
  }

  /* film-slate counter */
  .qve-count {
    position: absolute; left: 18px; bottom: 14px; z-index: 5; pointer-events: none;
    font-family: var(--sans); font-size: 10px; font-weight: 600;
    letter-spacing: .2em; font-variant-numeric: tabular-nums;
    color: rgba(31,24,16,.45);
  }

  .qve-nav {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 6;
    width: 42px; height: 46px; border: none; background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: rgba(31,24,16,.35);
    transition: color .25s ease, transform .4s var(--e-lux);
  }
  .qve-nav--prev { left: 6px; }
  .qve-nav--next { right: 6px; }
  .qve-nav:hover { color: var(--gold-deep); }
  .qve-nav--prev:hover { transform: translateY(-50%) translateX(-3px); }
  .qve-nav--next:hover { transform: translateY(-50%) translateX(3px); }
  .qve-nav:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 2px; }

  .qve-thumbs {
    display: flex; gap: 8px; padding: 12px 16px 16px; flex-shrink: 0;
    overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
    background: var(--paper); border-top: 1px solid rgba(31,24,16,.06);
    scroll-snap-type: x mandatory;
  }
  .qve-thumbs::-webkit-scrollbar { display: none; }
  .qve-thumb {
    width: 54px; height: 54px; flex-shrink: 0; padding: 4px; cursor: pointer;
    scroll-snap-align: start;
    background: #fff; border: 1px solid rgba(31,24,16,.1); border-radius: 2px;
    transition: border-color .3s ease, box-shadow .3s ease, transform .4s var(--e-lux);
  }
  .qve-thumb img { width: 100%; height: 100%; object-fit: contain; display: block; mix-blend-mode: multiply; }
  .qve-thumb:hover { border-color: var(--gold); transform: translateY(-2px); }
  .qve-thumb.is-active { border-color: var(--gold-deep); box-shadow: 0 4px 10px -4px rgba(140,109,63,.4); }
  .qve-thumb:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 2px; }

  /* ── Details — porcelain pane, cascading entrance ── */
  .qve-details {
    min-width: 0; overflow-y: auto; display: flex; flex-direction: column;
    padding: clamp(28px, 3.2vw, 42px) clamp(26px, 3vw, 38px) clamp(22px, 2.6vw, 30px);
    background: var(--porcelain); border-left: 1px solid rgba(31,24,16,.06);
    scrollbar-width: thin; scrollbar-color: #E5DCCB transparent;
  }
  .qve-details::-webkit-scrollbar { width: 5px; }
  .qve-details::-webkit-scrollbar-thumb { background: #E5DCCB; border-radius: 100px; }

  .qve-details > * { animation: qveUp .5s var(--e-lux) both; }
  .qve-details > *:nth-child(1) { animation-delay: .16s; }
  .qve-details > *:nth-child(2) { animation-delay: .21s; }
  .qve-details > *:nth-child(3) { animation-delay: .26s; }
  .qve-details > *:nth-child(4) { animation-delay: .31s; }
  .qve-details > *:nth-child(5) { animation-delay: .36s; }
  .qve-details > *:nth-child(6) { animation-delay: .41s; }
  .qve-details > *:nth-child(7) { animation-delay: .46s; }
  .qve-details > *:nth-child(8) { animation-delay: .51s; }
  .qve-details > *:nth-child(9) { animation-delay: .56s; }
  .qve-details > *:nth-child(10) { animation-delay: .61s; }
  @keyframes qveUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

  .qve-eyebrow {
    display: flex; align-items: center; gap: 10px; margin: 0 0 12px;
    font-family: var(--sans); font-size: 10px; font-weight: 700;
    letter-spacing: .26em; text-transform: uppercase; color: var(--muted);
  }
  .qve-eyebrow::before { content: ''; width: 26px; height: 1px; background: var(--gold); }

  .qve-name {
    font-family: var(--serif); font-weight: 500;
    font-size: clamp(1.7rem, 2.8vw, 2.15rem); line-height: 1.12;
    color: var(--ink); margin: 0 0 14px;
  }

  .qve-pricerow { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 18px; margin: 0 0 16px; }
  .qve-price { font-family: var(--sans); font-weight: 800; font-size: clamp(1.35rem, 2.1vw, 1.7rem); color: #111; letter-spacing: .01em; line-height: 1; font-variant-numeric: tabular-nums; }
  .qve-price-wrap { display: inline-flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .qve-price--sale { color: #111; }
  .qve-strike { font-family: var(--disp); font-weight: 500; font-size: 1.05rem; color: var(--ink); opacity: .55; text-decoration: line-through; text-decoration-thickness: 1.5px; text-decoration-color: rgba(46, 38, 32, 0.5); }
  .qve-off {
    font-family: var(--sans); font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: var(--gold-deep); background: rgba(176,141,87,.12); border-radius: 2px; padding: 4px 9px;
  }
  .qve-stars { display: flex; align-items: center; gap: 8px; }
  .qve-reviews { font-family: var(--sans); font-size: 11px; font-weight: 500; color: var(--muted); }

  .qve-rule { height: 1px; margin: 0 0 16px; background: linear-gradient(90deg, var(--gold), rgba(176,141,87,.16) 55%, transparent); }

  .qve-desc {
    font-family: var(--serif); font-style: italic; font-weight: 400;
    font-size: 1.04rem; line-height: 1.62; color: var(--ink-soft); margin: 0 0 20px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .qve-desc p { margin: 0; display: inline; }

  .qve-optgroup { margin: 0 0 18px; }
  .qve-optlabel {
    font-family: var(--sans); font-size: 8.5px; font-weight: 700;
    letter-spacing: .32em; text-transform: uppercase; color: var(--gold-deep); margin: 0 0 10px;
  }
  .qve-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .qve-swatch {
    display: inline-flex; align-items: center; gap: 8px;
    min-height: 38px; padding: 7px 14px; border-radius: 2px;
    font-family: var(--sans); font-size: 10px; font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase;
    background: transparent; border: 1px solid #E2D8C6; color: var(--ink-soft);
    cursor: pointer; transition: border-color .3s ease, color .3s ease, background .3s ease, box-shadow .3s ease;
  }
  .qve-swatch:hover { border-color: var(--gold); color: var(--ink); }
  .qve-swatch.is-active { border-color: var(--ink); color: var(--ink); background: rgba(31,24,16,.03); box-shadow: inset 0 0 0 1px var(--ink); }
  .qve-swatch:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 2px; }
  .qve-dot { width: 13px; height: 13px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(31,24,16,.2); }
  .qve-up { font-size: 9px; letter-spacing: .02em; text-transform: none; opacity: .8; }

  .qve-trust {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
    margin: 0 0 4px; padding: 15px 0;
    border-top: 1px solid #EFE8DA; border-bottom: 1px solid #EFE8DA;
  }
  .qve-hl { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 7px; }
  .qve-hl svg { color: var(--gold); }
  .qve-hl span { font-family: var(--sans); font-size: 8.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); line-height: 1.5; }

  .qve-actions { display: flex; gap: 10px; margin-top: auto; padding-top: 18px; }
  .qve-add {
    position: relative; flex: 1; min-height: 52px; border: none; border-radius: 2px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 10px; overflow: hidden;
    background: linear-gradient(135deg, #8C7456, #6F5A42); color: #FFFDF5;
    font-family: var(--sans); font-size: 11.5px; font-weight: 700;
    letter-spacing: .2em; text-transform: uppercase;
    box-shadow: 0 18px 34px -16px rgba(140,109,63,.55);
    transition: transform .35s var(--e-lux), box-shadow .35s ease;
  }
  /* ink wipe across the gold — one motion language for every primary CTA */
  .qve-add::before {
    content: ''; position: absolute; inset: 0;
    background: #1F1811;
    transform: scaleX(0); transform-origin: left;
    transition: transform .45s var(--e-lux);
  }
  .qve-add > * { position: relative; z-index: 1; }
  .qve-add:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 22px 40px -16px rgba(31,24,17,.55); }
  .qve-add:hover:not(:disabled)::before { transform: scaleX(1); }
  .qve-add:disabled { opacity: .8; cursor: default; }
  .qve-add:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 3px; }
  .qve-wish {
    width: 52px; min-height: 52px; flex-shrink: 0; cursor: pointer; border-radius: 2px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent; border: 1px solid #E2D8C6; color: var(--gold-deep);
    transition: background .3s ease, border-color .3s ease, color .3s ease;
  }
  .qve-wish:hover { border-color: var(--gold); background: rgba(176,141,87,.06); }
  .qve-wish.is-on { background: rgba(176,141,87,.1); border-color: var(--gold); color: var(--gold-deep); }
  .qve-wish.is-on svg { animation: qvePop .45s ease; }
  .qve-wish:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 2px; }
  @keyframes qvePop { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }

  .qve-link {
    display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; margin-top: 16px;
    font-family: var(--sans); font-size: 9.5px; font-weight: 700;
    letter-spacing: .24em; text-transform: uppercase; color: var(--muted);
    text-decoration: none; cursor: pointer;
    transition: color .3s ease, gap .4s var(--e-lux);
  }
  .qve-link:hover { color: var(--gold-deep); gap: 13px; }
  .qve-link:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 3px; }

  @media (max-width: 720px) {
    .qve-overlay { align-items: flex-end; padding: 0; }
    .qve-dialog {
      grid-template-columns: 1fr; width: 100vw; max-width: none; max-height: 92vh;
      overflow-y: auto; border-radius: 12px 12px 0 0;
      animation: qveSheet .46s var(--e-lux) both;
    }
    .qve-dialog::after { display: none; }
    .qve-handle {
      display: block; position: absolute; top: 8px; left: 50%; z-index: 40;
      width: 36px; height: 3px; margin-left: -18px; border-radius: 100px;
      background: rgba(31,24,16,.18);
    }
    .qve-stage { min-height: 0; height: min(62vw, 320px); flex: none; }
    .qve-details { overflow-y: visible; border-left: none; }
    .qve-actions { margin-top: 8px; }
  }
  @keyframes qveSheet { from { transform: translateY(100%); } to { transform: none; } }
  @media (max-width: 400px) {
    .qve-actions { flex-direction: column; }
    .qve-wish { width: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .qve-overlay, .qve-dialog, .qve-details > * { animation: none; opacity: 1; transform: none; clip-path: none; }
    .qve-dialog::before { animation: none; transform: scaleX(1); }
    .qve-dialog::after { animation: none; opacity: 1; transform: none; }
    .qve-layer { transition: opacity .16s linear; transform: none !important; filter: none !important; }
    .qve-add:hover:not(:disabled), .qve-nav:hover, .qve-thumb:hover { transform: none; }
    .qve-nav--prev:hover, .qve-nav--next:hover { transform: translateY(-50%); }
    .qve-add::before { display: none; }
    .qve-close:hover { transform: none; }
    .qve-wish.is-on svg { animation: none; }
  }
`;

const QuickViewModal = memo(({ product, open, onClose, onAdd, wished, onWish }: QuickViewModalProps) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState('');
  const [metal, setMetal] = useState('');
  const [carat, setCarat] = useState('');
  const [qty] = useState(1);
  const [adding, setAdding] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const metalOptions = product.metal_options || [];
  const caratOptions = product.carat_options || [];
  const sizeOptions = product.size_options || [];
  // Variant-aware price: first-variant default, follows the shopper's picks.
  const currentPrice = configuredRetailPrice(
    product,
    metal || undefined,
    carat || undefined,
    size || undefined
  );
  const qvDiscount = normalizeDiscount(product.discount_percent);
  const qvSalePrice = salePrice(currentPrice, qvDiscount);
  const gallery = product.allImages || [product.image];
  const shots = gallery.slice(0, 8);

  useEffect(() => {
    if (open) {
      setImgIdx(0);
      const dflt = defaultVariantSelection(product);
      setMetal(dflt.metal || (metalOptions[0] ? optionDisplayName(metalOptions[0], 'metal') : ''));
      setCarat(dflt.carat || (caratOptions[0] ? optionDisplayName(caratOptions[0], 'carat') : ''));
      setSize(sizeOptions.find((s: any) => s.is_default)?.name || sizeOptions[0]?.name || '');
    }
  }, [open, metalOptions, caratOptions, sizeOptions]);

  // Esc closes, body scroll locks, focus lands on the close control.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const prevShot = (e: React.MouseEvent) => { e.stopPropagation(); setImgIdx(i => (i - 1 + shots.length) % shots.length); };
  const nextShot = (e: React.MouseEvent) => { e.stopPropagation(); setImgIdx(i => (i + 1) % shots.length); };

  return createPortal(
    <div
      className="qve-overlay"
      onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}
    >
      <style>{MODAL_CSS}</style>
      <div className="qve-dialog" role="dialog" aria-modal="true" aria-label={product.name}>
        <span className="qve-handle" aria-hidden="true" />
        <button ref={closeRef} onClick={onClose} className="qve-close" aria-label="Close quick view">
          <X size={16} strokeWidth={2} />
        </button>

        {/* Left – the paper plate */}
        <div className="qve-gallery">
          <div className="qve-stage">
            <div className="qve-plinth" aria-hidden="true" />
            {shots.map((img, i) => (
              <div
                key={i}
                className={`qve-layer${i === imgIdx ? ' is-active' : i < imgIdx ? ' is-prev' : ' is-next'}`}
              >
                <Image
                  src={optimizeImageUrl(img)}
                  alt={product.name}
                  fill
                  unoptimized
                  style={{ objectFit: 'contain' }}
                  sizes="(max-width:720px) 100vw, 50vw"
                />
              </div>
            ))}
            <div className="qve-veil" aria-hidden="true" />
            <div className="qve-toplight" aria-hidden="true" />
            {shots.length > 1 && (
              <>
                <div className="qve-count">
                  {String(imgIdx + 1).padStart(2, '0')} — {String(shots.length).padStart(2, '0')}
                </div>
                <button type="button" className="qve-nav qve-nav--prev" onClick={prevShot} aria-label="Previous image">
                  <ChevronLeft size={19} strokeWidth={1.8} />
                </button>
                <button type="button" className="qve-nav qve-nav--next" onClick={nextShot} aria-label="Next image">
                  <ChevronRight size={19} strokeWidth={1.8} />
                </button>
              </>
            )}
          </div>
          {shots.length > 1 && (
            <div className="qve-thumbs">
              {shots.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  className={`qve-thumb${imgIdx === i ? ' is-active' : ''}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={optimizeImageUrl(img)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right – porcelain details */}
        <div className="qve-details">
          <p className="qve-eyebrow">{product.category}</p>
          <h2 className="qve-name">{product.name}</h2>

          <div className="qve-pricerow">
            {qvDiscount > 0 ? (
              <span className="qve-price-wrap">
                <Price value={qvSalePrice} className="qve-price qve-price--sale" />
                <Price value={currentPrice} className="qve-strike" />
                <span className="qve-off">−{qvDiscount}%</span>
              </span>
            ) : (
              <Price value={currentPrice} className="qve-price" />
            )}
            {product.reviews > 0 && (
              <div className="qve-stars">
                <Stars n={product.rating} size="lg" />
                <span className="qve-reviews">({product.reviews})</span>
              </div>
            )}
          </div>

          <div className="qve-rule" />

          <div
            className="qve-desc rte-content"
            dangerouslySetInnerHTML={{ __html: product.description || 'A masterpiece of elegance, crafted with precision to tell your unique story.' }}
          />

          {metalOptions.length > 0 && (
            <div className="qve-optgroup">
              <p className="qve-optlabel">Metal</p>
              <div className="qve-chips">
                {metalOptions.map(m => {
                  const label = optionDisplayName(m, 'metal');
                  return (
                    <button key={label} type="button" onClick={() => setMetal(label)}
                      className={`qve-swatch${metal === label ? ' is-active' : ''}`}>
                      <span className="qve-dot" style={{ background: metalSwatchBg(label) }} aria-hidden="true" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {caratOptions.length > 0 && (
            <div className="qve-optgroup">
              <p className="qve-optlabel">Diamond Weight</p>
              <div className="qve-chips">
                {caratOptions.map((c: any) => {
                  const label = optionDisplayName(c, 'carat');
                  return (
                    <button key={label} type="button" onClick={() => setCarat(label)}
                      className={`qve-swatch${carat === label ? ' is-active' : ''}`}>
                      <span>{label}</span>
                      {Number(c.price_modifier) > 0 && <span className="qve-up">+<Price value={c.price_modifier} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div className="qve-optgroup">
              <p className="qve-optlabel">Size</p>
              <div className="qve-chips">
                {sizeOptions.map((s: any) => (
                  <button key={s.name} type="button" onClick={() => setSize(s.name)}
                    className={`qve-swatch${size === s.name ? ' is-active' : ''}`}>
                    <span>{s.name}</span>
                    {s.price_modifier > 0 && <span className="qve-up">+<Price value={s.price_modifier} /></span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="qve-trust">
            <div className="qve-hl"><ShieldCheck size={16} strokeWidth={1.6} /><span>Certified<br />Authentic</span></div>
            <div className="qve-hl"><Truck size={16} strokeWidth={1.6} /><span>Insured<br />Shipping</span></div>
            <div className="qve-hl"><Gem size={16} strokeWidth={1.6} /><span>Lifetime<br />Care</span></div>
          </div>

          <div className="qve-actions">
            <button
              disabled={adding}
              onClick={() => { onAdd(qty, size, metal, carat); setAdding(true); setTimeout(() => { setAdding(false); onClose(); }, 1200); }}
              className="qve-add"
            >
              <ShoppingBag size={16} strokeWidth={2} />
              <span>{adding ? 'Reserving…' : 'Add to Bag'}</span>
            </button>
            <button onClick={onWish}
              className={`qve-wish${wished ? ' is-on' : ''}`}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={wished}>
              <Heart size={19} fill={wished ? 'currentColor' : 'none'} strokeWidth={1.8} />
            </button>
          </div>

          <a className="qve-link" href={`/products/${product.slug}`}>
            View full details <ArrowUpRight size={13} strokeWidth={2} />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
});
QuickViewModal.displayName = 'QuickViewModal';

/* ═══════════════════════════════════════════════════════════════
   PRODUCT CARD  ·  "GALERIE BLANCHE"
   — A jewel photographed against the warm plaster wall of a
     private gallery: porcelain card, paper stage, espresso ink,
     champagne-gold hairlines — the light-flooded flip of the old
     midnight vitrine
   — THE MELT: photos multiply-blend into the paper so white
     backgrounds dissolve and the jewel floats edgeless, grounded
     by a soft plinth shadow that shows through the photo
   — SILK-SLIDE image engine: permanently-mounted layers, class-swap
     transitions only (never restarting keyframes) — violent cursor
     scrubbing produces one continuous glide; each photo arrives
     through a blur-of-motion crossfade; direction is emergent from
     parked layer positions
   — Hover choreography: lift + GPU shadow crossfade + slow gallery
     zoom + engraving frame drawing itself clockwise + traveling
     champagne sheen + gold underline inking beneath the name +
     eyebrow tracking breath + Bodoni price glint
   — Ink plaque badges · porcelain orb action rail · departure-board
     "ADDED" roll · embossed-medallion Réservé for out-of-stock
   — Finger-attached touch drag with rubber-band edges
   — Horizontal "Ledger" variant for view==='list'
   — Logic preserved verbatim
═══════════════════════════════════════════════════════════════ */

interface ProductCardProps {
  product: any;
  view?: "grid" | "list";
}

const CARD_CSS = `
  .gvc-wrap {
    --porcelain:#FFFFFF; --paper:#FFFFFF; --paper-edge:rgba(31,24,16,.07);
    --ink:#1F1811; --ink-2:#3A2E20; --ink-soft:#57493A; --muted:#9B8C77;
    --gold:#B08D57; --gold-hi:#D9BC8C; --gold-deep:#8C6D3F;
    --sale-bg:rgba(176,141,87,.12);
    --ok:#5F7A5A; --ground:rgba(31,24,16,.12);
    --hairline:rgba(31,24,16,.08); --edge:rgba(31,24,16,.07);
    --serif:var(--font-dmsans),'DM Sans',system-ui,sans-serif;
    --disp:var(--font-dmsans),'DM Sans',system-ui,sans-serif;
    --sans:var(--font-dmsans),'DM Sans',system-ui,sans-serif;
    --e-lux:cubic-bezier(.19,1,.22,1);
    --e-silk:cubic-bezier(.33,0,.15,1);
    --e-spring:cubic-bezier(.34,1.3,.5,1);
    --barh:50px;

    height: 100%; padding: 6px;
    opacity: 0; transform: translateY(26px) scale(.985);
    transition: opacity 1s var(--e-lux), transform 1s var(--e-lux);
  }
  .gvc-wrap.is-in { opacity: 1; transform: none; }

  /* ════════ CARD SHELL — porcelain ════════ */
  .gvc-card {
    position: relative; display: flex; flex-direction: column; height: 100%;
    background: var(--porcelain); border-radius: 4px;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: transform .7s var(--e-lux);
  }
  .gvc-card:hover { transform: translateY(-6px); }
  .gvc-card:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 3px; }
  /* dual-pseudo GPU shadow crossfade — box-shadow values never animate */
  .gvc-card::before, .gvc-card::after,
  .gvc-list::before, .gvc-list::after {
    content: ''; position: absolute; inset: 0; border-radius: inherit;
    z-index: -1; pointer-events: none;
    transition: opacity .6s var(--e-lux);
  }
  .gvc-card::before, .gvc-list::before {
    box-shadow: 0 1px 2px rgba(31,24,16,.04), 0 12px 30px -18px rgba(31,24,16,.1);
    opacity: 1;
  }
  .gvc-card::after, .gvc-list::after {
    box-shadow: 0 42px 72px -30px rgba(31,24,16,.28), 0 18px 36px -20px rgba(176,141,87,.24);
    opacity: 0;
  }
  .gvc-card:hover::before, .gvc-list:hover::before { opacity: 0; }
  .gvc-card:hover::after, .gvc-list:hover::after { opacity: 1; }
  @media (hover: none) { .gvc-card:hover { transform: none; } }

  /* ════════ IMAGE STAGE — full-bleed photo ════════ */
  .gvc-stage {
    position: relative; aspect-ratio: 4 / 5; flex-shrink: 0;
    background: var(--paper); border-radius: 3px 3px 0 0; overflow: hidden;
    isolation: isolate; touch-action: pan-y;
  }

  /* full-bleed layers — pure crossfade; the only motion is a slow
     cinematic zoom on the resting hover. Simple, silent, expensive. */
  .gvc-layer {
    position: absolute; inset: 0; z-index: 1;
    pointer-events: none; opacity: 0;
    transition: opacity .45s var(--e-silk), transform 1.2s var(--e-lux);
  }
  .gvc-layer.is-active { opacity: 1; }
  .gvc-layer.is-prev   { opacity: 0; }
  .gvc-layer.is-next   { opacity: 0; }
  .gvc-card:hover .gvc-layer, .gvc-list:hover .gvc-layer { will-change: opacity, transform; }
  /* slow gallery zoom while the cursor rests */
  @media (hover: hover) and (pointer: fine) {
    .gvc-card:hover .gvc-layer.is-active { transform: scale(1.06); }
    .gvc-list:hover .gvc-layer.is-active { transform: scale(1.04); }
  }
  .is-dragging .gvc-layer { transition: none !important; }
  .gvc-stage.is-oos .gvc-layer, .gvc-l-stage.is-oos .gvc-layer { filter: saturate(.45) opacity(.6); }

  /* traveling champagne sheen — a position, not an animation: scrubbing drags it */
  .gvc-sheen {
    position: absolute; top: -5%; bottom: -5%; left: 0; width: 58%; z-index: 2;
    pointer-events: none;
    background: linear-gradient(100deg, transparent 20%, rgba(217,188,140,.3) 50%, transparent 80%);
    mix-blend-mode: soft-light;
    transition: transform 1s var(--e-lux);
  }

  .gvc-veil {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    background: radial-gradient(140% 110% at 50% 35%, transparent 74%, rgba(31,24,16,.08) 100%);
  }

  /* gallery ticks */
  .gvc-ticks {
    position: absolute; left: 0; right: 0; bottom: 12px; z-index: 4;
    display: flex; justify-content: center; gap: 7px; pointer-events: none;
    opacity: .45; transition: opacity .4s ease .1s;
  }
  .gvc-card:hover .gvc-ticks, .gvc-list:hover .gvc-ticks { opacity: 1; }
  .gvc-tick {
    width: 16px; height: 1px; background: rgba(31,24,16,.22);
    transition: width .45s var(--e-lux), background .45s ease;
  }
  .gvc-tick.is-active { width: 30px; background: var(--gold-deep); }
  @media (hover: none) { .gvc-ticks { opacity: 1; } .gvc-tick { height: 2px; } }

  /* champagne plaque badges — a foil light passes on hover */
  .gvc-plaque {
    position: absolute; top: 14px; left: 14px; z-index: 5;
    display: flex; flex-direction: column; gap: 6px; align-items: flex-start;
    max-width: calc(100% - 64px); pointer-events: none;
  }
  .gvc-tag {
    font-family: var(--sans); font-size: 8.5px; font-weight: 700;
    letter-spacing: .26em; text-transform: uppercase; color: #FFFDF5;
    padding: 6px 13px 5px;
    background: linear-gradient(115deg, #A9834C 0%, #C9A567 45%, #A9834C 100%);
    background-size: 240% 100%; background-position: 0% 0;
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 100%, 0 100%);
    box-shadow: 0 3px 8px rgba(140,109,63,.3);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
    transition: background-position 1s var(--e-silk);
  }
  .gvc-card:hover .gvc-tag, .gvc-list:hover .gvc-tag { background-position: 75% 0; }
  .gvc-tag--sale {
    background-image: linear-gradient(115deg, #8C6D3F, #C9A567 45%, #8C6D3F 100%);
    color: #FFFDF5;
  }

  /* action rail — porcelain orbs drop in with a spring */
  .gvc-rail {
    position: absolute; top: 14px; right: 14px; z-index: 6;
    display: flex; flex-direction: column; gap: 8px;
  }
  .gvc-chip {
    width: 38px; height: 38px; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,253,249,.92);
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
    border: 1px solid rgba(31,24,16,.1); color: var(--ink-soft);
    box-shadow: 0 4px 12px -6px rgba(31,24,16,.25);
    transition: opacity .45s var(--e-spring), transform .45s var(--e-spring),
                border-color .25s ease, color .25s ease, background .25s ease;
  }
  .gvc-chip:hover { background: var(--gold-deep); border-color: var(--gold-deep); color: #FFFDF5; }
  .gvc-chip:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 2px; opacity: 1; }
  .gvc-chip.is-on { color: var(--gold-deep); border-color: var(--gold); background: rgba(255,253,249,.96); }
  .gvc-chip.is-on:hover { color: var(--gold-hi); }
  .gvc-chip.is-on svg { animation: gvcPop .45s ease; }
  @keyframes gvcPop { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
  @media (hover: hover) and (pointer: fine) {
    .gvc-rail .gvc-chip { opacity: 0; transform: translateY(-12px); }
    .gvc-rail .gvc-chip.is-on, .gvc-rail .gvc-chip:focus-visible { opacity: 1; transform: translateY(0); }
    .gvc-card:hover .gvc-rail .gvc-chip, .gvc-list:hover .gvc-rail .gvc-chip { opacity: 1; transform: translateY(0); }
    .gvc-card:hover .gvc-rail .gvc-chip:nth-child(1) { transition-delay: 70ms; }
    .gvc-card:hover .gvc-rail .gvc-chip:nth-child(2) { transition-delay: 150ms; }
    .gvc-card:hover .gvc-rail .gvc-chip:hover { transform: translateY(0) scale(1.08); transition-delay: 0ms; }
  }
  @media (hover: none) { .gvc-chip { width: 40px; height: 40px; } }

  /* Réservé medallion — scarcity as privilege, embossed in porcelain */
  .gvc-seal {
    position: absolute; top: 50%; left: 50%; z-index: 7; width: 70px; height: 70px;
    transform: translate(-50%,-50%) rotate(-7deg);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 35% 30%, #FFFDF8, #EDE3D0 76%);
    box-shadow: inset 0 0 0 1px rgba(176,141,87,.55), inset 0 0 0 5px rgba(255,255,255,.6), 0 10px 24px -8px rgba(31,24,16,.35);
    font-family: var(--serif); font-style: italic; font-size: 12.5px; color: var(--ink-2);
    pointer-events: none;
  }
  .gvc-seal::before { content: ''; position: absolute; inset: 5px; border-radius: 50%; border: 1px solid rgba(176,141,87,.45); }

  /* ════════ BODY — the caption card ════════ */
  .gvc-body {
    display: flex; flex-direction: column; align-items: flex-start; flex: 1;
    padding: 18px 20px 15px; min-width: 0;
    background: linear-gradient(180deg, #FFFFFF, #FFFEFB);
  }
  .gvc-eyebrow {
    display: inline-flex; align-items: center; gap: 10px; max-width: 100%;
    font-family: var(--sans); font-size: 9.5px; font-weight: 700;
    letter-spacing: .24em; text-transform: uppercase; color: var(--muted);
    transition: letter-spacing .55s var(--e-silk), color .4s ease;
  }
  .gvc-eyebrow::before { content: ''; width: 22px; height: 1px; flex-shrink: 0; background: var(--gold); }
  .gvc-eyebrow span { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gvc-card:hover .gvc-eyebrow, .gvc-list:hover .gvc-eyebrow { letter-spacing: .32em; color: var(--gold-deep); }

  .gvc-name {
    font-family: var(--serif); font-weight: 500;
    font-size: clamp(1.24rem, 1.55vw, 1.42rem); line-height: 1.22;
    color: var(--ink); margin: 9px 0 0; max-width: 100%;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    min-height: 2.44em;
  }
  /* gold underline inks itself beneath the name */
  .gvc-namelink {
    color: inherit; text-decoration: none;
    background-image: linear-gradient(90deg, var(--gold), var(--gold-hi));
    background-repeat: no-repeat; background-size: 0% 1px; background-position: 0 94%;
    transition: background-size .8s var(--e-lux);
  }
  .gvc-card:hover .gvc-namelink, .gvc-list:hover .gvc-namelink { background-size: 100% 1px; }
  .gvc-namelink:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 2px; }

  .gvc-rating { display: flex; align-items: center; gap: 7px; margin-top: 9px; }
  .gvc-rcount { font-family: var(--sans); font-size: 10.5px; font-weight: 500; color: var(--muted); letter-spacing: .04em; }

  /* price row — pinned to the bottom hairline; Bodoni glint on hover */
  .gvc-pricerow {
    width: 100%; margin-top: auto; padding-top: 14px;
    display: flex; align-items: baseline; gap: 9px;
    border-top: 1px solid rgba(176,141,87,.18);
  }
  .gvc-from { font-family: var(--sans); font-size: 8px; font-weight: 700; letter-spacing: .26em; text-transform: uppercase; color: var(--muted); opacity: .8; }
  .gvc-price {
    font-family: var(--sans); font-weight: 800; font-size: 1.24rem; line-height: 1;
    color: #111; letter-spacing: .01em; font-variant-numeric: tabular-nums;
    transition: letter-spacing .65s var(--e-silk) .15s;
  }
  .gvc-card:hover .gvc-price, .gvc-list:hover .gvc-price { color: #111; letter-spacing: .055em; }
  .gvc-price--sale { color: #111; }
  .gvc-strike {
    font-family: var(--disp); font-weight: 400; font-size: .82rem; line-height: 1;
    color: var(--muted); text-decoration: line-through; text-decoration-color: rgba(155,140,119,.7);
  }
  .gvc-salechip {
    margin-left: auto; flex-shrink: 0;
    font-family: var(--sans); font-size: 9.5px; font-weight: 700; letter-spacing: .1em;
    color: var(--gold-deep); background: var(--sale-bg); padding: 3px 8px; border-radius: 2px;
  }

  /* ════════ BAG BAR — departure-board roll, champagne inversion ════════ */
  .gvc-bar {
    position: relative; width: 100%; height: var(--barh); overflow: hidden; flex-shrink: 0;
    border: none; border-top: 1px solid rgba(176,141,87,.18); background: transparent; cursor: pointer;
    padding: 0; border-radius: 0 0 4px 4px;
    transition: border-color .35s ease, background .45s var(--e-silk);
  }
  .gvc-bar .gvc-row { color: var(--gold-deep); transition: color .35s ease, letter-spacing .5s var(--e-silk); }
  .gvc-card:hover .gvc-bar { border-top-color: rgba(176,141,87,.4); }
  .gvc-bar:hover { background: linear-gradient(135deg, #8C7456, #6F5A42); border-top-color: transparent; }
  .gvc-bar:hover .gvc-row { color: #FFFDF5; letter-spacing: .26em; }
  .gvc-bar:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: -2px; }
  .gvc-roll { display: flex; flex-direction: column; transform: translateY(0); transition: transform .34s var(--e-lux); }
  .gvc-bar.is-added .gvc-roll, .gvc-l-add.is-added .gvc-roll { transform: translateY(calc(-1 * var(--barh))); }
  .gvc-row {
    height: var(--barh); display: flex; align-items: center; justify-content: center; gap: 9px;
    font-family: var(--sans); font-size: 10.5px; font-weight: 700;
    letter-spacing: .22em; text-transform: uppercase;
  }
  .gvc-bar .gvc-row--done { color: var(--ok); }
  .gvc-bar:hover .gvc-row--done { color: #FFFDF5; }
  .gvc-check { stroke-dasharray: 24; stroke-dashoffset: 24; transition: stroke-dashoffset .35s ease .12s; }
  .gvc-bar.is-added .gvc-check, .gvc-l-add.is-added .gvc-check { stroke-dashoffset: 0; }
  .gvc-bar--oos { pointer-events: none; cursor: default; }
  .gvc-bar--oos .gvc-row { color: var(--muted); letter-spacing: .26em; }

  @media (max-width: 560px) {
    .gvc-wrap { --barh: 44px; padding: 4px; }
    .gvc-stage { aspect-ratio: 1 / 1.06; }
    .gvc-body { padding: 13px 14px 12px; }
    .gvc-name { font-size: 1.05rem; }
    .gvc-price { font-size: 1.04rem; }
    .gvc-row { font-size: 9.5px; letter-spacing: .16em; }
  }

  /* ════════ LIST VIEW — "The Ledger" ════════ */
  .gvc-list {
    position: relative; display: grid; grid-template-columns: 216px 1fr 210px;
    width: 100%; height: 100%; min-height: 200px;
    background: var(--porcelain); border-radius: 4px;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: transform .7s var(--e-lux);
  }
  .gvc-list:hover { transform: translateY(-3px); }
  .gvc-list:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 3px; }
  @media (hover: none) { .gvc-list:hover { transform: none; } }

  .gvc-l-stage {
    position: relative; aspect-ratio: 1 / 1; margin: 12px; align-self: center;
    background: var(--paper); border-radius: 3px; overflow: hidden;
    isolation: isolate; touch-action: pan-y;
  }
  .gvc-l-body {
    display: flex; flex-direction: column; justify-content: center;
    padding: 20px 26px; min-width: 0;
  }
  .gvc-l-name {
    font-family: var(--serif); font-weight: 500;
    font-size: clamp(1.32rem, 1.9vw, 1.62rem); line-height: 1.18;
    color: var(--ink); margin: 10px 0 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .gvc-l-rule { width: 42px; height: 1px; background: var(--gold); margin: 13px 0 0; }
  .gvc-l-desc {
    font-family: var(--serif); font-style: italic; font-size: 1rem; line-height: 1.6;
    color: var(--ink-soft); margin: 12px 0 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .gvc-l-pricerow { display: flex; align-items: baseline; gap: 10px; margin-top: 15px; flex-wrap: wrap; }
  .gvc-l-pricerow .gvc-price { font-size: 1.32rem; }
  .gvc-l-pricerow .gvc-salechip { margin-left: 0; }

  .gvc-l-actions {
    display: flex; flex-direction: column; justify-content: center; gap: 10px;
    padding: 20px; border-left: 1px solid var(--hairline);
  }
  .gvc-l-add {
    position: relative; height: 48px; overflow: hidden; border: none; border-radius: 2px;
    background: linear-gradient(135deg, #8C7456, #6F5A42); cursor: pointer; padding: 0;
    box-shadow: 0 16px 30px -16px rgba(140,109,63,.55);
    transition: transform .35s var(--e-lux), box-shadow .35s ease;
  }
  .gvc-l-add::after {
    content: ''; position: absolute; inset: 0; background: #1F1811;
    transform: scaleX(0); transform-origin: left;
    transition: transform .45s var(--e-lux);
  }
  .gvc-l-add:hover::after { transform: scaleX(1); }
  .gvc-l-add .gvc-roll { position: relative; z-index: 1; }
  .gvc-l-add:hover { transform: translateY(-1px); box-shadow: 0 20px 36px -16px rgba(140,109,63,.65); }
  .gvc-l-add:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 3px; }
  .gvc-l-add .gvc-row { color: #FFFDF5; transition: color .3s ease; }
  .gvc-l-add:hover .gvc-row { color: #FFFFFF; }
  .gvc-l-add .gvc-row--done { color: #FFFDF5; }
  .gvc-l-add .gvc-roll { transition: transform .34s var(--e-lux); }
  .gvc-l-quick {
    height: 44px; border-radius: 2px; cursor: pointer;
    background: transparent; border: 1px solid #E2D8C6; color: var(--gold-deep);
    font-family: var(--sans); font-size: 10px; font-weight: 700;
    letter-spacing: .2em; text-transform: uppercase;
    transition: background .3s ease, border-color .3s ease, color .3s ease;
  }
  .gvc-l-quick:hover { background: rgba(176,141,87,.07); color: var(--ink); border-color: var(--gold); }
  .gvc-l-quick:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 2px; }
  .gvc-l-wish {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    background: none; border: none; cursor: pointer; padding: 6px 0;
    font-family: var(--sans); font-size: 9.5px; font-weight: 700;
    letter-spacing: .22em; text-transform: uppercase; color: var(--muted);
    transition: color .3s ease;
  }
  .gvc-l-wish:hover { color: var(--gold-deep); }
  .gvc-l-wish.is-on { color: var(--gold-deep); }
  .gvc-l-wish:focus-visible { outline: 1px solid var(--gold-deep); outline-offset: 2px; }
  .gvc-l-oos {
    height: 48px; display: flex; align-items: center; justify-content: center;
    border: 1px solid #E2D8C6; border-radius: 2px;
    font-family: var(--sans); font-size: 10px; font-weight: 700;
    letter-spacing: .24em; text-transform: uppercase; color: var(--muted);
  }

  @media (max-width: 920px) {
    .gvc-list { grid-template-columns: 150px 1fr; }
    .gvc-l-body { padding: 16px 18px; }
    .gvc-l-desc { display: none; }
    .gvc-l-actions {
      grid-column: 1 / -1; flex-direction: row; align-items: center;
      border-left: none; border-top: 1px solid var(--hairline);
      padding: 12px 16px;
    }
    .gvc-l-add { flex: 1; }
    .gvc-l-quick { padding: 0 18px; }
  }
  @media (max-width: 420px) {
    .gvc-list { grid-template-columns: 120px 1fr; }
    .gvc-l-quick { display: none; }
    .gvc-l-wish { padding: 6px; }
  }

  /* ════════ Reduced motion ════════ */
  @media (prefers-reduced-motion: reduce) {
    .gvc-wrap { opacity: 1 !important; transform: none !important; transition: none !important; }
    .gvc-card, .gvc-list, .gvc-card:hover, .gvc-list:hover { transform: none !important; }
    .gvc-layer { transition: opacity .16s linear !important; transform: none !important; filter: none !important; }
    .gvc-stage.is-oos .gvc-layer, .gvc-l-stage.is-oos .gvc-layer { filter: saturate(.45) opacity(.6) !important; }
    .gvc-sheen, .gvc-fl { display: none !important; }
    .gvc-tag, .gvc-eyebrow, .gvc-price, .gvc-roll, .gvc-tick, .gvc-namelink { transition: none !important; }
    .gvc-check { transition: none !important; stroke-dashoffset: 0; }
    .gvc-chip { opacity: 1 !important; transform: none !important; transition: none !important; }
    .gvc-chip.is-on svg { animation: none; }
    .gvc-l-add:hover, .gvc-card:hover .gvc-rail .gvc-chip:hover { transform: none; }
  }
`;

const ProductCard = memo(({ product: rawProduct, view = 'grid' }: ProductCardProps) => {
  const product = useMemo(() => mapApiProduct(rawProduct), [rawProduct]);
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(false);
  // which hover-zone image is showing — direction is emergent from
  // the parked layer positions, so no fwd/back bookkeeping is needed
  const [zoneIdx, setZoneIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef(0);

  // Finger-attached touch drag state
  const dragState = useRef({ x: 0, y: 0, t: 0, w: 1, active: false, moved: false });

  const hoverImgs = useMemo(() => product?.top3 || [], [product]);
  const hasMultipleImages = useMemo(() => (product?.allImages?.length || 0) > 1, [product]);
  const totalZones = hoverImgs.length;

  // Reveal once when scrolled into view (wide horizontal margin so carousel cards reveal too)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setRevealed(true); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { setRevealed(true); io.disconnect(); }
      });
    }, { threshold: 0.1, rootMargin: '0px 800px -8% 800px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (product?.slug) setWished(isInWishlist(product.slug));
  }, [product?.slug]);

  const visibleIdx = Math.min(zoneIdx, hoverImgs.length - 1);
  useEffect(() => { zoneRef.current = visibleIdx; }, [visibleIdx]);

  const handleAdd = useCallback((qty = 1, size = '6', metal = '', carat = '') => {
    const user = getUser();
    if (!user) { router.push('/auth/signin'); return; }
    // Variant-aware: never charge the bare base price for a variant product.
    // Empty selections fall back to the first-variant default (same as PDP).
    const dflt = defaultVariantSelection(product);
    const effMetal = metal || dflt.metal;
    const effCarat = carat || dflt.carat;
    // Charge the discounted price so the bag reflects the on-sale amount.
    const unitPrice = salePrice(
      configuredRetailPrice(product, effMetal || undefined, effCarat || undefined, size || undefined),
      product!.discount_percent || 0
    );
    addToCart({ productId: product!.id, slug: (product as any).slug, productName: product!.name, price: unitPrice, quantity: qty, size, metal: effMetal, carat: effCarat || undefined, image: product!.image });
    setAdded(true);
    toast({ title: 'Added', description: `${product!.name} is in your bag.` });
    setTimeout(() => setAdded(false), 2000);
  }, [product, router, toast]);

  const handleWish = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const user = getUser();
    if (!user) { router.push('/auth/signin'); return; }
    if (wished) {
      removeFromWishlist(product!.slug);
      setWished(false);
      toast({ title: 'Removed', description: 'Item removed from wishlist.' });
    } else {
      // Wishlist stores the shopper-facing price (starting variant when applicable).
      const wishPrice = salePrice(
        hasVariantOptions(product) ? startingRetailPrice(product) : (Number(product!.price) || 0),
        product!.discount_percent || 0
      );
      addToWishlist({ slug: product!.slug, name: product!.name, price: wishPrice, image: product!.image });
      setWished(true);
      toast({ title: 'Saved', description: 'Added to your favorites.' });
    }
  }, [product, router, toast, wished]);

  const closeQV = useCallback(() => setOpen(false), []);

  // Cursor thirds drive the active image — setState only on change,
  // so scrubbing costs nothing until a zone boundary is crossed.
  const handleZoneMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width <= 0) return;
    const n = totalZones;
    const z = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
    setZoneIdx(prev => (prev === z ? prev : z));
  }, [hasMultipleImages, totalZones]);

  const handleCardLeave = useCallback(() => {
    setZoneIdx(z => (z === 0 ? z : 0));
  }, []);

  /* ── finger-attached drag: layers ride the finger via direct DOM
     writes (no re-render per move); on release the .is-dragging class
     is removed first so transitions resume from the exact dragged
     position — the hand-off is seamless ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement;
    dragState.current = {
      x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(),
      w: el.clientWidth || 1, active: false, moved: false,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    const s = dragState.current;
    const dx = e.touches[0].clientX - s.x;
    const dy = e.touches[0].clientY - s.y;
    if (!s.active) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        s.active = true; s.moved = true;
        stageRef.current?.classList.add('is-dragging');
      } else return;
    }
    const el = stageRef.current;
    if (!el) return;
    const idx = zoneRef.current;
    const last = totalZones - 1;
    // rubber-band past the ends
    const d = ((idx === 0 && dx > 0) || (idx === last && dx < 0)) ? dx * 0.3 : dx;
    const w = s.w;
    const gap = w * 0.18;
    el.querySelectorAll<HTMLElement>('.gvc-layer').forEach((ly, i) => {
      const pos = (i - idx) * gap + d * 0.8;
      ly.style.transform = `translateX(${pos}px) scale(${i === idx ? 1 : 0.99})`;
      ly.style.opacity = String(Math.max(0, Math.min(1, 1 - Math.abs(pos) / gap)));
    });
  }, [hasMultipleImages, totalZones]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const s = dragState.current;
    if (!s.active) return;
    s.active = false;
    const dx = e.changedTouches[0].clientX - s.x;
    const dt = Math.max(1, Date.now() - s.t);
    const velocity = Math.abs(dx) / dt;
    const el = stageRef.current;
    // re-enable transitions, then clear inline styles in the same tick:
    // layers glide home (or onward) from exactly where the finger left them
    el?.classList.remove('is-dragging');
    el?.querySelectorAll<HTMLElement>('.gvc-layer').forEach(ly => {
      ly.style.transform = ''; ly.style.opacity = '';
    });
    if (Math.abs(dx) > 48 || velocity > 0.4) {
      if (dx < 0) setZoneIdx(z => Math.min(z + 1, totalZones - 1));
      else setZoneIdx(z => Math.max(z - 1, 0));
    }
  }, [totalZones]);

  const goToProduct = useCallback(() => {
    if (dragState.current.moved) { dragState.current.moved = false; return; }
    router.push(`/products/${product!.slug}`);
  }, [router, product]);

  const handleCardKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      router.push(`/products/${product!.slug}`);
    }
  }, [router, product]);

  if (!product) return null;

  const isOOS = (product.stock_quantity ?? 0) <= 0;
  const discount = normalizeDiscount(product.discount_percent);
  const hasDiscount = discount > 0;
  // Variant products never show the bare base price — cards quote the
  // cheapest fully-configured ("Starting at") variant instead.
  const showFrom = hasVariantOptions(product);
  const cardRetail = showFrom ? startingRetailPrice(product) : (Number(product.price) || 0);
  const salePriceVal = salePrice(cardRetail, discount);
  const sheenX = totalZones > 1 ? -50 + (visibleIdx / (totalZones - 1)) * 166 : 8;

  /* shared plate contents: full-bleed layers + sheen + veil + engraving frame */
  const MediaStack = (
    <>
      {hoverImgs.map((src: string, i: number) => (
        <div
          key={i}
          className={`gvc-layer${i === visibleIdx ? ' is-active' : i < visibleIdx ? ' is-prev' : ' is-next'}`}
        >
          <Image
            src={optimizeImageUrl(src)}
            alt={product.name}
            fill
            unoptimized
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 480px) 80vw, (max-width: 1024px) 40vw, 25vw"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = PLACEHOLDER; }}
          />
        </div>
      ))}
      <div className="gvc-sheen" style={{ transform: `translateX(${sheenX}%)` }} aria-hidden="true" />
      <div className="gvc-veil" aria-hidden="true" />
      {hasMultipleImages && (
        <div className="gvc-ticks">
          {hoverImgs.map((_: any, i: number) => (
            <span key={i} className={`gvc-tick${i === visibleIdx ? ' is-active' : ''}`} />
          ))}
        </div>
      )}
      {isOOS && <div className="gvc-seal">Réservé</div>}
    </>
  );

  const Plaques = (product.badge || hasDiscount) ? (
    <div className="gvc-plaque">
      {product.badge ? <div className="gvc-tag">{product.badge}</div> : null}
      {hasDiscount ? <div className="gvc-tag gvc-tag--sale">−{discount}%</div> : null}
    </div>
  ) : null;

  const WishChip = (
    <button
      className={`gvc-chip${wished ? ' is-on' : ''}`}
      onClick={handleWish}
      aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={wished}
    >
      <Heart size={15} fill={wished ? 'currentColor' : 'none'} strokeWidth={1.8} />
    </button>
  );

  const QuickChip = (
    <button
      className="gvc-chip"
      onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      aria-label="Quick view"
    >
      <Eye size={15} strokeWidth={1.8} />
    </button>
  );

  const PriceLine = (
    <>
      {showFrom && <span className="gvc-from">Starting at</span>}
      {hasDiscount ? (
        <>
          <Price value={salePriceVal} className="gvc-price gvc-price--sale" />
          <Price value={cardRetail} className="gvc-strike" />
          <span className="gvc-salechip">−{discount}%</span>
        </>
      ) : (
        <Price value={cardRetail} className="gvc-price" />
      )}
    </>
  );

  const stageTouchProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  /* ════════════════ LIST VIEW — "The Ledger" ════════════════ */
  if (view === 'list') {
    return (
      <div className={`gvc-wrap${revealed ? ' is-in' : ''}`} ref={wrapRef}>
        <style>{CARD_CSS}</style>
        <article
          className="gvc-list"
          onClick={goToProduct}
          onMouseLeave={handleCardLeave}
          tabIndex={0}
          onKeyDown={handleCardKey}
          aria-label={product.name}
        >
          <div
            ref={stageRef}
            className={`gvc-l-stage${isOOS ? ' is-oos' : ''}`}
            onMouseMove={handleZoneMove}
            {...stageTouchProps}
          >
            {MediaStack}
            {Plaques}
            <div className="gvc-rail">{WishChip}</div>
          </div>

          <div className="gvc-l-body">
            <span className="gvc-eyebrow"><span>{product.category}</span></span>
            <h3 className="gvc-l-name">
              <a
                className="gvc-namelink"
                href={`/products/${product.slug}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/products/${product.slug}`); }}
              >
                {product.name}
              </a>
            </h3>
            {product.reviews > 0 && (
              <div className="gvc-rating">
                <Stars n={product.rating} />
                <span className="gvc-rcount">({product.reviews} {product.reviews === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}
            <div className="gvc-l-rule" />
            <div
              className="gvc-l-desc rte-content"
              dangerouslySetInnerHTML={{ __html: product.description || 'A masterpiece of elegance, crafted to tell your story.' }}
            />
            <div className="gvc-l-pricerow">{PriceLine}</div>
          </div>

          <div className="gvc-l-actions">
            {!isOOS ? (
              <button
                className={`gvc-l-add${added ? ' is-added' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                aria-label={added ? 'Added to bag' : 'Add to bag'}
              >
                <span className="gvc-roll" aria-live="polite">
                  <span className="gvc-row"><ShoppingBag size={13} strokeWidth={2} />Add to Bag</span>
                  <span className="gvc-row gvc-row--done"><CheckDraw size={14} />Added</span>
                </span>
              </button>
            ) : (
              <div className="gvc-l-oos">Reserved</div>
            )}
            <button
              className="gvc-l-quick"
              onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            >
              Quick View
            </button>
            <button
              className={`gvc-l-wish${wished ? ' is-on' : ''}`}
              onClick={handleWish}
              aria-pressed={wished}
            >
              <Heart size={13} fill={wished ? 'currentColor' : 'none'} strokeWidth={1.8} />
              {wished ? 'Saved' : 'Wishlist'}
            </button>
          </div>
        </article>

        <QuickViewModal
          product={product}
          open={open}
          onClose={closeQV}
          onAdd={handleAdd}
          wished={wished}
          onWish={handleWish}
        />
      </div>
    );
  }

  /* ════════════════ GRID — "Galerie Blanche" ════════════════ */
  return (
    <div className={`gvc-wrap${revealed ? ' is-in' : ''}`} ref={wrapRef}>
      <style>{CARD_CSS}</style>

      <article
        className="gvc-card"
        onClick={goToProduct}
        onMouseLeave={handleCardLeave}
        tabIndex={0}
        onKeyDown={handleCardKey}
        aria-label={product.name}
      >
        <div
          ref={stageRef}
          className={`gvc-stage${isOOS ? ' is-oos' : ''}`}
          onMouseMove={handleZoneMove}
          {...stageTouchProps}
        >
          {MediaStack}
          {Plaques}
          <div className="gvc-rail">{WishChip}{QuickChip}</div>
        </div>

        <div className="gvc-body">
          <span className="gvc-eyebrow"><span>{product.category}</span></span>
          <h3 className="gvc-name">
            <a
              className="gvc-namelink"
              href={`/products/${product.slug}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/products/${product.slug}`); }}
            >
              {product.name}
            </a>
          </h3>
          {product.reviews > 0 && (
            <div className="gvc-rating">
              <Stars n={product.rating} />
              <span className="gvc-rcount">({product.reviews})</span>
            </div>
          )}
          <div className="gvc-pricerow">{PriceLine}</div>
        </div>

        {!isOOS ? (
          <button
            className={`gvc-bar${added ? ' is-added' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleAdd(); }}
            aria-label={added ? 'Added to bag' : 'Add to bag'}
          >
            <span className="gvc-roll" aria-live="polite">
              <span className="gvc-row"><ShoppingBag size={13} strokeWidth={2} />Add to Bag</span>
              <span className="gvc-row gvc-row--done"><CheckDraw size={14} />Added</span>
            </span>
          </button>
        ) : (
          <div className="gvc-bar gvc-bar--oos">
            <span className="gvc-row">Reserved</span>
          </div>
        )}
      </article>

      <QuickViewModal
        product={product}
        open={open}
        onClose={closeQV}
        onAdd={handleAdd}
        wished={wished}
        onWish={handleWish}
      />
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;

/* ─── Section Title (place above your product grid) ──────────── */
/*
  Usage in your page/section component:

  <ProductSectionTitle
    eyebrow="New Arrivals"           // optional
    title="Our Collection"
    subtitle="Discover pieces crafted to last a lifetime."  // optional
  />
*/

interface ProductSectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export const ProductSectionTitle = memo(({ eyebrow, title, subtitle }: ProductSectionTitleProps) => (
  <div style={{
    textAlign: 'center',
    padding: '48px 24px 36px',
  }}>
    {eyebrow && (
      <p style={{
        fontFamily: "var(--font-dmsans),'DM Sans','Jost',system-ui,sans-serif",
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.34em',
        textTransform: 'uppercase',
        color: '#8C6D3F',
        marginBottom: '14px',
      }}>
        {eyebrow}
      </p>
    )}
    <h2 style={{
      fontFamily: "var(--font-dmsans),'DM Sans',system-ui,sans-serif",
      fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
      fontWeight: 300,
      letterSpacing: '0.01em',
      color: '#1F1811',
      margin: 0,
      lineHeight: 1.12,
    }}>
      {title}
    </h2>
    {subtitle && (
      <p style={{
        marginTop: '14px',
        fontFamily: "var(--font-dmsans),'DM Sans',system-ui,sans-serif",
        fontStyle: 'italic',
        fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
        color: 'rgba(31,24,16,.55)',
        maxWidth: '480px',
        marginLeft: 'auto',
        marginRight: 'auto',
        lineHeight: 1.6,
      }}>
        {subtitle}
      </p>
    )}
  </div>
));
ProductSectionTitle.displayName = 'ProductSectionTitle';
