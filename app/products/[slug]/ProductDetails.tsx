"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from "@/components/footer";
import {
  Heart, Share2, Shield, Truck, RotateCcw, Play,
  ChevronLeft, ChevronRight, MessageCircle, Star,
  ShoppingBag, ZoomIn, ThumbsUp,
  Calendar, Upload, X as CloseIcon, BadgeCheck,
  Package, Clock, Camera, Filter, Award,
  ThumbsDown, Sparkles, Check,
} from "lucide-react";
import ModelViewer3D, { preloadModelViewer, prefetchModel, isUsdz } from "@/components/ModelViewer3D";
import {
  addToCart, getUser, addToWishlist, removeFromWishlist,
  isInWishlist, addToRecentlyViewed,
} from "@/lib/authStore";
import { useToast } from "@/hooks/use-toast";
import { Price } from "@/components/Price";
import { salePrice, normalizeDiscount, defaultVariantSelection, optionDisplayName } from "@/components/ProductCard";
import { isVideoUrl, isEmbedVideoUrl, videoEmbedUrl, isDisplayableImageUrl } from "@/lib/video";
import { RecentlyViewed } from "@/components/RecentlyViewed";

/* ── Types ── */
interface Product {
  id: string; name: string; description: string; price: number;
  category: string; categoryHierarchy?: string[]; slug: string;
  images: string[]; image?: string; rating: number; reviews: number;
  metal: string; style: string; stock_quantity: number;
  details: Record<string, any>; tags: string[];
  diamond_shape?: string; color?: string; carat?: string | number;
  clarity?: string; sku?: string; stock?: number;
  video_url?: string; model_3d?: string;
  metal_options?: any[]; size_options?: any[]; carat_options?: any[]; custom_options?: any[];
  variant_prices?: Array<{ metal_key: string; carat_key: string; price_modifier: number }>;
  discount_percent?: number; label?: string | null;
}
interface Review {
  id: string; product_id: string; user_id: string;
  rating: number; title: string; content: string; created_at: string;
  users?: { full_name: string }; isLiked?: boolean;
  helpful_count?: number; images?: string[]; verified_purchase?: boolean;
}

/* ── CSS injected via <style> tag in JSX — no module-level flag ── */
const PDP_CSS = `
/* ════════════════════════════════════════════════════
   PDP — AURUM — LUXURY JEWELRY PRODUCT DETAIL
   Injected via <style> in JSX so it re-mounts reliably.
   Matches site header / footer / auth / account family.
════════════════════════════════════════════════════ */

/* ── AURUM tokens ── */
.pdp-root {
  --w:#FFFFFF; --iv:#FDFCF9; --cr:#F8F4EE; --wa:#EFE9DF; --bd:#ECE5DA; --bd2:#E2D9CB;
  --a:#8C7456; --a2:#A8916F; --a3:#C9B68F;
  --al:rgba(140,116,86,.10); --am:rgba(140,116,86,.22);
  --ink:#3A2E22; --mu:rgba(58,46,34,.56); --fa:rgba(58,46,34,.40); --li:rgba(58,46,34,.08); --ok:#2D6A4F;
  --serif: var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
  --sans:  var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;

  --rad: 16px;
  --rad-sm: 12px;
  --shadow: 0 1px 2px rgba(58,46,34,.04), 0 14px 40px -22px rgba(58,46,34,.22);
  --shadow-lift: 0 2px 4px rgba(58,46,34,.05), 0 24px 56px -26px rgba(58,46,34,.30);

  background: var(--iv);
  color: var(--ink);
  font-family: var(--sans);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* Generous bottom padding so floating bottom pill-nav / sticky bars clear footer on ≤1023px */
@media(max-width:1023px){ .pdp-root { padding-bottom: 104px; } }

.pdp-root ::selection { background: var(--am); color: var(--ink); }

/* ── breadcrumb ── */
.pdp-bc {
  max-width: 1380px; margin: 0 auto;
  padding: 26px 48px 0;
  font-size: 11px; letter-spacing: .06em;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  color: var(--mu); font-family: var(--sans);
}
.pdp-bc a { color: var(--mu); text-decoration: none; transition: color .2s; }
.pdp-bc a:hover { color: var(--a); }
.pdp-bc-sep { color: var(--bd2); }
.pdp-bc-cur { color: var(--ink); font-weight: 600; }
@media(max-width:768px){ .pdp-bc { padding: 18px 18px 0; gap: 6px; font-size: 10px; } }

/* ════════════════════════════════════════════════════
   HERO — gallery (left) + sticky info (right)
════════════════════════════════════════════════════ */
.pdp-hero {
  max-width: 1380px; margin: 0 auto;
  padding: 30px 48px 64px;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr);
  gap: 60px;
  align-items: start;
}
@media(max-width:1023px){
  .pdp-hero { grid-template-columns: 1fr; gap: 40px; padding: 22px 24px 52px; }
}
@media(max-width:767px){
  .pdp-hero { padding: 16px 16px 44px; gap: 30px; }
}

/* ── gallery shell (holds gallery + side-zoom panel) ── */
.pdp-gallery-shell {
  position: sticky; top: 96px;
  display: flex; align-items: flex-start; gap: 18px;
}
@media(max-width:1023px){
  .pdp-gallery-shell { position: static; }
}

/* ── gallery ── */
.pdp-gallery {
  flex: 1 1 auto; min-width: 0;
  display: grid;
  grid-template-columns: 80px minmax(0,1fr);
  gap: 14px;
}
@media(max-width:767px){
  .pdp-gallery { grid-template-columns: 1fr; }
  .pdp-thumbs { flex-direction: row !important; overflow-x: auto; max-height: none !important; order: 2; margin-top: 12px; }
  .pdp-thumb { width: 62px !important; height: 62px !important; flex-shrink: 0; }
}

.pdp-thumbs {
  display: flex; flex-direction: column; gap: 10px;
  max-height: 560px; overflow-y: auto; scrollbar-width: none;
}
.pdp-thumbs::-webkit-scrollbar { display: none; }

.pdp-thumb {
  width: 80px; height: 80px; flex-shrink: 0;
  border: 1px solid var(--bd);
  border-radius: var(--rad-sm);
  cursor: pointer; overflow: hidden;
  transition: transform .25s ease, border-color .22s, box-shadow .22s;
  background: var(--w);
  display: flex; align-items: center; justify-content: center;
}
.pdp-thumb.on {
  border-color: var(--a2);
  box-shadow: 0 0 0 3px var(--al);
}
.pdp-thumb:hover:not(.on) { border-color: var(--a3); transform: translateY(-2px); box-shadow: var(--shadow); }
.pdp-thumb img {
  width: 100%; height: 100%; object-fit: contain; padding: 6px;
  transition: transform .4s;
}
.pdp-thumb:hover img { transform: scale(1.08); }
.pdp-thumb-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(58,46,34,.10); z-index: 2; border-radius: var(--rad-sm);
}

/* ── main image wrapper — no background shorthand ── */
.pdp-main-wrap {
  position: relative;
  overflow: hidden;
  border-radius: var(--rad);
  background-color: var(--w);
  border: 1px solid var(--bd);
  box-shadow: var(--shadow);
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow .35s;
}
.pdp-main-wrap:hover { box-shadow: var(--shadow-lift); }
.pdp-main-wrap img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  padding: 26px;
  transition: transform .5s cubic-bezier(.25,.46,.45,.94);
  display: block;
}
/* gentle scale on hover only when the side-zoom lens is NOT active */
.pdp-main-wrap:not(.zooming):hover img { transform: scale(1.03); }
.pdp-main-wrap video {
  width: 100%; height: 100%; object-fit: contain;
  background: var(--w); border-radius: var(--rad);
}

/* corner badge for media type */
.pdp-media-tag {
  position: absolute; top: 14px; left: 14px; z-index: 3;
  font-size: 9px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
  padding: 6px 12px; border-radius: 30px;
  background: rgba(255,255,255,.86); backdrop-filter: blur(6px);
  border: 1px solid var(--bd); color: var(--a);
  display: flex; align-items: center; gap: 6px;
}

.pdp-zoom-btn {
  position: absolute; top: 14px; right: 14px; z-index: 6;
  width: 42px; height: 42px; border-radius: 50%;
  background: rgba(255,255,255,.92); backdrop-filter: blur(6px);
  border: 1px solid var(--bd);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .22s; color: var(--a);
  box-shadow: 0 6px 18px -8px rgba(58,46,34,.4);
}
.pdp-zoom-btn:hover {
  background: linear-gradient(135deg,var(--a),var(--a2));
  color: #fff; border-color: transparent; transform: translateY(-2px);
}

/* nav arrows for gallery */
.pdp-gal-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  z-index: 6; width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,.9); backdrop-filter: blur(6px);
  border: 1px solid var(--bd);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .22s; color: var(--mu);
  box-shadow: 0 6px 18px -8px rgba(58,46,34,.4);
}
.pdp-gal-nav:hover {
  background: linear-gradient(135deg,var(--a),var(--a2));
  color: #fff; border-color: transparent;
}
.pdp-gal-nav.prev { left: 14px; }
.pdp-gal-nav.next { right: 14px; }

/* ── SIDE ZOOM-ON-HOVER MAGNIFIER ── */
/* lens / region indicator that floats over the main image */
.pdp-zoom-lens {
  position: absolute; z-index: 5;
  border: 1px solid var(--a2);
  background: rgba(140,116,86,.12);
  box-shadow: 0 0 0 1px rgba(255,255,255,.5) inset, 0 6px 20px -8px rgba(58,46,34,.5);
  pointer-events: none;
  border-radius: 6px;
  display: none;
}
/* the magnified preview panel to the side (right of gallery) */
.pdp-zoom-panel {
  position: absolute;
  top: 0; left: calc(100% + 18px);
  width: 440px; height: 100%;
  z-index: 30;
  border-radius: var(--rad);
  border: 1px solid var(--bd);
  background-color: var(--w);
  background-repeat: no-repeat;
  box-shadow: var(--shadow-lift);
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
  transition: opacity .18s ease;
  display: none;
}
/* only enable side-zoom on desktop ≥1024px */
@media(min-width:1024px){
  .pdp-main-wrap.zooming { cursor: crosshair; }
  .pdp-main-wrap.zooming .pdp-zoom-lens { display: block; }
  /* lift the (sticky) gallery shell above the info column so the floating panel sits on top */
  .pdp-gallery-shell.zoom-active { z-index: 30; }
  .pdp-gallery-shell.zoom-active .pdp-zoom-panel {
    display: block; opacity: 1;
  }
  /* controls stay clickable at all times — hovering them pauses the lens
     (see onMouseEnter below) instead of hiding them, so zoom + buttons
     never fight each other */
}
@media(min-width:1024px) and (max-width:1199px){
  .pdp-zoom-panel { width: 360px; }
}

/* image fallback */
.pdp-img-fallback {
  width: 100%; height: 100%; min-height: 320px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px;
  background: var(--cr); border-radius: var(--rad);
}
.pdp-img-fallback-letter {
  width: 84px; height: 84px; border-radius: 50%;
  background: var(--al);
  border: 1px solid var(--am);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--serif); font-size: 38px; font-weight: 400; font-style: italic;
  color: var(--a);
}
.pdp-img-fallback-txt {
  font-size: 10px; color: var(--fa); letter-spacing: .14em; text-transform: uppercase;
}

/* ════════════════════════════════════════════════════
   INFO PANEL (sticky on desktop)
════════════════════════════════════════════════════ */
.pdp-info {
  padding: 4px 0 0; min-width: 0;
  position: sticky; top: 96px;
}
@media(max-width:1023px){ .pdp-info { position: static; } }

.pdp-eyebrow {
  display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
}
.pdp-eyebrow-line { width: 28px; height: 1px; background: linear-gradient(90deg,var(--a),transparent); }
.pdp-eyebrow-txt {
  font-size: 10px; font-weight: 600; letter-spacing: .34em;
  text-transform: uppercase; color: var(--a); font-family: var(--sans);
}

.pdp-title {
  font-family: var(--serif);
  font-size: clamp(30px, 3.4vw, 50px);
  font-weight: 500; line-height: 1.05;
  letter-spacing: -.01em; color: var(--ink);
  margin: 0 0 18px;
}
.pdp-title em {
  font-style: italic; font-weight: 600;
  background: linear-gradient(120deg,var(--a),var(--a2) 55%,var(--a3));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pdp-meta {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  margin-bottom: 22px; padding-bottom: 22px;
  border-bottom: 1px solid var(--bd);
}
.pdp-stars-row { display: flex; gap: 2px; color: var(--a); }
.pdp-rev-count { font-size: 12px; color: var(--mu); }
.pdp-stock-badge {
  font-size: 10px; letter-spacing: .12em; text-transform: uppercase;
  padding: 6px 14px; border-radius: 30px; font-weight: 600;
  background: rgba(45,106,79,.08);
  border: 1px solid rgba(45,106,79,.22); color: var(--ok);
  display: inline-flex; align-items: center; gap: 7px;
}
.pdp-stock-badge::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: var(--ok); box-shadow: 0 0 0 3px rgba(45,106,79,.18);
}
.pdp-stock-badge.oos {
  background: rgba(176,52,52,.06);
  border-color: rgba(176,52,52,.2); color: #B03434;
}
.pdp-stock-badge.oos::before { background: #B03434; box-shadow: 0 0 0 3px rgba(176,52,52,.16); }

/* price */
.pdp-price-lbl {
  font-size: 10px; letter-spacing: .28em; text-transform: uppercase;
  color: var(--mu); margin-bottom: 6px; font-family: var(--sans);
}
.pdp-price {
  font-family: var(--sans); font-size: clamp(32px, 3.8vw, 44px); font-weight: 800;
  color: #111; letter-spacing: .01em; font-variant-numeric: tabular-nums;
  line-height: 1; margin-bottom: 22px;
  display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
}
/* struck-through original ("real") price next to the sale price */
.pdp-price-original {
  font-family: var(--serif); font-size: .5em; font-weight: 500;
  color: var(--fa); text-decoration: line-through; text-decoration-color: var(--a3);
}
.pdp-off-badge {
  font-family: var(--sans); font-size: 11px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; color: #fff;
  background: linear-gradient(135deg,var(--a),var(--a2));
  border-radius: 100px; padding: 6px 13px; align-self: center;
  box-shadow: 0 10px 22px -12px rgba(140,116,86,.7);
}
.pdp-label-badge {
  font-size: 10px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700;
  padding: 6px 14px; border-radius: 30px;
  background: var(--al); border: 1px solid var(--am); color: var(--a);
  display: inline-flex; align-items: center;
}

.pdp-divider {
  height: 1px;
  background: linear-gradient(90deg, var(--bd2), transparent);
  margin: 22px 0;
}

/* selector label */
.pdp-sel-lbl {
  font-size: 10px; font-weight: 700; letter-spacing: .22em;
  text-transform: uppercase; color: var(--mu);
  margin-bottom: 12px; font-family: var(--sans);
}

/* options — chip / pill group */
.pdp-opts { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
.pdp-opt {
  min-width: 50px; height: 44px; padding: 0 18px;
  border: 1px solid var(--bd2);
  border-radius: 30px;
  background: var(--w); font-size: 12.5px; font-weight: 500;
  color: var(--ink); cursor: pointer; font-family: var(--sans);
  display: flex; align-items: center; justify-content: center; gap: 7px;
  letter-spacing: .02em;
  transition: all .22s ease;
}
.pdp-opt:hover { border-color: var(--a2); color: var(--a); transform: translateY(-1px); box-shadow: 0 8px 20px -12px rgba(58,46,34,.4); }
.pdp-opt.on {
  background: linear-gradient(135deg,var(--a),var(--a2));
  border-color: transparent;
  color: #fff; font-weight: 600;
  box-shadow: 0 10px 24px -10px rgba(140,116,86,.6);
}
.pdp-opt.on span { opacity: .92; }

/* quantity */
.pdp-qty {
  display: flex; align-items: center;
  border: 1px solid var(--bd2);
  border-radius: 30px;
  width: fit-content; margin-bottom: 24px;
  background: var(--w); overflow: hidden;
}
.pdp-qty-btn {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  color: var(--a); transition: background .2s, color .2s;
}
.pdp-qty-btn:hover { background: var(--cr); color: var(--ink); }
.pdp-qty-num {
  width: 50px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--serif); font-size: 18px; font-weight: 600;
  color: var(--ink);
}

/* CTA */
.pdp-ctas { display: flex; gap: 12px; margin-bottom: 14px; }
.pdp-btn-primary {
  flex: 1; height: 56px; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center; gap: 11px;
  font-size: 11px; font-weight: 700; letter-spacing: .18em;
  text-transform: uppercase; color: #fff;
  background: linear-gradient(135deg,var(--a),#6F5A42);
  border: none;
  border-radius: 30px; cursor: pointer;
  transition: box-shadow .35s cubic-bezier(.22,1,.36,1), transform .28s cubic-bezier(.22,1,.36,1); font-family: var(--sans);
  box-shadow: 0 14px 32px -14px rgba(140,116,86,.7);
}
.pdp-btn-primary::after {
  content: ''; position: absolute; inset: 0; background: var(--ink);
  transform: scaleX(0); transform-origin: left;
  transition: transform .45s cubic-bezier(.22,1,.36,1);
}
.pdp-btn-primary > * { position: relative; z-index: 1; }
.pdp-btn-primary:hover:not(:disabled) {
  box-shadow: 0 18px 40px -12px rgba(58,46,34,.5);
  transform: translateY(-2px);
}
.pdp-btn-primary:hover:not(:disabled)::after { transform: scaleX(1); }
.pdp-btn-primary:disabled { opacity: .42; cursor: not-allowed; box-shadow: none; }
.pdp-btn-chat {
  width: 56px; height: 56px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--bd2);
  border-radius: 50%; background: var(--w);
  cursor: pointer; color: var(--a); transition: all .22s;
}
.pdp-btn-chat:hover { border-color: var(--a2); color: var(--ink); background: var(--cr); transform: translateY(-2px); }

.pdp-secondary { display: flex; gap: 12px; margin-bottom: 26px; }
.pdp-btn-sec {
  flex: 1; height: 46px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  font-size: 10px; font-weight: 600; letter-spacing: .14em;
  text-transform: uppercase; color: var(--mu);
  background: var(--w);
  border: 1px solid var(--bd2);
  border-radius: 30px; cursor: pointer; font-family: var(--sans);
  transition: all .22s;
}
.pdp-btn-sec:hover { border-color:transparent; color:#fff; background:linear-gradient(135deg,var(--a),#6F5A42); transform:translateY(-2px); box-shadow:0 14px 28px -14px rgba(58,46,34,.5); }
.pdp-btn-sec.on { border-color: var(--a2); color: var(--a); background: var(--al); }

/* trust */
.pdp-trust {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 14px;
  padding: 24px 0 0;
  border-top: 1px solid var(--bd);
}
.pdp-trust-item {
  text-align: center; padding: 16px 8px;
  background: var(--w); border: 1px solid var(--bd);
  border-radius: var(--rad-sm); transition: all .25s;
}
.pdp-trust-item:hover { border-color: var(--a3); box-shadow: var(--shadow); transform: translateY(-2px); }
.pdp-trust-icon {
  width: 42px; height: 42px; margin: 0 auto 10px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--am); border-radius: 50%;
  color: var(--a); background: var(--al);
}
.pdp-trust-lbl {
  font-size: 9px; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: var(--ink); font-family: var(--sans);
}
.pdp-trust-sub { font-size: 10px; color: var(--mu); margin-top: 3px; }

/* ════════════════════════════════════════════════════
   TABS SECTION (below hero)
════════════════════════════════════════════════════ */
.pdp-tabs-wrap {
  max-width: 1380px; margin: 0 auto;
  padding: 0 48px 88px;
}
@media(max-width:767px){ .pdp-tabs-wrap { padding: 0 16px 64px; } }

.pdp-tab-nav {
  display: inline-flex;
  margin-bottom: 44px;
  gap: 6px;
  padding: 6px;
  background: var(--w);
  border: 1px solid var(--bd);
  border-radius: 40px;
  box-shadow: var(--shadow);
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}
.pdp-tab-nav::-webkit-scrollbar { display: none; }
.pdp-tab-btn {
  padding: 12px 30px;
  font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
  font-weight: 600; color: var(--mu);
  background: transparent; border: none; cursor: pointer;
  border-radius: 30px; white-space: nowrap;
  transition: all .25s; font-family: var(--sans);
}
.pdp-tab-btn:hover { color: var(--ink); }
.pdp-tab-btn.on {
  color: #fff;
  background: linear-gradient(135deg,var(--a),var(--a2));
  box-shadow: 0 10px 24px -12px rgba(140,116,86,.7);
}
@media(max-width:767px){ .pdp-tab-btn { padding: 11px 20px; font-size: 10px; } }

/* ── Description tab ── */
.pdp-desc-body {
  font-size: 15px; font-weight: 400; line-height: 1.9;
  color: var(--mu); max-width: 760px;
  font-family: var(--sans);
}
.pdp-desc-body p { margin-bottom: 18px; }
.pdp-desc-body h2, .pdp-desc-body h3 {
  font-family: var(--serif); font-weight: 600;
  color: var(--ink); margin: 28px 0 14px;
}
.pdp-desc-body ul { padding-left: 22px; margin-bottom: 18px; }
.pdp-desc-body li { margin-bottom: 8px; }
.pdp-desc-body strong { color: var(--ink); font-weight: 600; }

/* specs grid */
.pdp-specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px; margin-top: 0;
}
.pdp-spec-card {
  padding: 28px;
  border: 1px solid var(--bd);
  border-radius: var(--rad); background: var(--w);
  box-shadow: var(--shadow);
  transition: all .28s;
}
.pdp-spec-card:hover {
  border-color: var(--a3);
  box-shadow: var(--shadow-lift); transform: translateY(-3px);
}
.pdp-spec-card-title {
  font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
  font-weight: 700; color: var(--ink);
  margin-bottom: 18px; display: flex; align-items: center; gap: 9px;
  font-family: var(--sans);
}
.pdp-spec-card-title svg { color: var(--a); }
.pdp-spec-row {
  display: flex; justify-content: space-between; align-items: center; gap: 14px;
  padding: 11px 0; border-bottom: 1px solid var(--bd);
}
.pdp-spec-row:last-child { border-bottom: none; padding-bottom: 0; }
.pdp-spec-key { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--mu); }
.pdp-spec-val { font-size: 13.5px; font-weight: 500; color: var(--ink); text-align: right; }

/* delivery rows */
.pdp-dlv-row {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 14px 0; border-bottom: 1px solid var(--bd);
}
.pdp-dlv-row:last-child { border-bottom: none; padding-bottom: 0; }
.pdp-dlv-icon {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--al); border: 1px solid var(--am);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--a);
}
.pdp-dlv-title { font-size: 13.5px; font-weight: 600; color: var(--ink); margin-bottom: 3px; }
.pdp-dlv-sub { font-size: 11.5px; color: var(--mu); line-height: 1.6; }

/* ════════════════════════════════════════════════════
   REVIEWS TAB
════════════════════════════════════════════════════ */
.pdp-rv-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 44px; align-items: start;
}
@media(max-width:1023px){ .pdp-rv-layout { grid-template-columns: 1fr; gap: 30px; } }

/* left: rating summary */
.pdp-rv-summary {
  position: sticky; top: 100px;
  background: var(--w);
  border: 1px solid var(--bd);
  border-radius: var(--rad); padding: 28px;
  box-shadow: var(--shadow);
}
@media(max-width:1023px){ .pdp-rv-summary { position: static; } }
.pdp-rv-big-num {
  font-family: var(--serif); font-size: 58px; font-weight: 600;
  color: var(--ink); line-height: 1; margin-bottom: 8px;
}
.pdp-rv-total { font-size: 11.5px; color: var(--mu); margin-top: 8px; }
.pdp-rv-bars { margin-top: 22px; display: flex; flex-direction: column; gap: 9px; }
.pdp-rv-bar-row { display: flex; align-items: center; gap: 10px; }
.pdp-rv-bar-lbl { font-size: 11px; color: var(--mu); min-width: 10px; }
.pdp-rv-bar-track {
  flex: 1; height: 7px; border-radius: 20px;
  background: var(--cr); overflow: hidden;
}
.pdp-rv-bar-fill { height: 100%; border-radius: 20px; background: linear-gradient(90deg,var(--a),var(--a2)); transition: width .8s; }
.pdp-rv-bar-ct { font-size: 11px; color: var(--fa); min-width: 18px; text-align: right; }

.pdp-rv-write-btn {
  width: 100%; height: 46px; margin-top: 24px;
  background: linear-gradient(135deg,var(--a),var(--a2)); color: #fff;
  border: none; border-radius: 30px;
  font-size: 10px; letter-spacing: .18em; text-transform: uppercase;
  font-weight: 700; cursor: pointer; transition: all .22s;
  font-family: var(--sans);
  box-shadow: 0 12px 28px -14px rgba(140,116,86,.7);
}
.pdp-rv-write-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 34px -12px rgba(140,116,86,.85); }

/* right: list */
.pdp-rv-right {}
.pdp-rv-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 22px; flex-wrap: wrap; gap: 12px;
}
.pdp-rv-count-txt { font-size: 12px; color: var(--mu); font-weight: 600; letter-spacing: .04em; }
.pdp-rv-sort-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--mu); }
.pdp-rv-sort-row select {
  background: var(--w);
  border: 1px solid var(--bd2); border-radius: 30px;
  padding: 9px 30px 9px 14px; font-size: 12px;
  font-family: var(--sans); color: var(--ink); cursor: pointer; outline: none;
  appearance: none;
  transition: border-color .2s, box-shadow .2s;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238C7456' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 11px center;
}
.pdp-rv-sort-row select:focus { border-color: var(--a2); box-shadow: 0 0 0 3px var(--al); }

/* customer photos strip */
.pdp-rv-photos { margin-bottom: 28px; }
.pdp-rv-photos-title {
  font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
  color: var(--mu); margin-bottom: 12px; display: flex; align-items: center; gap: 7px;
  font-family: var(--sans);
}
.pdp-rv-photos-title svg { color: var(--a); }
.pdp-rv-photos-row { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
.pdp-rv-photos-row::-webkit-scrollbar { display: none; }
.pdp-rv-photo {
  width: 72px; height: 72px; flex-shrink: 0; border-radius: var(--rad-sm);
  overflow: hidden; border: 1px solid var(--bd);
  cursor: zoom-in; transition: all .22s;
}
.pdp-rv-photo:hover { border-color: var(--a2); transform: scale(1.05); box-shadow: var(--shadow); }
.pdp-rv-photo img { width: 100%; height: 100%; object-fit: cover; }

/* review card */
.pdp-rv-list { display: flex; flex-direction: column; gap: 16px; }
.pdp-rv-card {
  background: var(--w);
  border: 1px solid var(--bd);
  border-radius: var(--rad); padding: 24px 26px;
  box-shadow: var(--shadow);
  transition: all .25s;
}
.pdp-rv-card:hover {
  border-color: var(--a3);
  box-shadow: var(--shadow-lift); transform: translateY(-2px);
}
.pdp-rv-card-top {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 14px; gap: 12px;
}
.pdp-rv-user { display: flex; align-items: center; gap: 13px; }
.pdp-rv-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: var(--al);
  border: 1px solid var(--am);
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 15px; color: var(--a);
  font-family: var(--serif);
  flex-shrink: 0; overflow: hidden;
}
.pdp-rv-name {
  font-size: 13.5px; font-weight: 600; color: var(--ink);
  display: flex; align-items: center; gap: 7px; margin-bottom: 3px;
}
.pdp-rv-verified {
  font-size: 9px; font-weight: 700; letter-spacing: .05em;
  color: var(--ok); background: rgba(45,106,79,.08);
  border: 1px solid rgba(45,106,79,.2);
  border-radius: 30px; padding: 3px 8px; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 3px;
}
.pdp-rv-date {
  font-size: 11px; color: var(--fa);
  display: flex; align-items: center; gap: 4px;
}
.pdp-rv-stars { display: flex; gap: 2px; color: var(--a); }

.pdp-rv-title { font-size: 14.5px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
.pdp-rv-body {
  font-size: 13.5px; line-height: 1.8; color: var(--mu);
  font-weight: 400; margin-bottom: 16px; font-family: var(--sans);
}
.pdp-rv-imgs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.pdp-rv-img {
  width: 72px; height: 72px; object-fit: cover; border-radius: var(--rad-sm);
  border: 1px solid var(--bd); cursor: zoom-in; transition: all .22s;
}
.pdp-rv-img:hover { border-color: var(--a2); transform: scale(1.06); box-shadow: var(--shadow); }

.pdp-rv-footer {
  display: flex; align-items: center; gap: 12px;
  padding-top: 14px; border-top: 1px solid var(--bd);
}
.pdp-rv-helpful-lbl { font-size: 11px; color: var(--fa); }
.pdp-rv-hlp-btn {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; padding: 6px 13px;
  border-radius: 30px; background: var(--w);
  border: 1px solid var(--bd2); color: var(--mu);
  cursor: pointer; transition: all .2s; font-family: var(--sans);
}
.pdp-rv-hlp-btn:hover { color: var(--a); border-color: var(--a2); background: var(--al); }
.pdp-rv-hlp-btn.on { color: var(--a); border-color: var(--a2); background: var(--al); }

/* review form */
.pdp-rv-form {
  background: var(--w);
  border: 1px solid var(--bd);
  border-radius: var(--rad); padding: 32px; margin-bottom: 32px;
  box-shadow: var(--shadow);
}
.pdp-rv-form-title {
  font-family: var(--serif); font-size: 24px; font-weight: 600;
  color: var(--ink); margin-bottom: 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.pdp-rv-form-close {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--mu);
  border: 1px solid var(--bd2); transition: all .2s;
}
.pdp-rv-form-close:hover { border-color: var(--a2); color: var(--a); transform: rotate(90deg); }
.pdp-rv-star-pick { display: flex; gap: 8px; margin-bottom: 22px; }
.pdp-rv-star-pick button {
  background: none; border: none; cursor: pointer; transition: transform .15s; padding: 0;
  color: var(--a);
}
.pdp-rv-star-pick button:hover { transform: scale(1.25); }
.pdp-rv-inp, .pdp-rv-ta {
  width: 100%; background: var(--iv);
  border: 1px solid var(--bd2); border-radius: var(--rad-sm);
  padding: 14px 18px; font-size: 13.5px; color: var(--ink);
  font-family: var(--sans); outline: none; transition: border-color .2s, box-shadow .2s;
  margin-bottom: 16px;
}
.pdp-rv-inp:focus, .pdp-rv-ta:focus { border-color: var(--a2); box-shadow: 0 0 0 3px var(--al); }
.pdp-rv-inp::placeholder, .pdp-rv-ta::placeholder { color: var(--fa); }
.pdp-rv-ta { resize: vertical; min-height: 110px; line-height: 1.6; }
.pdp-rv-upload-lbl {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 11px 20px; border-radius: 30px;
  border: 1px dashed var(--am); color: var(--a);
  font-size: 11px; text-transform: uppercase; letter-spacing: .12em; font-weight: 600;
  cursor: pointer; transition: all .2s; margin-bottom: 16px;
}
.pdp-rv-upload-lbl:hover { background: var(--al); border-color: var(--a2); }
.pdp-rv-prev { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
.pdp-rv-prev-item {
  position: relative; width: 64px; height: 64px; border-radius: var(--rad-sm);
  overflow: hidden; border: 1px solid var(--bd);
}
.pdp-rv-prev-item img { width: 100%; height: 100%; object-fit: cover; }
.pdp-rv-prev-rm {
  position: absolute; top: -5px; right: -5px;
  width: 18px; height: 18px; background: #B03434; color: #fff;
  border: 2px solid #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 7px;
}
.pdp-rv-submit {
  height: 48px; padding: 0 40px;
  background: linear-gradient(135deg,var(--a),var(--a2)); color: #fff;
  border: none; border-radius: 30px;
  font-size: 10px; font-weight: 700; letter-spacing: .18em;
  text-transform: uppercase; cursor: pointer; transition: all .22s;
  font-family: var(--sans);
  box-shadow: 0 12px 28px -14px rgba(140,116,86,.7);
}
.pdp-rv-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 34px -12px rgba(140,116,86,.85); }
.pdp-rv-submit:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }

/* empty */
.pdp-rv-empty {
  text-align: center; padding: 56px 32px;
  border: 1px dashed var(--bd2); border-radius: var(--rad);
  background: var(--w);
}
.pdp-rv-empty p { font-size: 14px; color: var(--mu); margin-bottom: 22px; }

/* lightbox */
.pdp-lightbox {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(58,46,34,.82); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; cursor: zoom-out;
}
.pdp-lightbox img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 10px; }
/* Embedded players (Drive/YouTube) need an explicit 16:9 stage. Direct video
   files size NATURALLY to their own ratio (portrait stays pillar-free). */
.pdp-lightbox iframe {
  width: min(90vw, 960px); aspect-ratio: 16 / 9;
  border: none; border-radius: 10px; background: #000;
  box-shadow: 0 30px 80px -20px rgba(0,0,0,.6);
}
.pdp-lightbox video {
  max-width: min(90vw, 640px); max-height: 86vh; width: auto; height: auto;
  border-radius: 10px; background: #000;
  box-shadow: 0 30px 80px -20px rgba(0,0,0,.6);
}
.pdp-lightbox-x {
  position: absolute; top: 28px; right: 28px; color: #fff; cursor: pointer;
  width: 46px; height: 46px; border-radius: 50%;
  background: rgba(255,255,255,.14); display: flex; align-items: center; justify-content: center;
  transition: background .2s; border: 1px solid rgba(255,255,255,.2);
}
.pdp-lightbox-x:hover { background: rgba(255,255,255,.26); }

/* ── Combined variant table (Metal + Diamond Carat) ── */
.pdp-vt-header {
  display: grid;
  grid-template-columns: 28px 1.3fr 1fr 1.2fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--bd2);
}
.pdp-vt-hcol {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--mu);
  font-family: var(--sans);
}
.pdp-vt-row {
  display: grid;
  grid-template-columns: 28px 1.3fr 1fr 1.2fr;
  gap: 12px;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--bd);
  cursor: pointer;
  transition: background .2s;
}
.pdp-vt-row:hover { background: var(--cr); }
.pdp-vt-row.on { background: var(--al); }
.pdp-vt-row.on .pdp-vt-check { border-color: var(--a); background: var(--a); }
.pdp-vt-check {
  width: 20px; height: 20px;
  border: 1.5px solid var(--bd2);
  border-radius: 4px;
  background: var(--w);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .2s;
  flex-shrink: 0;
}
.pdp-vt-check svg { color: #fff; width: 13px; height: 13px; }
.pdp-vt-material {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  font-family: var(--sans);
}
.pdp-vt-carat {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  font-family: var(--sans);
}
.pdp-vt-price {
  border: 1px solid var(--bd2);
  border-radius: 16px;
  padding: 14px 20px;
  background: var(--w);
  transition: border-color .2s, box-shadow .2s;
}
/* Variant amount — solid black, bold, clean sans with tabular numerals.
   Simple, sharp, premium (no more gold serif that reads "0" as "O"). */
.pdp-vt-amt-wrap { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.pdp-vt-amt {
  font-family: var(--sans);
  font-size: 21px;
  font-weight: 800;
  letter-spacing: .01em;
  color: #111;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.pdp-vt-was {
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--fa);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
  font-variant-numeric: tabular-nums;
}
.pdp-vt-row.on .pdp-vt-price {
  border-color: #111;
  box-shadow: 0 0 0 3px rgba(17,17,17,.08);
}
.pdp-vt-vcount {
  font-size: 11px;
  color: var(--mu);
  margin-bottom: 10px;
}
@media(max-width:640px){
  .pdp-vt-header, .pdp-vt-row {
    grid-template-columns: 24px 1fr;
    gap: 10px;
    padding: 12px 10px;
  }
  .pdp-vt-hcol:nth-child(3), .pdp-vt-hcol:nth-child(4) { display: none; }
  .pdp-vt-carat { grid-column: 2; font-size: 12px; color: var(--mu); margin-top: -4px; }
  .pdp-vt-price { grid-column: 2; margin-top: 4px; padding: 10px 12px; }
  .pdp-vt-amt { font-size: 16px; }
  .pdp-vt-check { width: 18px; height: 18px; }
}

/* reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pdp-root *, .pdp-root *::before, .pdp-root *::after {
    transition: none !important; animation: none !important;
  }
  .pdp-thumb:hover, .pdp-opt:hover, .pdp-btn-primary:hover:not(:disabled),
  .pdp-spec-card:hover, .pdp-rv-card:hover, .pdp-trust-item:hover { transform: none !important; }
}
`;

/* ── helpers ── */
function relDate(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  if (s < 2592000) return `${Math.floor(s / 604800)}w ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function isDisplayable(url: string) {
  // Single source of truth (lib/video): video of every kind (files, Drive,
  // YouTube, Vimeo) and 3D models are separate tabs, never gallery images.
  return isDisplayableImageUrl(url);
}

/* ── SafeImage ── */
function SafeImage({ src, alt, className, style, fallback, thumb = false }: {
  src: string; alt: string; className?: string;
  style?: React.CSSProperties; fallback: string; thumb?: boolean;
}) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    if (thumb) return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cr)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--a)' }}>
        {fallback}
      </div>
    );
    return (
      <div className="pdp-img-fallback">
        <div className="pdp-img-fallback-letter">{fallback}</div>
        <div className="pdp-img-fallback-txt">Image unavailable</div>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setErr(true)} />;
}

/* ── Stars renderer ── */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const full = i <= Math.floor(rating);
        const part = i === Math.ceil(rating) && !Number.isInteger(rating);
        const pct = part ? (rating % 1) * 100 : 0;
        return (
          <div key={i} style={{ position: 'relative', width: size, height: size }}>
            <Star size={size} fill="none" stroke="currentColor" strokeWidth={1.5} style={{ position: 'absolute', opacity: 0.2 }} />
            {full && <Star size={size} fill="currentColor" stroke="currentColor" strokeWidth={1.5} style={{ position: 'absolute' }} />}
            {part && <div style={{ position: 'absolute', overflow: 'hidden', width: `${pct}%` }}>
              <Star size={size} fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
            </div>}
          </div>
        );
      })}
    </div>
  );
}

/* ══ MAIN COMPONENT ══════════════════════════════════════════ */
// Breadcrumb style: first letter capital, rest small ("Bracelets", "Efgfeef").
const capCrumb = (s: any) => {
  const t = String(s || '').toLowerCase();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
};

export default function ProductDetails({ initialProduct, slug }: {
  initialProduct: Product | null; slug: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [diamondModel, setDiamondModel] = useState<string | null>(initialProduct?.model_3d || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialProduct?.video_url || null);
  const [selImg, setSelImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [isWished, setIsWished] = useState(false);
  const [selSize, setSelSize] = useState('');
  const [selMetal, setSelMetal] = useState(initialProduct?.metal || '');
  const [selCarat, setSelCarat] = useState(initialProduct?.carat?.toString() || '');
  const [selCustomOpts, setSelCustomOpts] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  // True once the shopper picks a variant themselves. Until then the PDP
  // quotes the first-variant default with a "Starting at" label — the bare
  // base price is never shown as the price for a variant product.
  const [userPickedVariant, setUserPickedVariant] = useState(false);

  // Tabs: 'description' | 'specs' | 'reviews'
  const [tab, setTab] = useState<'description' | 'specs' | 'reviews'>('description');

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingRv, setLoadingRv] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rvForm, setRvForm] = useState({ rating: 5, title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [rvImages, setRvImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [rvSort, setRvSort] = useState('recent');
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<string | null>(null);

  /* ── Side zoom-on-hover magnifier (desktop ≥1024px only) ── */
  const mainWrapRef = useRef<HTMLDivElement>(null);
  const [zoomActive, setZoomActive] = useState(false);
  // lens box (px, relative to main image) + magnified panel background position (%)
  const [zoom, setZoom] = useState({ lensX: 0, lensY: 0, lensW: 0, lensH: 0, bgX: 50, bgY: 50 });
  const ZOOM_FACTOR = 2.25; // ~225% zoom — background-size on the panel

  const handleZoomMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // desktop only
    if (typeof window !== 'undefined' && window.matchMedia('(max-width:1023px)').matches) return;
    const el = mainWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) { setZoomActive(false); return; }
    // lens size = viewport area / zoom factor
    const lensW = rect.width / ZOOM_FACTOR;
    const lensH = rect.height / ZOOM_FACTOR;
    // clamp lens fully inside image
    let lensX = x - lensW / 2;
    let lensY = y - lensH / 2;
    lensX = Math.max(0, Math.min(lensX, rect.width - lensW));
    lensY = Math.max(0, Math.min(lensY, rect.height - lensH));
    // background-position percentage for the magnified panel
    const bgX = (lensX / (rect.width - lensW)) * 100;
    const bgY = (lensY / (rect.height - lensH)) * 100;
    setZoom({
      lensX, lensY, lensW, lensH,
      bgX: isFinite(bgX) ? bgX : 50,
      bgY: isFinite(bgY) ? bgY : 50,
    });
  }, []);

  const handleZoomEnter = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width:1023px)').matches) return;
    setZoomActive(true);
  }, []);
  const handleZoomLeave = useCallback(() => setZoomActive(false), []);

  /* ── Style injection: use key-based <style> in JSX instead of module flag ── */
  // (styles injected via JSX <style> tag below — no module-level flag needed)

  /* ── Sync on slug change ── */
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      const imgs = Array.isArray(initialProduct.images) ? initialProduct.images : [];
      const vid = imgs.find(u => isVideoUrl(u)) || initialProduct.video_url || null;
      const mdl = imgs.find(u => /\.(glb|gltf)/i.test(u)) || initialProduct.model_3d || null;
      setVideoUrl(vid);
      setDiamondModel(mdl);
      // Warm up the viewer script + model file in the background so the
      // 3D tab opens instantly instead of downloading everything on click.
      if (mdl && !isUsdz(mdl)) { preloadModelViewer(); prefetchModel(mdl); }
      setSelImg(0);
      // Default to the first-variant configuration (admin default wins when
      // flagged) so the quoted price is always a real variant price.
      const dflt = defaultVariantSelection(initialProduct);
      setSelMetal(dflt.metal || initialProduct.metal || '');
      setSelSize(initialProduct.size_options?.find((s: any) => s.is_default)?.name || '');
      setSelCarat(dflt.carat || initialProduct.carat?.toString() || '');
      setUserPickedVariant(false);
    }
  }, [initialProduct]);

  useEffect(() => {
    fetchReviews();
    checkWishlist();
    if (!initialProduct) fetchProduct();
  }, [slug]);

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/products/${slug}`, { cache: 'no-store' });
      const d = await res.json();
      if (d) {
        setProduct(d);
        const m = d.model_3d;
        if (m) { setDiamondModel(m); if (!isUsdz(m)) { preloadModelViewer(); prefetchModel(m); } }
        if (d.video_url) setVideoUrl(d.video_url);
        const dflt = defaultVariantSelection(d);
        setSelMetal(dflt.metal || d.metal || '');
        setSelSize(d.size_options?.find((s: any) => s.is_default)?.name || '');
        setSelCarat(dflt.carat || d.carat?.toString() || '');
        setUserPickedVariant(false);
        addToRecentlyViewed(d);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchReviews() {
    const id = initialProduct?.id || product?.id;
    if (!id) return;
    setLoadingRv(true);
    try {
      const res = await fetch(`/api/reviews?product_id=${id}`);
      const d = await res.json();
      setReviews(Array.isArray(d) ? d : []);
    } catch (e) { console.error(e); }
    finally { setLoadingRv(false); }
  }

  async function checkWishlist() {
    const u = getUser();
    if (u && product) setIsWished(await isInWishlist(product.slug));
  }

  const handleWishlist = async () => {
    const u = getUser();
    if (!u) { router.push('/auth/signin'); return; }
    if (!product) return;
    if (isWished) {
      await removeFromWishlist(product.slug); setIsWished(false);
      toast({ title: 'Removed from wishlist' });
    } else {
      // Store the shopper-facing (variant-aware) price, not the bare base.
      await addToWishlist({ slug: product.slug, name: product.name, price: pdpSalePrice, image: product.image || product.images?.[0] });
      setIsWished(true); toast({ title: 'Added to wishlist' });
    }
  };

  const handleCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      // Charge the discounted price when the product is on sale.
      // Uses the EFFECTIVE variant (first-variant default until the shopper
      // picks their own) so the bag always matches the quoted price.
      await addToCart({ productId: product.id, slug: product.slug || slug, productName: product.name, price: pdpSalePrice, quantity: qty, size: selSize, metal: effMetal, carat: effCarat, image: product.image || product.images?.[0] });
      toast({ title: 'Added to cart', description: `${product.name} added to your bag.` });
    } catch { toast({ variant: 'destructive', title: 'Failed to add' }); }
    finally { setAdding(false); }
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) fd.append('files', files[i]);
    const u = getUser();
    if (u) fd.append('user_id', u.id);
    try {
      const res = await fetch('/api/reviews/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.urls) setRvImages(p => [...p, ...d.urls]);
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const submitReview = async () => {
    const u = getUser();
    if (!u) { router.push('/auth/signin'); return; }
    if (!product) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, user_id: u.id, rating: rvForm.rating, title: rvForm.title, content: rvForm.content, images: rvImages }),
      });
      if (res.ok) {
        toast({ title: 'Review submitted!' });
        setRvForm({ rating: 5, title: '', content: '' });
        setRvImages([]); setShowForm(false);
        fetchReviews();
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to submit' }); }
    finally { setSubmitting(false); }
  };

  /* computed */
  if (!product) return (
    <div className="pdp-root">
      <style>{PDP_CSS}</style>
      <HeaderMegaMenu />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--a)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20 }}>
        Crafting excellence…
      </div>
    </div>
  );

  const allImgs = (Array.isArray(product.images) ? product.images : product.image ? [product.image] : []).filter(isDisplayable);
  // ── Variant model (shared by the price block + the variant table) ──
  // A variant product is NEVER priced at the bare base: the effective
  // selection always resolves to a real row (first-variant default), so the
  // quoted price is a genuine configured price from load to checkout.
  const pdpMetals: any[] = Array.isArray(product.metal_options) ? product.metal_options : [];
  const pdpCarats: any[] = Array.isArray(product.carat_options) ? product.carat_options : [];
  const pdpHasBoth = pdpMetals.length > 0 && pdpCarats.length > 0;
  const pdpHasOnlyMetal = pdpMetals.length > 0 && pdpCarats.length === 0;
  const pdpHasOnlyCarat = pdpMetals.length === 0 && pdpCarats.length > 0;
  const pdpHasVariants = pdpHasBoth || pdpHasOnlyMetal || pdpHasOnlyCarat;
  // Per-variant (metal x carat) price overrides, keyed by option keys (migration 116).
  // When a row has its own rate it wins; otherwise metal+carat shared sum applies.
  const variantMap: Record<string, number> = {};
  (Array.isArray(product.variant_prices) ? product.variant_prices : []).forEach((v: any) => {
    if (v && v.metal_key && v.carat_key) variantMap[v.metal_key + '__' + v.carat_key] = Number(v.price_modifier) || 0;
  });
  const variantUpFor = (m: any, c: any): number | null => {
    if (!m || !c || !m.key || !c.key) return null;
    const k = m.key + '__' + c.key;
    return Object.prototype.hasOwnProperty.call(variantMap, k) ? variantMap[k] : null;
  };
  // Offered rows: saved per-row variants win (exact admin ticks);
  // otherwise the full metals x carats cross (legacy/shared model).
  const pdpVariantRows: Array<{ metal: any; carat: any; totalUp: number; combinedKey: string }> = (() => {
    if (!pdpHasBoth) return [];
    const savedVariants: any[] = Array.isArray(product.variant_prices) ? product.variant_prices : [];
    if (savedVariants.length > 0) {
      const metalByKey: Record<string, any> = {};
      pdpMetals.forEach(m => { if (m && m.key) metalByKey[m.key] = m; });
      const caratByKey: Record<string, any> = {};
      pdpCarats.forEach(c => { if (c && c.key) caratByKey[c.key] = c; });
      const out: Array<{ metal: any; carat: any; totalUp: number; combinedKey: string }> = [];
      savedVariants.forEach(v => {
        const m = metalByKey[v.metal_key];
        const c = caratByKey[v.carat_key];
        if (!m || !c) return;
        out.push({
          metal: m,
          carat: c,
          totalUp: Number(v.price_modifier) || 0,
          combinedKey: `${optionDisplayName(m, 'metal')}__${optionDisplayName(c, 'carat')}`
        });
      });
      return out;
    }
    const out: Array<{ metal: any; carat: any; totalUp: number; combinedKey: string }> = [];
    pdpMetals.forEach(m => {
      pdpCarats.forEach(c => {
        const vUp = variantUpFor(m, c);
        out.push({
          metal: m,
          carat: c,
          totalUp: vUp != null ? vUp : (Number(m.price_modifier) || 0) + (Number(c.price_modifier) || 0),
          combinedKey: `${optionDisplayName(m, 'metal')}__${optionDisplayName(c, 'carat')}`
        });
      });
    });
    return out;
  })();
  // Effective selection: the shopper's pick when it matches a real row,
  // otherwise the first-variant default (never the bare base).
  const pdpDefaultSel = defaultVariantSelection(product);
  const pdpEffRow = pdpHasBoth
    ? (pdpVariantRows.find(r => optionDisplayName(r.metal, 'metal') === selMetal && optionDisplayName(r.carat, 'carat') === selCarat)
      ?? pdpVariantRows.find(r => optionDisplayName(r.metal, 'metal') === pdpDefaultSel.metal && optionDisplayName(r.carat, 'carat') === pdpDefaultSel.carat)
      ?? pdpVariantRows[0] ?? null)
    : null;
  const effMetal = pdpHasBoth
    ? (pdpEffRow ? optionDisplayName(pdpEffRow.metal, 'metal') : selMetal)
    : (pdpHasOnlyMetal
      ? (pdpMetals.some(m => optionDisplayName(m, 'metal') === selMetal) ? selMetal : pdpDefaultSel.metal)
      : selMetal);
  const effCarat = pdpHasBoth
    ? (pdpEffRow ? optionDisplayName(pdpEffRow.carat, 'carat') : selCarat)
    : (pdpHasOnlyCarat
      ? (pdpCarats.some(c => optionDisplayName(c, 'carat') === selCarat) ? selCarat : pdpDefaultSel.carat)
      : selCarat);
  const metalUp = product.metal_options?.find((m: any) => optionDisplayName(m, 'metal') === effMetal)?.price_modifier || 0;
  const sizeUp = product.size_options?.find((s: any) => s.name === selSize)?.price_modifier || 0;
  const caratUp = product.carat_options?.find((c: any) => optionDisplayName(c, 'carat') === effCarat)?.price_modifier || 0;
  const customUp = Object.entries(selCustomOpts).reduce((sum, [secTitle, choiceName]) => {
    const sec = product.custom_options?.find((s: any) => s.title === secTitle);
    const item = sec?.items?.find((i: any) => i.name === choiceName);
    return sum + (Number(item?.price_modifier) || 0);
  }, 0);
  const selVariantUp = variantUpFor(
    product.metal_options?.find((m: any) => optionDisplayName(m, 'metal') === effMetal),
    product.carat_options?.find((c: any) => optionDisplayName(c, 'carat') === effCarat)
  );
  const curPrice = product.price + (selVariantUp != null ? selVariantUp : metalUp + caratUp) + sizeUp + customUp;
  const pdpDiscount = normalizeDiscount(product.discount_percent);
  const pdpSalePrice = salePrice(curPrice, pdpDiscount);
  const totalCurPrice = Math.round(curPrice * Math.max(1, qty) * 100) / 100;
  const totalSalePrice = Math.round(pdpSalePrice * Math.max(1, qty) * 100) / 100;
  const initial = (product.name || 'J')[0].toUpperCase();

  const rvArr = Array.isArray(reviews) ? reviews : [];
  const rvCounts = [0, 0, 0, 0, 0];
  rvArr.forEach(r => { rvCounts[Math.min(4, Math.max(0, Math.round(r.rating) - 1))]++; });
  const rvTotal = rvArr.length;
  const avgRating = rvTotal > 0 ? rvArr.reduce((s, r) => s + r.rating, 0) / rvTotal : (product.rating || 0);

  const custPhotos = rvArr.flatMap(r => (r.images || []).map(img => ({ img, id: r.id }))).slice(0, 12);

  const sortedRv = [...rvArr].sort((a, b) => {
    if (rvSort === 'helpful') return (b.helpful_count || 0) - (a.helpful_count || 0);
    if (rvSort === 'highest') return b.rating - a.rating;
    if (rvSort === 'lowest') return a.rating - b.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // side-zoom source: the active main image
  const zoomSrc = allImgs[selImg] || '';
  // Drive / YouTube / Vimeo play inside OUR dialog via embed — never a Drive redirect
  const videoEmbed = videoUrl ? videoEmbedUrl(videoUrl) : null;
  // panel shows side-zoom only for real images (not 3D / video) and when there is a source
  const canSideZoom = selImg >= 0 && !!zoomSrc;
  const panelActive = zoomActive && canSideZoom && !lightbox;

  return (
    <div className="pdp-root">
      {/* Inject styles via JSX — always fresh on re-render, no stale flag */}
      <style dangerouslySetInnerHTML={{ __html: PDP_CSS }} />
      <HeaderMegaMenu />

      {/* Breadcrumb — first letter capital, rest small */}
      <nav className="pdp-bc">
        <Link href="/">Home</Link>
        <span className="pdp-bc-sep">/</span>
        <Link href="/collection">Collections</Link>
        {product.categoryHierarchy?.map(cat => (
          <React.Fragment key={cat}>
            <span className="pdp-bc-sep">/</span>
            <Link href={`/collection?category=${encodeURIComponent(cat)}`}>{capCrumb(cat)}</Link>
          </React.Fragment>
        ))}
        <span className="pdp-bc-sep">/</span>
        <span className="pdp-bc-cur">{capCrumb(product.name)}</span>
      </nav>

      {/* ── Hero ── */}
      <main className="pdp-hero">
        {/* Gallery + side-zoom panel shell */}
        <div className={`pdp-gallery-shell ${panelActive ? 'zoom-active' : ''}`}>
          {/* Gallery */}
          <section className="pdp-gallery">
            {/* Thumbnails */}
            <div className="pdp-thumbs">
              {allImgs.map((img, i) => (
                <div key={i} className={`pdp-thumb ${selImg === i ? 'on' : ''}`} onClick={() => setSelImg(i)} style={{ position: 'relative' }}>
                  <SafeImage src={img} alt={`${product.name} ${i + 1}`} fallback={initial} thumb />
                </div>
              ))}
              {videoUrl && (
                <div className={`pdp-thumb ${selImg === -2 ? 'on' : ''}`} onClick={() => setSelImg(-2)} style={{ position: 'relative' }}>
                  <div className="pdp-thumb-overlay"><Play size={16} fill="var(--a)" color="var(--a)" /></div>
                  <SafeImage src={allImgs[0] || ''} alt="Video" fallback={initial} thumb style={{ opacity: 0.35 }} />
                </div>
              )}
              {diamondModel && (
                <div className={`pdp-thumb ${selImg === -1 ? 'on' : ''}`} onClick={() => setSelImg(-1)} style={{ position: 'relative' }}>
                  <div className="pdp-thumb-overlay" style={{ fontSize: 10, fontWeight: 700, color: 'var(--a)' }}>3D</div>
                  <SafeImage src={allImgs[0] || ''} alt="3D" fallback={initial} thumb style={{ opacity: 0.35 }} />
                </div>
              )}
            </div>

            {/* Main image */}
            <div
              ref={mainWrapRef}
              className={`pdp-main-wrap ${panelActive ? 'zooming' : ''}`}
              onMouseEnter={canSideZoom ? handleZoomEnter : undefined}
              onMouseMove={canSideZoom ? handleZoomMove : undefined}
              onMouseLeave={handleZoomLeave}
            >
              {selImg === -1 ? (
                <ModelViewer3D src={diamondModel || ''} poster={allImgs[0]} fill />
              ) : selImg === -2 ? (
                videoEmbed ? (
                  <iframe src={videoEmbed} title={`${product.name} video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 'none' }} />
                ) : (
                  <video src={videoUrl || ''} controls autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )
              ) : (
                <SafeImage src={allImgs[selImg] || ''} alt={product.name} fallback={initial} />
              )}
              {/* media type tag */}
              {selImg === -2 && <div className="pdp-media-tag"><Play size={9} /> Video</div>}
              {selImg === -1 && <div className="pdp-media-tag">3D View</div>}
              {/* side-zoom lens / region indicator (desktop only via CSS) */}
              {panelActive && (
                <div
                  className="pdp-zoom-lens"
                  style={{ left: zoom.lensX, top: zoom.lensY, width: zoom.lensW, height: zoom.lensH }}
                />
              )}
              {/* Nav arrows — pausing the lens on hover so it never swallows clicks */}
              {allImgs.length > 1 && selImg >= 0 && (
                <>
                  <button className="pdp-gal-nav prev" onClick={() => setSelImg(Math.max(0, selImg - 1))} onMouseEnter={handleZoomLeave} aria-label="Previous image">
                    <ChevronLeft size={16} />
                  </button>
                  <button className="pdp-gal-nav next" onClick={() => setSelImg(Math.min(allImgs.length - 1, selImg + 1))} onMouseEnter={handleZoomLeave} aria-label="Next image">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
              <div className="pdp-zoom-btn" role="button" tabIndex={0} aria-label="Open fullscreen view" onClick={() => allImgs[selImg] && setLightbox(allImgs[selImg])} onMouseEnter={handleZoomLeave} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); allImgs[selImg] && setLightbox(allImgs[selImg]); } }}>
                <ZoomIn size={16} />
              </div>
            </div>
          </section>

          {/* Side magnified preview panel (desktop ≥1024px only, shown while hovering) */}
          <div
            className="pdp-zoom-panel"
            aria-hidden="true"
            style={{
              backgroundImage: panelActive ? `url("${zoomSrc}")` : 'none',
              backgroundSize: `${ZOOM_FACTOR * 100}% ${ZOOM_FACTOR * 100}%`,
              backgroundPosition: `${zoom.bgX}% ${zoom.bgY}%`,
            }}
          />
        </div>

        {/* Info panel */}
        <section className="pdp-info">
          <div className="pdp-eyebrow">
            <div className="pdp-eyebrow-line" />
            <div className="pdp-eyebrow-txt">{product.category} Collection</div>
          </div>

          <h1 className="pdp-title">
            {product.name}
          </h1>

          <div className="pdp-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="pdp-stars-row"><Stars rating={avgRating} /></div>
              <span className="pdp-rev-count">({rvTotal} review{rvTotal !== 1 ? 's' : ''})</span>
            </div>
            <div className={`pdp-stock-badge ${(product.stock_quantity || 0) > 0 ? '' : 'oos'}`}>
              {(product.stock_quantity || 0) > 0 ? 'In Stock' : 'Out of Stock'}
            </div>
            {product.label ? <span className="pdp-label-badge">{product.label}</span> : null}
          </div>

          <div className="pdp-price-lbl">{pdpHasVariants && !userPickedVariant ? 'Starting at' : 'Price'}{qty > 1 ? ` · Qty ${qty}` : ''}</div>
          {pdpDiscount > 0 ? (
            <div className="pdp-price">
              <Price value={totalSalePrice} />
              <span className="pdp-price-original"><Price value={totalCurPrice} /></span>
              <span className="pdp-off-badge">{pdpDiscount}% Off</span>
            </div>
          ) : (
            <div className="pdp-price"><Price value={totalCurPrice} /></div>
          )}

          <div className="pdp-divider" />

          {/* ── Metal + Diamond Weight: unified combined table ── */}
          {((product.metal_options && product.metal_options.length > 0) || (product.carat_options && product.carat_options.length > 0)) && (
            <div style={{ marginBottom: 20 }}>
              {(() => {
                // Rows + flags are hoisted above (shared with the price block)
                // so the table and the quoted price can never disagree.
                const rows = pdpVariantRows;
                const hasBoth = pdpHasBoth;
                const hasOnlyMetal = pdpHasOnlyMetal;
                const hasOnlyCarat = pdpHasOnlyCarat;

                // Only show combined table when BOTH metal and carat options exist
                if (hasBoth) {
                  return (
                    <>
                      <div className="pdp-sel-lbl">Select Variant</div>
                      {rows.length > 9 && (
                        <div className="pdp-vt-vcount">{rows.length} variants</div>
                      )}
                      <div style={{
                        border: '1px solid var(--bd)',
                        borderRadius: 'var(--rad)',
                        background: 'var(--w)',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow)'
                      }}>
                        <div className="pdp-vt-header">
                          <div className="pdp-vt-hcol" />
                          <div className="pdp-vt-hcol">Material</div>
                          <div className="pdp-vt-hcol">Total Diamond Weight</div>
                          <div className="pdp-vt-hcol">Price</div>
                        </div>
                        {rows.map(row => {
                          const rowMetal = optionDisplayName(row.metal, 'metal');
                          const rowCarat = optionDisplayName(row.carat, 'carat');
                          const isOn = selMetal === rowMetal && selCarat === rowCarat;
                          // Include EVERY modifier that the main price uses: base + metal + carat + size + custom
                          const rowSizeUp = product.size_options?.find((s: any) => s.name === selSize)?.price_modifier || 0;
                          const rowCustomUp = Object.entries(selCustomOpts).reduce((sum, [secTitle, choiceName]) => {
                            const sec = product.custom_options?.find((s: any) => s.title === secTitle);
                            const item = sec?.items?.find((i: any) => i.name === choiceName);
                            return sum + (Number(item?.price_modifier) || 0);
                          }, 0);
                          const rowPrice = (Number(product.price) || 0) + row.totalUp + Number(rowSizeUp) + rowCustomUp;
                          const d = normalizeDiscount(product.discount_percent);
                          const displayPrice = d > 0 ? salePrice(rowPrice, d) : rowPrice;
                          return (
                            <div
                              key={row.combinedKey}
                              className={`pdp-vt-row ${isOn ? 'on' : ''}`}
                              onClick={() => {
                                // Single-select: one variant is always active so the
                                // quoted price never falls back to the bare base.
                                setSelMetal(rowMetal);
                                setSelCarat(rowCarat);
                                setUserPickedVariant(true);
                              }}
                            >
                              <div className="pdp-vt-check">
                                {isOn && <Check size={13} />}
                              </div>
                              <div className="pdp-vt-material">{rowMetal}</div>
                              <div className="pdp-vt-carat">{rowCarat}</div>
                              <div className="pdp-vt-price">
                                {d > 0 ? (
                                  <span className="pdp-vt-amt-wrap">
                                    <Price value={displayPrice} className="pdp-vt-amt" />
                                    <span className="pdp-vt-was">
                                      <Price value={rowPrice} />
                                    </span>
                                  </span>
                                ) : (
                                  <Price value={displayPrice} className="pdp-vt-amt" />
                                )}

                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                }

                // Only metal options, no carats → chip fallback
                if (hasOnlyMetal) {
                  return (
                    <div>
                      <div className="pdp-sel-lbl">Select Metal</div>
                      <div className="pdp-opts">
                        {pdpMetals.map((m: any) => {
                          const label = optionDisplayName(m, 'metal');
                          return (
                            <button key={label} className={`pdp-opt ${selMetal === label ? 'on' : ''}`} onClick={() => { setSelMetal(label); setUserPickedVariant(true); }}>
                              {label}
                              {Number(m.price_modifier) > 0 && <span style={{ fontSize: 11, opacity: 0.8 }}>+<Price value={m.price_modifier} /></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Only carat options, no metals → chip fallback
                if (hasOnlyCarat) {
                  return (
                    <div>
                      <div className="pdp-sel-lbl">Diamond Weight</div>
                      <div className="pdp-opts">
                        {pdpCarats.map((c: any) => {
                          const label = optionDisplayName(c, 'carat');
                          return (
                            <button key={label} className={`pdp-opt ${selCarat === label ? 'on' : ''}`} onClick={() => { setSelCarat(label); setUserPickedVariant(true); }}>
                              {label}
                              {Number(c.price_modifier) > 0 && <span style={{ fontSize: 11, opacity: 0.8 }}>+<Price value={c.price_modifier} /></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          )}

          {/* Size options */}
          {product.size_options && product.size_options.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="pdp-sel-lbl">Select Size (US)</div>
              <div className="pdp-opts">
                {product.size_options.map((s: any) => (
                  <button key={s.name} className={`pdp-opt ${selSize === s.name ? 'on' : ''}`} onClick={() => setSelSize(selSize === s.name ? '' : s.name)}>
                    {s.name}
                    {Number(s.price_modifier) > 0 && <span style={{ fontSize: 11, opacity: 0.8 }}>+<Price value={s.price_modifier} /></span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Custom Option Sections added by admin */}
          {product.custom_options && Array.isArray(product.custom_options) && product.custom_options.map((sec: any) => (
            <div key={sec.title} style={{ marginBottom: 20 }}>
              <div className="pdp-sel-lbl">Select {sec.title}</div>
              <div className="pdp-opts">
                {Array.isArray(sec.items) && sec.items.map((item: any) => {
                  const isSelected = selCustomOpts[sec.title] === item.name;
                  return (
                    <button
                      key={item.name}
                      className={`pdp-opt ${isSelected ? 'on' : ''}`}
                      onClick={() => setSelCustomOpts(prev => ({
                        ...prev,
                        [sec.title]: isSelected ? '' : item.name
                      }))}
                    >
                      {item.name}
                      {item.price_modifier > 0 && <span style={{ fontSize: 11, opacity: 0.8 }}>+<Price value={item.price_modifier} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="pdp-sel-lbl">Quantity</div>
          <div className="pdp-qty">
            <button className="pdp-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}><ChevronLeft size={15} /></button>
            <div className="pdp-qty-num">{qty}</div>
            <button className="pdp-qty-btn" onClick={() => setQty(qty + 1)}><ChevronRight size={15} /></button>
          </div>

          {/* CTA */}
          <div className="pdp-ctas">
            <button className="pdp-btn-primary" disabled={adding || (product.stock_quantity || 0) <= 0} onClick={handleCart}>
              <ShoppingBag size={17} />
              <span>{adding ? 'Adding…' : 'Add to Shopping Bag'}</span>
            </button>
            <button className="pdp-btn-chat" aria-label="Chat with our concierge"
              onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}>
              <MessageCircle size={19} />
            </button>
          </div>

          {/* Custom order */}
          <button
            className="pdp-btn-sec"
            style={{ width: '100%', marginBottom: 12 }}
            onClick={() => router.push(`/custom-order?product=${encodeURIComponent(product.slug)}`)}
          >
            <Sparkles size={15} />
            <span>Create Custom Order</span>
          </button>

          {/* Secondary */}
          <div className="pdp-secondary">
            <button className={`pdp-btn-sec ${isWished ? 'on' : ''}`} onClick={handleWishlist}>
              <Heart size={15} fill={isWished ? 'currentColor' : 'none'} />
              <span>{isWished ? 'Wishlisted' : 'Wishlist'}</span>
            </button>
            <button className="pdp-btn-sec" onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}>
              <Share2 size={15} />
              <span>Share</span>
            </button>
          </div>

          {/* Trust */}
          <div className="pdp-trust">
            {[
              { icon: <Shield size={17} />, lbl: 'Authentic', sub: 'GIA Certified' },
              { icon: <Truck size={17} />, lbl: 'Free Shipping', sub: 'Worldwide' },
              { icon: <RotateCcw size={17} />, lbl: '30-Day Returns', sub: 'Hassle-free' },
            ].map(t => (
              <div key={t.lbl} className="pdp-trust-item">
                <div className="pdp-trust-icon">{t.icon}</div>
                <div className="pdp-trust-lbl">{t.lbl}</div>
                <div className="pdp-trust-sub">{t.sub}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── TABS ── */}
      <div className="pdp-tabs-wrap">
        <div className="pdp-tab-nav">
          {(['description', 'specs', 'reviews'] as const).map(t => (
            <button key={t} className={`pdp-tab-btn ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
              {t === 'description' ? 'Description' : t === 'specs' ? 'Specifications' : `Reviews (${rvTotal})`}
            </button>
          ))}
        </div>

        {/* Description */}
        {tab === 'description' && (
          <div className="pdp-desc-body" dangerouslySetInnerHTML={{ __html: product.description || '<p>Handcrafted with precision and passion, this piece embodies timeless elegance.</p>' }} />
        )}

        {/* Specs */}
        {tab === 'specs' && (
          <div className="pdp-specs-grid">
            {/* Product details */}
            <div className="pdp-spec-card">
              <div className="pdp-spec-card-title"><Award size={14} /> Product Details</div>
              {[
                ['SKU', product.sku || product.id.slice(0, 8)],
                ['Metal', selMetal || product.metal],
                ['Style', product.style],
                ['Category', product.category],
                ...(product.tags?.length ? [['Tags', product.tags.join(', ')]] : []),
              ].map(([k, v]) => v ? (
                <div key={k} className="pdp-spec-row">
                  <span className="pdp-spec-key">{k}</span>
                  <span className="pdp-spec-val">{v}</span>
                </div>
              ) : null)}
            </div>

            {/* Diamond specs if applicable */}
            {product.diamond_shape && (
              <div className="pdp-spec-card">
                <div className="pdp-spec-card-title"><Star size={14} /> Diamond Specifications</div>
                {[
                  ['Shape', product.diamond_shape],
                  ['Carat', selCarat || (product.details?.carat ? `${product.details.carat} ct` : null)],
                  ['Color', product.details?.color],
                  ['Clarity', product.details?.clarity],
                ].map(([k, v]) => v ? (
                  <div key={k} className="pdp-spec-row">
                    <span className="pdp-spec-key">{k}</span>
                    <span className="pdp-spec-val">{v}</span>
                  </div>
                ) : null)}
              </div>
            )}

            {/* Custom Admin Spec Sections */}
            {product.custom_options && Array.isArray(product.custom_options) && product.custom_options.map((sec: any) => (
              <div key={sec.title} className="pdp-spec-card">
                <div className="pdp-spec-card-title"><Sparkles size={14} /> {sec.title}</div>
                {Array.isArray(sec.items) && sec.items.map((item: any) => (
                  <div key={item.key || item.name} className="pdp-spec-row">
                    <span className="pdp-spec-key">{item.name}</span>
                    <span className="pdp-spec-val">
                      {item.price_modifier > 0 ? `+ $${item.price_modifier.toFixed(2)}` : 'Included'}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Delivery */}
            <div className="pdp-spec-card">
              <div className="pdp-spec-card-title"><Package size={14} /> Delivery & Returns</div>
              {[
                { icon: <Clock size={13} />, title: 'Custom Made — 2–3 Weeks', sub: 'Handcrafted to order by our master artisans' },
                { icon: <Truck size={13} />, title: 'Free Insured Shipping', sub: 'Worldwide delivery with full insurance coverage' },
                { icon: <RotateCcw size={13} />, title: '30-Day Hassle-Free Returns', sub: 'Full refund if you\'re not completely satisfied' },
              ].map(d => (
                <div key={d.title} className="pdp-dlv-row">
                  <div className="pdp-dlv-icon">{d.icon}</div>
                  <div>
                    <div className="pdp-dlv-title">{d.title}</div>
                    <div className="pdp-dlv-sub">{d.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {tab === 'reviews' && (
          <div className="pdp-rv-layout">
            {/* Left: summary */}
            <div className="pdp-rv-summary">
              <div className="pdp-rv-big-num">{avgRating.toFixed(1)}</div>
              <div className="pdp-stars-row"><Stars rating={avgRating} size={16} /></div>
              <div className="pdp-rv-total">{rvTotal} review{rvTotal !== 1 ? 's' : ''}</div>
              <div className="pdp-rv-bars">
                {[5, 4, 3, 2, 1].map(s => {
                  const ct = rvCounts[s - 1];
                  const pct = rvTotal > 0 ? (ct / rvTotal) * 100 : 0;
                  return (
                    <div key={s} className="pdp-rv-bar-row">
                      <span className="pdp-rv-bar-lbl">{s}</span>
                      <div className="pdp-rv-bar-track">
                        <div className="pdp-rv-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="pdp-rv-bar-ct">{ct}</span>
                    </div>
                  );
                })}
              </div>
              <button className="pdp-rv-write-btn" onClick={() => setShowForm(v => !v)}>
                Write a Review
              </button>
            </div>

            {/* Right: reviews */}
            <div className="pdp-rv-right">
              {/* Customer photos */}
              {custPhotos.length > 0 && (
                <div className="pdp-rv-photos">
                  <div className="pdp-rv-photos-title"><Camera size={11} /> Customer Photos ({custPhotos.length})</div>
                  <div className="pdp-rv-photos-row">
                    {custPhotos.map((p, i) => (
                      <div key={i} className="pdp-rv-photo">
                        <img src={p.img} alt="" onClick={() => setLightbox(p.img)} onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review form */}
              {showForm && (
                <div className="pdp-rv-form">
                  <div className="pdp-rv-form-title">
                    Share Your Experience
                    <div className="pdp-rv-form-close" onClick={() => setShowForm(false)}><CloseIcon size={15} /></div>
                  </div>
                  <div className="pdp-rv-star-pick">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button key={i} onClick={() => setRvForm(f => ({ ...f, rating: i }))}>
                        <Star size={22} fill={i <= rvForm.rating ? 'var(--a)' : 'none'} stroke="var(--a)" strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                  <input className="pdp-rv-inp" placeholder="Review title (e.g. Stunning Craftsmanship)" value={rvForm.title} onChange={e => setRvForm(f => ({ ...f, title: e.target.value }))} />
                  <textarea className="pdp-rv-ta" rows={5} placeholder="Tell us about your experience with this piece…" value={rvForm.content} onChange={e => setRvForm(f => ({ ...f, content: e.target.value }))} />
                  <div>
                    <input type="file" id="rv-img" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImgUpload} />
                    <label htmlFor="rv-img" className="pdp-rv-upload-lbl">
                      <Upload size={13} /> {uploading ? 'Uploading…' : 'Attach Photos'}
                    </label>
                  </div>
                  {rvImages.length > 0 && (
                    <div className="pdp-rv-prev">
                      {rvImages.map((img, i) => (
                        <div key={i} className="pdp-rv-prev-item">
                          <img src={img} alt="" />
                          <div className="pdp-rv-prev-rm" onClick={() => setRvImages(p => p.filter((_, j) => j !== i))}><CloseIcon size={7} /></div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="pdp-rv-submit" disabled={submitting || !rvForm.content.trim()} onClick={submitReview}>
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </div>
              )}

              {/* Toolbar */}
              {sortedRv.length > 0 && (
                <div className="pdp-rv-toolbar">
                  <span className="pdp-rv-count-txt">{sortedRv.length} review{sortedRv.length !== 1 ? 's' : ''}</span>
                  <div className="pdp-rv-sort-row">
                    <Filter size={11} />
                    <span>Sort:</span>
                    <select value={rvSort} onChange={e => setRvSort(e.target.value)}>
                      <option value="recent">Most Recent</option>
                      <option value="helpful">Most Helpful</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                    </select>
                  </div>
                </div>
              )}

              {/* List */}
              {loadingRv ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--fa)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>Loading reviews…</div>
              ) : sortedRv.length > 0 ? (
                <div className="pdp-rv-list">
                  {sortedRv.map(r => (
                    <div key={r.id} className="pdp-rv-card">
                      <div className="pdp-rv-card-top">
                        <div className="pdp-rv-user">
                          <div className="pdp-rv-avatar">{r.users?.full_name?.charAt(0) || 'C'}</div>
                          <div>
                            <div className="pdp-rv-name">
                              {r.users?.full_name || 'Verified Customer'}
                              {r.verified_purchase !== false && (
                                <span className="pdp-rv-verified"><BadgeCheck size={8} /> Verified</span>
                              )}
                            </div>
                            <div className="pdp-rv-date"><Calendar size={10} />{relDate(r.created_at)}</div>
                          </div>
                        </div>
                        <div className="pdp-rv-stars"><Stars rating={r.rating} size={13} /></div>
                      </div>
                      {r.title && <div className="pdp-rv-title">{r.title}</div>}
                      <p className="pdp-rv-body">{r.content}</p>
                      {r.images && r.images.length > 0 && (
                        <div className="pdp-rv-imgs">
                          {r.images.map((img, i) => (
                            <img key={i} src={img} className="pdp-rv-img" alt="" onClick={() => setLightbox(img)} onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'} />
                          ))}
                        </div>
                      )}
                      <div className="pdp-rv-footer">
                        <span className="pdp-rv-helpful-lbl">Helpful?</span>
                        <button className={`pdp-rv-hlp-btn ${liked.has(r.id) ? 'on' : ''}`} onClick={() => setLiked(p => { const n = new Set(p); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}>
                          <ThumbsUp size={11} /> {(r.helpful_count || 0) + (liked.has(r.id) ? 1 : 0)}
                        </button>
                        <button className="pdp-rv-hlp-btn"><ThumbsDown size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pdp-rv-empty">
                  <p>No reviews yet — be the first to share your experience.</p>
                  {!showForm && <button style={{ padding: '12px 28px', border: '1px solid var(--a2)', borderRadius: 30, background: 'transparent', color: 'var(--a)', cursor: 'pointer', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }} onClick={() => setShowForm(true)}>Write a Review</button>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <RecentlyViewed />
      <Footer />

      {/* Lightbox — images, direct video files and embeds (Drive/YouTube/Vimeo
          play inside OUR dialog, never a Drive redirect) */}
      {lightbox && (() => {
        const embed = videoEmbedUrl(lightbox);
        return (
          <div className="pdp-lightbox" onClick={() => setLightbox(null)}>
            <div className="pdp-lightbox-x"><CloseIcon size={22} /></div>
            {embed ? (
              <iframe src={embed} title="Video full view" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen onClick={(e) => e.stopPropagation()} />
            ) : isVideoUrl(lightbox) ? (
              <video src={lightbox} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={lightbox} alt="Full view" />
            )}
          </div>
        );
      })()}
    </div>
  );
}
