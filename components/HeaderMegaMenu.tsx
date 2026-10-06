'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  ShoppingBag, User, X, Phone, Mail, ChevronDown, ArrowRight,
  Sparkles, ShoppingBag as ShoppingBagIcon, Link as LinkIcon, Headphones,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  getUser, getCart, getWishlist, getSettings, fetchAndSyncSettings, type SiteSettings,
  getCurrency, setCurrency, type Currency,
} from '@/lib/authStore'

const CURRENCIES: { code: Currency; sym: string; label: string }[] = [
  { code: 'USD', sym: '$', label: 'USD' },
  { code: 'INR', sym: '₹', label: 'INR' },
]

type Category = {
  id: string
  name: string
  slug: string
  parent_category_id: string | null
  show_in_header: boolean
  header_order: number
  header_image_url: string | null
  header_description: string | null
  image_url?: string | null
}

type MegaMenuSection = {
  id: string
  category_id: string
  title: string
  section_order: number
  section_type: 'categories' | 'links' | 'image'
  data: any
  custom_links?: any[]
  image_url: string | null
}

type HeaderConfig = {
  id: string
  logo_url: string | null
  logo_text: string
  show_search: boolean
  show_cart: boolean
  show_account: boolean
  phone_number: string | null
  email: string | null
  show_consultant?: boolean
  consultant_text?: string | null
  consultant_url?: string | null
}

const QUICK = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Collection', href: '/collection' },
]

const HEX_RE = /^#([0-9a-f]{3}){1,2}$/i
const isImg = (s?: string | null) => !!s && /^https?:\/\//i.test(s)

type Snapshot = {
  categories: Category[]
  config: HeaderConfig | null
  sections: Record<string, MegaMenuSection[]>
}
let CACHE: Snapshot | null = null

const Glyph = ({ icon, size = 18 }: { icon?: string | null; size?: number }) => {
  if (!icon) return null
  if (HEX_RE.test(icon)) {
    return <span aria-hidden="true" className="hm-swatch" style={{ width: size, height: size, background: icon }} />
  }
  switch (icon) {
    case 'sparkles': return <Sparkles size={size} />
    case 'shopping-bag': return <ShoppingBagIcon size={size} />
    case 'link': return <LinkIcon size={size} />
    case 'star': return <span style={{ fontSize: size }}>⭐</span>
    case 'heart': return <span style={{ fontSize: size }}>❤️</span>
    case 'gift': return <span style={{ fontSize: size }}>🎁</span>
    case 'trending': return <span style={{ fontSize: size }}>🔥</span>
    default: return null
  }
}

/* ── crisp 1.5-stroke glyphs for the mobile bottom nav ── */
const NavHome = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.2 10.3 12 3.4l8.8 6.9" />
    <path d="M5 9.4V19a1.4 1.4 0 0 0 1.4 1.4h11.2A1.4 1.4 0 0 0 19 19V9.4" />
    <path d="M9.6 20.4v-5.2a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v5.2" />
  </svg>
)
const NavGem = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12l4 6-10 13L2 9Z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </svg>
)
const NavChat = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 11.5a7.7 7.7 0 0 1-11 7L4 20l1.6-5a7.7 7.7 0 1 1 14.9-3.5Z" />
    <path d="M8.6 11.6h.01M12 11.6h.01M15.4 11.6h.01" strokeWidth="2.1" />
  </svg>
)
const NavHeart = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20.4S3.6 15.6 3.6 9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8.4 2c0 6-8.4 10.8-8.4 10.8Z" />
  </svg>
)
/* Boutique bag — tapered silhouette, arched handles. Clean outline (no seal)
   so the centered count badge can sit in its middle with strokes over it. */
const NavBag = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.2 8.2h13.6l-1.1 12.1a1 1 0 0 1-1 .9H7.3a1 1 0 0 1-1-.9L5.2 8.2Z" />
    <path d="M9 8.2V6.8a3 3 0 0 1 6 0v1.4" />
  </svg>
)
const NavUser = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8.2" r="3.6" />
    <path d="M4.8 20c0-3.8 3.2-6.4 7.2-6.4s7.2 2.6 7.2 6.4" />
  </svg>
)

/* ════════════════════════════════════════════════════════════════════
   CSS — warm ivory/taupe-gold palette
════════════════════════════════════════════════════════════════════ */
const CSS = `
/* palette + tokens — shared by ALL root nodes.
   .hm-mobile / .hm-overlay / .hm-bn render OUTSIDE <header class="hm">, so the
   custom properties MUST live on a selector that covers them too, otherwise the
   mobile panel's background:var(--hm-iv) resolves to nothing → transparent. */
.hm,.hm-mobile,.hm-overlay,.hm-bn{
  --hm-w:#fff;--hm-iv:#fdfcf9;--hm-cream:#f8f4ee;--hm-warm:#efe9df;--hm-bd:#e6ded2;
  --hm-gold:#8c7456;--hm-gold2:#a8916f;--hm-gold3:#c9b68f;--hm-ink:#3a2e22;
  --hm-mut:rgba(58,46,34,.56);--hm-fa:rgba(58,46,34,.34);--hm-li:rgba(58,46,34,.08);
  --hm-serif:var(--font-playfair),'Cormorant Garamond',Georgia,serif;
  --hm-sans:var(--font-dmsans),'Jost',system-ui,sans-serif;
  --hm-e:cubic-bezier(.22,1,.36,1);
  --hm-spring:cubic-bezier(.34,1.56,.64,1);
}
.hm{
  position:sticky;top:0;z-index:1000;background:var(--hm-w);
  transition:transform .42s var(--hm-e);will-change:transform;
}
.hm.hm--hidden{transform:translateY(-100%);}
.hm *,.hm-mobile *,.hm-bn *{box-sizing:border-box;}
.hm a:focus-visible,.hm button:focus-visible{
  outline:2px solid var(--hm-gold);outline-offset:2px;border-radius:6px;
}

/* ── row 1 : quick-links / logo / actions ── */
.hm-bar{position:relative;border-bottom:1px solid var(--hm-bd);transition:box-shadow .3s ease;}
.hm.hm--scrolled .hm-bar{box-shadow:0 6px 24px -12px rgba(58,46,34,.16);}
.hm-bar-inner{
  max-width:1440px;margin:0 auto;padding:0 28px;height:84px;
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;
}
@media(max-width:1023px){.hm-bar-inner{height:62px;padding:0 10px;gap:8px;}}
@media(max-width:380px){.hm-bar-inner{padding:0 6px;gap:4px;}}

.hm-left{display:flex;align-items:center;gap:6px;min-width:0;height:100%;}

.hm-burger{
  display:none;width:44px;height:44px;flex-shrink:0;border:none;background:transparent;
  cursor:pointer;color:var(--hm-ink);border-radius:12px;align-items:center;justify-content:center;
  transition:background .2s ease,transform .18s var(--hm-spring);-webkit-tap-highlight-color:transparent;
}
.hm-burger:active{transform:scale(.9);}
.hm-burger.open{color:var(--hm-gold);}
.hm-burger-box{position:relative;width:20px;height:14px;}
.hm-burger-line{
  position:absolute;left:0;height:2px;width:100%;border-radius:2px;background:currentColor;
  transition:transform .42s var(--hm-spring),opacity .2s ease,width .42s var(--hm-spring);
}
.hm-burger-line:nth-child(1){top:0;}
.hm-burger-line:nth-child(2){top:50%;transform:translateY(-50%);width:74%;}
.hm-burger-line:nth-child(3){bottom:0;}
.hm-burger.open .hm-burger-line:nth-child(1){top:50%;transform:translateY(-50%) rotate(45deg);}
.hm-burger.open .hm-burger-line:nth-child(2){opacity:0;width:0;}
.hm-burger.open .hm-burger-line:nth-child(3){bottom:auto;top:50%;transform:translateY(-50%) rotate(-45deg);}
@media(max-width:1023px){.hm-burger{display:inline-flex;}}

.hm-ql{display:flex;align-items:center;height:100%;gap:2px;}
.hm-ql-a{
  position:relative;display:inline-flex;align-items:center;height:100%;padding:0 13px;
  font-family:var(--hm-sans);font-size:11px;font-weight:600;letter-spacing:.16em;
  text-transform:uppercase;color:var(--hm-mut);text-decoration:none;white-space:nowrap;
  transition:color .22s ease;
}
.hm-ql-a::after{
  content:'';position:absolute;left:13px;right:13px;bottom:24px;height:1.5px;border-radius:1px;
  background:linear-gradient(90deg,var(--hm-gold),var(--hm-gold2));
  transform:scaleX(0);transform-origin:left;transition:transform .32s var(--hm-e);
}
.hm-ql-a:hover,.hm-ql-a.on{color:var(--hm-ink);}
.hm-ql-a:hover::after,.hm-ql-a.on::after{transform:scaleX(1);}
@media(max-width:1180px){.hm-ql-a{padding:0 10px;letter-spacing:.12em;}}
@media(max-width:1023px){.hm-ql{display:none;}}

.hm-logo{text-decoration:none;color:inherit;display:inline-flex;align-items:center;justify-self:center;min-width:0;}
.hm-logo img{height:46px;max-width:200px;width:auto;object-fit:contain;display:block;}
.hm-logo-txt{
  margin:0;font-family:var(--hm-serif);font-size:clamp(19px,2.3vw,28px);font-weight:500;
  color:var(--hm-ink);letter-spacing:.16em;white-space:nowrap;line-height:1;
}
/* Reserves the logo's footprint while the config is still in flight so the
   bar doesn't reflow — and so no wordmark flashes before the image lands. */
.hm-logo-ph{display:block;width:clamp(120px,16vw,190px);height:46px;}
@media(max-width:1023px){
  .hm-logo{max-width:48vw;}
  .hm-logo img{height:32px;max-width:150px;}
  .hm-logo-txt{font-size:clamp(15px,4.4vw,20px);letter-spacing:.1em;}
  .hm-logo-ph{width:clamp(96px,32vw,150px);height:32px;}
}
@media(max-width:380px){.hm-logo{max-width:42vw;}}

.hm-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px;min-width:0;}

/* ── action icons (account / cart) ──
   Cream plate + gold hairline at rest, filling to the gold gradient on hover.
   The glyph flips to white in the same beat so contrast never dips. */
.hm-ic{
  width:43px;height:43px;border-radius:13px;cursor:pointer;
  border:1px solid var(--hm-bd);
  background:linear-gradient(160deg,var(--hm-w),var(--hm-cream));
  display:inline-flex;align-items:center;justify-content:center;color:var(--hm-ink);
  text-decoration:none;position:relative;
  box-shadow:0 1px 3px -1px rgba(58,46,34,.12),inset 0 1px 0 rgba(255,255,255,.8);
  transition:color .22s ease,border-color .22s ease,box-shadow .28s var(--hm-e),transform .18s var(--hm-spring);
  -webkit-tap-highlight-color:transparent;flex-shrink:0;
}
.hm-ic::before{
  content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(135deg,var(--hm-gold),var(--hm-gold2));
  opacity:0;transition:opacity .24s ease;
}
.hm-ic > svg,.hm-ic > span{position:relative;z-index:1;}
.hm-ic:hover{color:#fff;border-color:transparent;transform:translateY(-1px);
  box-shadow:0 8px 18px -9px rgba(140,116,86,.7);}
.hm-ic:hover::before{opacity:1;}
.hm-ic:active{transform:translateY(0) scale(.94);}
@media(max-width:1023px){.hm-ic{width:41px;height:41px;border-radius:12px;}}
@media(max-width:380px){.hm-ic{width:38px;height:38px;border-radius:11px;}}

/* count badge — sits FULLY outside the button, touching its top-right corner.
   Icon stays perfectly centered and untouched; badge takes no layout space. */
.hm-ic-badge{
  position:absolute;top:-16px;right:-16px;z-index:3;min-width:16px;height:16px;padding:0 4px;border-radius:10px;
  background:linear-gradient(135deg,var(--hm-gold),var(--hm-gold2));color:#fff;
  font-family:var(--hm-sans);font-size:9px;font-weight:700;line-height:1;letter-spacing:.01em;
  font-variant-numeric:tabular-nums;
  display:inline-flex;align-items:center;justify-content:center;
  border:1.5px solid var(--hm-w);box-shadow:0 3px 8px -2px rgba(58,46,34,.5);
  animation:hmBadgePop .38s var(--hm-spring);pointer-events:none;
}
/* smaller screens: button shrinks (41px/38px) so the badge steps down too,
   keeping the same inside-corner balance instead of crowding the icon */
@media(max-width:1023px){.hm-ic-badge{min-width:15px;height:15px;font-size:8.5px;top:-15px;right:-15px;}}
@media(max-width:380px){.hm-ic-badge{min-width:14px;height:14px;font-size:8px;top:-14px;right:-14px;border-width:1px;}}
.hm-ic:hover .hm-ic-badge{background:linear-gradient(135deg,var(--hm-gold),var(--hm-gold2));}
@keyframes hmBadgePop{0%{transform:scale(0);}60%{transform:scale(1.18);}100%{transform:scale(1);}}

.hm-consultant{
  display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 20px;margin-left:4px;
  border-radius:24px;background:var(--hm-cream);border:1px solid var(--hm-bd);
  text-decoration:none;color:var(--hm-ink);font-family:var(--hm-sans);font-size:13px;
  font-weight:600;letter-spacing:.03em;white-space:nowrap;
  transition:background .2s ease,border-color .2s ease,transform .16s var(--hm-spring);flex-shrink:0;
}

.hm-consultant-ic{
  width:32px;height:32px;border-radius:50%;background:var(--hm-w);flex-shrink:0;
  display:inline-flex;align-items:center;justify-content:center;color:var(--hm-gold);
}
/* small-desktop (1024–1180): drop the label but keep a chunky, well-padded pill
   button — "meet a consultant" stays prominent as a solid icon button. */
@media(max-width:1180px){
  .hm-consultant-tx{display:none;}
  .hm-consultant{padding:0 16px;height:50px;width:auto;justify-content:center;margin-left:6px;
    background:var(--hm-cream);border-color:var(--hm-bd);box-shadow:0 4px 14px -8px rgba(58,46,34,.3);}
  .hm-consultant:hover{background:var(--hm-w);border-color:var(--hm-gold2);transform:translateY(-1px);}
  .hm-consultant-ic{background:var(--hm-w);width:36px;height:36px;box-shadow:0 2px 6px -2px rgba(58,46,34,.2);}
}
@media(max-width:1023px){.hm-consultant{display:none;}}

/* ── currency segmented toggle ── */
.hm-cur{
  position:relative;display:inline-flex;align-items:center;height:38px;padding:3px;margin-right:2px;
  border-radius:22px;background:var(--hm-cream);border:1px solid var(--hm-bd);
  box-shadow:inset 0 1px 2px rgba(58,46,34,.05);flex-shrink:0;
}
.hm-cur-thumb{
  position:absolute;top:3px;left:3px;width:calc(50% - 3px);height:calc(100% - 6px);border-radius:18px;
  background:linear-gradient(135deg,var(--hm-gold),var(--hm-gold2));
  box-shadow:0 4px 12px -4px rgba(140,116,86,.7);
  transition:transform .38s var(--hm-spring);will-change:transform;pointer-events:none;
}
.hm-cur-thumb[data-cur="INR"]{transform:translateX(100%);}
.hm-cur-b{
  position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;
  height:100%;padding:0 14px;border:none;background:transparent;cursor:pointer;
  font-family:var(--hm-sans);font-size:12px;font-weight:700;letter-spacing:.05em;
  color:var(--hm-mut);transition:color .28s ease;-webkit-tap-highlight-color:transparent;white-space:nowrap;
}
.hm-cur-b:active{transform:scale(.94);}
.hm-cur-b.on{color:#fff;}
.hm-cur-sym{font-size:13.5px;font-weight:800;line-height:1;}
/* small-desktop: shrink the currency toggle to symbols-only so the consultant
   button can breathe. */
@media(max-width:1180px){
  /* keep padding:3px so the absolutely-positioned thumb (top/left:3px) stays aligned */
  .hm-cur{height:34px;margin-right:0;}
  .hm-cur-tx{display:none;}
  .hm-cur-b{padding:0 9px;font-size:11.5px;}
  .hm-cur-sym{font-size:12.5px;}
  .hm-cur-thumb{border-radius:16px;box-shadow:0 3px 9px -3px rgba(140,116,86,.6);}
}
@media(max-width:1023px){.hm-cur{display:none;}} /* hidden in bar on mobile → lives in the slide menu */

/* ── currency toggle · inside the mobile slide menu (full width, labelled) ── */
.hm-mcur{display:flex;padding:14px 16px 4px;}
.hm-mcur-seg{
  position:relative;display:flex;flex:1;height:52px;padding:4px;border-radius:26px;
  background:var(--hm-cream);border:1px solid var(--hm-bd);box-shadow:inset 0 1px 2px rgba(58,46,34,.05);
}
.hm-mcur-thumb{
  position:absolute;top:4px;left:4px;width:calc(50% - 4px);height:calc(100% - 8px);border-radius:22px;
  background:linear-gradient(135deg,var(--hm-gold),var(--hm-gold2));
  box-shadow:0 6px 16px -6px rgba(140,116,86,.75);
  transition:transform .38s var(--hm-spring);will-change:transform;pointer-events:none;
}
.hm-mcur-thumb[data-cur="INR"]{transform:translateX(100%);}
.hm-mcur-b{
  position:relative;z-index:1;flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  border:none;background:transparent;cursor:pointer;font-family:var(--hm-sans);font-size:14px;font-weight:700;
  letter-spacing:.04em;color:var(--hm-mut);transition:color .28s ease;-webkit-tap-highlight-color:transparent;
}
.hm-mcur-b.on{color:#fff;}
.hm-mcur-b:active{transform:scale(.97);}
.hm-mcur-sym{font-size:17px;font-weight:800;line-height:1;}

/* ── row 2 : category nav ── */
.hm-navbar{position:relative;border-bottom:1px solid var(--hm-bd);}
.hm-navbar-inner{
  max-width:1440px;margin:0 auto;padding:0 32px;
  display:flex;justify-content:center;align-items:stretch;gap:2px;flex-wrap:wrap;min-height:50px;
}
@media(max-width:1023px){.hm-navbar{display:none;}}

.hm-nav-item{position:static;display:flex;align-items:stretch;}
.hm-nav-link{
  display:inline-flex;align-items:center;height:50px;padding:0 20px;
  font-family:var(--hm-sans);font-size:12.5px;font-weight:600;letter-spacing:.1em;
  text-transform:uppercase;color:var(--hm-ink);text-decoration:none;position:relative;
  transition:color .2s ease;white-space:nowrap;gap:6px;
}
.hm-nav-link .hm-nav-chev{opacity:.4;transition:transform .3s var(--hm-e),opacity .2s ease;}
.hm-nav-item:hover .hm-nav-chev{transform:rotate(180deg);opacity:.7;}
.hm-nav-link::after{
  content:'';position:absolute;left:20px;right:20px;bottom:9px;height:2px;border-radius:1px;
  background:linear-gradient(90deg,var(--hm-gold),var(--hm-gold2));
  transform:scaleX(0);transform-origin:center;transition:transform .3s var(--hm-e);
}
.hm-nav-link:hover{color:var(--hm-gold);}
.hm-nav-item:hover .hm-nav-link::after{transform:scaleX(1);}
.hm-nav-link.active{color:var(--hm-ink);}
.hm-nav-link.active::after{background:var(--hm-ink);transform:scaleX(1);}

.hm-skel-row{display:flex;justify-content:center;align-items:center;gap:26px;min-height:50px;}
.hm-skel{height:13px;width:84px;border-radius:7px;
  background:linear-gradient(90deg,var(--hm-warm) 25%,var(--hm-cream) 37%,var(--hm-warm) 63%);
  background-size:400% 100%;animation:hmShimmer 1.4s ease-in-out infinite;}
.hm-skel:nth-child(2){width:70px;}.hm-skel:nth-child(3){width:96px;}
.hm-skel:nth-child(4){width:64px;}.hm-skel:nth-child(5){width:80px;}
@keyframes hmShimmer{0%{background-position:100% 0;}100%{background-position:0 0;}}

/* ══════════════════════════════════════════════════════════════════
   MEGA MENU — centered on the full navbar row, not on individual items
   .hm-navbar is position:relative → the mega panel anchors to its full width
══════════════════════════════════════════════════════════════════ */
.hm-mega{
  position:absolute;
  /* anchor to the navbar edge, not the individual hm-nav-item */
  left:0;right:0;top:100%;
  background:var(--hm-w);border:1px solid var(--hm-bd);border-top:none;
  border-radius:0 0 20px 20px;
  box-shadow:0 32px 64px -20px rgba(58,46,34,.22),0 8px 24px -12px rgba(58,46,34,.12);
  padding:clamp(24px,2.6vw,38px) clamp(24px,4vw,52px);
  display:flex;align-items:flex-start;gap:clamp(18px,2.4vw,34px);z-index:1001;
  /* center the CONTENT inside the full-width panel */
  justify-content:center;flex-wrap:wrap;
  opacity:0;visibility:hidden;pointer-events:none;
  transform:translateY(6px);
  transition:opacity .22s ease,transform .28s var(--hm-e),visibility .22s;
}
/* open on the ITEM hover, but position relative to the NAVBAR */
.hm-nav-item:hover .hm-mega{
  opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0);
}
.hm-mega-cols{
  display:flex;align-items:flex-start;gap:0;
  /* cap at a readable width so content is tight + centered */
  max-width:960px;flex:1 1 auto;flex-wrap:wrap;min-width:0;justify-content:center;
}
.hm-col{min-width:200px;max-width:300px;padding:0 28px;display:flex;flex-direction:column;}
.hm-col:first-child{padding-left:0;}
.hm-col:not(:last-child){border-right:1px solid var(--hm-li);}
.hm-nav-item:hover .hm-col{animation:hmColIn .38s var(--hm-e) both;}
.hm-col:nth-child(2){animation-delay:.05s;}
.hm-col:nth-child(3){animation-delay:.1s;}
.hm-col:nth-child(4){animation-delay:.15s;}
@keyframes hmColIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}

.hm-col-title{
  display:flex;align-items:center;gap:10px;
  font-family:var(--hm-sans);font-size:10px;font-weight:700;letter-spacing:.26em;
  text-transform:uppercase;color:var(--hm-gold);margin:0 0 16px;white-space:nowrap;
}
.hm-col-title::after{content:'';flex:1;height:1px;background:var(--hm-bd);}

/* ── category/link CARDS (photographic thumbnails) ── */
.hm-cards{display:grid;grid-template-columns:repeat(2,minmax(170px,1fr));gap:4px;}
.hm-cards.one{grid-template-columns:1fr;}
.hm-card{
  display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:12px;
  text-decoration:none;color:var(--hm-ink);position:relative;
  transition:background .2s ease,transform .2s var(--hm-e);
}
.hm-card:hover .hm-card-nm{color:var(--hm-gold);}

/* ── THUMBNAIL — 48×48, crisp cover fill ── */
.hm-thumb{
  width:28px;height:28px;min-width:28px;border-radius:6px;flex-shrink:0;overflow:hidden;
  background:var(--hm-cream);border:1px solid var(--hm-bd);display:block;position:relative;
}
.hm-thumb img{
  position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;display:block;
}
.hm-thumb--ph{
  width:48px;height:48px;min-width:48px;border-radius:11px;flex-shrink:0;overflow:hidden;
  display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--hm-serif);font-size:18px;font-weight:600;
  color:var(--hm-gold);background:linear-gradient(135deg,var(--hm-cream),var(--hm-warm));
  border:1px solid var(--hm-bd);
}
.hm-card-tx{display:flex;flex-direction:column;gap:2px;min-width:0;}
.hm-card-nm{font-family:var(--hm-sans);font-size:13px;font-weight:600;color:var(--hm-ink);line-height:1.2;}
.hm-card-ds{font-family:var(--hm-sans);font-size:11px;color:var(--hm-mut);line-height:1.3;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;}
/* arrow reveals + glides on hover */
.hm-card-go{margin-left:auto;color:var(--hm-gold2);opacity:0;flex-shrink:0;
  transform:translateX(-4px);transition:opacity .2s ease,transform .25s var(--hm-e);}
.hm-card:hover .hm-card-go{opacity:1;transform:translateX(0);}

/* glyph / swatch link rows */
.hm-links{display:flex;flex-direction:column;gap:2px;}
.hm-links.grid{display:grid;grid-template-columns:repeat(2,minmax(155px,1fr));gap:2px 20px;}
.hm-lk{
  display:inline-flex;align-items:center;gap:11px;padding:9px 8px;border-radius:10px;
  font-family:var(--hm-sans);font-size:13.5px;color:var(--hm-ink);text-decoration:none;
  white-space:nowrap;transition:background .18s ease,color .18s ease;
}
.hm-lk:hover{color:var(--hm-gold);}
.hm-lk-ic{
  width:30px;height:30px;border-radius:9px;flex-shrink:0;
  display:inline-flex;align-items:center;justify-content:center;color:var(--hm-gold);
  background:var(--hm-cream);border:1px solid var(--hm-bd);
}
.hm-swatch{display:inline-block;border-radius:50%;border:1px solid rgba(58,46,34,.22);}

/* image panel */
.hm-pic{
  flex:1;min-width:200px;border-radius:14px;overflow:hidden;position:relative;
  border:1px solid var(--hm-bd);display:block;min-height:220px;
}
.hm-pic img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0;}

/* featured banner column — image only, no text overlay */
.hm-feat{
  flex-shrink:0;width:240px;border-radius:16px;overflow:hidden;text-decoration:none;
  position:relative;display:block;min-height:280px;border:1px solid var(--hm-bd);
  background:var(--hm-cream);cursor:default;
}
.hm-feat-img{position:absolute;inset:0;z-index:0;}
.hm-feat-img img{width:100%;height:100%;object-fit:cover;display:block;}

/* ── mega menu · narrow-desktop (tablet-laptop) responsiveness ──
   The full-width panel can overflow between 1024–1300px because the
   capped 960px column block + 240px banner + paddings exceed the viewport.
   Let columns wrap, shrink the banner, then drop it on the tightest widths. */
@media(max-width:1280px){
  .hm-col{min-width:178px;padding:0 20px;}
  .hm-feat{width:200px;min-height:236px;}
  .hm-cards{grid-template-columns:repeat(2,minmax(150px,1fr));}
  .hm-links.grid{grid-template-columns:repeat(2,minmax(140px,1fr));gap:2px 14px;}
}
@media(max-width:1140px){
  .hm-mega{padding:24px clamp(18px,3vw,30px);gap:18px;}
  .hm-mega-cols{max-width:100%;}
  .hm-col{min-width:160px;padding:0 16px;}
  .hm-nav-link{padding:0 13px;font-size:11.5px;letter-spacing:.06em;}
  .hm-nav-link::after{left:13px;right:13px;}
}

/* ══════════════════════════════════════════════════════════════════
   MOBILE overlay + full-height panel
══════════════════════════════════════════════════════════════════ */
.hm-overlay{
  position:fixed;inset:0;z-index:1190;background:rgba(30,22,14,.46);
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  opacity:0;pointer-events:none;transition:opacity .38s var(--hm-e);
}
.hm-overlay.open{opacity:1;pointer-events:auto;}

.hm-mobile{
  position:fixed;left:0;right:0;top:0;
  /* full screen height — progressive units, dvh LAST so it wins: the panel
     tracks the actually-visible viewport (URL bar in/out) so the footer is
     never pushed below the browser chrome. (100vh = large/overflowing.) */
  height:100vh;height:100svh;height:100dvh;
  max-height:100vh;max-height:100svh;max-height:100dvh;
  z-index:1200;display:flex;flex-direction:column;overflow:hidden;
  background:var(--hm-iv,#fdfcf9);color:var(--hm-ink,#3a2e22);
  box-shadow:2px 0 40px rgba(58,46,34,.18);
  opacity:0;visibility:hidden;pointer-events:none;
  transform:translateY(-12px);
  transition:opacity .32s ease,transform .38s var(--hm-e),visibility .32s;
}
.hm-mobile.open{
  opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0);
  transition:opacity .26s ease,transform .38s var(--hm-e);
}
/* gold accent line at top */
.hm-mobile::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2.5px;z-index:5;pointer-events:none;
  background:linear-gradient(90deg,transparent 0%,var(--hm-gold3) 30%,var(--hm-gold2) 50%,var(--hm-gold3) 70%,transparent 100%);
}

.hm-mobile-head{
  position:relative;
  flex-shrink:0;display:flex;align-items:center;justify-content:space-between;
  padding:14px 16px;border-bottom:1px solid var(--hm-bd,#e6ded2);background:var(--hm-w,#fff);
  min-height:62px;
}
/* soft scroll-shadow so the body reads as scrollable beneath the fixed head */
.hm-mobile-head::after{
  content:'';position:absolute;left:0;right:0;bottom:-12px;height:12px;pointer-events:none;
  background:linear-gradient(180deg,rgba(58,46,34,.06),transparent);
}
.hm-mobile-head .hm-logo-txt{font-size:20px;}

/* min-height:0 lets this flex child shrink so its OWN overflow scrolls,
   instead of growing and pushing the pinned footer off-screen */
.hm-mobile-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 0 16px;}
.hm-mobile-body::-webkit-scrollbar{width:0;}

/* staggered reveal */
.hm-rev{opacity:0;}
.hm-mobile.open .hm-rev{animation:hmRev .44s var(--hm-e) both;}
@keyframes hmRev{from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:none;}}

/* quick-link chips */
.hm-mchips{display:flex;gap:8px;padding:16px 16px 8px;flex-wrap:wrap;}
.hm-mchip{flex:1;min-width:0;text-align:center;padding:12px 10px;border-radius:12px;
  border:1px solid var(--hm-bd);background:var(--hm-cream);box-shadow:inset 0 1px 0 rgba(255,255,255,.6);text-decoration:none;
  font-family:var(--hm-sans);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:var(--hm-ink);transition:background .2s ease,border-color .2s ease,transform .15s ease;
  -webkit-tap-highlight-color:transparent;}
.hm-mchip:active{transform:scale(.96);background:var(--hm-warm);border-color:var(--hm-gold2);}

/* ── section divider label ── */
.hm-msec{display:flex;align-items:center;gap:12px;padding:24px 16px 2px;}
.hm-msec-lbl{font-family:var(--hm-sans);font-size:9px;font-weight:700;letter-spacing:.3em;
  text-transform:uppercase;color:var(--hm-gold);white-space:nowrap;}
.hm-msec-ln{flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--hm-bd) 18%,var(--hm-bd) 82%,transparent);}

/* ══════════════════════════════════════════════════════════════════
   MOBILE category image-cards — the old header's "Shop by Category"
   strip, retoned to the hm-* palette. Horizontal scroll, hidden
   scrollbar, image cover + gradient + name overlay, gold arrow,
   lettered gradient placeholder when an image is missing.
══════════════════════════════════════════════════════════════════ */
.hm-mcats{
  display:flex;gap:10px;padding:14px 16px 4px;
  overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;
  -webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none;
}
.hm-mcats::-webkit-scrollbar{display:none;}
.hm-mcat{
  position:relative;display:block;overflow:hidden;flex-shrink:0;
  width:160px;height:120px;border-radius:15px;
  border:1px solid var(--hm-bd);background:var(--hm-cream);
  text-decoration:none;color:var(--hm-iv);
  box-shadow:0 8px 20px -14px rgba(58,46,34,.55);
  transition:transform .3s var(--hm-spring),box-shadow .3s ease;
  -webkit-tap-highlight-color:transparent;
}
.hm-mcat:hover,.hm-mcat:active{transform:translateY(-3px);box-shadow:0 15px 30px -12px rgba(58,46,34,.5);}
.hm-mcat-img{position:absolute;inset:0;z-index:0;}
.hm-mcat-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .65s var(--hm-e);}
.hm-mcat:hover .hm-mcat-img img,.hm-mcat:active .hm-mcat-img img{transform:scale(1.07);}
.hm-mcat-ph{
  position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;
  font-family:var(--hm-serif);font-size:46px;font-weight:600;line-height:1;color:var(--hm-gold);
  background:linear-gradient(135deg,var(--hm-cream),var(--hm-warm));
}
.hm-mcat-ov{position:absolute;inset:0;z-index:1;
  background:linear-gradient(to top,rgba(20,14,8,.88) 0%,rgba(20,14,8,.30) 48%,rgba(20,14,8,.02) 84%);}
.hm-mcat--ph .hm-mcat-ov{
  background:linear-gradient(to top,rgba(58,46,34,.46) 0%,rgba(58,46,34,.10) 52%,transparent 84%);}
.hm-mcat-l{
  position:absolute;left:0;right:0;bottom:0;z-index:2;
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:10px 12px 12px;color:var(--hm-iv);
}
.hm-mcat--ph .hm-mcat-l{color:var(--hm-ink);}
.hm-mcat-nm{
  font-family:var(--hm-serif);font-size:14px;font-weight:500;letter-spacing:.004em;line-height:1.12;
  text-shadow:0 1px 8px rgba(0,0,0,.4);
  overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
}
.hm-mcat--ph .hm-mcat-nm{text-shadow:none;}
.hm-mcat-l svg{flex-shrink:0;opacity:.72;color:var(--hm-gold3);transition:transform .25s var(--hm-e),opacity .25s ease;}
.hm-mcat--ph .hm-mcat-l svg{color:var(--hm-gold);}
.hm-mcat:hover .hm-mcat-l svg,.hm-mcat:active .hm-mcat-l svg{transform:translateX(3px);opacity:1;}

/* ══════════════════════════════════════════════════════════════════
   MOBILE accordion · clean, typographic, image-free
   (category imagery intentionally omitted on small screens)
══════════════════════════════════════════════════════════════════ */
.hm-macc{position:relative;border-bottom:1px solid var(--hm-li);margin:0 16px;border-radius:14px;
  transition:background .32s var(--hm-e);}
.hm-macc:last-child{border-bottom:none;}
/* warm wash anchors the open branch so hierarchy reads instantly */
.hm-macc.exp{background:linear-gradient(180deg,var(--hm-cream),transparent 72%);border-bottom-color:transparent;}
/* gold rail draws in while the row is open */
.hm-macc::before{
  content:'';position:absolute;left:0;top:14px;bottom:14px;width:2px;border-radius:2px;
  background:linear-gradient(180deg,var(--hm-gold),var(--hm-gold2));
  transform:scaleY(0);transform-origin:top;opacity:0;
  transition:transform .42s var(--hm-e),opacity .3s ease;
}
.hm-macc.exp::before{transform:scaleY(1);opacity:1;}
.hm-macc-head{
  width:100%;display:flex;align-items:center;gap:14px;min-height:60px;
  padding:13px 4px 13px 14px;background:none;border:none;cursor:pointer;text-align:left;
  color:var(--hm-ink);-webkit-tap-highlight-color:transparent;
  transition:padding-left .32s var(--hm-e);
}
.hm-macc.exp .hm-macc-head{padding-left:22px;}
.hm-macc-nm{
  flex:1;font-family:var(--hm-serif);font-size:23px;font-weight:500;line-height:1.08;
  letter-spacing:.004em;transition:color .2s ease;
}
.hm-macc-head:active .hm-macc-nm{color:var(--hm-gold);}
.hm-macc-head.open .hm-macc-nm{color:var(--hm-gold);font-style:italic;}
/* circular chevron pill */
.hm-macc-chev{
  width:34px;height:34px;flex-shrink:0;border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--hm-bd);background:var(--hm-w);color:var(--hm-gold2);
  transition:transform .42s var(--hm-spring),color .2s ease,background .2s ease,border-color .2s ease;
}
.hm-macc-head.open .hm-macc-chev{transform:rotate(180deg);color:var(--hm-gold);
  background:var(--hm-cream);border-color:var(--hm-gold2);}
.hm-macc-body{display:grid;grid-template-rows:0fr;overflow:hidden;
  transition:grid-template-rows .4s var(--hm-e);}
.hm-macc-body.open{grid-template-rows:1fr;}
.hm-macc-inner{min-height:0;overflow:hidden;padding:2px 8px 14px 16px;}
.hm-macc-all{display:inline-flex;align-items:center;gap:7px;width:fit-content;margin:2px 0 8px;padding:8px 14px;
  border-radius:20px;background:var(--hm-cream);border:1px solid var(--hm-bd);
  font-family:var(--hm-sans);font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:var(--hm-gold);text-decoration:none;
  transition:background .2s ease,border-color .2s ease,transform .15s var(--hm-spring);}
.hm-macc-all:active{transform:scale(.96);background:var(--hm-warm);border-color:var(--hm-gold2);}
.hm-macc-all svg{transition:transform .25s var(--hm-e);}
.hm-macc-all:active svg{transform:translateX(3px);}
.hm-macc-sub{font-family:var(--hm-sans);font-size:9px;font-weight:700;letter-spacing:.22em;
  text-transform:uppercase;color:var(--hm-fa);padding:12px 0 2px;}
.hm-macc-link{
  position:relative;display:flex;align-items:center;gap:12px;padding:11px 0 11px 18px;min-height:46px;
  font-family:var(--hm-sans);font-size:15px;font-weight:500;letter-spacing:.01em;
  color:var(--hm-mut);text-decoration:none;-webkit-tap-highlight-color:transparent;
  transition:color .16s ease,padding-left .22s var(--hm-e);
}
.hm-macc-link:has(.hm-macc-thumb){
  padding-left:12px;
}
.hm-macc-thumb{
  position:relative;width:28px;height:28px;min-width:28px;border-radius:8px;flex-shrink:0;overflow:hidden;
  background:var(--hm-cream);border:1px solid var(--hm-bd);box-shadow:inset 0 0 0 1px rgba(255,255,255,.4);
  display:flex;align-items:center;justify-content:center;
}
.hm-macc-thumb img{
  position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
}
.hm-macc-link::before{
  content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
  width:6px;height:6px;border-radius:50%;border:1.4px solid var(--hm-gold3);
  transition:background .2s ease,border-color .2s ease;
}
.hm-macc-link:has(.hm-macc-thumb)::before{
  display:none;
}
.hm-macc-link:active{color:var(--hm-ink);padding-left:23px;}
.hm-macc-link:has(.hm-macc-thumb):active{padding-left:17px;}
.hm-macc-link:active::before{background:var(--hm-gold);border-color:var(--hm-gold);}

/* footer */
.hm-mobile-foot{
  flex-shrink:0;padding:16px 14px calc(16px + env(safe-area-inset-bottom,0px));
  border-top:1px solid var(--hm-bd);display:flex;flex-direction:column;gap:10px;
  background:linear-gradient(180deg,var(--hm-w),var(--hm-cream));
}
.hm-mobile.open .hm-mobile-foot{animation:hmRev .44s var(--hm-e) .22s both;}
.hm-foot-cta{width:100%;}
.hm-foot-row{display:flex;gap:10px;}
/* The two headline CTAs (custom order + consultant) sit side by side so the
   footer stays compact and neither one reads as the lesser option. Each is a
   stacked icon-over-label tile — a full-width label would truncate at 2-up. */
.hm-foot-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
@media(max-width:359px){.hm-foot-pair{grid-template-columns:1fr;}}
.hm-foot-btn{
  position:relative;
  flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;height:44px;
  padding:0 14px;border-radius:22px;
  border:1px solid var(--hm-bd);background:var(--hm-w);
  font-family:var(--hm-sans);font-size:11px;font-weight:600;
  letter-spacing:.07em;color:var(--hm-mut);text-decoration:none;white-space:nowrap;
  transition:background .2s var(--hm-e),border-color .2s var(--hm-e),color .2s var(--hm-e);
  -webkit-tap-highlight-color:transparent;
}
.hm-foot-btn:hover,.hm-foot-btn:active{border-color:var(--hm-gold2);color:var(--hm-ink);}
.hm-foot-btn--accent{
  background:linear-gradient(135deg,var(--hm-gold),var(--hm-gold2));
  color:#fff;border-color:transparent;
  box-shadow:0 6px 16px -8px rgba(140,116,86,.7);
}
.hm-foot-btn--accent:hover,.hm-foot-btn--accent:active{
  background:linear-gradient(135deg,var(--hm-gold),var(--hm-gold2));
  color:#fff;filter:brightness(1.06);
}
/* Compact single-row variant for the 2-up CTA pair. Deliberately the same
   44px height as every other footer button — stacking icon over label made
   these two read as oversized slabs next to the rest of the menu. */
.hm-foot-btn--tall{
  height:44px;padding:0 10px;gap:7px;
  font-size:10px;letter-spacing:.05em;line-height:1.2;
  min-width:0;
}
.hm-foot-btn--tall .hm-foot-btn-ic{
  flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;
}
.hm-foot-btn--tall > :not(.hm-foot-btn-ic){min-width:0;overflow:hidden;text-overflow:ellipsis;}
@media(max-width:400px){
  .hm-foot-btn--tall{font-size:9.5px;letter-spacing:.03em;padding:0 8px;gap:6px;}
}
.hm-foot-badge{
  margin-left:3px;min-width:19px;height:19px;padding:0 6px;border-radius:10px;
  background:linear-gradient(135deg,var(--hm-gold),var(--hm-gold2));color:#fff;
  font-family:var(--hm-sans);font-size:10px;font-weight:700;line-height:1;letter-spacing:.01em;
  display:inline-flex;align-items:center;justify-content:center;
  box-shadow:0 3px 8px -3px rgba(140,116,86,.6);
  animation:hmBadgePop .38s var(--hm-spring);
}
/* Cart reads as the primary footer action — soft gold wash + gold border. */
.hm-foot-btn--cart{
  background:linear-gradient(160deg,var(--hm-w),var(--hm-cream));
  border-color:var(--hm-gold2);color:var(--hm-ink);
}
.hm-foot-btn--cart:hover,.hm-foot-btn--cart:active{
  border-color:var(--hm-gold);color:var(--hm-ink);
  box-shadow:0 6px 16px -10px rgba(140,116,86,.7);
}

/* ══════════════════════════════════════════════════════════════════
   BOTTOM NAV (mobile) · floating pill
══════════════════════════════════════════════════════════════════ */
.hm-bn{display:none;}
@media(max-width:1023px){
  /* Solid cream-white rather than a blurred pane: backdrop-filter forces the
     compositor to re-sample everything scrolling underneath it, which is the
     single most expensive thing a permanently-visible bar can do on a phone. */
  /* A plain seated bar, not a floating candy pill: flush to the bottom edge,
     square, one hairline on top. Solid white rather than a blurred pane —
     backdrop-filter makes the compositor re-sample everything scrolling
     underneath, which is the most expensive thing a permanent bar can do. */
  .hm-bn{
    display:flex;position:fixed;bottom:0;left:0;right:0;z-index:1180;
    align-items:stretch;justify-content:space-around;
    height:calc(60px + env(safe-area-inset-bottom,0px));
    padding-bottom:env(safe-area-inset-bottom,0px);
    background:#fff;border-top:1px solid #e6ded2;
  }
  .hm-bn-i{
    flex:1;min-width:0;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;
    text-decoration:none;color:rgba(58,46,34,.48);
    border:none;background:transparent;cursor:pointer;position:relative;padding:0;
    -webkit-tap-highlight-color:transparent;
    transition:color .2s ease;
  }
  .hm-bn-i:active{opacity:.6;}
  .hm-bn-i.on{color:#8c7456;}
  .hm-bn-i:focus-visible{outline:2px solid #8c7456;outline-offset:-3px;}
  /* active: gold seam across the top of the cell + a soft gold wash */
  .hm-bn-i::after{
    content:'';position:absolute;top:-1px;left:0;right:0;height:2px;
    background:linear-gradient(90deg,#c9b68f,#8c7456,#a8916f);
    transform:scaleX(0);transition:transform .3s cubic-bezier(.22,1,.36,1);
  }
  .hm-bn-i.on::after{transform:scaleX(1);}
  .hm-bn-i.on::before{
    content:'';position:absolute;inset:0;pointer-events:none;
    background:linear-gradient(180deg,rgba(140,116,86,.11),transparent 72%);
  }
  .hm-bn-ic{position:relative;color:inherit;display:grid;place-items:center;
    transition:transform .3s cubic-bezier(.34,1.56,.64,1);}
  .hm-bn-i.on .hm-bn-ic{transform:translateY(-1px);}
  .hm-bn-lbl{
    position:relative;
    font-family:var(--font-dmsans),'Jost',system-ui,sans-serif;font-size:8.5px;font-weight:500;
    letter-spacing:.13em;text-transform:uppercase;color:inherit;line-height:1;
    max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  }
  .hm-bn-i.on .hm-bn-lbl{font-weight:700;}
  /* the concierge is the one always-accented item */
  .hm-bn-chat .hm-bn-ic{color:#8c7456;}
  .hm-bn-badge{
    position:absolute;top:-5px;right:-9px;
    min-width:15px;height:15px;padding:0 4px;border-radius:8px;
    background:linear-gradient(135deg,#8c7456,#a8916f);color:#fff;
    font-family:var(--font-dmsans),'Jost',system-ui,sans-serif;font-size:8px;font-weight:700;line-height:1;
    display:inline-flex;align-items:center;justify-content:center;
    border:1.5px solid #fff;box-shadow:0 2px 6px -2px rgba(140,116,86,.6);z-index:2;
  }
  @media(max-width:360px){
    .hm-bn-lbl{font-size:8px;letter-spacing:.08em;}
  }
  body{padding-bottom:calc(68px + env(safe-area-inset-bottom,0px));}
  /* hide the floating pill while the full-screen menu is open — defensive,
     so it can never bleed through at the bottom edge */
  .hm-mobile.open ~ .hm-bn{opacity:0;pointer-events:none;visibility:hidden;}
}

/* ── very short / landscape viewports: head + 3 footer rows can exceed the
   visible height. Trim the head and let the footer scroll internally so every
   button (Account / Cart / Consultant / Call / Email) stays reachable. ── */
@media(max-height:520px){
  .hm-mobile-head{min-height:52px;padding-top:10px;padding-bottom:10px;}
  .hm-mobile-foot{max-height:54svh;max-height:54dvh;overflow-y:auto;overscroll-behavior:contain;}
  .hm-mcat{width:150px;height:104px;}
}

@media(prefers-reduced-motion:reduce){
  .hm,.hm *,.hm-mobile,.hm-mobile *,.hm-bn,.hm-bn *{transition-duration:.01ms!important;animation-duration:.01ms!important;}
  .hm-mobile{transform:none!important;}
  .hm-mcats{scroll-behavior:auto!important;}
  .hm-rev{opacity:1!important;}
}
`

export default function HeaderMegaMenu() {
  const router = useRouter()
  const pathname = usePathname()

  const [categories, setCategories] = useState<Category[]>(() => CACHE?.categories ?? [])
  const [config, setConfig] = useState<HeaderConfig | null>(() => CACHE?.config ?? null)
  const [sections, setSections] = useState<Record<string, MegaMenuSection[]>>(() => CACHE?.sections ?? {})
  const [loaded, setLoaded] = useState<boolean>(() => !!CACHE)

  const [user, setUser] = useState<any>(null)
  const [cartCnt, setCartCnt] = useState(0)
  const [wishCnt, setWishCnt] = useState(0)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [currency, setCur] = useState<Currency>('USD')

  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [hmHidden, setHmHidden] = useState(false)
  const lastScrollY = useRef(0)

  /* ── load admin-driven data ── */
  useEffect(() => {
    if (CACHE) return
    let alive = true
      ; (async () => {
        try {
          const [catRes, configRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/header-config'),
          ])

          let catData, configData;
          if (catRes.ok) {
            catData = await catRes.json();
          }
          if (configRes.ok) {
            configData = await configRes.json();
          }
          const cats: Category[] = Array.isArray(catData) ? catData : []

          const sectionsData: Record<string, MegaMenuSection[]> = {}
          await Promise.all(
            cats.filter(c => c.show_in_header && !c.parent_category_id).map(async cat => {
              try {
                const res = await fetch(`/api/mega-menu-sections?categoryId=${cat.id}`)
                const data = await res.json()
                sectionsData[cat.id] = Array.isArray(data.sections)
                  ? data.sections.map((s: any) => ({
                    ...s,
                    data: s.section_type === 'links' ? (s.custom_links || s.data || []) : (s.data || []),
                  }))
                  : []
              } catch { sectionsData[cat.id] = [] }
            })
          )

          CACHE = { categories: cats, config: configData?.config ?? null, sections: sectionsData }
          if (!alive) return
          setCategories(cats)
          setConfig(CACHE.config)
          setSections(sectionsData)
        } catch (e) { console.error('Header load error:', e) }
        finally { if (alive) setLoaded(true) }
      })()
    return () => { alive = false }
  }, [])

  /* ── store sync ── */
  useEffect(() => {
    setUser(getUser())
    setCartCnt(getCart().reduce((s: number, i: any) => s + (i.quantity ?? 0), 0))
    setWishCnt(getWishlist().length)
    setSettings(getSettings())
    setCur(getCurrency())
    fetchAndSyncSettings().then(s => { if (s) setSettings(s) })
    const onCart = (e: any) => setCartCnt(e?.detail?.count ?? getCart().reduce((s: number, i: any) => s + (i.quantity ?? 0), 0))
    const onWish = (e: any) => setWishCnt(e?.detail?.count ?? getWishlist().length)
    const onUser = (e: any) => setUser(e?.detail?.user ?? getUser())
    const onSets = (e: any) => setSettings(e?.detail?.settings ?? getSettings())
    const onCur = (e: any) => setCur(e?.detail?.currency ?? getCurrency())
    window.addEventListener('cart-updated', onCart as EventListener)
    window.addEventListener('wishlist-updated', onWish as EventListener)
    window.addEventListener('user-updated', onUser as EventListener)
    window.addEventListener('settings-updated', onSets as EventListener)
    window.addEventListener('currency-updated', onCur as EventListener)
    return () => {
      window.removeEventListener('cart-updated', onCart as EventListener)
      window.removeEventListener('wishlist-updated', onWish as EventListener)
      window.removeEventListener('user-updated', onUser as EventListener)
      window.removeEventListener('settings-updated', onSets as EventListener)
      window.removeEventListener('currency-updated', onCur as EventListener)
    }
  }, [])

  /* ── scroll hide/reveal ── */
  useEffect(() => {
    lastScrollY.current = window.scrollY || 0
    const onScroll = () => {
      const y = window.scrollY || 0
      setScrolled(y > 4)
      if (mobileOpen) { setHmHidden(false); lastScrollY.current = y; return }
      const delta = y - lastScrollY.current
      if (y < 90) setHmHidden(false)
      else if (delta > 6) setHmHidden(true)
      else if (delta < -6) setHmHidden(false)
      lastScrollY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mobileOpen])

  /* ── body scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  /* ── resize / route / escape handlers ── */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ── derived ── */
  const headerCategories = categories
    .filter(c => !c.parent_category_id && c.show_in_header)
    .sort((a, b) => a.header_order - b.header_order)
  const childrenOf = (pid: string) => categories.filter(c => c.parent_category_id === pid)
  const categoryById = (id: string) => categories.find(c => c.id === id)
  const isActive = (cat: Category) => {
    if (!pathname) return false
    const own = `/collection/${cat.slug}`
    if (pathname === own || pathname.startsWith(`${own}/`)) return true
    return childrenOf(cat.id).some(c => {
      const h = `/collection/${c.slug}`
      return pathname === h || pathname.startsWith(`${h}/`)
    })
  }
  const isActivePath = (href: string) => !!pathname && (pathname === href || pathname.startsWith(`${href}/`))

  const logoText = config?.logo_text || 'Gems Global Jewels'
  const showCart = config?.show_cart !== false
  const showAccount = config?.show_account !== false
  const showConsultant = config?.show_consultant !== false
  const consultantText = config?.consultant_text || 'Meet a Consultant'
  const consultantUrl = config?.consultant_url || '/appointments'

  const waNum = (settings?.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^0-9]/g, '')
  const fmtCount = (n: number) => (n > 99 ? '99+' : String(n))

  const changeCurrency = (c: Currency) => {
    if (c === currency) return
    setCur(c)          // optimistic — instant thumb slide
    setCurrency(c)     // persists + dispatches 'currency-updated' → re-renders every <Price/>
  }

  /* ── desktop: render one mega column ── */
  const renderSectionColumn = (section: MegaMenuSection) => {
    if (section.section_type === 'image') {
      return section.image_url ? (
        <div key={section.id} className="hm-col" style={{ minWidth: 220 }}>
          {section.title && <h3 className="hm-col-title">{section.title}</h3>}
          <div className="hm-pic">
            <img src={section.image_url} alt={section.title || ''} loading="lazy" decoding="async" />
          </div>
        </div>
      ) : null
    }

    if (section.section_type === 'links') {
      const links = (Array.isArray(section.data) ? section.data : []) as any[]
      if (!links.length) return null
      const photo = links.filter(l => isImg(l?.icon))
      const glyph = links.filter(l => !isImg(l?.icon))
      return (
        <div key={section.id} className="hm-col">
          {section.title && <h3 className="hm-col-title">{section.title}</h3>}
          {photo.length > 0 && (
            <div className={`hm-cards${photo.length === 1 ? ' one' : ''}`} style={{ marginBottom: glyph.length ? 12 : 0 }}>
              {photo.map((link, i) => (
                <Link key={`p${i}`} href={link.url || '/'} className="hm-card">
                  <span className="hm-thumb">
                    <img src={link.icon} alt="" loading="lazy" decoding="async" />
                  </span>
                  <span className="hm-card-tx"><span className="hm-card-nm">{link.label || 'Link'}</span></span>
                  <ArrowRight size={14} className="hm-card-go" />
                </Link>
              ))}
            </div>
          )}
          {glyph.length > 0 && (
            <div className={`hm-links${glyph.length > 6 ? ' grid' : ''}`}>
              {glyph.map((link, i) => (
                <Link key={`g${i}`} href={link.url || '/'} className="hm-lk">
                  {link.icon && (
                    <span className="hm-lk-ic"><Glyph icon={link.icon} size={16} /></span>
                  )}
                  {link.label || 'Link'}
                </Link>
              ))}
            </div>
          )}
        </div>
      )
    }

    /* categories section */
    const childIds: string[] = Array.isArray(section.data) ? section.data : []
    const children = childIds.map(categoryById).filter(Boolean) as Category[]
    if (!children.length) return null
    return (
      <div key={section.id} className="hm-col">
        {section.title && <h3 className="hm-col-title">{section.title}</h3>}
        <div className={`hm-cards${children.length <= 3 ? ' one' : ''}`}>
          {children.map(child => (
            <Link key={child.id} href={`/collection/${child.slug}`} className="hm-card">
              {isImg(child.header_image_url || child.image_url) ? (
                <span className="hm-thumb">
                  <img src={(child.header_image_url || child.image_url)!} alt="" loading="lazy" decoding="async" />
                </span>
              ) : null}
              <span className="hm-card-tx">
                <span className="hm-card-nm">{child.name}</span>
                {child.header_description && <span className="hm-card-ds">{child.header_description}</span>}
              </span>
              <ArrowRight size={14} className="hm-card-go" />
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const renderMega = (category: Category) => {
    const catSections = (sections[category.id] || []).slice().sort((a, b) => a.section_order - b.section_order)
    const hasSections = catSections.some(s =>
      s.section_type === 'image' ? !!s.image_url : Array.isArray(s.data) && s.data.length > 0)
    const banner = category.header_image_url
    const kids = childrenOf(category.id)
    if (!hasSections && kids.length === 0 && !banner) return null

    return (
      <div className="hm-mega">
        <div className="hm-mega-cols">
          {hasSections
            ? catSections.map(renderSectionColumn)
            : kids.length > 0 && (
              <div className="hm-col">
                <div className={`hm-cards${kids.length <= 3 ? ' one' : ''}`}>
                  {kids.map(child => (
                    <Link key={child.id} href={`/collection/${child.slug}`} className="hm-card">
                      {isImg(child.header_image_url || child.image_url) ? (
                        <span className="hm-thumb">
                          <img src={(child.header_image_url || child.image_url)!} alt="" loading="lazy" decoding="async" />
                        </span>
                      ) : null}
                      <span className="hm-card-tx">
                        <span className="hm-card-nm">{child.name}</span>
                        {child.header_description && <span className="hm-card-ds">{child.header_description}</span>}
                      </span>
                      <ArrowRight size={14} className="hm-card-go" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
        </div>

        {banner && (
          <Link href={`/collection/${category.slug}`} className="hm-feat" aria-label={category.name}>
            <span className="hm-feat-img"><img src={banner} alt={category.name} loading="lazy" decoding="async" /></span>
          </Link>
        )}
      </div>
    )
  }

  /* ── mobile: flatten sections into link blocks ── */
  type MobLink = { label: string; href: string; icon?: string; thumb?: string | null }
  const mobileRows = (category: Category): { title?: string; links: MobLink[] }[] => {
    const catSections = (sections[category.id] || []).slice().sort((a, b) => a.section_order - b.section_order)
    const blocks: { title?: string; links: MobLink[] }[] = []
    const usable = catSections.filter(s => s.section_type !== 'image')
    if (usable.length) {
      for (const s of usable) {
        if (s.section_type === 'links') {
          const links: MobLink[] = (Array.isArray(s.data) ? s.data : [])
            .map((l: any) => ({ label: l.label || 'Link', href: l.url || '/', icon: l.icon, thumb: isImg(l.icon) ? l.icon : null }))
          if (links.length) blocks.push({ title: s.title, links })
        } else {
          const children = (Array.isArray(s.data) ? s.data : []).map(categoryById).filter(Boolean) as Category[]
          const links: MobLink[] = children.map(c => ({ label: c.name, href: `/collection/${c.slug}`, thumb: c.header_image_url || c.image_url }))
          if (links.length) blocks.push({ title: s.title, links })
        }
      }
    } else {
      const links: MobLink[] = childrenOf(category.id).map(c => ({ label: c.name, href: `/collection/${c.slug}`, thumb: c.header_image_url || c.image_url }))
      if (links.length) blocks.push({ links })
    }
    return blocks
  }

  const showSkeleton = !loaded && headerCategories.length === 0

  return (
    <>
      <style>{CSS}</style>
      <header className={`hm${scrolled ? ' hm--scrolled' : ''}${hmHidden ? ' hm--hidden' : ''}`}>

        {/* ── row 1 : quick-links / logo / actions ── */}
        <div className="hm-bar">
          <div className="hm-bar-inner">
            <div className="hm-left">
              <button
                className={`hm-burger${mobileOpen ? ' open' : ''}`}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(v => !v)}
              >
                <span className="hm-burger-box">
                  <span className="hm-burger-line" />
                  <span className="hm-burger-line" />
                  <span className="hm-burger-line" />
                </span>
              </button>

              {/* currency toggle — moved to the far-left of the bar (before quick-links) */}
              <div className="hm-cur" role="group" aria-label="Select currency">
                <span className="hm-cur-thumb" data-cur={currency} aria-hidden="true" />
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    className={`hm-cur-b${currency === c.code ? ' on' : ''}`}
                    onClick={() => changeCurrency(c.code)}
                    aria-pressed={currency === c.code}
                    aria-label={`Show prices in ${c.label}`}
                  >
                    <span className="hm-cur-sym">{c.sym}</span>
                    <span className="hm-cur-tx">{c.label}</span>
                  </button>
                ))}
              </div>

              <nav className="hm-ql" aria-label="Quick links">
                {QUICK.map(q => (
                  <Link key={q.href} href={q.href} className={`hm-ql-a${isActivePath(q.href) ? ' on' : ''}`}>
                    {q.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* logo — the wordmark fallback only renders once the config has
                actually resolved, otherwise "Gems Global Jewels" flashes in
                for a beat before the real logo image swaps in. */}
            <Link href="/" className="hm-logo">
              {config?.logo_url
                ? <img src={config.logo_url} alt={logoText} />
                : loaded
                  ? <h1 className="hm-logo-txt">{logoText}</h1>
                  : <span className="hm-logo-ph" aria-hidden="true" />}
            </Link>

            {/* actions — search removed */}
            <div className="hm-actions">
              {showConsultant && (
                <Link href={consultantUrl} className="hm-consultant">
                  <span className="hm-consultant-ic"><Headphones size={14} /></span>
                  <span className="hm-consultant-tx">{consultantText}</span>
                </Link>
              )}
              <Link href="/custom-order" className="hm-consultant" aria-label="Create a custom order">
                <span className="hm-consultant-ic"><Sparkles size={14} /></span>
                <span className="hm-consultant-tx">Create Custom Order</span>
              </Link>
              {showAccount && (
                <Link href="/account" className="hm-ic" aria-label="Account"><User size={20} /></Link>
              )}
              {showCart && (
                <Link href="/cart" className="hm-ic" aria-label={`Cart${cartCnt > 0 ? `, ${cartCnt} item${cartCnt > 1 ? 's' : ''}` : ''}`}>
                  <NavBag size={20} />
                  {cartCnt > 0 && <span className="hm-ic-badge" suppressHydrationWarning>{fmtCount(cartCnt)}</span>}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── row 2 : category nav ── */}
        <nav className="hm-navbar" aria-label="Main">
          <div className="hm-navbar-inner">
            {showSkeleton ? (
              <div className="hm-skel-row" aria-hidden="true">
                <span className="hm-skel" /><span className="hm-skel" /><span className="hm-skel" />
                <span className="hm-skel" /><span className="hm-skel" />
              </div>
            ) : (
              headerCategories.map(category => (
                <div key={category.id} className="hm-nav-item">
                  <Link
                    href={`/collection/${category.slug}`}
                    className={`hm-nav-link${isActive(category) ? ' active' : ''}`}
                  >
                    {category.name}
                    {(childrenOf(category.id).length > 0 || (sections[category.id]?.length ?? 0) > 0) && (
                      <ChevronDown size={14} className="hm-nav-chev" />
                    )}
                  </Link>
                  {renderMega(category)}
                </div>
              ))
            )}
          </div>
        </nav>
      </header>

      {/* ── mobile overlay — OUTSIDE <header> so position:sticky doesn't trap it ── */}
      <div className={`hm-overlay${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      <div className={`hm-mobile${mobileOpen ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="hm-mobile-head">
          <Link href="/" className="hm-logo" onClick={() => setMobileOpen(false)}>
            {config?.logo_url
              ? <img src={config.logo_url} alt={logoText} style={{ height: 32 }} />
              : loaded
                ? <span className="hm-logo-txt">{logoText}</span>
                : <span className="hm-logo-ph" aria-hidden="true" />}
          </Link>
          <button className="hm-ic" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
            <X size={22} />
          </button>
        </div>

        <div className="hm-mobile-body">
          {/* quick-link chips */}
          <div className="hm-mchips hm-rev" style={{ animationDelay: '.06s' }}>
            {QUICK.map(q => (
              <Link key={q.href} href={q.href} className="hm-mchip" onClick={() => setMobileOpen(false)}>{q.label}</Link>
            ))}
          </div>

          {/* currency toggle */}
          <div className="hm-mcur hm-rev" style={{ animationDelay: '.08s' }}>
            <div className="hm-mcur-seg" role="group" aria-label="Select currency">
              <span className="hm-mcur-thumb" data-cur={currency} aria-hidden="true" />
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={`hm-mcur-b${currency === c.code ? ' on' : ''}`}
                  onClick={() => changeCurrency(c.code)}
                  aria-pressed={currency === c.code}
                  aria-label={`Show prices in ${c.label}`}
                >
                  <span className="hm-mcur-sym">{c.sym}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* collections section label */}
          {headerCategories.length > 0 && (
            <div className="hm-msec hm-rev" style={{ animationDelay: '.10s' }}>
              <span className="hm-msec-lbl">Collections</span>
              <span className="hm-msec-ln" />
            </div>
          )}

          {/* ── category image-cards — same visual treatment as the old header's
               "Shop by Category" strip, retoned to the hm-* palette. The whole
               card links to the category and closes the menu on tap. ── */}
          {headerCategories.length > 0 && (
            <div className="hm-mcats hm-rev" style={{ animationDelay: '.14s' }}>
              {headerCategories.map(category => {
                const img = category.header_image_url || category.image_url
                const hasImg = isImg(img)
                const letter = (category.name?.trim()?.[0] || '?').toUpperCase()
                return (
                  <Link
                    key={category.id}
                    href={`/collection/${category.slug}`}
                    className={`hm-mcat${hasImg ? '' : ' hm-mcat--ph'}`}
                    aria-label={category.name}
                    onClick={() => setMobileOpen(false)}
                  >
                    {hasImg ? (
                      <span className="hm-mcat-img">
                        <img src={img!} alt="" loading="lazy" decoding="async" draggable={false} />
                      </span>
                    ) : (
                      <span className="hm-mcat-ph" aria-hidden="true">{letter}</span>
                    )}
                    <span className="hm-mcat-ov" aria-hidden="true" />
                    <span className="hm-mcat-l">
                      <span className="hm-mcat-nm">{category.name}</span>
                      <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
                    </span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* accordions */}
          <div style={{ marginTop: 8 }}>
            {headerCategories.map((category, i) => {
              const blocks = mobileRows(category)
              const expandable = blocks.length > 0
              const open = mobileExpanded === category.id
              return (
                <div key={category.id} className={`hm-macc hm-rev${open ? ' exp' : ''}`} style={{ animationDelay: `${0.22 + i * 0.04}s` }}>
                  <button
                    className={`hm-macc-head${open ? ' open' : ''}`}
                    onClick={() => {
                      if (!expandable) { setMobileOpen(false); router.push(`/collection/${category.slug}`); return }
                      setMobileExpanded(open ? null : category.id)
                    }}
                    aria-expanded={expandable ? open : undefined}
                  >
                    <span className="hm-macc-nm">{category.name}</span>
                    {expandable && (
                      <span className="hm-macc-chev"><ChevronDown size={18} /></span>
                    )}
                  </button>
                  {expandable && (
                    <div className={`hm-macc-body${open ? ' open' : ''}`}>
                      <div className="hm-macc-inner">
                        <Link href={`/collection/${category.slug}`} className="hm-macc-all" onClick={() => setMobileOpen(false)}>
                          View all {category.name} <ArrowRight size={13} />
                        </Link>
                        {blocks.map((block, bi) => (
                          <div key={bi}>
                            {block.title && <div className="hm-macc-sub">{block.title}</div>}
                            {block.links.map((link, li) => (
                              <Link key={li} href={link.href} className="hm-macc-link" onClick={() => setMobileOpen(false)}>
                                {link.thumb && (
                                  <span className="hm-macc-thumb">
                                    <img src={link.thumb} alt="" />
                                  </span>
                                )}
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="hm-mobile-foot">
          <div className={showConsultant ? 'hm-foot-pair' : 'hm-foot-cta'}>
            <Link
              href="/custom-order"
              className={`hm-foot-btn hm-foot-btn--accent${showConsultant ? ' hm-foot-btn--tall' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="hm-foot-btn-ic"><Sparkles size={14} /></span>
              <span>Custom Order</span>
            </Link>
            {showConsultant && (
              <Link
                href={consultantUrl}
                className="hm-foot-btn hm-foot-btn--accent hm-foot-btn--tall"
                onClick={() => setMobileOpen(false)}
              >
                <span className="hm-foot-btn-ic"><Headphones size={14} /></span>
                <span>{consultantText}</span>
              </Link>
            )}
          </div>
          <div className="hm-foot-row">
            {showAccount && (
              <Link href="/account" className="hm-foot-btn" onClick={() => setMobileOpen(false)}><User size={15} /> Account</Link>
            )}
            {showCart && (
              <Link href="/cart" className="hm-foot-btn hm-foot-btn--cart" onClick={() => setMobileOpen(false)}>
                <NavBag size={15} /> Cart
                {cartCnt > 0 && <span className="hm-foot-badge" suppressHydrationWarning>{fmtCount(cartCnt)}</span>}
              </Link>
            )}
          </div>
          {(() => {
            // Prefer the admin-configured contact number (site_settings) so the
            // Call button matches the Footer / admin panel. Fall back to the
            // header_config phone only if settings haven't loaded a number.
            const callNum = settings?.india_contact || settings?.canada_contact || config?.phone_number || ''
            const mailTo = settings?.contact_email || config?.email || ''
            if (!callNum && !mailTo) return null
            return (
              <div className="hm-foot-row">
                {callNum && (
                  <Link href={`tel:${callNum.replace(/\s+/g, '')}`} className="hm-foot-btn"><Phone size={15} /> Call</Link>
                )}
                {mailTo && (
                  <Link href={`mailto:${mailTo}`} className="hm-foot-btn"><Mail size={15} /> Email</Link>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── bottom nav (mobile) ── */}
      <nav className="hm-bn" aria-label="Quick navigation">
        <Link href="/" className={`hm-bn-i${pathname === '/' ? ' on' : ''}`} aria-label="Home" aria-current={pathname === '/' ? 'page' : undefined}>
          <span className="hm-bn-ic"><NavHome size={20} /></span>
          <span className="hm-bn-lbl">Home</span>
        </Link>
        <Link href="/collection" className={`hm-bn-i${isActivePath('/collection') ? ' on' : ''}`} aria-label="Collection" aria-current={isActivePath('/collection') ? 'page' : undefined}>
          <span className="hm-bn-ic"><NavGem size={20} /></span>
          <span className="hm-bn-lbl">Jewels</span>
        </Link>
        <button
          type="button"
          className="hm-bn-i hm-bn-chat"
          onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
          aria-label="Chat with our concierge"
        >
          <span className="hm-bn-ic"><NavChat size={22} /></span>
          <span className="hm-bn-lbl">Chat</span>
        </button>
        <Link href="/wishlist" className={`hm-bn-i${pathname === '/wishlist' ? ' on' : ''}`} aria-label={`Wishlist${wishCnt > 0 ? `, ${wishCnt}` : ''}`} aria-current={pathname === '/wishlist' ? 'page' : undefined}>
          <span className="hm-bn-ic" style={{ position: 'relative' }}>
            <NavHeart size={20} />
            {wishCnt > 0 && <span className="hm-bn-badge" suppressHydrationWarning>{fmtCount(wishCnt)}</span>}
          </span>
          <span className="hm-bn-lbl">Saved</span>
        </Link>
        <Link
          href={user ? '/account' : '/auth/signin'}
          className={`hm-bn-i${(pathname === '/account' || !!pathname?.startsWith('/auth')) ? ' on' : ''}`}
          aria-label={user ? 'My account' : 'Sign in'}
          aria-current={(pathname === '/account' || !!pathname?.startsWith('/auth')) ? 'page' : undefined}
        >
          <span className="hm-bn-ic"><NavUser size={20} /></span>
          <span className="hm-bn-lbl">{user ? 'Account' : 'Sign In'}</span>
        </Link>
      </nav>
    </>
  )
}