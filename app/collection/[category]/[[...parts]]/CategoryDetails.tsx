'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer';
import { optionAppliesToCategory } from '@/lib/categoryScope';
import {
  ChevronDown, ChevronRight, Grid3x3, LayoutList, Search,
  X, RotateCcw, Check, ChevronLeft, SlidersHorizontal, Home,
} from 'lucide-react';
import {
  getUser, addToCart, addToWishlist, removeFromWishlist,
} from '@/lib/authStore';
import { useToast } from '@/hooks/use-toast';
import { Price } from '@/components/Price';
import ProductCard, { isSellableProduct } from '@/components/ProductCard';

/* ─── utils ─────────────────────────────────────────────────────── */
function isDisplayableImage(url: string) {
  if (!url || typeof url !== 'string') return false;
  if (/\.(mp4|webm|ogg|mov|avi)([?#]|$)/i.test(url)) return false;
  if (/\.(glb|gltf|usdz|obj|fbx)([?#]|$)/i.test(url)) return false;
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return false;
  return true;
}

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
      const parent = allCategories.find((c: any) => c.id === current.parent_category_id);
      if (parent) { categoryHierarchy.unshift(parent.name); current = parent; } else break;
    }
    if (categoryHierarchy.length > 0) categoryName = categoryHierarchy[categoryHierarchy.length - 1];
  }

  return {
    id: p.id, name: p.name ?? '', category: categoryName, categoryHierarchy,
    style: p.style ?? '', price: Number(p.price ?? 0), price_inr: p.price_inr,
    rating: p.rating || 0, reviews: p.reviews || 0,
    material: p.metal ?? '', image, hoverImage: unique[0] || image,
    tags, slug, description: p.description ?? '',
    stock_quantity: p.stock_quantity ?? 0,
    diamond_shape: p.diamond_shape || '',
    _allImages: [image, ...unique].filter(Boolean),
    // Variant pricing passes through untouched — dropping these makes cards
    // fall back to the bare base price (e.g. ₹0) when the raw lookup misses.
    metal_options: p.metal_options || [],
    size_options: p.size_options || [],
    category_id: p.category_id || null,
    carat_options: p.carat_options || [],
    variant_prices: p.variant_prices || [],
    discount_percent: p.discount_percent,
    label: p.label ?? null,
  };
}

function slugToName(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function nameToSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getPaginationItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | '...')[] = [];
  items.push(1);
  if (current > 3) items.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) items.push(i);
  if (current < total - 2) items.push('...');
  items.push(total);
  return items;
}

/* ─── CSS (AURUM design system — shared with CollectionDetails) ──── */
const CSS = `
/* ══ AURUM DESIGN TOKENS ════════════════════════════════════════════ */
.lx-root {
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

  background:var(--iv);
  color:var(--ink);
  font-family:var(--sans);
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
}
.lx-root *{box-sizing:border-box;}

/* utility — gold gradient text */
.lx-gtext{
  background:var(--gold-text);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
}

/* ══ BREADCRUMB ══════════════════════════════════════════════════════ */
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

/* ══ HERO / CATEGORY HEADER ══════════════════════════════════════════ */
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

/* ══ SUBCATEGORY CHIP BAND ═══════════════════════════════════════════ */
.lx-subcat-band{
  display:flex; align-items:center; gap:9px;
  margin:18px clamp(16px,5vw,72px) 0;
  padding:13px 16px;
  background:var(--w);
  border:1px solid var(--bd);
  border-radius:16px;
  box-shadow:var(--sh-sm);
  overflow-x:auto;
  scrollbar-width:none;
}
.lx-subcat-band::-webkit-scrollbar{ display:none; }
.lx-subcat-label{
  font-family:var(--sans);
  font-size:9.5px; letter-spacing:.26em; text-transform:uppercase;
  color:var(--a); font-weight:700; flex-shrink:0; margin-right:2px;
}
.lx-subcat-chip{
  display:inline-flex; align-items:center; gap:6px;
  padding:9px 16px;
  border:1px solid var(--bd2);
  border-radius:20px;
  font-family:var(--sans);
  font-size:12px; font-weight:500;
  color:var(--mu);
  cursor:pointer; white-space:nowrap;
  transition:all .18s;
  text-decoration:none;
  flex-shrink:0;
  background:var(--w);
  min-height:38px;
}
.lx-subcat-chip:hover{ border-color:var(--a2); color:var(--a); background:var(--al); }
.lx-subcat-chip.on{
  background:var(--grad); color:#fff; border-color:var(--a);
  box-shadow:0 6px 16px rgba(140,116,86,.26);
}
@media (max-width:480px){
  .lx-subcat-band{ margin:16px 14px 0; padding:12px 14px; }
}

/* ══ MOBILE STICKY TOOLBAR ═══════════════════════════════════════════ */
.lx-mobile-bar{
  display:none;
  position:sticky;
  top:62px;
  z-index:140;
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
    padding:24px clamp(14px,5vw,72px) 120px;
    gap:0;
  }
}
@media (max-width:480px){
  .lx-layout{ padding:20px 14px 120px; }
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

/* checkbox */
.lx-chk{
  width:17px; height:17px;
  border:1.5px solid var(--bd2);
  border-radius:5px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  transition:all .18s; position:relative; background:var(--w);
}
.lx-chk-tick{
  display:none; width:8px; height:5px;
  border-left:1.5px solid #fff; border-bottom:1.5px solid #fff;
  transform:rotate(-45deg) translateY(-1px);
}

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
  z-index:1000;
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
  z-index:1000;
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
}
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
function FRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; }) {
  return (
    <div className={`lx-f-row ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="lx-chk"><span className="lx-chk-tick" /></span>
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

/* ─── Sub-category sidebar rows ─────────────────────────────────── */
function SubCatRows({ childCategories, selectedSubCat, onSelect }: {
  childCategories: any[];
  selectedSubCat: string | null;
  onSelect: (name: string | null) => void;
}) {
  if (!childCategories.length) return null;
  return (
    <Acc label="Sub-Category" defaultOpen>
      <FRow label="All" active={selectedSubCat === null} onClick={() => onSelect(null)} />
      {childCategories.map((child: any) => (
        <FRow key={child.id} label={child.name} active={selectedSubCat === child.name} onClick={() => onSelect(child.name)} />
      ))}
    </Acc>
  );
}

/* ─── Filter panel (shared between sidebar + drawer) ────────────── */
function FilterPanel({
  childCategories, selectedSubCat, onSubCat,
  metal, setMetal, style, setStyle, shape, setShape,
  minPrice, maxPrice, setMinPrice, setMaxPrice,
  metals, styleOptions, shapeOptions, onReset, onApply, showFooter = true,
}: {
  childCategories: any[]; selectedSubCat: string | null; onSubCat: (v: string | null) => void;
  metal: string; setMetal: (v: string) => void;
  style: string; setStyle: (v: string) => void;
  shape: string; setShape: (v: string) => void;
  minPrice: string; maxPrice: string;
  setMinPrice: (v: string) => void; setMaxPrice: (v: string) => void;
  metals: string[];
  styleOptions: { key: string; name: string }[];
  shapeOptions: { key: string; name: string }[];
  onReset: () => void; onApply: () => void;
  showFooter?: boolean;
}) {
  return (
    <>
      {childCategories.length > 0 && (
        <SubCatRows childCategories={childCategories} selectedSubCat={selectedSubCat} onSelect={onSubCat} />
      )}

      <Acc label="Price" defaultOpen>
        <PriceFilter
          minPrice={minPrice} maxPrice={maxPrice}
          setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
        />
      </Acc>

      <Acc label="Material" defaultOpen>
        {metals.map(m => <FRow key={m} label={m} active={metal === m} onClick={() => setMetal(m)} />)}
      </Acc>

      {styleOptions.length > 0 && (
        <Acc label="Style">
          <FRow label="All" active={style === 'All'} onClick={() => setStyle('All')} />
          {styleOptions.map(s => <FRow key={s.key} label={s.name} active={style === s.key} onClick={() => setStyle(s.key)} />)}
        </Acc>
      )}

      {shapeOptions.length > 0 && (
        <Acc label="Shape">
          <FRow label="All" active={shape === 'All'} onClick={() => setShape('All')} />
          {shapeOptions.map(s => <FRow key={s.key} label={s.name} active={shape === s.key} onClick={() => setShape(s.key)} />)}
        </Acc>
      )}

      {showFooter && (
        <div className="lx-sidebar-footer">
          <button className="lx-btn-apply" onClick={onApply}>Apply Filters</button>
          <button className="lx-btn-reset" onClick={onReset}>
            <RotateCcw size={11} strokeWidth={2} /> Reset all
          </button>
        </div>
      )}
    </>
  );
}

/* ─── Inner component that uses searchParams ───────────────────── */
function CategoryPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const categorySlug = params?.category as string;
  const parts = params?.parts as string[] | undefined;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [columns, setColumns] = useState<2 | 3 | 4>(3);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [parentCategory, setParentCategory] = useState<any>(null);
  const [childCategories, setChildCategories] = useState<any[]>([]);
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);

  const [metal, setMetal] = useState(searchParams.get('metal') || 'All');
  const [style, setStyle] = useState(searchParams.get('style') || 'All');
  const [shape, setShape] = useState(searchParams.get('shape') || 'All');
  // Raw style rows kept whole; the filter list is the category-scoped view so
  // a Necklaces page never offers ring-only styles.
  const [styleRows, setStyleRows] = useState<any[]>([]);
  const [shapeOptions, setShapeOptions] = useState<{ key: string; name: string }[]>([]);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Active category UUID: the sub-category chip is a *name*, so resolve it
  // through the category list; no active category (e.g. "All") keeps every
  // style visible rather than blanking the filter.
  const activeCatId = String(
    selectedSubCat
      ? (categories.find(c => c.name === selectedSubCat) || {}).id || currentCategory?.id || ''
      : currentCategory?.id || ''
  );
  const styleOptions = useMemo(
    () => styleRows
      .filter(x => x.is_enabled !== false)
      .filter(x => !activeCatId || optionAppliesToCategory(x, activeCatId))
      .map(x => ({ key: x.key, name: x.name })),
    [styleRows, activeCatId]
  );

  const metals = ['All', '14K Yellow Gold', '18K Yellow Gold', '14K White Gold', '18K White Gold', 'Rose Gold', 'Platinum'];
  const sortOptions = [
    { id: 'newest', label: 'Newest First' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'rating', label: 'Customer Rating' },
  ];

  // Redirect if product path
  useEffect(() => {
    if (parts && parts.length > 0) {
      router.replace(`/products/${parts[0]}`);
    }
  }, [parts, router]);

  // Load categories + admin-managed Style / Shape lists
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(console.error);
    fetch('/api/styles')
      .then(r => r.json())
      .then(d => setStyleRows(Array.isArray(d) ? d.filter((x: any) => x.is_enabled !== false) : []))
      .catch(() => { });
    fetch('/api/diamond-shapes')
      .then(r => r.json())
      .then(d => setShapeOptions(Array.isArray(d) ? d.filter((x: any) => x.is_enabled !== false).map((x: any) => ({ key: x.key, name: x.name })) : []))
      .catch(() => { });
  }, []);

  // Resolve current category from slug
  useEffect(() => {
    if (!categories.length || !categorySlug) return;
    let found = categories.find((c: any) => c.slug === categorySlug);
    if (!found) {
      const nameGuess = slugToName(categorySlug);
      found = categories.find((c: any) => c.name.toLowerCase() === nameGuess.toLowerCase());
    }
    if (found) {
      setCurrentCategory(found);
      if (found.parent_category_id) {
        const parent = categories.find((c: any) => c.id === found.parent_category_id);
        setParentCategory(parent || null);
        setChildCategories([]);
      } else {
        const children = categories.filter((c: any) => c.parent_category_id === found.id);
        setChildCategories(children);
        setParentCategory(null);
      }
    }
  }, [categories, categorySlug]);

  // Fetch products when category resolved
  // Fetch products when category resolved (one automatic retry — a single
  // transient failure must never blank the grid; HTTP errors are retried,
  // and an unresolvable slug stops the skeleton via the guard above).
  const fetchProducts = useCallback(async () => {
    if (!currentCategory) { if (categories.length > 0) setLoading(false); return; }
    setLoading(true);
    const buildUrl = () => {
      const p = new URLSearchParams();
      if (metal !== 'All') p.append('metal', metal);
      if (style !== 'All') p.append('style', style);
      if (shape !== 'All') p.append('shape', shape);
      p.append('sort', sortBy);
      p.append('limit', '1000');
      return `/api/products?${p.toString()}`;
    };
    const loadOnce = async () => {
      const res = await fetch(buildUrl(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.products || []);
    };
    const applyCategoryFilter = (list: any[]) => {
      const isChild = !!currentCategory.parent_category_id;
      if (isChild) {
        return list.filter((p: any) => (p.category_id || p.categories?.id) === currentCategory.id);
      }
      const childIds = childCategories.map((c: any) => c.id);
      const ids = [currentCategory.id, ...childIds];
      return list.filter((p: any) => ids.includes(p.category_id || p.categories?.id));
    };
    try {
      setProducts(applyCategoryFilter(await loadOnce()));
    } catch (err) {
      console.error(err);
      try {
        await new Promise(r => setTimeout(r, 900));
        setProducts(applyCategoryFilter(await loadOnce()));
      } catch (err2) { console.error(err2); }
    }
    finally { setLoading(false); }
  }, [currentCategory, childCategories, categories, metal, style, shape, sortBy]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* Safety net: never spin skeletons forever on a hung request — after 25s
     fall back to the empty state (its reset button refetches). */
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 25000);
    return () => clearTimeout(t);
  }, [loading]);

  const filteredAndSorted = useMemo(() => {
    let r = products.map((p: any) => mapProduct(p, categories));

    // Hide true junk only (shared variant-aware check: base 0 is fine when
    // priced variants exist — same rule as the main collection page).
    r = r.filter(isSellableProduct);

    // Sub-category filter (client-side)
    if (selectedSubCat) {
      r = r.filter(p => p.category === selectedSubCat || p.categoryHierarchy?.includes(selectedSubCat));
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    const min = minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== '' ? Number(maxPrice) : null;
    if (min !== null && !Number.isNaN(min)) r = r.filter(p => p.price >= min);
    if (max !== null && !Number.isNaN(max)) r = r.filter(p => p.price <= max);

    if (sortBy === 'price-low') r.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') r.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') r.sort((a, b) => b.rating - a.rating);
    return r;
  }, [products, searchTerm, sortBy, categories, selectedSubCat, minPrice, maxPrice]);

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, page]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));
  const pagerItems = getPaginationItems(page, totalPages);

  const updateURL = (nm?: string, ns?: string, nsort?: string, nmin?: string, nmax?: string, nshape?: string) => {
    const p = new URLSearchParams(searchParams);
    if (nm !== undefined) { if (nm === 'All') p.delete('metal'); else p.set('metal', nm); }
    if (ns !== undefined) { if (ns === 'All') p.delete('style'); else p.set('style', ns); }
    if (nshape !== undefined) { if (nshape === 'All') p.delete('shape'); else p.set('shape', nshape); }
    if (nmin !== undefined) { if (nmin === '') p.delete('minPrice'); else p.set('minPrice', nmin); }
    if (nmax !== undefined) { if (nmax === '') p.delete('maxPrice'); else p.set('maxPrice', nmax); }
    if (nsort) p.set('sort', nsort);
    router.push(`/collection/${categorySlug}?${p.toString()}`, { scroll: false });
  };

  const handleReset = () => { setMetal('All'); setStyle('All'); setShape('All'); setSelectedSubCat(null); setMinPrice(''); setMaxPrice(''); };
  const handleApply = () => { updateURL(metal, style, undefined, minPrice, maxPrice, shape); setIsFilterOpen(false); };
  const goPage = (pg: number) => { setPage(pg); window.scrollTo({ top: 280, behavior: 'smooth' }); };

  const catDisplayName = currentCategory?.name || slugToName(categorySlug || '');

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
  const activeFilterCount = [
    metal !== 'All', style !== 'All', shape !== 'All', selectedSubCat !== null, priceActive,
  ].filter(Boolean).length;

  const activeFilters = [
    ...(selectedSubCat ? [{ label: selectedSubCat, clear: () => setSelectedSubCat(null) }] : []),
    ...(metal !== 'All' ? [{ label: metal, clear: () => setMetal('All') }] : []),
    ...(style !== 'All' ? [{ label: styleLabel, clear: () => setStyle('All') }] : []),
    ...(shape !== 'All' ? [{ label: shapeLabel, clear: () => setShape('All') }] : []),
    ...(priceActive ? [{ label: priceLabel, clear: () => { setMinPrice(''); setMaxPrice(''); } }] : []),
  ];

  const currentSortLabel = sortOptions.find(o => o.id === sortBy)?.label ?? 'Sort';
  const gridClass = view === 'list' ? 'cl' : `c${columns}`;

  if (parts && parts.length > 0) return null;

  return (
    <div className="lx-root">
      <style>{CSS}</style>
      <HeaderMegaMenu />

      {/* Breadcrumb */}
      <nav className="lx-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="lx-breadcrumb-home"><Home size={13} strokeWidth={1.8} /> Home</Link>
        <ChevronRight size={13} strokeWidth={2} className="lx-breadcrumb-sep" />
        <Link href="/collection">Collection</Link>
        {parentCategory && (
          <>
            <ChevronRight size={13} strokeWidth={2} className="lx-breadcrumb-sep" />
            <Link href={`/collection/${parentCategory.slug || nameToSlug(parentCategory.name)}`}>{parentCategory.name}</Link>
          </>
        )}
        <ChevronRight size={13} strokeWidth={2} className="lx-breadcrumb-sep" />
        <span className="lx-breadcrumb-current">{catDisplayName}</span>
      </nav>

      {/* Header / Hero */}
      <header className="lx-col-header">
        <div>
          <div className="lx-col-eyebrow">
            {parentCategory ? parentCategory.name : 'Fine Jewellery'}
          </div>
          <h1 className="lx-col-title"><em>{catDisplayName}</em></h1>
          <p className="lx-col-desc">
            Explore our exquisite {catDisplayName.toLowerCase()} collection, each piece handcrafted with uncompromising precision and timeless beauty.
          </p>
        </div>
        <div className="lx-col-stat">
          <div className="lx-col-stat-num">{filteredAndSorted.length}</div>
          <div className="lx-col-stat-lbl">Pieces</div>
        </div>
      </header>

      {/* Sub-category chips — only for parent categories with children */}
      {!currentCategory?.parent_category_id && childCategories.length > 0 && (
        <div className="lx-subcat-band">
          <span className="lx-subcat-label">Browse:</span>
          <div
            className={`lx-subcat-chip ${selectedSubCat === null ? 'on' : ''}`}
            onClick={() => setSelectedSubCat(null)}
          >
            All {catDisplayName}
          </div>
          {childCategories.map((child: any) => (
            <div
              key={child.id}
              className={`lx-subcat-chip ${selectedSubCat === child.name ? 'on' : ''}`}
              onClick={() => setSelectedSubCat(selectedSubCat === child.name ? null : child.name)}
            >
              {child.name}
            </div>
          ))}
        </div>
      )}

      {/* Mobile sticky bar */}
      <div className="lx-mobile-bar">
        <button className="lx-mb-btn" onClick={() => setIsFilterOpen(true)}>
          <SlidersHorizontal size={13} strokeWidth={2} />
          Filters
          {activeFilterCount > 0 && <span className="lx-mb-badge">{activeFilterCount}</span>}
        </button>
        <button className="lx-mb-btn" onClick={() => setIsSortOpen(true)}>
          <ChevronDown size={13} strokeWidth={2} /> Sort
        </button>
        <span className="lx-mb-count">{filteredAndSorted.length} items</span>
      </div>

      {/* Layout */}
      <div className="lx-layout">

        {/* Desktop Sidebar */}
        <aside className="lx-sidebar">
          <div className="lx-sidebar-head">
            <span className="lx-sidebar-title">Refine</span>
            {activeFilterCount > 0 && (
              <span className="lx-sidebar-clear" onClick={handleReset}>Clear all</span>
            )}
          </div>
          <FilterPanel
            childCategories={childCategories}
            selectedSubCat={selectedSubCat} onSubCat={setSelectedSubCat}
            metal={metal} setMetal={setMetal}
            style={style} setStyle={setStyle}
            shape={shape} setShape={setShape}
            minPrice={minPrice} maxPrice={maxPrice}
            setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
            metals={metals} styleOptions={styleOptions} shapeOptions={shapeOptions}
            onReset={handleReset} onApply={handleApply}
          />
        </aside>

        {/* Main Products */}
        <main className="lx-main">

          {/* Toolbar */}
          <div className="lx-toolbar">
            <div className="lx-toolbar-left">
              <span className="lx-count">
                <strong>{filteredAndSorted.length}</strong> {filteredAndSorted.length === 1 ? 'piece' : 'pieces'}
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
              {/* View controls */}
              <div className="lx-view-group">
                <div className={`lx-vbtn ${columns === 2 && view === 'grid' ? 'on' : ''}`} onClick={() => { setColumns(2); setView('grid'); }} title="2 cols">2</div>
                <div className={`lx-vbtn ${columns === 3 && view === 'grid' ? 'on' : ''}`} onClick={() => { setColumns(3); setView('grid'); }} title="3 cols">3</div>
                <div className={`lx-vbtn ${columns === 4 && view === 'grid' ? 'on' : ''}`} onClick={() => { setColumns(4); setView('grid'); }} title="4 cols">4</div>
                <div className={`lx-vbtn ${view === 'list' ? 'on' : ''}`} onClick={() => setView('list')} title="List">
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
                      onClick={() => { setSortBy(o.id); updateURL(undefined, undefined, o.id); }}>
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
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="lx-skel">
                  <div className="lx-skel-img" />
                  <div className="lx-skel-line" style={{ width: '68%' }} />
                  <div className="lx-skel-line" style={{ width: '42%' }} />
                </div>
              ))}
            </div>
          ) : paginated.length > 0 ? (
            <div className={`lx-grid ${gridClass}`}>
              {paginated.map((p: any) => {
                const rawP = products.find((r: any) => r.id === p.id) || p;
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
              <button className="lx-empty-btn" onClick={() => { handleReset(); setSearchTerm(''); }}>
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <div className="lx-pager">
                <button className="lx-pg" disabled={page === 1} onClick={() => goPage(page - 1)}>
                  <ChevronLeft size={14} strokeWidth={2} />
                </button>
                {pagerItems.map((item, i) =>
                  item === '...'
                    ? <span key={`d${i}`} className="lx-pg lx-pg-dots">···</span>
                    : (
                      <button key={item} className={`lx-pg ${page === item ? 'on' : ''}`} onClick={() => goPage(item as number)}>
                        {item}
                      </button>
                    )
                )}
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
                childCategories={childCategories}
                selectedSubCat={selectedSubCat} onSubCat={setSelectedSubCat}
                metal={metal} setMetal={setMetal}
                style={style} setStyle={setStyle}
                shape={shape} setShape={setShape}
                minPrice={minPrice} maxPrice={maxPrice}
                setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
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
                onClick={() => { setSortBy(o.id); updateURL(undefined, undefined, o.id); setIsSortOpen(false); }}>
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

/* ─── Page export (Suspense boundary for useSearchParams) ─────────── */
export default function CategoryDetails() {
  return (
    <Suspense fallback={null}>
      <CategoryPageInner />
    </Suspense>
  );
}
