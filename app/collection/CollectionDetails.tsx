"use client";

import React, { Suspense, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer';
import './collection.css';
import {
  ChevronDown, Grid3x3, LayoutList, Search, BadgeCheck,
  ShoppingBag, Heart, Eye, X, Plus, Minus, ArrowRight,
  Ruler, SlidersHorizontal, RotateCcw, Check, ChevronRight, ChevronLeft, Home,
} from 'lucide-react';
import {
  getUser, addToCart, addToWishlist, removeFromWishlist, isInWishlist,
} from '@/lib/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Price } from '@/components/Price';
import ProductCard, { isSellableProduct } from '@/components/ProductCard';
import { isDisplayableImageUrl } from '@/lib/video';

/* ─── utils ─────────────────────────────────────────────────────── */
/* utils ─ hide junk / non-sellable rows from the storefront.
   The products table has no visibility flag, so we filter heuristically:
   a piece must have a real price, a real image, and not look like a
   test row or a one-off custom/personal order. */
function isDisplayableImage(url: string) {
  // Single source of truth (lib/video) — also keeps Drive/YouTube/Vimeo
  // links out of image stacks so they never render as broken pictures.
  return isDisplayableImageUrl(url);
}

/* Sellability is decided by the shared variant-aware helper imported from
   components/ProductCard (a base price of 0 is fine when priced variants
   exist). We deliberately do NOT reject by name keywords (e.g. "test"). */

function mapProduct(p: any, allCategories?: any[]) {
  const rawImgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const displayable = rawImgs.filter(isDisplayableImage);
  const primary = p.image && isDisplayableImage(p.image) ? p.image : null;
  const image = primary || displayable[0] || '';
  const unique = [...new Set(displayable)].filter(u => u !== image);
  const tags = [
    ...(p.metal ? [p.metal] : []),
    ...(p.color ? [p.color] : []),
    ...(p.carat ? [String(p.carat)] : []),
    ...(p.clarity ? [p.clarity] : []),
  ];
  const slug = p.slug || (p.name ? String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');

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
    if (categoryHierarchy.length > 0) {
      categoryName = categoryHierarchy[categoryHierarchy.length - 1];
    }
  }

  return {
    id: p.id, name: p.name ?? '', category: categoryName, categoryHierarchy,
    style: p.style ?? '', style_slug: p.style_slug ?? '',
    price: Number(p.price ?? 0), price_inr: p.price_inr,
    rating: p.rating || 0, reviews: p.reviews || 0, badge: p.is_featured ? 'Featured' : null,
    material: p.metal ?? '', image, hoverImage: unique[0] || image,
    tags, slug, description: p.description ?? '',
    stock_quantity: p.stock_quantity ?? 0,
    diamond_shape: p.diamond_shape || '',
    _allImages: [image, ...unique].filter(Boolean),
    // Variant pricing passes through untouched — dropping these makes cards
    // fall back to the bare base price (e.g. ₹0) when the raw lookup misses.
    metal_options: p.metal_options || [],
    size_options: p.size_options || [],
    carat_options: p.carat_options || [],
    variant_prices: p.variant_prices || [],
    discount_percent: p.discount_percent,
    label: p.label ?? null,
  };
}

/* ─── Pagination helper ──────────────────────────────────────────── */
function getPaginationItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | '...')[] = [];
  items.push(1);
  if (current > 3) items.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    items.push(i);
  }
  if (current < total - 2) items.push('...');
  items.push(total);
  return items;
}

/* ─── CSS ────────────────────────────────────────────────────────── */
const CSS = `
/* ══ AURUM DESIGN TOKENS ════════════════════════════════════════════ */
/* Tokens are shared with the mobile drawer + sort sheet, which portal to
   document.body (outside .lx-root). Defining them here keeps var(--*) resolved
   in those portals — otherwise the overlay renders with no background. */
.lx-root, .lx-dr-overlay, .lx-sh-overlay {
  --w:#FFFFFF; --iv:#FDFCF9; --cr:#F8F4EE; --wa:#EFE9DF; --bd:#ECE5DA; --bd2:#E2D9CB;
  --a:#8C7456; --a2:#A8916F; --a3:#C9B68F; --al:rgba(140,116,86,.10); --am:rgba(140,116,86,.22);
  --ink:#3A2E22; --mu:rgba(58,46,34,.56); --fa:rgba(58,46,34,.40); --li:rgba(58,46,34,.08);
  --serif:var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
  --sans:var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;

  --sh-sm:0 1px 2px rgba(58,46,34,.06);
  --sh:0 8px 26px rgba(58,46,34,.08);
  --sh-lg:0 18px 48px rgba(58,46,34,.12);
  --grad:linear-gradient(135deg,var(--a),var(--a2));
  --gold-text:linear-gradient(120deg,var(--a3),var(--a) 50%,var(--a2));
  --side-w:280px;
}
.lx-root {
  background:var(--iv);
  color:var(--ink);
  font-family:var(--sans);
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
}
.lx-root *{box-sizing:border-box;}
.lx-dr-overlay *, .lx-sh-overlay *{box-sizing:border-box;}

/* utility — gold gradient text */
.lx-gtext{
  background:var(--gold-text);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
}

/* ══ BREADCRUMB — refined, sentence-case, premium ══════════════════════ */
.lx-breadcrumb{
  display:flex; align-items:center; gap:7px;
  padding:clamp(18px,2.4vw,26px) clamp(20px,5vw,72px) clamp(4px,1vw,8px);
  font-family:var(--sans);
  font-size:12.5px; letter-spacing:.01em; text-transform:none;
  color:var(--mu);
  background:var(--iv);
  flex-wrap:wrap;
}
.lx-breadcrumb a{
  display:inline-flex; align-items:center; gap:5px;
  color:var(--mu); text-decoration:none;
  transition:color .22s ease;
}
.lx-breadcrumb a:hover{color:var(--a);}
.lx-breadcrumb-home svg{opacity:.75; transition:opacity .22s ease;}
.lx-breadcrumb-home:hover svg{opacity:1;}
.lx-breadcrumb-sep{
  display:inline-flex; align-items:center;
  color:var(--bd2); flex-shrink:0;
}
.lx-breadcrumb-current{
  color:var(--ink); font-weight:600; letter-spacing:.005em;
}

/* ══ HERO / COLLECTION HEADER ════════════════════════════════════════ */
.lx-col-header{
  position:relative;
  margin:0 clamp(16px,5vw,72px);
  padding:clamp(34px,5vw,66px) clamp(26px,5vw,60px) clamp(34px,5vw,58px);
  background:
    radial-gradient(120% 140% at 100% 0%, var(--cr) 0%, transparent 55%),
    linear-gradient(180deg,var(--w),var(--iv));
  border:1px solid var(--bd);
  border-radius:22px;
  box-shadow:var(--sh);
  display:flex; align-items:flex-end; justify-content:space-between;
  gap:clamp(20px,4vw,48px);
  overflow:hidden;
}
.lx-col-header::before{
  content:'';
  position:absolute; inset:0;
  background:
    radial-gradient(60% 90% at 90% 110%, var(--al), transparent 60%);
  pointer-events:none;
}
.lx-col-header > *{position:relative; z-index:1;}
.lx-col-eyebrow{
  display:inline-flex; align-items:center; gap:10px;
  font-family:var(--sans);
  font-size:10px; letter-spacing:.34em; text-transform:uppercase;
  color:var(--a); font-weight:500;
  margin-bottom:18px;
}
.lx-col-eyebrow::before{
  content:''; width:26px; height:1px;
  background:linear-gradient(90deg,transparent,var(--a2));
}
.lx-col-title{
  font-family:var(--serif);
  font-size:clamp(40px,6vw,78px);
  font-weight:300; line-height:.98; letter-spacing:-.02em;
  color:var(--ink);
  margin:0 0 18px;
}
.lx-col-title em{
  font-style:italic; font-weight:400;
  background:var(--gold-text);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.lx-col-desc{
  font-family:var(--serif);
  font-size:clamp(15px,1.6vw,19px);
  color:var(--mu); line-height:1.7; max-width:480px;
  font-weight:400;
}
.lx-col-stat{
  flex-shrink:0; text-align:right;
  padding:clamp(16px,2vw,26px) clamp(18px,2vw,30px);
  background:var(--w);
  border:1px solid var(--bd);
  border-radius:16px;
  box-shadow:var(--sh-sm);
  min-width:130px;
}
.lx-col-stat-num{
  font-family:var(--serif);
  font-size:clamp(40px,4.4vw,62px);
  font-weight:300; line-height:1; letter-spacing:-.03em;
  background:var(--gold-text);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.lx-col-stat-lbl{
  font-family:var(--sans);
  font-size:9.5px; letter-spacing:.3em; text-transform:uppercase;
  color:var(--mu); margin-top:8px;
}

@media (max-width:1023px){
  .lx-col-header{
    flex-direction:column; align-items:flex-start; gap:22px;
    border-radius:18px;
  }
  .lx-col-stat{
    text-align:left; min-width:0;
    display:flex; align-items:baseline; gap:12px;
    padding:14px 20px;
  }
  .lx-col-stat-lbl{margin-top:0;}
}
@media (max-width:480px){
  .lx-col-header{margin:0 14px;}
}

/* ══ MOBILE STICKY TOOLBAR ═══════════════════════════════════════════ */
.lx-mobile-bar{
  display:none;
  position:relative;
  z-index:40;
  margin:18px clamp(14px,5vw,72px) 0;
  background:rgba(253,252,249,.86);
  -webkit-backdrop-filter:blur(14px) saturate(140%);
  backdrop-filter:blur(14px) saturate(140%);
  border:1px solid var(--bd);
  border-radius:16px;
  box-shadow:var(--sh-sm);
  padding:9px 12px;
  gap:10px; align-items:center;
}
@media (max-width:1023px){ .lx-mobile-bar{ display:flex; } }
@media (max-width:480px){ .lx-mobile-bar{ margin:16px 14px 0; } }

.lx-mb-btn{
  display:flex; align-items:center; gap:8px;
  height:42px; padding:0 16px;
  border:1px solid var(--bd);
  border-radius:11px;
  font-family:var(--sans);
  font-size:11px; letter-spacing:.14em; text-transform:uppercase; font-weight:600;
  color:var(--ink); cursor:pointer;
  background:var(--w);
  transition:all .2s; white-space:nowrap;
}
.lx-mb-btn:active{transform:scale(.97);}
.lx-mb-btn:hover{border-color:var(--a2); color:var(--a);}
.lx-mb-badge{
  display:inline-flex; align-items:center; justify-content:center;
  min-width:18px; height:18px; padding:0 5px;
  background:var(--grad); color:#fff;
  border-radius:9px; font-size:10px; font-weight:700; line-height:1;
}
.lx-mb-count{
  margin-left:auto;
  font-family:var(--sans);
  font-size:12px; color:var(--mu); white-space:nowrap;
  font-weight:500;
}

/* ══ PAGE LAYOUT ═════════════════════════════════════════════════════ */
.lx-layout{
  display:flex; align-items:flex-start;
  padding:clamp(26px,3vw,42px) clamp(16px,5vw,72px) 120px;
  gap:clamp(28px,3vw,52px);
  max-width:1760px; margin:0 auto;
}
@media (max-width:1023px){
  .lx-layout{
    padding:24px clamp(14px,5vw,72px) 110px;
    gap:0;
  }
}
@media (max-width:480px){
  .lx-layout{ padding:20px 14px 104px; }
}

/* ══ SIDEBAR ═════════════════════════════════════════════════════════ */
.lx-sidebar{
  width:var(--side-w); flex-shrink:0;
  position:sticky; top:96px;
  max-height:calc(100vh - 120px);
  overflow-y:auto; scrollbar-width:none;
  background:var(--w);
  border:1px solid var(--bd);
  border-radius:18px;
  box-shadow:var(--sh-sm);
  padding:22px 22px 26px;
}
.lx-sidebar::-webkit-scrollbar{ display:none; }
@media (max-width:1023px){ .lx-sidebar{ display:none; } }

.lx-sidebar-head{
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:8px; padding-bottom:18px;
  border-bottom:1px solid var(--bd);
}
.lx-sidebar-title{
  font-family:var(--sans);
  font-size:10px; letter-spacing:.3em; text-transform:uppercase;
  color:var(--a); font-weight:700;
}
.lx-sidebar-clear{
  font-family:var(--sans);
  font-size:10px; letter-spacing:.1em; text-transform:uppercase;
  color:var(--mu); cursor:pointer; transition:color .2s; font-weight:600;
}
.lx-sidebar-clear:hover{ color:var(--a); }

/* ── Accordion ── */
.lx-acc{ border-bottom:1px solid var(--bd); }
.lx-acc:last-of-type{ border-bottom:none; }
.lx-acc-trigger{
  display:flex; align-items:center; justify-content:space-between;
  padding:18px 0 16px; cursor:pointer; user-select:none;
}
.lx-acc-trigger:hover .lx-acc-label{ color:var(--a); }
.lx-acc-label{
  font-family:var(--sans);
  font-size:11px; letter-spacing:.2em; text-transform:uppercase; font-weight:600;
  color:var(--ink); transition:color .2s;
}
.lx-acc-chevron{
  display:flex; color:var(--a2);
  transition:transform .3s ease; flex-shrink:0;
}
.lx-acc-chevron.open{ transform:rotate(180deg); }
.lx-acc-body{
  overflow:hidden; max-height:0;
  transition:max-height .4s cubic-bezier(.4,0,.2,1);
}
.lx-acc-body.open{ max-height:900px; }
.lx-acc-inner{ padding-bottom:18px; }

/* ── Category tree ── */
.lx-cat-parent{ display:flex; align-items:center; gap:0; margin-bottom:1px; }
.lx-cat-row{
  display:flex; align-items:center; gap:11px;
  padding:9px 0;
  font-family:var(--sans);
  font-size:13px; color:var(--mu); cursor:pointer;
  transition:color .18s; flex:1; min-width:0;
}
.lx-cat-row:hover{ color:var(--ink); }
.lx-cat-row.active{ color:var(--ink); font-weight:600; }

/* checkbox */
.lx-chk{
  width:17px; height:17px;
  border:1.5px solid var(--bd2);
  border-radius:5px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  transition:all .18s; position:relative; background:var(--w);
}
.lx-cat-row:hover .lx-chk{ border-color:var(--a2); }
.lx-cat-row.active .lx-chk{ background:var(--grad); border-color:var(--a); }
.lx-chk-tick{
  display:none; width:8px; height:5px;
  border-left:1.5px solid #fff; border-bottom:1.5px solid #fff;
  transform:rotate(-45deg) translateY(-1px);
}
.lx-cat-row.active .lx-chk-tick{ display:block; }

.lx-cat-name{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.lx-cat-expand{
  width:24px; height:24px;
  display:flex; align-items:center; justify-content:center;
  border-radius:8px; cursor:pointer; color:var(--mu);
  transition:all .2s; flex-shrink:0;
}
.lx-cat-expand:hover{ background:var(--al); color:var(--a); }
.lx-cat-expand.open{ transform:rotate(90deg); }

/* children */
.lx-cat-children{
  overflow:hidden; max-height:0;
  transition:max-height .3s ease;
  margin-left:8px; border-left:1px solid var(--bd);
}
.lx-cat-children.open{ max-height:500px; }
.lx-cat-child{
  display:flex; align-items:center; gap:11px;
  padding:7px 0 7px 18px;
  font-family:var(--sans);
  font-size:12.5px; color:var(--mu); cursor:pointer;
  transition:color .18s;
}
.lx-cat-child:hover{ color:var(--ink); }
.lx-cat-child.active{ color:var(--ink); font-weight:500; }
.lx-cat-child .lx-chk{ width:15px; height:15px; }
.lx-cat-child.active .lx-chk{ background:var(--grad); border-color:var(--a); }
.lx-cat-child.active .lx-chk-tick{ display:block; }

/* generic filter row */
.lx-f-row{
  display:flex; align-items:center; gap:11px;
  padding:9px 0;
  font-family:var(--sans);
  font-size:13px; color:var(--mu); cursor:pointer;
  transition:color .18s;
}
.lx-f-row:hover{ color:var(--ink); }
.lx-f-row.active{ color:var(--ink); font-weight:500; }
.lx-f-row:hover .lx-chk{ border-color:var(--a2); }
.lx-f-row.active .lx-chk{ background:var(--grad); border-color:var(--a); }
.lx-f-row.active .lx-chk-tick{ display:block; }
.lx-f-name{ flex:1; }

/* ── Price filter ── */
.lx-price-chips{
  display:flex; flex-wrap:wrap; gap:7px;
  margin:4px 0 14px;
}
.lx-price-chip{
  display:inline-flex; align-items:center;
  padding:7px 13px;
  background:var(--cr);
  border:1px solid var(--bd);
  border-radius:20px;
  font-family:var(--sans);
  font-size:11px; letter-spacing:.02em; color:var(--ink);
  cursor:pointer; transition:all .18s; white-space:nowrap;
}
.lx-price-chip:hover{ border-color:var(--a2); color:var(--a); }
.lx-price-chip.on{
  background:var(--al); border-color:var(--a2); color:var(--a); font-weight:600;
}
.lx-price-inputs{
  display:flex; align-items:center; gap:10px; margin-top:4px;
}
.lx-price-field{
  flex:1; min-width:0; position:relative;
  display:flex; align-items:center;
}
.lx-price-field span{
  position:absolute; left:11px;
  font-family:var(--sans);
  font-size:13px; color:var(--fa); pointer-events:none;
}
.lx-price-input{
  width:100%; height:42px;
  padding:0 10px 0 24px;
  border:1px solid var(--bd2);
  border-radius:11px;
  background:var(--w);
  font-family:var(--sans);
  font-size:13px; color:var(--ink);
  outline:none; transition:all .18s;
  -moz-appearance:textfield;
}
.lx-price-input::-webkit-outer-spin-button,
.lx-price-input::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
.lx-price-input::placeholder{ color:var(--fa); }
.lx-price-input:focus{ border-color:var(--a2); box-shadow:0 0 0 3px var(--al); }
.lx-price-dash{ color:var(--fa); font-size:13px; flex-shrink:0; }

/* sidebar footer buttons */
.lx-sidebar-footer{
  margin-top:22px; padding-top:20px;
  border-top:1px solid var(--bd);
  display:flex; flex-direction:column; gap:9px;
}
.lx-btn-apply{
  height:48px;
  background:var(--grad); color:#fff; border:none;
  font-family:var(--sans);
  font-size:10px; letter-spacing:.26em; text-transform:uppercase; font-weight:700;
  cursor:pointer; transition:all .22s;
  border-radius:12px; width:100%;
  box-shadow:0 6px 18px rgba(140,116,86,.26);
}
.lx-btn-apply:hover{ filter:brightness(1.06); transform:translateY(-1px); box-shadow:0 10px 24px rgba(140,116,86,.32); }
.lx-btn-apply:active{ transform:translateY(0); }
.lx-btn-reset{
  height:44px; background:var(--w);
  border:1px solid var(--bd2); color:var(--mu);
  font-family:var(--sans);
  font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:600;
  cursor:pointer; transition:all .18s;
  border-radius:12px; width:100%;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.lx-btn-reset:hover{ border-color:var(--a2); color:var(--a); }

/* ══ MAIN CONTENT ════════════════════════════════════════════════════ */
.lx-main{ flex:1; min-width:0; }

/* ── Toolbar ── */
.lx-toolbar{
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:26px; padding:14px 18px;
  background:var(--w);
  border:1px solid var(--bd);
  border-radius:16px;
  box-shadow:var(--sh-sm);
  gap:14px; flex-wrap:wrap;
}
@media (max-width:1023px){ .lx-toolbar{ display:none; } }
.lx-toolbar-left{
  display:flex; align-items:center; gap:14px; flex-wrap:wrap; min-width:0;
}
.lx-toolbar-right{
  display:flex; align-items:center; gap:8px; flex-shrink:0;
}

/* result count */
.lx-count{
  font-family:var(--sans);
  font-size:12px; color:var(--mu); white-space:nowrap; letter-spacing:.04em;
}
.lx-count strong{ color:var(--ink); font-weight:700; }

/* active pills */
.lx-pills{ display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
.lx-pill{
  display:inline-flex; align-items:center; gap:6px;
  padding:5px 8px 5px 12px;
  background:var(--al);
  border:1px solid var(--am);
  border-radius:20px;
  font-family:var(--sans);
  font-size:11px; color:var(--a); font-weight:500;
  cursor:pointer; transition:all .18s; white-space:nowrap;
}
.lx-pill:hover{ background:var(--am); border-color:var(--a2); }
.lx-pill svg{ color:var(--a); opacity:.7; }
.lx-clear-all{
  font-family:var(--sans);
  font-size:11px; color:var(--mu); cursor:pointer;
  text-decoration:underline; text-underline-offset:3px;
  transition:color .18s; white-space:nowrap;
}
.lx-clear-all:hover{ color:var(--a); }

/* view controls */
.lx-view-group{
  display:flex; align-items:center; gap:3px;
  background:var(--cr); border:1px solid var(--bd);
  border-radius:11px; padding:4px;
}
.lx-vbtn{
  min-width:32px; height:32px; padding:0 4px;
  display:flex; align-items:center; justify-content:center;
  border-radius:8px; cursor:pointer; color:var(--mu);
  transition:all .18s;
  font-family:var(--sans);
  font-size:11px; font-weight:700;
}
.lx-vbtn:hover{ color:var(--ink); }
.lx-vbtn.on{
  background:var(--w); color:var(--a);
  box-shadow:0 1px 4px rgba(58,46,34,.1);
}

/* sort */
.lx-sort-wrap{ position:relative; }
.lx-sort-btn{
  display:flex; align-items:center; gap:8px;
  height:40px; padding:0 15px;
  border:1px solid var(--bd2);
  border-radius:11px; background:var(--w);
  font-family:var(--sans);
  font-size:11px; letter-spacing:.1em; text-transform:uppercase;
  color:var(--ink); cursor:pointer; transition:all .18s;
  white-space:nowrap; font-weight:600;
}
.lx-sort-btn:hover{ border-color:var(--a2); color:var(--a); }
.lx-sort-drop{
  position:absolute; top:calc(100% + 8px); right:0;
  width:220px; background:var(--w);
  border:1px solid var(--bd);
  border-radius:14px;
  box-shadow:var(--sh-lg);
  overflow:hidden; z-index:200; padding:6px;
  opacity:0; visibility:hidden; transform:translateY(-6px);
  transition:all .2s ease;
}
.lx-sort-wrap:hover .lx-sort-drop{ opacity:1; visibility:visible; transform:translateY(0); }
.lx-sort-opt{
  padding:11px 14px; border-radius:9px;
  font-family:var(--sans);
  font-size:12.5px; color:var(--mu); cursor:pointer;
  transition:all .14s;
  display:flex; align-items:center; justify-content:space-between;
}
.lx-sort-opt:hover{ background:var(--cr); color:var(--ink); }
.lx-sort-opt.on{ color:var(--a); font-weight:600; background:var(--al); }

/* search */
.lx-srch-wrap{ position:relative; }
.lx-srch-btn{
  width:40px; height:40px;
  display:flex; align-items:center; justify-content:center;
  border:1px solid var(--bd2); border-radius:11px;
  cursor:pointer; color:var(--mu); transition:all .18s; background:var(--w);
}
.lx-srch-btn:hover{ border-color:var(--a2); color:var(--a); }
.lx-srch-box{
  position:absolute; top:calc(100% + 8px); right:0;
  width:300px; background:var(--w);
  border:1px solid var(--bd);
  border-radius:14px; padding:8px 14px;
  box-shadow:var(--sh-lg);
  display:flex; align-items:center; gap:10px; z-index:200;
  opacity:0; visibility:hidden; transform:translateY(-6px);
  transition:all .22s ease;
}
.lx-srch-box.open{ opacity:1; visibility:visible; transform:translateY(0); }
.lx-srch-input{
  flex:1; border:none; outline:none; height:36px;
  font-family:var(--sans);
  font-size:14px; color:var(--ink); background:transparent;
}
.lx-srch-input::placeholder{ color:var(--fa); }
.lx-srch-x{ cursor:pointer; color:var(--mu); transition:color .18s; display:flex; align-items:center; }
.lx-srch-x:hover{ color:var(--a); }

/* ── Grid ── */
.lx-grid{
  display:grid;
  gap:clamp(14px,1.6vw,22px);
  row-gap:clamp(26px,3vw,42px);
  align-items:stretch;
}
.lx-grid.c2{ grid-template-columns:repeat(2,minmax(0,1fr)); }
.lx-grid.c3{ grid-template-columns:repeat(3,minmax(0,1fr)); }
.lx-grid.c4{ grid-template-columns:repeat(4,minmax(0,1fr)); }
.lx-grid.cl{ grid-template-columns:1fr; row-gap:18px; }

@media (max-width:1280px){ .lx-grid.c4{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
@media (max-width:1023px){ .lx-grid.c3,.lx-grid.c4{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
@media (max-width:880px){  .lx-grid.c3,.lx-grid.c4{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:540px){
  .lx-grid.c2,.lx-grid.c3,.lx-grid.c4{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:12px; row-gap:22px;
  }
}
@media (max-width:380px){
  .lx-grid.c2,.lx-grid.c3,.lx-grid.c4{ grid-template-columns:1fr; }
}

/* ── Skeleton ── */
.lx-skel{
  position:relative; overflow:hidden;
  background:var(--w); border:1px solid var(--bd);
  border-radius:16px; padding:12px;
}
.lx-skel::after{
  content:''; position:absolute; inset:0;
  background:linear-gradient(90deg, transparent 0%, rgba(255,255,255,.6) 50%, transparent 100%);
  animation:lx-shimmer 1.6s infinite;
}
@keyframes lx-shimmer{ 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
.lx-skel-img{ aspect-ratio:1; background:var(--cr); border-radius:12px; margin-bottom:14px; }
.lx-skel-line{ height:12px; background:var(--cr); border-radius:6px; margin-bottom:8px; }

/* ── Empty ── */
.lx-empty{
  min-height:380px;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  text-align:center; padding:60px 24px;
  background:var(--w); border:1px solid var(--bd);
  border-radius:18px; box-shadow:var(--sh-sm);
}
.lx-empty-ring{
  width:66px; height:66px;
  border:1px solid var(--bd2);
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  color:var(--a2); margin-bottom:22px;
  background:var(--cr);
}
.lx-empty-h{
  font-family:var(--serif);
  font-size:26px; font-weight:400; color:var(--ink); margin-bottom:10px;
}
.lx-empty-p{
  font-family:var(--serif);
  font-size:16px; color:var(--mu); line-height:1.6; max-width:320px; margin-bottom:28px;
}
.lx-empty-btn{
  height:48px; padding:0 30px;
  background:var(--grad); color:#fff; border:none;
  font-family:var(--sans);
  font-size:10px; letter-spacing:.22em; text-transform:uppercase; font-weight:700;
  cursor:pointer; transition:all .2s; border-radius:12px;
  box-shadow:0 6px 18px rgba(140,116,86,.26);
}
.lx-empty-btn:hover{ filter:brightness(1.06); transform:translateY(-1px); }

/* ══ PAGINATION ══════════════════════════════════════════════════════ */
.lx-pager{
  display:flex; align-items:center; justify-content:center;
  gap:7px; margin-top:clamp(44px,5vw,68px);
  padding-top:clamp(28px,3vw,38px);
  border-top:1px solid var(--bd);
  flex-wrap:wrap;
}
.lx-pg{
  min-width:44px; height:44px; padding:0 6px;
  display:flex; align-items:center; justify-content:center;
  border:1px solid var(--bd2);
  border-radius:11px;
  font-family:var(--sans);
  font-size:13px; color:var(--mu); cursor:pointer;
  transition:all .18s; background:var(--w);
  user-select:none; font-weight:500;
}
.lx-pg:hover:not(:disabled):not(.lx-pg-dots){
  border-color:var(--a2); color:var(--a); background:var(--al);
}
.lx-pg.on{
  background:var(--grad); color:#fff; border-color:var(--a);
  font-weight:700; box-shadow:0 6px 16px rgba(140,116,86,.26);
}
.lx-pg:disabled{ opacity:.3; cursor:not-allowed; }
.lx-pg-dots{ border:none; cursor:default; color:var(--fa); background:transparent; letter-spacing:.05em; }
.lx-pager-info{
  width:100%; text-align:center;
  font-family:var(--sans);
  font-size:11px; color:var(--mu); margin-top:16px; letter-spacing:.12em; text-transform:uppercase;
}

/* ══ DRAWER (MOBILE FILTER) ══════════════════════════════════════════ */
.lx-dr-overlay{
  position:fixed; inset:0;
  background:rgba(58,46,34,.42);
  z-index:1200;
  opacity:0; visibility:hidden;
  transition:all .38s cubic-bezier(.4,0,.2,1);
  -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);
}
.lx-dr-overlay.open{ opacity:1; visibility:visible; }
.lx-drawer{
  position:absolute; left:0; top:0; bottom:0;
  width:100%; max-width:400px;
  background:var(--iv);
  display:flex; flex-direction:column;
  transform:translateX(-100%);
  transition:transform .42s cubic-bezier(.4,0,.2,1);
  box-shadow:24px 0 60px rgba(58,46,34,.18);
}
.lx-dr-overlay.open .lx-drawer{ transform:translateX(0); }
.lx-dr-head{
  display:flex; align-items:center; justify-content:space-between;
  padding:22px 22px 18px;
  border-bottom:1px solid var(--bd);
  flex-shrink:0; background:var(--w);
}
.lx-dr-title{
  font-family:var(--serif);
  font-size:28px; font-weight:400; color:var(--ink); letter-spacing:-.01em;
}
.lx-dr-title em{ font-style:italic; }
.lx-dr-close{
  width:42px; height:42px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:var(--mu);
  transition:all .25s;
  border:1px solid var(--bd2); border-radius:50%;
  background:var(--w);
}
.lx-dr-close:hover{ color:var(--a); border-color:var(--a2); transform:rotate(90deg); }
.lx-dr-body{
  flex:1; overflow-y:auto; padding:8px 22px;
  scrollbar-width:none;
}
.lx-dr-body::-webkit-scrollbar{ display:none; }
.lx-dr-foot{
  padding:16px 22px calc(20px + env(safe-area-inset-bottom));
  border-top:1px solid var(--bd);
  display:flex; gap:9px; flex-shrink:0; background:var(--w);
}
.lx-dr-foot .lx-btn-reset{ flex:0 0 auto; width:auto; padding:0 20px; }
.lx-dr-foot .lx-btn-apply{ flex:1; }

/* ══ SORT SHEET (MOBILE) ═════════════════════════════════════════════ */
.lx-sh-overlay{
  position:fixed; inset:0;
  background:rgba(58,46,34,.42);
  z-index:1200;
  opacity:0; visibility:hidden;
  transition:all .28s ease;
  display:flex; align-items:flex-end;
  -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);
}
.lx-sh-overlay.open{ opacity:1; visibility:visible; }
.lx-sh{
  width:100%; background:var(--iv);
  border-radius:22px 22px 0 0;
  padding:16px 24px calc(28px + env(safe-area-inset-bottom));
  transform:translateY(100%);
  transition:transform .32s cubic-bezier(.4,0,.2,1);
  box-shadow:0 -20px 60px rgba(58,46,34,.18);
  max-height:80vh; overflow-y:auto;
  -webkit-overflow-scrolling:touch; scrollbar-width:none;
}
.lx-sh::-webkit-scrollbar{ display:none; }
.lx-sh-overlay.open .lx-sh{ transform:translateY(0); }
.lx-sh-handle{
  width:42px; height:4px;
  background:var(--bd2); border-radius:2px;
  margin:0 auto 20px;
}
.lx-sh-title{
  font-family:var(--sans);
  font-size:10px; letter-spacing:.28em; text-transform:uppercase; color:var(--a);
  margin-bottom:8px; font-weight:700;
}
.lx-sh-opt{
  padding:16px 0;
  border-bottom:1px solid var(--bd);
  font-family:var(--serif);
  font-size:18px; color:var(--ink); cursor:pointer;
  display:flex; align-items:center; justify-content:space-between;
  transition:color .18s;
}
.lx-sh-opt:last-child{ border-bottom:none; }
.lx-sh-opt:hover{ color:var(--a); }
.lx-sh-opt.on{ color:var(--a); font-weight:600; }

/* ══ TABLET/MOBILE BOTTOM-NAV CLEARANCE ══════════════════════════════ */
@media (max-width:1023px){
  .lx-layout{ padding-bottom:120px; }
}

/* ══ REDUCED MOTION ══════════════════════════════════════════════════ */
@media (prefers-reduced-motion:reduce){
  .lx-root *,
  .lx-root *::before,
  .lx-root *::after{
    animation-duration:.001ms !important;
    transition-duration:.001ms !important;
    scroll-behavior:auto !important;
  }
  .lx-skel::after{ animation:none; }
}
`;

/* ─── Accordion ─────────────────────────────────────────────────── */
function Acc({ label, defaultOpen = false, children }: {
  label: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="lx-acc">
      <div className="lx-acc-trigger" onClick={() => setOpen(o => !o)}>
        <span className="lx-acc-label">{label}</span>
        <span className={`lx-acc-chevron ${open ? 'open' : ''}`}>
          <ChevronDown size={14} strokeWidth={2.2} />
        </span>
      </div>
      <div className={`lx-acc-body ${open ? 'open' : ''}`}>
        <div className="lx-acc-inner">{children}</div>
      </div>
    </div>
  );
}

/* ─── Generic filter row ────────────────────────────────────────── */
function FRow({ label, active, onClick }: {
  label: string; active: boolean; onClick: () => void;
}) {
  return (
    <div className={`lx-f-row ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="lx-chk">
        <span className="lx-chk-tick" />
      </span>
      <span className="lx-f-name">{label}</span>
    </div>
  );
}

/* ─── Price filter (chips + min/max inputs) ─────────────────────── */
function PriceFilter({
  minPrice, maxPrice, setMinPrice, setMaxPrice,
}: {
  minPrice: string; maxPrice: string;
  setMinPrice: (v: string) => void; setMaxPrice: (v: string) => void;
}) {
  const presets = [
    { label: 'Under ₹50,000', min: '', max: '50000' },
    { label: '₹50k – ₹1L', min: '50000', max: '100000' },
    { label: '₹1L+', min: '100000', max: '' },
  ];
  const isPresetOn = (p: { min: string; max: string }) =>
    String(minPrice || '') === p.min && String(maxPrice || '') === p.max;

  return (
    <div>
      <div className="lx-price-chips">
        {presets.map(p => (
          <span
            key={p.label}
            className={`lx-price-chip ${isPresetOn(p) ? 'on' : ''}`}
            onClick={() => {
              if (isPresetOn(p)) { setMinPrice(''); setMaxPrice(''); }
              else { setMinPrice(p.min); setMaxPrice(p.max); }
            }}
          >
            {p.label}
          </span>
        ))}
      </div>
      <div className="lx-price-inputs">
        <label className="lx-price-field">
          <span>₹</span>
          <input
            className="lx-price-input"
            type="number" inputMode="numeric" min={0}
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
          />
        </label>
        <span className="lx-price-dash">—</span>
        <label className="lx-price-field">
          <span>₹</span>
          <input
            className="lx-price-input"
            type="number" inputMode="numeric" min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

/* ─── Category tree (always-visible, expandable children) ────────── */
function CategoryTree({
  organizedCategories,
  category,
  setCategory,
}: {
  organizedCategories: any[];
  category: string;
  setCategory: (v: string) => void;
}) {
  // Track which parents have their children expanded
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Pre-expand the parent whose child is currently selected
    const initial = new Set<string>();
    return initial;
  });

  // Auto-expand parent when a child is selected
  useEffect(() => {
    organizedCategories.forEach(parent => {
      if (parent.children?.some((c: any) => c.name === category)) {
        setExpanded(prev => new Set([...prev, parent.id]));
      }
    });
  }, [category, organizedCategories]);

  const toggleExpand = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  return (
    <div>
      {/* All */}
      <div className={`lx-cat-parent`}>
        <div
          className={`lx-cat-row ${category === 'All' ? 'active' : ''}`}
          onClick={() => setCategory('All')}
        >
          <span className="lx-chk"><span className="lx-chk-tick" /></span>
          <span className="lx-cat-name">All</span>
        </div>
      </div>

      {organizedCategories.map(parent => {
        const hasChildren = parent.children && parent.children.length > 0;
        const isExpanded = expanded.has(parent.id);
        const parentActive = category === parent.name;
        const childActive = parent.children?.some((c: any) => c.name === category);

        return (
          <div key={parent.id}>
            <div className="lx-cat-parent">
              <div
                className={`lx-cat-row ${parentActive ? 'active' : ''}`}
                onClick={() => setCategory(parent.name)}
                style={{ flex: 1 }}
              >
                <span className="lx-chk"><span className="lx-chk-tick" /></span>
                <span className="lx-cat-name" style={{ fontWeight: (parentActive || childActive) ? 600 : 400 }}>
                  {parent.name}
                </span>
              </div>
              {hasChildren && (
                <span
                  className={`lx-cat-expand ${isExpanded ? 'open' : ''}`}
                  onClick={(e) => toggleExpand(parent.id, e)}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <ChevronRight size={13} strokeWidth={2} />
                </span>
              )}
            </div>

            {hasChildren && (
              <div className={`lx-cat-children ${isExpanded ? 'open' : ''}`}>
                {parent.children.map((child: any) => (
                  <div
                    key={child.id}
                    className={`lx-cat-child ${category === child.name ? 'active' : ''}`}
                    onClick={() => setCategory(child.name)}
                  >
                    <span className="lx-chk"><span className="lx-chk-tick" /></span>
                    <span>{child.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Filter panel content (shared desktop + drawer) ────────────── */
function FilterPanel({
  category, setCategory,
  metal, setMetal,
  style, setStyle,
  shape, setShape,
  minPrice, maxPrice, setMinPrice, setMaxPrice,
  organizedCategories,
  metals, styleOptions, shapeOptions,
  onReset, onApply,
  showFooter = true,
}: {
  category: string; setCategory: (v: string) => void;
  metal: string; setMetal: (v: string) => void;
  style: string; setStyle: (v: string) => void;
  shape: string; setShape: (v: string) => void;
  minPrice: string; maxPrice: string;
  setMinPrice: (v: string) => void; setMaxPrice: (v: string) => void;
  organizedCategories: any[];
  metals: string[];
  styleOptions: { key: string; name: string }[];
  shapeOptions: { key: string; name: string }[];
  onReset: () => void; onApply: () => void;
  showFooter?: boolean;
}) {
  return (
    <>
      <Acc label="Category" defaultOpen>
        <CategoryTree
          organizedCategories={organizedCategories}
          category={category}
          setCategory={setCategory}
        />
      </Acc>

      <Acc label="Price" defaultOpen>
        <PriceFilter
          minPrice={minPrice} maxPrice={maxPrice}
          setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
        />
      </Acc>

      <Acc label="Material" defaultOpen>
        {metals.map(m => (
          <FRow key={m} label={m} active={metal === m} onClick={() => setMetal(m)} />
        ))}
      </Acc>

      {styleOptions.length > 0 && (
        <Acc label="Style">
          <FRow label="All" active={style === 'All'} onClick={() => setStyle('All')} />
          {styleOptions.map(s => (
            <FRow key={s.key} label={s.name} active={style === s.key} onClick={() => setStyle(s.key)} />
          ))}
        </Acc>
      )}

      {shapeOptions.length > 0 && (
        <Acc label="Shape">
          <FRow label="All" active={shape === 'All'} onClick={() => setShape('All')} />
          {shapeOptions.map(s => (
            <FRow key={s.key} label={s.name} active={shape === s.key} onClick={() => setShape(s.key)} />
          ))}
        </Acc>
      )}

      {showFooter && (
        <div className="lx-sidebar-footer">
          <button className="lx-btn-apply" onClick={onApply}>Apply Filters</button>
          <button className="lx-btn-reset" onClick={onReset}>
            <RotateCcw size={11} strokeWidth={2} />
            Reset all
          </button>
        </div>
      )}
    </>
  );
}

/* ─── Inner component that uses searchParams ───────────────────── */
function CollectionDetailsInner({ initialProducts }: { initialProducts: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [products, setProducts] = useState<any[]>(initialProducts);
  const [loading, setLoading] = useState(
    (searchParams.get('category') || 'All') !== 'All' ||
    (searchParams.get('metal') || 'All') !== 'All' ||
    (searchParams.get('style') || 'All') !== 'All' ||
    (searchParams.get('shape') || 'All') !== 'All'
  );
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [columns, setColumns] = useState<2 | 3 | 4>(3);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<any[]>([]);

  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [metal, setMetal] = useState(searchParams.get('metal') || 'All');
  const [style, setStyle] = useState(searchParams.get('style') || 'All');
  const [shape, setShape] = useState(searchParams.get('shape') || 'All');
  const [styleOptions, setStyleOptions] = useState<{ key: string; name: string }[]>([]);
  const [shapeOptions, setShapeOptions] = useState<{ key: string; name: string }[]>([]);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const itemsPerPage = 12;
  const didMountRef = useRef(false);

  const organizedCategories = useMemo(() => {
    const parents = categories.filter(c => !c.parent_category_id);
    const children = categories.filter(c => c.parent_category_id);
    return parents.map(parent => ({
      ...parent,
      children: children.filter(c => c.parent_category_id === parent.id)
    }));
  }, [categories]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(console.error);
    // Admin-managed Style + Shape lists — keep the sidebar in sync with what
    // products are actually tagged with.
    fetch('/api/styles')
      .then(r => r.json())
      .then(d => setStyleOptions(Array.isArray(d) ? d.filter((x: any) => x.is_enabled !== false).map((x: any) => ({ key: x.key, name: x.name })) : []))
      .catch(() => { });
    fetch('/api/diamond-shapes')
      .then(r => r.json())
      .then(d => setShapeOptions(Array.isArray(d) ? d.filter((x: any) => x.is_enabled !== false).map((x: any) => ({ key: x.key, name: x.name })) : []))
      .catch(() => { });
  }, []);

  const metals = ['All', '14K Yellow Gold', '18K Yellow Gold', '14K White Gold', '18K White Gold', 'Rose Gold', 'Platinum'];
  const sortOptions = [
    { id: 'newest', label: 'Newest First' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'rating', label: 'Customer Rating' },
  ];

  useEffect(() => {
    fetchWishlist();
  }, []);
  useEffect(() => {
    // Skip the mount run — the server-rendered initialProducts already match the
    // unfiltered view, so refetching on mount only flashes the skeleton/count (the
    // "flicker"). Only fetch on mount when the URL carries server-side filters
    // (category/metal/style) that make initialProducts unrepresentative.
    if (!didMountRef.current) {
      didMountRef.current = true;
      if (category !== 'All' || metal !== 'All' || style !== 'All' || shape !== 'All') fetchProducts();
      return;
    }
    setPage(1);
    fetchProducts();
  }, [category, metal, style, shape, sortBy]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (category !== 'All') p.append('category', category);
      if (metal !== 'All') p.append('metal', metal);
      if (style !== 'All') p.append('style', style);
      if (shape !== 'All') p.append('shape', shape);
      p.append('sort', sortBy);
      p.append('limit', '1000'); // Get all products
      const res = await fetch(`/api/products?${p.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.products || []));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchWishlist() {
    const user = getUser();
    if (!user) return;
    try {
      const res = await fetch(`/api/wishlist?userId=${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setWishlist(new Set(data.map((i: any) => i.id)));
    } catch { }
  }

  const filteredAndSorted = useMemo(() => {
    let r = products.map(p => mapProduct(p, categories));
    // Hide non-sellable / junk rows (no price, no image, test / custom-order items).
    r = r.filter(isSellableProduct);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    const min = minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== '' ? Number(maxPrice) : null;
    if (min !== null && !Number.isNaN(min)) r = r.filter(p => p.price >= min);
    if (max !== null && !Number.isNaN(max)) r = r.filter(p => p.price <= max);
    if (sortBy === 'price-low') r.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') r.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') r.sort((a, b) => b.rating - a.rating);
    return r;
  }, [products, searchTerm, sortBy, categories, minPrice, maxPrice]);

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, page]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));
  const pagerItems = getPaginationItems(page, totalPages);

  const updateURL = (nc?: string, nm?: string, ns?: string, nsort?: string, npage?: number, nmin?: string, nmax?: string, nshape?: string) => {
    const p = new URLSearchParams(searchParams);
    if (nc !== undefined) { if (nc === 'All') p.delete('category'); else p.set('category', nc); }
    if (nm !== undefined) { if (nm === 'All') p.delete('metal'); else p.set('metal', nm); }
    if (ns !== undefined) { if (ns === 'All') p.delete('style'); else p.set('style', ns); }
    if (nshape !== undefined) { if (nshape === 'All') p.delete('shape'); else p.set('shape', nshape); }
    if (nmin !== undefined) { if (nmin === '') p.delete('minPrice'); else p.set('minPrice', nmin); }
    if (nmax !== undefined) { if (nmax === '') p.delete('maxPrice'); else p.set('maxPrice', nmax); }
    if (nsort) p.set('sort', nsort);
    if (npage !== undefined) {
      if (npage === 1) p.delete('page');
      else p.set('page', String(npage));
    }
    router.push(`/collection?${p.toString()}`, { scroll: false });
  };

  const handleReset = () => { setCategory('All'); setMetal('All'); setStyle('All'); setShape('All'); setMinPrice(''); setMaxPrice(''); };
  const handleApply = () => { updateURL(category, metal, style, undefined, undefined, minPrice, maxPrice, shape); setIsFilterOpen(false); };

  const goPage = (pg: number) => {
    setPage(pg);
    updateURL(undefined, undefined, undefined, undefined, pg);
    window.scrollTo({ top: 280, behavior: 'smooth' });
  };

  const formatPrice = (v: string) => {
    const n = Number(v);
    if (!v || Number.isNaN(n)) return v;
    if (n >= 100000) return `₹${(n / 100000).toString().replace(/\.0$/, '')}L`;
    if (n >= 1000) return `₹${(n / 1000).toString().replace(/\.0$/, '')}k`;
    return `₹${n}`;
  };
  const priceLabel =
    minPrice !== '' && maxPrice !== '' ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
      : minPrice !== '' ? `Over ${formatPrice(minPrice)}`
        : maxPrice !== '' ? `Under ${formatPrice(maxPrice)}`
          : '';

  const priceActive = minPrice !== '' || maxPrice !== '';
  const styleLabel = styleOptions.find(o => o.key === style)?.name || style;
  const shapeLabel = shapeOptions.find(o => o.key === shape)?.name || shape;

  // When the selected category is a child, surface its parent in the breadcrumb:
  // Home / Collection / Parent / Child
  const selectedCatObj = categories.find(c => c.name === category);
  const parentOfSelected = selectedCatObj?.parent_category_id
    ? categories.find(c => c.id === selectedCatObj.parent_category_id)
    : null;
  const activeFilterCount = [category !== 'All', metal !== 'All', style !== 'All', shape !== 'All', priceActive].filter(Boolean).length;
  const activeFilters = [
    ...(category !== 'All' ? [{ label: category, clear: () => setCategory('All') }] : []),
    ...(metal !== 'All' ? [{ label: metal, clear: () => setMetal('All') }] : []),
    ...(style !== 'All' ? [{ label: styleLabel, clear: () => setStyle('All') }] : []),
    ...(shape !== 'All' ? [{ label: shapeLabel, clear: () => setShape('All') }] : []),
    ...(priceActive ? [{ label: priceLabel, clear: () => { setMinPrice(''); setMaxPrice(''); } }] : []),
  ];
  const currentSortLabel = sortOptions.find(o => o.id === sortBy)?.label ?? 'Sort';

  const gridClass = view === 'list' ? 'cl' : `c${columns}`;

  return (
    <div className="lx-root">
      <style>{CSS}</style>
      <HeaderMegaMenu />

      {/* Breadcrumb */}
      <nav className="lx-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="lx-breadcrumb-home"><Home size={13} strokeWidth={1.8} /> Home</Link>
        <ChevronRight size={13} strokeWidth={2} className="lx-breadcrumb-sep" />
        {category === 'All'
          ? <span className="lx-breadcrumb-current">Collection</span>
          : <Link href="/collection">Collection</Link>}
        {parentOfSelected && (
          <>
            <ChevronRight size={13} strokeWidth={2} className="lx-breadcrumb-sep" />
            <Link href={`/collection?category=${encodeURIComponent(parentOfSelected.name)}`}>{parentOfSelected.name}</Link>
          </>
        )}
        {category !== 'All' && (
          <>
            <ChevronRight size={13} strokeWidth={2} className="lx-breadcrumb-sep" />
            <span className="lx-breadcrumb-current">{category}</span>
          </>
        )}
      </nav>

      {/* Header / Hero */}
      <header className="lx-col-header">
        <div>
          <div className="lx-col-eyebrow">{parentOfSelected ? parentOfSelected.name : 'Fine Jewellery Collection'}</div>
          <h1 className="lx-col-title">
            {category === 'All' ? <>All <em>Pieces</em></> : <em>{category}</em>}
          </h1>
          <p className="lx-col-desc">
            {category === 'All'
              ? 'Each piece is handcrafted to carry meaning — moments made precious, worn for a lifetime.'
              : `Discover our curated ${category.toLowerCase()} collection, crafted with exceptional materials and timeless design.`}
          </p>
        </div>
        <div className="lx-col-stat">
          <div className="lx-col-stat-num">{loading ? '—' : filteredAndSorted.length}</div>
          <div className="lx-col-stat-lbl">Pieces</div>
        </div>
      </header>

      {/* Mobile sticky bar */}
      <div className="lx-mobile-bar">
        <button className="lx-mb-btn" onClick={() => setIsFilterOpen(true)}>
          <SlidersHorizontal size={13} strokeWidth={2} />
          Filters
          {activeFilterCount > 0 && <span className="lx-mb-badge">{activeFilterCount}</span>}
        </button>
        <button className="lx-mb-btn" onClick={() => setIsSortOpen(true)}>
          <ChevronDown size={13} strokeWidth={2} />
          Sort
        </button>
        <span className="lx-mb-count">{loading ? '—' : `${filteredAndSorted.length} items`}</span>
      </div>

      {/* Layout */}
      <div className="lx-layout">

        {/* Desktop sidebar */}
        <aside className="lx-sidebar">
          <div className="lx-sidebar-head">
            <span className="lx-sidebar-title">Refine</span>
            {activeFilterCount > 0 && (
              <span className="lx-sidebar-clear" onClick={handleReset}>Clear all</span>
            )}
          </div>
          <FilterPanel
            category={category} setCategory={setCategory}
            metal={metal} setMetal={setMetal}
            style={style} setStyle={setStyle}
            shape={shape} setShape={setShape}
            minPrice={minPrice} maxPrice={maxPrice}
            setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
            organizedCategories={organizedCategories}
            metals={metals} styleOptions={styleOptions} shapeOptions={shapeOptions}
            onReset={handleReset} onApply={handleApply}
          />
        </aside>

        {/* Products */}
        <main className="lx-main">

          {/* Toolbar */}
          <div className="lx-toolbar">
            <div className="lx-toolbar-left">
              <span className="lx-count">
                <strong>{loading ? '—' : filteredAndSorted.length}</strong> {loading || filteredAndSorted.length !== 1 ? 'pieces' : 'piece'}
              </span>
              {activeFilters.length > 0 && (
                <div className="lx-pills">
                  {activeFilters.map((f, i) => (
                    <div key={i} className="lx-pill" onClick={f.clear}>
                      {f.label} <X size={10} strokeWidth={2.5} />
                    </div>
                  ))}
                  <span className="lx-clear-all" onClick={handleReset}>Clear all</span>
                </div>
              )}
            </div>

            <div className="lx-toolbar-right">
              {/* Column/view toggle */}
              <div className="lx-view-group">
                <div className={`lx-vbtn ${columns === 2 && view === 'grid' ? 'on' : ''}`}
                  onClick={() => { setColumns(2); setView('grid'); }} title="2 cols">
                  2
                </div>
                <div className={`lx-vbtn ${columns === 3 && view === 'grid' ? 'on' : ''}`}
                  onClick={() => { setColumns(3); setView('grid'); }} title="3 cols">
                  3
                </div>
                <div className={`lx-vbtn ${columns === 4 && view === 'grid' ? 'on' : ''}`}
                  onClick={() => { setColumns(4); setView('grid'); }} title="4 cols">
                  4
                </div>
                <div className={`lx-vbtn ${view === 'list' ? 'on' : ''}`}
                  onClick={() => setView('list')} title="List">
                  <LayoutList size={13} strokeWidth={2} />
                </div>
              </div>

              {/* Sort */}
              <div className="lx-sort-wrap">
                <button className="lx-sort-btn">
                  {currentSortLabel} <ChevronDown size={12} strokeWidth={2} />
                </button>
                <div className="lx-sort-drop">
                  {sortOptions.map(o => (
                    <div key={o.id} className={`lx-sort-opt ${sortBy === o.id ? 'on' : ''}`}
                      onClick={() => { setSortBy(o.id); updateURL(undefined, undefined, undefined, o.id); }}>
                      {o.label}
                      {sortBy === o.id && <Check size={12} strokeWidth={2.5} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="lx-srch-wrap">
                <div className="lx-srch-btn" onClick={() => setIsSearchOpen(v => !v)}>
                  <Search size={14} strokeWidth={2} />
                </div>
                <div className={`lx-srch-box ${isSearchOpen ? 'open' : ''}`}>
                  <Search size={14} strokeWidth={2} style={{ color: 'var(--mu)', flexShrink: 0 }} />
                  <input
                    autoFocus={isSearchOpen}
                    className="lx-srch-input"
                    placeholder="Search pieces…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && setIsSearchOpen(false)}
                  />
                  <div className="lx-srch-x" onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}>
                    <X size={13} strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className={`lx-grid ${gridClass}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="lx-skel">
                  <div className="lx-skel-img" />
                  <div className="lx-skel-line" style={{ width: '68%' }} />
                  <div className="lx-skel-line" style={{ width: '42%' }} />
                </div>
              ))}
            </div>
          ) : paginated.length > 0 ? (
            <div className={`lx-grid ${gridClass}`}>
              {paginated.map(p => {
                const rawP = products.find(r => r.id === p.id) || p;
                return (
                  <div key={p.id} style={{ height: '100%' }}>
                    <ProductCard product={rawP} view={view} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="lx-empty">
              <div className="lx-empty-ring"><Search size={22} strokeWidth={1.2} /></div>
              <div className="lx-empty-h">No pieces found</div>
              <p className="lx-empty-p">We couldn't find jewellery matching your selection. Try adjusting your filters.</p>
              <button className="lx-empty-btn" onClick={() => { handleReset(); setSearchTerm(''); updateURL('All', 'All', 'All', undefined, undefined, '', ''); }}>
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {filteredAndSorted.length > 0 && (
            <>
              <div className="lx-pager">
                {/* Prev */}
                <button className="lx-pg" disabled={page === 1} onClick={() => goPage(page - 1)}>
                  <ChevronLeft size={14} strokeWidth={2} />
                </button>

                {pagerItems.map((item, i) =>
                  item === '...'
                    ? <span key={`dots-${i}`} className="lx-pg lx-pg-dots">···</span>
                    : (
                      <button
                        key={item}
                        className={`lx-pg ${page === item ? 'on' : ''}`}
                        onClick={() => goPage(item as number)}
                      >
                        {item}
                      </button>
                    )
                )}

                {/* Next */}
                <button className="lx-pg" disabled={page === totalPages} onClick={() => goPage(page + 1)}>
                  <ChevronRight size={14} strokeWidth={2} />
                </button>
              </div>
              <div className="lx-pager-info">
                Page {page} of {totalPages} · {filteredAndSorted.length} pieces
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {typeof document !== 'undefined' && createPortal(
        <div className={`lx-dr-overlay ${isFilterOpen ? 'open' : ''}`} onClick={() => setIsFilterOpen(false)}>
          <div className="lx-drawer" onClick={e => e.stopPropagation()}>
            <div className="lx-dr-head">
              <h2 className="lx-dr-title">Refine <em>Selection</em></h2>
              <div className="lx-dr-close" onClick={() => setIsFilterOpen(false)}>
                <X size={16} strokeWidth={2} />
              </div>
            </div>
            <div className="lx-dr-body">
              <FilterPanel
                category={category} setCategory={setCategory}
                metal={metal} setMetal={setMetal}
                style={style} setStyle={setStyle}
                shape={shape} setShape={setShape}
                minPrice={minPrice} maxPrice={maxPrice}
                setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
                organizedCategories={organizedCategories}
                metals={metals} styleOptions={styleOptions} shapeOptions={shapeOptions}
                onReset={handleReset} onApply={handleApply}
                showFooter={false}
              />
            </div>
            <div className="lx-dr-foot">
              <button className="lx-btn-reset" onClick={handleReset}>
                <RotateCcw size={11} strokeWidth={2} /> Reset
              </button>
              <button className="lx-btn-apply" onClick={handleApply}>Apply Filters</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Sort Sheet */}
      {typeof document !== 'undefined' && createPortal(
        <div className={`lx-sh-overlay ${isSortOpen ? 'open' : ''}`} onClick={() => setIsSortOpen(false)}>
          <div className="lx-sh" onClick={e => e.stopPropagation()}>
            <div className="lx-sh-handle" />
            <div className="lx-sh-title">Sort By</div>
            {sortOptions.map(o => (
              <div key={o.id} className={`lx-sh-opt ${sortBy === o.id ? 'on' : ''}`}
                onClick={() => { setSortBy(o.id); updateURL(undefined, undefined, undefined, o.id); setIsSortOpen(false); }}>
                {o.label}
                {sortBy === o.id && <Check size={15} strokeWidth={2.5} style={{ color: 'var(--a)' }} />}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
      <Footer />
    </div>
  );
}

/* ─── Main component with Suspense boundary ─────────────────────── */
export default function CollectionDetails({ initialProducts }: { initialProducts: any[] }) {
  return (
    <Suspense fallback={null}>
      <CollectionDetailsInner initialProducts={initialProducts} />
    </Suspense>
  );
}
