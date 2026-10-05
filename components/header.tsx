'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  ShoppingBag, User, LogOut, ChevronDown,
  ArrowRight, Mail, Heart, Globe,
  Gem, Sparkles, CalendarDays, BookOpen
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import {
  getUser, clearUser, getCart, getWishlist,
  getCurrency, setCurrency, Currency, clearCart,
  getSettings, fetchAndSyncSettings, SiteSettings
} from '@/lib/authStore'
import { signOut } from '@/lib/auth'

const NAV = [
  {
    label: 'Collection', href: '/collection',
    mega: [
      {
        title: 'Rings',
        links: [
          { label: 'All Rings', href: '/collection?category=rings' },
          { label: 'Solitaire', href: '/collection?category=rings&style=solitaire' },
          { label: 'Hidden Halo', href: '/collection?category=rings&style=hidden-halo' },
          { label: 'Three Stone', href: '/collection?category=rings&style=three-stone' },
          { label: 'Floral Inspired', href: '/collection?category=rings&style=floral-inspired' },
          { label: 'Side Stone', href: '/collection?category=rings&style=side-stone' },
        ],
      },
      {
        title: 'Fine Jewellery',
        links: [
          { label: 'Necklaces', href: '/collection/necklaces' },
          { label: 'Earrings', href: '/collection/earrings' },
          { label: 'Bracelets', href: '/collection/bracelets' },
          { label: 'Wedding Bands', href: '/collection/wedding-bands' },
          { label: 'Bridal Sets', href: '/collection/bridal' },
        ],
      },
      {
        title: 'Discover',
        links: [
          { label: 'New Arrivals', href: '/collection?sort=new' },
          { label: 'Bestsellers', href: '/collection?sort=popular' },
          { label: 'Under ₹50,000', href: '/collection?maxPrice=50000' },
          { label: 'Gift Guide', href: '/gift-guide' },
        ],
      },
    ],
  },
  { label: 'About', href: '/about', drop: ['Our Story', 'Craftsmanship', 'Sustainability', 'Repairs'] },
  { label: 'Appointments', href: '/appointments', drop: ['Book a Visit'] },
  { label: 'Blog', href: '/blog', },
]

/* Per-item destinations for dropdown sub-links (label → route). Falls back to
   the parent nav href when a label isn't listed here. */
const DROP_LINKS: Record<string, string> = {
  'Our Story': '/about',
  'Craftsmanship': '/craftsmanship',
  'Sustainability': '/sustainability',
  'Repairs': '/repairs',
  'Book a Visit': '/appointments',
}

/* Row-1 utility quick-links (left of the logo) — a quieter, secondary nav.
   Deliberately understated so the centered Row-2 nav reads as the hero. */
const QUICK = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Collection', href: '/collection' },
]

/* ─── Category type + fallback for the mobile-menu cards.
   Real data is fetched live from /api/categories?home=true (same source
   as the home page "Shop by Category" strip).  These images-backed
   fallbacks render instantly and only show if the fetch returns nothing. */
type MobCat = { id: number; name: string; slug: string; image: string }
const MOB_CAT_FALLBACK: MobCat[] = [
  { id: 1, name: 'Engagement Rings', slug: 'engagement-rings', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=400&q=85&fit=crop' },
  { id: 2, name: 'Wedding Bands', slug: 'wedding-bands', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=400&q=85&fit=crop' },
  { id: 3, name: 'Necklaces', slug: 'necklaces', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500&h=400&q=85&fit=crop' },
  { id: 4, name: 'Earrings', slug: 'earrings', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=400&q=85&fit=crop' },
]

/* ════════════════════════════════════════════════════════════════
   GEMS GLOBAL — HEADER v9  "AURUM"
   Palette: pure ivory / warm cream / taupe-gold accent — zero black.
   • Logo never flashes brand-text — a faceted gem monogram holds the
     space until the real logo image loads (no text, ever).
   • Mobile hamburger TOGGLES (morphs ↔ X) and the menu drops down
     beneath the header bar — same button opens & closes it.
   • Smooth, hysteresis-based scroll hide/show (no jitter).
   • Header dressed head-to-toe in tasteful motion: intro reveal,
     announcement shimmer sweep, logo shine, gradient underlines,
     animated gold hairline, springy badge pops, gliding bottom-nav.
════════════════════════════════════════════════════════════════ */
const CSS = `
:root{
  --w:  #FFFFFF;
  --iv: #FDFCF9;
  --cr: #F8F4EE;
  --wa: #EFE9DF;
  --bd: #E6DED2;
  --a:  #8C7456;
  --a2: #A8916F;
  --a3: #C9B68F;
  --al: rgba(140,116,86,.11);
  --am: rgba(140,116,86,.22);
  --ink:#3A2E22;
  --mu: rgba(58,46,34,.50);
  --fa: rgba(58,46,34,.34);
  --li: rgba(58,46,34,.10);
  --serif: var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
  --sans:  var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;
  --e: cubic-bezier(.22,1,.36,1);
  --spring: cubic-bezier(.34,1.56,.64,1);
}

/* ══ FIXED WRAPPER ══ */
.gh{ position:fixed;top:0;left:0;right:0;z-index:9999;
  transform:translateY(0);transition:transform .55s cubic-bezier(.16,1,.3,1);
  will-change:transform;
  -webkit-backface-visibility:hidden;backface-visibility:hidden; }
.gh.hide{ transform:translateY(-101%); }

/* ── one-time intro reveal ── */
.gh-ann{ animation:ghDrop .6s var(--e) both; }
.gh-bar{ animation:ghDrop .68s var(--e) .05s both; }
@keyframes ghDrop{ from{opacity:0;transform:translateY(-100%);} to{opacity:1;transform:translateY(0);} }

/* ══ ANNOUNCEMENT BAR ══ */
.gh-ann{
  position:relative;
  width:100%;height:30px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(90deg,var(--cr),var(--wa),var(--cr));
  border-bottom:1px solid var(--bd);overflow:hidden;
}
.gh-ann::before{
  content:'';position:absolute;inset:0;z-index:0;
  background:linear-gradient(100deg,transparent 35%,rgba(201,182,143,.45) 50%,transparent 65%);
  transform:translateX(-120%);
  animation:annSweep 7s ease-in-out 1.2s infinite;
}
@keyframes annSweep{ 0%{transform:translateX(-120%);} 55%,100%{transform:translateX(120%);} }
.gh-ann-t{
  position:relative;z-index:1;
  font-family:var(--sans);font-size:9.5px;font-weight:500;
  letter-spacing:.22em;text-transform:uppercase;color:var(--a);white-space:nowrap;
}
.gh-ann-t b{ color:var(--ink);font-weight:700; }
@media(max-width:767px){ .gh-ann{height:24px;} .gh-ann-t{font-size:8px;letter-spacing:.1em;} }

/* ══ MAIN BAR ══ */
.gh-bar{
  position:relative;
  width:100%;background:var(--w);border-bottom:1px solid var(--bd);
  transition:box-shadow .35s var(--e),border-color .35s ease,background .35s ease;
}
.gh.compact .gh-bar{
  box-shadow:0 6px 26px -6px rgba(58,46,34,.10),inset 0 1px 0 rgba(255,255,255,.6);
  border-bottom-color:transparent;
  background:linear-gradient(180deg,rgba(255,255,255,.90),rgba(253,252,249,.82));
  backdrop-filter:blur(13px) saturate(1.45);-webkit-backdrop-filter:blur(13px) saturate(1.45);
}
/* animated gold hairline — glows in when scrolled */
.gh-bar::after{
  content:'';position:absolute;left:0;right:0;bottom:-1px;height:1.5px;
  background:linear-gradient(90deg,transparent,var(--a3),var(--a2),var(--a3),transparent);
  background-size:220% 100%;
  opacity:0;transform:scaleX(.4);transform-origin:center;
  transition:opacity .4s var(--e),transform .55s var(--e);
}
.gh.compact .gh-bar::after{ opacity:1;transform:scaleX(1);animation:lineFlow 9s linear infinite; }
/* while the mobile menu is open, draw the hairline so burger + panel read as one surface */
.gh.menu-open .gh-bar::after{ opacity:1;transform:scaleX(1); }
@keyframes lineFlow{ 0%{background-position:0% 0;} 100%{background-position:220% 0;} }

/* ══ ROW 1 — logo row : utility-left · logo-center · icons-right ══ */
.gh-row1{
  display:grid;grid-template-columns:1fr auto 1fr;
  align-items:center;height:60px;
  padding:0 clamp(20px,3.4vw,54px);column-gap:14px;
}
.gh-r1l{display:flex;align-items:center;gap:2px;justify-self:start;min-width:0;height:100%;}
@media(max-width:1279px){ .gh-row1{height:56px;padding:0 clamp(16px,3vw,40px);} }
@media(max-width:1023px){ .gh-row1{height:58px;padding:0 12px;} }
@media(max-width:767px) { .gh-row1{height:54px;padding:0 8px;} }

/* ══ ROW 1 quick-links — a quieter secondary nav (desktop only) ══ */
.gh-ql-nav{display:flex;align-items:center;height:100%;}
.gh-ql{
  font-family:var(--sans);font-size:9.5px;font-weight:500;
  letter-spacing:.18em;text-transform:uppercase;text-decoration:none;
  color:var(--fa);padding:0 11px;position:relative;white-space:nowrap;
  display:inline-flex;align-items:center;height:100%;
  transition:color .25s ease;
}
.gh-ql::after{
  content:'';position:absolute;left:11px;right:11px;bottom:14px;height:1px;
  background:linear-gradient(90deg,var(--a2),var(--a3));
  transform:scaleX(0);transform-origin:left;transition:transform .34s var(--e);
}
.gh-ql:hover{color:var(--ink);}
.gh-ql.on{color:var(--a);}
.gh-ql:hover::after,.gh-ql.on::after{transform:scaleX(1);}
@media(max-width:1279px){ .gh-ql{letter-spacing:.14em;padding:0 9px;} }

/* ══ ROW 2 — centered primary nav; collapses FIRST on scroll ══
   The grid-template-rows 1fr→0fr trick gives an exact-height, JS-free
   collapse.  overflow lives on the WRAP (clips the tween) while the inner
   row keeps overflow:visible so dropdowns aren't clipped at rest. */
.gh-row2wrap{
  display:grid;grid-template-rows:1fr;overflow:hidden;
  transition:grid-template-rows .5s var(--e),opacity .34s var(--e);
  will-change:grid-template-rows,opacity;
}
.gh.r2ready .gh-row2wrap{overflow:visible;}
.gh-row2wrap:focus-within{grid-template-rows:1fr!important;opacity:1!important;overflow:visible;pointer-events:auto;}
.gh-row2{
  display:flex;align-items:center;justify-content:center;
  min-height:0;height:46px;position:relative;overflow:visible;
  padding:0 clamp(20px,3.4vw,54px);
  transition:transform .42s var(--e);
}
/* inset, centre-fading couture rule between the rows */
.gh-row2::before{
  content:'';position:absolute;top:0;
  left:clamp(20px,3.4vw,54px);right:clamp(20px,3.4vw,54px);height:1px;
  background:linear-gradient(90deg,transparent,var(--bd) 18%,var(--bd) 82%,transparent);
  transition:opacity .26s ease,transform .4s var(--e);
}
.gh.compact .gh-row2::before{
  background:linear-gradient(90deg,transparent,var(--a3),var(--a2),var(--a3),transparent);
  background-size:220% 100%;animation:lineFlow 9s linear infinite;
}
/* collapsed (scrolled-down) state */
.gh.r2hide .gh-row2wrap{grid-template-rows:0fr;opacity:0;pointer-events:none;}
.gh.r2hide .gh-row2{transform:translateY(-6px);}
.gh.r2hide .gh-row2::before{opacity:0;transform:scaleX(0);transform-origin:center;}
/* un-furl the nav words on (re)expand — quick L→R micro-stagger */
.gh:not(.r2hide) .gh-row2 .gh-ni{animation:navUnfurl .42s var(--e) both;animation-delay:calc(var(--i,0)*.04s);}
@keyframes navUnfurl{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
@media(max-width:1279px){ .gh-row2{height:42px;} }
@media(max-width:1023px){ .gh-row2wrap{display:none!important;} .gh-ql-nav{display:none!important;} }

/* ══ SPACER — reserves the FULL (uncollapsed) header height, so the
   row-2 collapse (fixed header) never reflows page content (no CLS) ══ */
.gh-sp{display:block;width:100%;height:calc(30px + 60px + 46px);}
@media(max-width:1279px){ .gh-sp{height:calc(30px + 56px + 42px);} }
@media(max-width:1023px){ .gh-sp{height:calc(30px + 58px);} }
@media(max-width:767px) { .gh-sp{height:calc(24px + 54px);} }

/* ══ FOCUS ══ */
.gh a:focus-visible,.gh button:focus-visible{ outline:2px solid var(--a);outline-offset:2px;border-radius:6px; }

/* ══ RESPONSIVE TOGGLES ══ */
.desk{ display:flex; }
.mob { display:none!important; }
@media(max-width:1023px){ .desk{display:none!important;} .mob{display:flex!important;} }

/* ══ LOGO ══ */
.gh-logo{
  position:relative;overflow:hidden;
  display:inline-flex;align-items:center;justify-content:center;
  height:100%;padding:0 8px;text-decoration:none;border-radius:8px;
  transition:transform .4s var(--spring);
}
.gh-logo:hover{ transform:translateY(-1px); }
.gh-logo::after{
  content:'';position:absolute;top:0;bottom:0;left:0;width:60%;
  background:linear-gradient(105deg,transparent,rgba(255,255,255,.85),transparent);
  transform:translateX(-220%) skewX(-18deg);pointer-events:none;
}
.gh-logo:hover::after{ animation:shine .9s var(--e); }
@keyframes shine{ to{ transform:translateX(360%) skewX(-18deg); } }

.gh-logo-img{display:block;height:100%;max-height:38px;max-width:170px;width:auto;object-fit:contain;animation:logoFade .5s var(--e) both;transition:max-height .5s var(--e);}
.gh.compact .gh-logo-img{max-height:34px;}
@keyframes logoFade{ from{opacity:0;transform:scale(.9);} to{opacity:1;transform:scale(1);} }
.gh-logo-txt{
  font-family:var(--serif);font-size:clamp(13px,1.6vw,18px);font-weight:300;
  letter-spacing:.32em;text-transform:uppercase;color:var(--ink);white-space:nowrap;line-height:1;
}
.gh-logo-txt em{font-style:italic;font-weight:400;color:var(--a);}

/* faceted gem monogram — placeholder that NEVER shows brand text */
.gh-logo-mark,.m-logo-mark{ display:inline-flex;align-items:center;justify-content:center; }
.gh-logo-mark svg{ height:30px;width:auto; }
.m-logo-mark  svg{ height:26px;width:auto; }
.gem-spin{ transform-box:fill-box;transform-origin:center;animation:gemPulse 2.4s var(--e) infinite; }
@keyframes gemPulse{ 0%,100%{opacity:.55;} 50%{opacity:1;} }

/* ══ DESKTOP NAV (row 2) ══ */
.gh-ni  {position:relative;display:flex;align-items:center;height:100%;}
.gh-nl{
  font-family:var(--sans);font-size:10.5px;font-weight:500;
  letter-spacing:.16em;text-transform:uppercase;text-decoration:none;
  padding:0 clamp(9px,1vw,16px);height:100%;
  display:inline-flex;align-items:center;gap:4px;
  white-space:nowrap;color:var(--mu);position:relative;
  transition:color .25s ease;
}
.gh-nl::after{
  content:'';position:absolute;
  left:clamp(9px,1vw,16px);right:clamp(9px,1vw,16px);
  bottom:0;height:1.5px;border-radius:1px;
  background:linear-gradient(90deg,var(--a),var(--a3),var(--a2));
  background-size:200% 100%;
  transform:scaleX(0);transform-origin:center;
  filter:drop-shadow(0 1px 2px var(--am));
  transition:transform .4s var(--e);
}
.gh-nl:hover,.gh-nl.on{color:var(--ink);}
.gh-ni:hover .gh-nl::after,
.gh-ni:focus-within .gh-nl::after,
.gh-nl.on::after{transform:scaleX(1);}
.gh-nl.on::after{animation:navUnderShine 2.6s var(--e) infinite;}
@keyframes navUnderShine{0%{background-position:0% 0;}100%{background-position:200% 0;}}
.gh-chev{opacity:.4;flex-shrink:0;transition:transform .3s var(--e),opacity .2s ease;}
.gh-ni:hover .gh-chev,.gh-chev.r{transform:rotate(180deg);opacity:.7;}

/* simple dropdown */
.gh-dd{
  position:absolute;top:100%;left:50%;
  transform:translateX(-50%) translateY(10px);
  min-width:194px;background:var(--w);
  border:1px solid var(--bd);border-radius:14px;
  box-shadow:0 18px 40px -12px rgba(58,46,34,.16);
  padding:7px;opacity:0;visibility:hidden;pointer-events:none;
  transition:opacity .18s ease,transform .26s var(--e),visibility .18s;
  z-index:8000;
}
.gh-dd.open{opacity:1;visibility:visible;pointer-events:all;transform:translateX(-50%) translateY(2px);}
.gh-ddl{
  display:flex;align-items:center;padding:10px 13px;
  font-family:var(--sans);font-size:10.5px;font-weight:400;letter-spacing:.05em;
  color:var(--mu);text-decoration:none;border-radius:9px;
  transition:color .16s ease,background .16s ease,padding-left .22s var(--e);
}
.gh-ddl:hover{color:var(--ink);background:var(--cr);padding-left:18px;}

/* ══ RIGHT ICONS ══ */
.gh-right{display:flex;align-items:center;justify-content:flex-end;gap:1px;height:100%;}
.gh-ic{
  width:38px;height:38px;border-radius:11px;
  display:inline-flex;align-items:center;justify-content:center;gap:4px;
  background:transparent;border:none;cursor:pointer;
  text-decoration:none;flex-shrink:0;position:relative;
  color:var(--mu);
  transition:color .2s ease,background .25s var(--e),transform .18s var(--spring);
  -webkit-tap-highlight-color:transparent;
}
.gh-ic:hover{color:var(--a);background:var(--al);transform:translateY(-2px);}
.gh-ic:active{transform:scale(.9);}
.gh-ic.on{color:var(--a);background:var(--al);}
/* ══ WHATSAPP — premium contact control (desktop + mobile) ══ */
.gh-wa{
  position:relative;flex-shrink:0;overflow:visible;
  width:38px;height:38px;border-radius:11px;
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  cursor:pointer;text-decoration:none;
  color:#0E7A4F;
  background:linear-gradient(135deg,rgba(37,211,102,.16),rgba(18,140,126,.10));
  border:1px solid rgba(18,140,126,.26);
  box-shadow:0 2px 10px -4px rgba(18,140,126,.4),inset 0 1px 0 rgba(255,255,255,.55);
  transition:color .25s var(--e),background .3s var(--e),border-color .25s var(--e),
    transform .18s var(--spring),box-shadow .3s var(--e);
  -webkit-tap-highlight-color:transparent;
}
.gh-wa svg{position:relative;z-index:1;transition:transform .3s var(--spring);}
.gh-wa:hover{
  color:#fff;border-color:transparent;transform:translateY(-2px);
  background:linear-gradient(135deg,#25D366,#0F9D74 55%,#128C7E);
  box-shadow:0 10px 24px -8px rgba(18,140,126,.65),inset 0 1px 0 rgba(255,255,255,.35);
}
.gh-wa:hover svg{transform:scale(1.08);}
.gh-wa:active{transform:scale(.92);}
.gh-wa.mob{margin-right:14px;}
/* labelled pill variant (desktop) */
.gh-wa.pill{width:auto;padding:0 14px 0 12px;margin-left:6px;}
.gh-wa-lbl{position:relative;z-index:1;font-family:var(--sans);font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;}
.gh-wa-glow{display:none;}
/* gentle presence pulse */
.gh-wa::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:0 0 0 0 rgba(37,211,102,.35);animation:waPulse 3s ease-out infinite;}
@keyframes waPulse{0%{box-shadow:0 0 0 0 rgba(37,211,102,.3);}70%,100%{box-shadow:0 0 0 8px rgba(37,211,102,0);}}
.gh-badge{
  position:absolute;top:1px;right:1px;
  min-width:15px;height:15px;padding:0 3px;border-radius:8px;
  background:linear-gradient(135deg,var(--a),var(--a2));color:var(--w);
  font-family:var(--sans);font-size:8px;font-weight:700;line-height:1;
  display:inline-flex;align-items:center;justify-content:center;
  border:1.5px solid var(--w);box-shadow:0 2px 6px -1px rgba(140,116,86,.5);
  animation:badgePop .45s var(--spring) both;
}
.gh-badge::after{content:'';position:absolute;inset:-3px;border-radius:inherit;border:1.5px solid var(--a3);opacity:0;pointer-events:none;animation:badgeRing .55s var(--e) both;}
@keyframes badgeRing{0%{opacity:.6;transform:scale(.6);}100%{opacity:0;transform:scale(1.5);}}
@keyframes badgePop{ 0%{transform:scale(0);} 60%{transform:scale(1.28);} 100%{transform:scale(1);} }
.gh-sep{width:1px;height:16px;margin:0 4px;flex-shrink:0;background:var(--bd);}
.gh-curlbl{font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:.04em;}

/* ══ CART — ultra-premium minimal icon ══
   Clean icon-only design with a refined floating badge. No background pill —
   just a crisp icon that subtly lifts and glows on hover, with a sharp count
   badge in the corner. Luxury-minimalist aesthetic. */
.gh-cart{
  position:relative;box-sizing:border-box;flex-shrink:0;
  display:inline-flex;align-items:center;justify-content:center;
  width:44px;height:44px;cursor:pointer;text-decoration:none;
  color:var(--ink);
  background:transparent;
  border:none;
  transition:color .28s cubic-bezier(.4,0,.2,1),transform .22s cubic-bezier(.34,1.56,.64,1);
  -webkit-tap-highlight-color:transparent;
}
.gh-cart.desk{margin-left:2px;}
.gh-cart:hover{
  color:var(--a);
  transform:translateY(-1px) scale(1.02);
}
.gh-cart:active{transform:scale(.96);}
.gh-cart-ico{
  position:relative;z-index:2;display:inline-flex;
  filter:drop-shadow(0 1px 2px rgba(26,22,20,.06));
  transition:filter .28s cubic-bezier(.4,0,.2,1);
}
.gh-cart:hover .gh-cart-ico{
  filter:drop-shadow(0 3px 8px rgba(140,116,86,.28)) drop-shadow(0 1px 3px rgba(140,116,86,.18));
}
/* count — sharp, compact badge with subtle depth */
.gh-cart-ct{
  position:absolute;top:-4px;right:-4px;z-index:3;
  min-width:19px;height:19px;padding:0 5px;border-radius:10px;
  display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--sans);font-size:10.5px;font-weight:800;line-height:1;letter-spacing:-.01em;
  background:linear-gradient(135deg,#1a1714 0%,#2a2420 100%);
  color:#fff;
  border:2px solid var(--w);
  box-shadow:0 2px 6px -1px rgba(26,22,20,.35),0 1px 2px rgba(26,22,20,.2);
  animation:badgePop .42s cubic-bezier(.34,1.56,.64,1) both;
  transition:background .25s ease,transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease;
}
.gh-cart:hover .gh-cart-ct{
  background:linear-gradient(135deg,var(--a),var(--a2));
  transform:scale(1.08);
  box-shadow:0 3px 9px -2px rgba(140,116,86,.5),0 2px 4px -1px rgba(140,116,86,.3);
}

/* ══ ANIMATED HAMBURGER ↔ X ══ */
.gh-burger{
  width:40px;height:40px;border-radius:12px;flex-shrink:0;
  display:inline-flex;align-items:center;justify-content:center;
  background:transparent;border:none;cursor:pointer;color:var(--ink);position:relative;
  transition:color .2s ease,background .25s var(--e),transform .18s var(--spring);
  -webkit-tap-highlight-color:transparent;
}
.gh-burger:hover{background:var(--al);color:var(--a);}
.gh-burger:active{transform:scale(.9);}
.gh-burger.open{background:var(--al);color:var(--a);}
.gh-burger-box{position:relative;width:20px;height:14px;}
.gh-burger-line{
  position:absolute;left:0;height:1.8px;width:100%;border-radius:2px;
  background:currentColor;
  transition:transform .42s var(--spring),opacity .22s ease,width .42s var(--spring);
}
.gh-burger-line:nth-child(1){top:0;}
.gh-burger-line:nth-child(2){top:50%;transform:translateY(-50%);width:72%;}
.gh-burger-line:nth-child(3){bottom:0;}
.gh-burger.open .gh-burger-line:nth-child(1){top:50%;transform:translateY(-50%) rotate(45deg);}
.gh-burger.open .gh-burger-line:nth-child(2){opacity:0;width:0;}
.gh-burger.open .gh-burger-line:nth-child(3){bottom:auto;top:50%;transform:translateY(-50%) rotate(-45deg);}

/* ══ DESKTOP POPOVERS ══ */
.gh-pop{
  position:absolute;top:calc(100% + 10px);right:0;
  min-width:176px;background:var(--w);
  border:1px solid var(--bd);border-radius:15px;
  box-shadow:0 20px 48px -14px rgba(58,46,34,.18);
  padding:7px;z-index:9100;
  animation:pop .2s var(--e) both;
}
@keyframes pop{from{opacity:0;transform:translateY(-7px) scale(.97);}to{opacity:1;transform:none;}}
.gh-pl{
  display:flex;align-items:center;gap:8px;padding:10px 12px;
  font-family:var(--sans);font-size:10px;font-weight:500;letter-spacing:.10em;text-transform:uppercase;
  color:var(--mu);text-decoration:none;background:none;border:none;
  cursor:pointer;width:100%;text-align:left;border-radius:10px;
  transition:color .14s ease,background .14s ease,padding-left .2s var(--e);
}
.gh-pl:hover{color:var(--ink);background:var(--cr);padding-left:15px;}
.gh-pl.hi{color:var(--a);}
.gh-psep{height:1px;background:var(--bd);margin:5px 6px;}
.gh-pem{padding:8px 12px 4px;font-family:var(--sans);font-size:9px;color:var(--fa);word-break:break-all;}
.gh-plo{
  display:flex;align-items:center;gap:8px;padding:10px 12px;
  font-family:var(--sans);font-size:10px;font-weight:500;letter-spacing:.10em;text-transform:uppercase;
  color:rgba(160,70,70,.70);background:none;border:none;cursor:pointer;
  width:100%;text-align:left;border-radius:10px;
  transition:color .13s ease,background .13s ease,padding-left .2s var(--e);
}
.gh-plo:hover{color:#b83232;background:rgba(184,50,50,.05);padding-left:15px;}

/* ══ DESKTOP MEGA ══ */
.gh-mega-bd{
  position:fixed;inset:0;background:rgba(58,46,34,.16);
  backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);
  z-index:8980;opacity:0;pointer-events:none;transition:opacity .26s ease;
}
.gh-mega-bd.open{opacity:1;pointer-events:all;}
.gh-mega-w{
  position:fixed;left:0;right:0;z-index:8990;pointer-events:none;
  opacity:0;transform:translateY(-8px);
  transition:opacity .22s var(--e),transform .3s var(--e);
}
.gh-mega-w::before{content:'';position:absolute;top:-22px;left:0;right:0;height:22px;pointer-events:all;}
.gh-mega-w.open{opacity:1;pointer-events:all;transform:translateY(0);}
@media(max-width:1023px){.gh-mega-w,.gh-mega-bd{display:none;}}
.gh-mega{
  width:100%;background:var(--w);
  border-top:1px solid rgba(140,116,86,.18);
  border-bottom:1px solid var(--bd);
  box-shadow:0 24px 50px -18px rgba(58,46,34,.13);
}
.gh-mg{
  display:grid;grid-template-columns:repeat(3,1fr) 1.2fr;
  max-width:1280px;margin:0 auto;padding:0 clamp(22px,4vw,50px);
}
.gh-mc{padding:28px 20px 32px;border-right:1px solid var(--li);}
.gh-mega-w.open .gh-mc{animation:mdrop .4s var(--e) both;}
.gh-mega-w.open .gh-mc:nth-child(2){animation-delay:.05s;}
.gh-mega-w.open .gh-mc:nth-child(3){animation-delay:.1s;}
.gh-mc:nth-child(3){border-right:none;}
.gh-mh{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.gh-mt{font-family:var(--sans);font-size:8px;font-weight:600;letter-spacing:.30em;text-transform:uppercase;color:var(--a);}
.gh-md{flex:1;height:1px;background:var(--bd);}
.gh-ml{
  display:flex;align-items:center;padding:7px 0;
  font-family:var(--sans);font-size:11.5px;font-weight:300;letter-spacing:.03em;
  color:var(--mu);text-decoration:none;position:relative;
  transition:color .18s ease,padding-left .22s var(--e);
}
.gh-ml::before{
  content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
  width:0;height:1px;background:var(--a);transition:width .22s var(--e);
}
.gh-ml:hover{color:var(--ink);padding-left:14px;}
.gh-ml:hover::before{width:9px;}
.gh-mf{padding:20px;background:var(--cr);border-left:1px solid var(--bd);display:flex;flex-direction:column;justify-content:center;}
.gh-fc{
  position:relative;border-radius:12px;overflow:hidden;
  min-height:184px;display:flex;flex-direction:column;justify-content:flex-end;
  padding:14px;text-decoration:none;border:1px solid var(--bd);
  transition:transform .38s var(--e),box-shadow .3s ease;
}
.gh-fc:hover{transform:translateY(-3px);box-shadow:0 16px 32px -10px rgba(58,46,34,.2);}
.gh-fi{position:absolute;inset:0;z-index:0;}
.gh-fi img{width:100%;height:100%;object-fit:cover;transition:transform .7s var(--e);}
.gh-fc:hover .gh-fi img{transform:scale(1.08);}
.gh-fo{position:absolute;inset:0;background:linear-gradient(to top,rgba(20,14,8,.82) 0%,transparent 58%);}
.gh-fb{position:relative;z-index:1;}
.gh-ft{display:block;font-family:var(--sans);font-size:8px;font-weight:600;letter-spacing:.20em;text-transform:uppercase;color:rgba(201,182,143,.95);margin-bottom:3px;}
.gh-fh{font-family:var(--serif);font-size:18px;font-weight:400;color:var(--iv);margin:0 0 6px;line-height:1.15;}
.gh-fcta{font-family:var(--sans);font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(250,246,240,.62);display:inline-flex;align-items:center;gap:5px;transition:color .2s ease,gap .2s ease;}
.gh-fc:hover .gh-fcta{color:rgba(201,182,143,.95);gap:10px;}


/* ══════════════════════════════════════════════════════════════════
   MOBILE MENU  —  drops DOWN from beneath the header bar.
   Same hamburger toggles open & close (morphs into an X).
══════════════════════════════════════════════════════════════════ */

/* frosted backdrop (sits below header so the X stays clickable) */
.m-ov{
  position:fixed;inset:0;z-index:9000;
  background:rgba(43,33,23,.32);
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  opacity:0;pointer-events:none;
  transition:opacity .4s var(--e);
}
.m-ov.open{opacity:1;pointer-events:all;}

/* panel — unrolls downward from the header */
.m-pn{
  position:fixed;left:0;right:0;z-index:9500;
  top:var(--header-h,84px);bottom:0;
  background:var(--iv);
  box-shadow:0 24px 60px -12px rgba(58,46,34,.22);
  display:flex;flex-direction:column;overflow:hidden;
  opacity:0;visibility:hidden;pointer-events:none;
  transform-origin:top center;transform:scaleY(.985);
  clip-path:inset(0 0 100% 0);
  /* CLOSE (default) — a crisp, faster retract upward */
  transition:clip-path .38s var(--e),opacity .26s ease,transform .38s var(--e),visibility .38s;
}
.m-pn.open{
  opacity:1;visibility:visible;pointer-events:auto;transform:scaleY(1);clip-path:inset(0 0 0 0);
  /* OPEN — a slower, poured-from-the-bar unroll */
  transition:clip-path .5s var(--e),opacity .35s ease,transform .5s var(--e);
}
/* gold top-edge light that draws across as the panel opens (and fades first on close) */
.m-pn::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;z-index:3;pointer-events:none;
  background:linear-gradient(90deg,transparent,var(--a3),var(--a2),var(--a3),transparent);
  transform:scaleX(0);transform-origin:center;transition:transform .26s var(--e);
}
.m-pn.open::before{transform:scaleX(1);transition:transform .55s var(--e) .08s;}

/* scrollable body */
.m-body{flex:1;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding-top:6px;}
.m-body::-webkit-scrollbar{width:0;}

/* staggered reveal helper */
.m-rev{opacity:0;}
.m-pn.open .m-rev{animation:mIn .5s var(--e) both;}
@keyframes mIn{from{opacity:0;transform:translateY(-12px) scale(.99);}to{opacity:1;transform:translateY(0) scale(1);}}

/* ── featured hero card ── */
.m-feat{
  position:relative;display:block;margin:14px 14px 4px;
  border-radius:16px;overflow:hidden;min-height:128px;text-decoration:none;
  border:1px solid var(--bd);
  box-shadow:0 10px 28px -12px rgba(58,46,34,.2);
}
.m-feat-img{position:absolute;inset:0;z-index:0;}
.m-feat-img img{width:100%;height:100%;object-fit:cover;transition:transform 5s var(--e);}
.m-feat:active .m-feat-img img{transform:scale(1.06);}
.m-feat-ov{position:absolute;inset:0;z-index:1;background:linear-gradient(105deg,rgba(20,14,8,.78) 0%,rgba(20,14,8,.32) 60%,transparent 100%);}
.m-feat-tx{position:relative;z-index:2;display:flex;flex-direction:column;gap:3px;padding:18px 18px 16px;height:100%;justify-content:flex-end;}
.m-feat-k{font-family:var(--sans);font-size:8px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:var(--a3);}
.m-feat-h{font-family:var(--serif);font-size:23px;font-weight:400;line-height:1.1;color:var(--iv);}
.m-feat-c{display:inline-flex;align-items:center;gap:6px;margin-top:5px;font-family:var(--sans);font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(250,246,240,.7);}

/* ── category cards — image + name, the whole card is the link ── */
.m-cats{
  display:flex;gap:10px;
  padding:12px 14px 4px;
  overflow-x:auto;
  overflow-y:hidden;
  scroll-behavior:smooth;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
  -ms-overflow-style:none;
}
.m-cats::-webkit-scrollbar{display:none;}
.m-cat{
  position:relative;display:block;overflow:hidden;
  flex-shrink:0;
  width:160px;
  height:120px;
  border-radius:15px;
  border:1px solid var(--bd);background:var(--cr);
  text-decoration:none;
  box-shadow:0 8px 20px -14px rgba(58,46,34,.55);
  transition:transform .3s var(--spring),box-shadow .3s ease;
  -webkit-tap-highlight-color:transparent;
}
.m-cat:hover,.m-cat:active{transform:translateY(-3px);box-shadow:0 15px 30px -12px rgba(58,46,34,.5);}
.m-cat-img{position:absolute;inset:0;z-index:0;}
.m-cat-img img{width:100%;height:100%;object-fit:cover;transition:transform .65s var(--e);}
.m-cat:hover .m-cat-img img,.m-cat:active .m-cat-img img{transform:scale(1.07);}
.m-cat-ov{position:absolute;inset:0;z-index:1;background:linear-gradient(to top,rgba(20,14,8,.88) 0%,rgba(20,14,8,.30) 48%,rgba(20,14,8,.02) 84%);}
.m-cat-l{
  position:absolute;left:0;right:0;bottom:0;z-index:2;
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:10px 12px 12px;color:var(--iv);
}
.m-cat-nm{
  font-family:var(--serif);font-size:14px;font-weight:500;letter-spacing:.004em;line-height:1.12;
  text-shadow:0 1px 8px rgba(0,0,0,.4);
}
.m-cat-l svg{flex-shrink:0;opacity:.72;color:var(--a3);transition:transform .25s var(--e),opacity .25s ease;}
.m-cat:hover .m-cat-l svg,.m-cat:active .m-cat-l svg{transform:translateX(3px);opacity:1;}

/* ── divider label ── */
.m-sec-hd{display:flex;align-items:center;gap:10px;padding:18px 16px 4px;}
.m-sec-lbl{font-family:var(--sans);font-size:8px;font-weight:600;letter-spacing:.30em;text-transform:uppercase;color:var(--a);}
.m-sec-ln{flex:1;height:1px;background:linear-gradient(90deg,var(--bd),transparent);}

/* ── main nav items ── */
.m-ni{border-bottom:1px solid var(--li);}
.m-nrow{display:flex;align-items:center;padding:0 16px;min-height:56px;}
.m-nlink{
  flex:1;display:flex;align-items:center;
  padding:13px 0;min-height:46px;
  text-decoration:none;
  -webkit-tap-highlight-color:transparent;
}
.m-nlink-tx{
  position:relative;
  font-family:var(--serif);font-size:25px;font-weight:300;letter-spacing:.01em;
  color:var(--ink);transition:color .22s ease;
}
.m-nlink-tx::after{
  content:'';position:absolute;left:0;right:100%;bottom:2px;height:1.5px;
  background:linear-gradient(90deg,var(--a),var(--a3));
  transition:right .35s var(--e);
}
.m-nlink:hover .m-nlink-tx,.m-nlink.act .m-nlink-tx{color:var(--a);}
.m-nlink:hover .m-nlink-tx::after,.m-nlink.act .m-nlink-tx::after{right:0;}
.m-nlink.act .m-nlink-tx{font-style:italic;}

.m-tog{
  width:38px;height:38px;flex-shrink:0;
  display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--bd);border-radius:50%;
  background:transparent;cursor:pointer;color:var(--mu);
  transition:background .22s ease,color .22s ease,border-color .22s ease,transform .25s var(--spring);
  -webkit-tap-highlight-color:transparent;
}
.m-tog:hover,.m-tog.open{background:var(--cr);color:var(--a);border-color:var(--a2);}
.m-tog.open{transform:rotate(180deg);}
.m-tc{transition:transform .3s var(--e);}

/* accordion — grid-rows for exact, jank-free height */
.m-acc{display:grid;grid-template-rows:0fr;overflow:hidden;background:var(--cr);transition:grid-template-rows .4s var(--e);}
.m-acc.open{grid-template-rows:1fr;}
.m-acc-in{min-height:0;overflow:hidden;}
.m-asc{padding:13px 16px 3px;font-family:var(--sans);font-size:8px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--a);}
.m-asl{
  display:flex;align-items:center;min-height:42px;padding:9px 16px;
  font-family:var(--sans);font-size:12.5px;font-weight:400;letter-spacing:.03em;
  color:var(--mu);text-decoration:none;
  transition:color .14s ease,background .14s ease,padding-left .2s var(--e);
}
.m-asl:hover{color:var(--ink);background:var(--wa);padding-left:24px;}

/* ── panel footer ── */
.m-foot{
  flex-shrink:0;
  padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px));
  border-top:1px solid var(--bd);
  background:linear-gradient(180deg,var(--w),var(--iv));
  display:flex;flex-direction:column;gap:10px;
}
.m-pn.open .m-foot{animation:mIn .45s var(--e) .34s both;}

/* currency pills */
.m-cur{display:flex;gap:6px;}
.m-cur-b{
  flex:1;height:38px;border-radius:19px;cursor:pointer;
  font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:.10em;text-transform:uppercase;
  border:1px solid var(--bd);background:transparent;color:var(--mu);
  transition:all .2s var(--e);-webkit-tap-highlight-color:transparent;
}
.m-cur-b.on{background:linear-gradient(135deg,var(--a),var(--a2));color:var(--w);border-color:var(--a);box-shadow:0 6px 16px -6px rgba(140,116,86,.6);}

/* auth row */
.m-auth{display:flex;gap:8px;}
.m-auth a,.m-auth button{
  flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;
  height:44px;border-radius:22px;
  font-family:var(--sans);font-size:10px;font-weight:600;
  letter-spacing:.10em;text-transform:uppercase;text-decoration:none;
  cursor:pointer;transition:all .2s var(--e);-webkit-tap-highlight-color:transparent;
}
.m-a-ghost{border:1px solid var(--bd);background:transparent;color:var(--mu);}
.m-a-ghost:hover{border-color:var(--a2);color:var(--ink);background:var(--cr);}
.m-a-solid{background:linear-gradient(135deg,var(--a),var(--a2));color:var(--w);border:1px solid var(--a);font-weight:700;box-shadow:0 8px 20px -8px rgba(140,116,86,.7);}
.m-a-solid:hover{transform:translateY(-1px);box-shadow:0 12px 26px -8px rgba(140,116,86,.8);}
.m-a-danger{border:1px solid rgba(160,60,60,.20);color:rgba(160,60,60,.72);background:transparent;}
.m-a-danger:hover{background:rgba(184,50,50,.05);color:#b83232;}

.m-email{font-family:var(--sans);font-size:9px;color:var(--fa);text-align:center;word-break:break-all;}

/* contact links */
.m-contact{display:flex;gap:8px;}
.m-cl{
  flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;
  height:38px;border-radius:19px;border:1px solid var(--bd);
  background:transparent;font-family:var(--sans);font-size:9.5px;font-weight:500;
  letter-spacing:.07em;color:var(--mu);text-decoration:none;
  transition:all .18s var(--e);-webkit-tap-highlight-color:transparent;
}
.m-cl:hover{color:var(--ink);border-color:var(--a2);background:var(--cr);}


/* ══════════════════════════════════════════════════════════════════
   BOTTOM NAV  —  floating pill, warm ivory palette, gliding indicator
══════════════════════════════════════════════════════════════════ */
.bn{display:none;}
@media(max-width:1023px){
  .bn{
    display:flex;position:fixed;
    bottom:calc(10px + env(safe-area-inset-bottom,0px));
    left:50%;transform:translateX(-50%);z-index:9200;
    align-items:center;justify-content:space-around;
    width:calc(100% - 20px);max-width:370px;height:60px;
    background:rgba(255,255,255,.92);
    backdrop-filter:blur(12px) saturate(1.5);-webkit-backdrop-filter:blur(12px) saturate(1.5);
    border:1px solid var(--bd);border-radius:30px;
    box-shadow:0 6px 28px rgba(58,46,34,.1),0 1px 4px rgba(58,46,34,.06);
    padding:0 4px;
  }
  .bn-i{
    flex:1;height:100%;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    text-decoration:none;color:var(--mu);
    border:none;background:transparent;cursor:pointer;position:relative;
    border-radius:22px;padding:0;
    -webkit-tap-highlight-color:transparent;
    transition:color .25s var(--e);
  }
  .bn-i:active{transform:scale(.86);transition:transform .1s ease,color .14s ease;}
  .bn-i.act{color:var(--a);}
  .bn-i:focus-visible{outline:2px solid var(--a);outline-offset:-4px;border-radius:20px;}

  /* active pill glow */
  .bn-i.act::before{
    content:'';position:absolute;inset:5px 3px;
    background:var(--al);border-radius:17px;
    border:1px solid rgba(140,116,86,.18);
    animation:bnGlow .4s var(--spring) both;
  }
  @keyframes bnGlow{from{opacity:0;transform:scale(.7);}to{opacity:1;transform:scale(1);}}

  /* gliding top indicator */
  .bn-i::after{
    content:'';position:absolute;top:-1px;left:50%;
    width:22px;height:2.5px;border-radius:2px;
    background:linear-gradient(90deg,var(--a),var(--a2));
    transform:translateX(-50%) scaleX(0);transform-origin:center;
    transition:transform .35s var(--spring);
  }
  .bn-i.act::after{transform:translateX(-50%) scaleX(1);}

  .bn-icon{position:relative;z-index:1;transition:transform .3s var(--spring);}
  .bn-i.act .bn-icon{transform:translateY(-2px);}

  .bn-lbl{
    font-family:var(--sans);font-size:7px;font-weight:500;
    letter-spacing:.10em;text-transform:uppercase;z-index:1;
    transition:font-weight .2s ease;
  }
  .bn-i.act .bn-lbl{font-weight:700;}

  .bn-badge{
    position:absolute;top:2px;right:calc(50% - 16px);
    min-width:14px;height:14px;padding:0 3px;border-radius:7px;
    background:linear-gradient(135deg,var(--a),var(--a2));color:var(--w);
    font-family:var(--sans);font-size:7.5px;font-weight:700;line-height:1;
    display:inline-flex;align-items:center;justify-content:center;
    border:1.5px solid var(--w);z-index:2;
    animation:badgePop .45s var(--spring) both;
  }

  /* ── elevated premium center FAB — wax-seal concierge ── */
  .bn-center{overflow:visible;justify-content:flex-end;padding-bottom:6px;}
  .bn-center::after,.bn-center::before{display:none;}
  .bn-center .bn-fab{
    position:relative;width:52px;height:52px;margin-top:-28px;margin-bottom:2px;
    border-radius:50%;color:var(--iv);
    background:radial-gradient(circle at 38% 30%,var(--a3),var(--a) 82%);
    display:flex;align-items:center;justify-content:center;
    border:2px solid var(--w);
    box-shadow:0 7px 20px rgba(140,116,86,.42),0 2px 6px rgba(58,46,34,.22);
    animation:bnFloat 3.4s var(--e) infinite;
    transition:transform .4s var(--spring);
  }
  .bn-center .bn-fab svg{position:relative;z-index:1;}
  .bn-center .bn-fab::before{
    content:'';position:absolute;inset:-3px;border-radius:50%;
    border:1.5px solid var(--a3);opacity:.6;
    animation:bnHalo 3.4s var(--e) infinite;
  }
  .bn-center .bn-fab::after{
    content:'';position:absolute;inset:0;border-radius:50%;pointer-events:none;
    background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.55) 50%,transparent 60%);
    background-size:250% 250%;background-position:120% 0;
    animation:bnGlint 6.5s var(--e) infinite;
  }
  .bn-center:active .bn-fab{transform:scale(.9);}
  .bn-center .bn-lbl{color:var(--a);font-weight:700;}
  @keyframes bnFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes bnHalo{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.85;transform:scale(1.14)}}
  @keyframes bnGlint{0%,80%{background-position:120% 0}92%,100%{background-position:-45% 0}}

  body{padding-bottom:calc(78px + env(safe-area-inset-bottom,0px));}
  .cw-trigger,.fab-wa-wrap{display:none!important;}
}

/* ══ REDUCED MOTION ══ */
@media(prefers-reduced-motion:reduce){
  .gh{transition:none;}.gh.hide{transform:translateY(0);}
  .gh-ann,.gh-bar{animation:none;}
  .gh-ann::before,.gh-bar::after{animation:none;display:none;}
  .gh *,.m-pn,.m-pn *,.m-ov,.gh-pop *,.bn *,.gh-mega-w *{
    animation-duration:.01ms!important;transition-duration:.01ms!important;
  }
  /* keep a static, fully-open two-row header — never collapse/hide via motion */
  .gh-row2wrap,.gh.r2hide .gh-row2wrap{grid-template-rows:1fr!important;opacity:1!important;overflow:visible;}
  .gh.r2hide .gh-row2{transform:none!important;}
  .gh.r2hide .gh-row2::before{opacity:1!important;transform:none!important;}
  .gh:not(.r2hide) .gh-row2 .gh-ni{animation:none!important;}
  .m-pn{clip-path:none!important;transform:none!important;}
  .m-pn::before{display:none;}
  .m-rev{opacity:1;}
}
`

const fmtCount = (n: number) => (n > 99 ? '99+' : String(n))

/* ── Faceted gem monogram — logo placeholder (NEVER renders text) ── */
const GemMark = () => (
  <svg viewBox="0 0 40 34" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ggem" x1="0" y1="0" x2="40" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C9B68F" /><stop offset=".5" stopColor="#A8916F" /><stop offset="1" stopColor="#8C7456" />
      </linearGradient>
    </defs>
    <g className="gem-spin" stroke="url(#ggem)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 4h24l6 8-18 18L2 12Z" fill="rgba(201,182,143,.10)" />
      <path d="M15 4l-7 8 12 18 12-18-7-8" />
      <path d="M2 12h36" />
      <path d="M20 4 15 12l5 18 5-18-5-8" />
    </g>
  </svg>
)

/* ── Custom SVG icons for bottom nav ── */
const IconGem = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12l4 6-10 13L2 9Z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </svg>
)

const IconWA = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M27.1 4.9A14.5 14.5 0 0 0 16 .5C7.5.5.6 7.4.6 15.9c0 2.7.7 5.2 2 7.5L.5 31.5l8.4-2.1a15 15 0 0 0 7.1 1.8h.1c8.5 0 15.4-6.9 15.4-15.4 0-4.1-1.6-8-4.4-10.9ZM16.1 28.9h-.1a12.7 12.7 0 0 1-6.5-1.8l-.5-.3-5 1.3 1.3-4.9-.3-.5a12.8 12.8 0 1 1 23.1-6.8c0 7-5.7 12.7-12 13ZM23 19.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.6.2-.2.3-.7 1-1 1.2-.2.2-.4.3-.8.1-2.2-1.1-3.6-2-5-4.5-.4-.7.4-.7 1-2.2 0-.2 0-.4 0-.6a.6.6 0 0 0-.2-.5c-.2-.2-.6-.3-.8-.3-.8-.1-1.5.1-2 .6-.7.7-1 1.9-1 2.9 0 .3 0 .6.1.9.2.6.7 2.4 2.7 4.3 1.9 1.8 3.6 2.3 4.2 2.5.6.2 1.9.2 2.6 0 .8-.2 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.1-.3-.2-.5-.3Z" fill="currentColor" />
  </svg>
)

/* ── Refined, cohesive bottom-nav icon set (1.5 stroke, rounded) ── */
const IconHome = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.2 10.3 12 3.4l8.8 6.9" />
    <path d="M5 9.4V19a1.4 1.4 0 0 0 1.4 1.4h11.2A1.4 1.4 0 0 0 19 19V9.4" />
    <path d="M9.6 20.4v-5.2a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v5.2" />
  </svg>
)
const IconHeartNav = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20.4S3.6 15.6 3.6 9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8.4 2c0 6-8.4 10.8-8.4 10.8Z" />
  </svg>
)
const IconUserNav = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8.2" r="3.6" />
    <path d="M4.8 20c0-3.8 3.2-6.4 7.2-6.4s7.2 2.6 7.2 6.4" />
  </svg>
)
const IconChatNav = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 11.5a7.7 7.7 0 0 1-11 7L4 20l1.6-5a7.7 7.7 0 1 1 14.9-3.5Z" />
    <path d="M8.6 11.6h.01M12 11.6h.01M15.4 11.6h.01" strokeWidth="2.1" />
  </svg>
)

export function Header() {
  const router = useRouter()
  const pathname = usePathname()

  const outerRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const leaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userPopRef = useRef<HTMLDivElement>(null)
  const curPopRef = useRef<HTMLDivElement>(null)
  const lastY = useRef(0)
  const accRef = useRef(0)
  const r2hideRef = useRef(false)
  const hiddenRef = useRef(false)
  const wasOpen = useRef(false)
  const logoRef = useRef<HTMLAnchorElement>(null)
  const mobCartRef = useRef<HTMLAnchorElement>(null)
  const bnRef = useRef<HTMLElement>(null)

  const [compact, setCompact] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [r2hide, setR2hide] = useState(false)
  const [r2ready, setR2ready] = useState(true)
  const [menuOpen, setMenu] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [cartCnt, setCart] = useState(0)
  const [wishCnt, setWish] = useState(0)
  const [currency, setCur] = useState<Currency>('USD')
  const [settings, setSets] = useState<SiteSettings | null>(null)
  const [userOpen, setUserOpen] = useState(false)
  const [curOpen, setCurOpen] = useState(false)
  const [activeNav, setActiveNav] = useState<string | null>(null)
  const [megaTop, setMegaTop] = useState(98)
  const [mobExp, setMobExp] = useState<string | null>(null)
  const [cats, setCats] = useState<MobCat[]>(MOB_CAT_FALLBACK)

  /* ── smart scroll: a two-beat choreography ──
     Scrolling DOWN first collapses the nav row (row 2), leaving a slim
     logo bar; a further beat then tucks the whole header away.  Scrolling
     UP reveals the compact bar instantly, and only un-furls row 2 once
     you near the top.  Hysteresis on accRef keeps it jitter-free. */
  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion:reduce)')
    let tick = false
    const run = () => {
      tick = false
      const y = Math.max(0, window.scrollY || 0)
      const dy = y - lastY.current
      setCompact(y > 6)
      if (rm.matches) { setHidden(false); setR2hide(false); accRef.current = 0; lastY.current = y; return }
      /* near-top: always fully open + shown (self-heals any stuck state) */
      if (y < 70) { setHidden(false); setR2hide(false); accRef.current = 0; lastY.current = y; return }
      /* reset the accumulator the instant scroll direction flips */
      if ((dy > 0 && accRef.current < 0) || (dy < 0 && accRef.current > 0)) accRef.current = 0
      accRef.current += dy
      if (accRef.current > 34) {
        /* DOWN — collapse the nav row first … */
        if (!r2hideRef.current) { setR2hide(true); setActiveNav(null); accRef.current = 0 }
        /* … then, after a fresh beat, tuck the whole header away */
        else if (accRef.current > 56) { setHidden(true); accRef.current = 0 }
      } else if (accRef.current < -38) {
        /* UP — reveal the (still-compact) bar first … */
        if (hiddenRef.current) { setHidden(false); accRef.current = 0 }
        /* … then un-furl row 2 again only once we near the top */
        else if (r2hideRef.current && y < 150) { setR2hide(false); accRef.current = 0 }
      }
      lastY.current = y
    }
    const onScroll = () => { if (!tick) { tick = true; requestAnimationFrame(run) } }
    window.addEventListener('scroll', onScroll, { passive: true })
    run()
    rm.addEventListener?.('change', run)
    return () => { window.removeEventListener('scroll', onScroll); rm.removeEventListener?.('change', run) }
  }, [])

  /* mirror collapse/hide flags into refs so the rAF closure reads fresh values */
  useEffect(() => { r2hideRef.current = r2hide }, [r2hide])
  useEffect(() => { hiddenRef.current = hidden }, [hidden])

  /* overflow gate — only let row-2 dropdowns spill once it has fully
     un-collapsed, so the collapse/expand tween always clips cleanly */
  useEffect(() => {
    if (r2hide) { setR2ready(false); return }
    const t = setTimeout(() => setR2ready(true), 520)
    return () => clearTimeout(t)
  }, [r2hide])

  /* measure header → mega top + --header-h (drives mobile panel offset) */
  useEffect(() => {
    const el = outerRef.current; if (!el) return
    const m = () => {
      const h = el.offsetHeight
      if (h) { setMegaTop(h); document.documentElement.style.setProperty('--header-h', `${h}px`) }
    }
    m()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(m); ro.observe(el) }
    window.addEventListener('resize', m, { passive: true })
    return () => { ro?.disconnect(); window.removeEventListener('resize', m) }
  }, [])

  /* store sync */
  useEffect(() => {
    setUser(getUser())
    setCart(getCart().reduce((s: number, i: any) => s + (i.quantity ?? 0), 0))
    setWish(getWishlist().length)
    setCur(getCurrency())
    setSets(getSettings())
    fetchAndSyncSettings().then(s => { if (s) setSets(s) })
    const h = {
      cart: (e: any) => setCart(e?.detail?.count ?? getCart().reduce((s: number, i: any) => s + (i.quantity ?? 0), 0)),
      wish: (e: any) => setWish(e?.detail?.count ?? getWishlist().length),
      cur: (e: any) => setCur(e?.detail?.currency),
      user: (e: any) => setUser(e?.detail?.user ?? getUser()),
      sets: (e: any) => setSets(e?.detail?.settings ?? getSettings()),
    }
    window.addEventListener('cart-updated', h.cart as EventListener)
    window.addEventListener('wishlist-updated', h.wish as EventListener)
    window.addEventListener('currency-updated', h.cur as EventListener)
    window.addEventListener('user-updated', h.user as EventListener)
    window.addEventListener('settings-updated', h.sets as EventListener)
    return () => {
      window.removeEventListener('cart-updated', h.cart as EventListener)
      window.removeEventListener('wishlist-updated', h.wish as EventListener)
      window.removeEventListener('currency-updated', h.cur as EventListener)
      window.removeEventListener('user-updated', h.user as EventListener)
      window.removeEventListener('settings-updated', h.sets as EventListener)
    }
  }, [])

  /* live categories for the mobile menu — same source as the home page */
  useEffect(() => {
    let alive = true
    fetch('/api/categories?home=true')
      .then(r => r.json())
      .then((data: unknown) => {
        if (!alive || !Array.isArray(data) || !data.length) return
        const mapped: MobCat[] = data.map((c: Record<string, unknown>, i: number) => ({
          id: Number(c.id) || i + 1,
          name: String(c.name || ''),
          slug: String(c.slug || String(c.name || '').toLowerCase().replace(/\s+/g, '-')),
          image: String(c.image_url || MOB_CAT_FALLBACK[0].image),
        })).filter(c => c.name)
        if (mapped.length) setCats(mapped)
      })
      .catch(() => { })
    return () => { alive = false }
  }, [])

  useEffect(() => { setMenu(false); setUserOpen(false); setCurOpen(false); setMobExp(null); setActiveNav(null) }, [pathname])
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [menuOpen])

  /* outside click closes popovers */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (userOpen && userPopRef.current && !userPopRef.current.contains(e.target as Node)) setUserOpen(false)
      if (curOpen && curPopRef.current && !curPopRef.current.contains(e.target as Node)) setCurOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [userOpen, curOpen])

  /* esc */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setUserOpen(false); setCurOpen(false); setActiveNav(null); setMenu(false) }
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  /* focus trap — includes the header toggle (X) so the close stays reachable */
  useEffect(() => {
    if (!menuOpen) { if (wasOpen.current) menuBtnRef.current?.focus(); wasOpen.current = false; return }
    wasOpen.current = true
    const el = panelRef.current; if (!el) return
    const SEL = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
    const foc = () => {
      const inPanel = Array.from(el.querySelectorAll<HTMLElement>(SEL)).filter(n => n.offsetParent !== null)
      return [menuBtnRef.current, ...inPanel].filter(Boolean) as HTMLElement[]
    }
    const t = setTimeout(() => foc()[1]?.focus(), 120)
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setMenu(false); return }
      if (e.key !== 'Tab') return
      const f = foc(); if (!f.length) return
      const [first, last] = [f[0], f[f.length - 1]]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', fn)
    return () => { clearTimeout(t); document.removeEventListener('keydown', fn) }
  }, [menuOpen])

  const navEnter = useCallback((lbl: string) => { if (leaveRef.current) clearTimeout(leaveRef.current); setActiveNav(lbl) }, [])
  const navLeave = useCallback(() => { leaveRef.current = setTimeout(() => setActiveNav(null), 220) }, [])

  const logout = async () => {
    try { await signOut() } catch { }
    clearUser(); clearCart()
    try { localStorage.removeItem('user_wishlist') } catch { }
    setUser(null); setCart(0); setWish(0)
    setUserOpen(false); setMenu(false)
    router.replace('/auth/signin')
  }

  const waNum = (settings?.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^0-9]/g, '')
  const email = settings?.contact_email || 'hello@gemsglobal.com'
  const activeMega = NAV.find(n => n.label === activeNav && n.mega)
  const cls = ['gh', (hidden && !menuOpen) ? 'hide' : '', compact ? 'compact' : '', r2hide ? 'r2hide' : '', r2ready ? 'r2ready' : '', menuOpen ? 'menu-open' : ''].filter(Boolean).join(' ')

  /* Logo — text is NEVER shown while loading; a gem monogram holds the
     space until the real logo image (or, only if no image is configured,
     the brand text) resolves.  Plain function (NOT an inline component) so
     the <img> reconciles in place and its fade-in plays once — never
     remounting/flickering on the frequent scroll re-renders. */
  const renderLogo = (mob?: boolean) => {
    if (!settings) return <span className={mob ? 'm-logo-mark' : 'gh-logo-mark'} aria-label="Gems Global"><GemMark /></span>
    if (settings.logo_url) return <img src={settings.logo_url} alt={settings.site_name ?? 'Gems Global'} width={200} height={60} className={mob ? 'm-logo-img' : 'gh-logo-img'} />
    return <span className={mob ? 'm-logo-txt' : 'gh-logo-txt'}>{settings.logo_text}<em>{settings.logo_em ?? 'Jewels'}</em></span>
  }

  return (
    <>
      <style>{CSS}</style>
      <div aria-hidden className="gh-sp" />

      {/* mega backdrop */}
      <div className={`gh-mega-bd${activeMega ? ' open' : ''}`} onClick={() => setActiveNav(null)} aria-hidden="true" />

      {/* ══ HEADER ══ */}
      <header ref={outerRef} className={cls} suppressHydrationWarning>
        {/* announcement */}
        <div className="gh-ann">
          <span className="gh-ann-t">Complimentary shipping above <b>₹25,000</b> &nbsp;·&nbsp; Free 30-day returns</span>
        </div>

        {/* main bar */}
        <div className="gh-bar" ref={barRef}>
          {/* ══ ROW 1 — utility-left · logo-center · icons-right ══ */}
          <div className="gh-row1">

            {/* LEFT — quiet quick-links (desktop) + hamburger (mobile) */}
            <div className="gh-r1l">
              <nav className="gh-ql-nav" aria-label="Quick links">
                {QUICK.map(q => (
                  <Link key={q.label} href={q.href}
                    className={`gh-ql${pathname === q.href || (q.href !== '/' && pathname.startsWith(q.href)) ? ' on' : ''}`}>
                    {q.label}
                  </Link>
                ))}
              </nav>

              {/* animated hamburger ↔ X toggle */}
              <button ref={menuBtnRef} className={`gh-burger mob${menuOpen ? ' open' : ''}`} type="button"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-haspopup="dialog"
                onClick={() => setMenu(p => !p)}>
                <span className="gh-burger-box" aria-hidden="true">
                  <span className="gh-burger-line" />
                  <span className="gh-burger-line" />
                  <span className="gh-burger-line" />
                </span>
              </button>
            </div>

            {/* LOGO */}
            <Link href="/" className="gh-logo" aria-label="Gems Global — Home">{renderLogo()}</Link>

            {/* RIGHT */}
            <div className="gh-right">
              {/* currency desktop */}
              <div style={{ position: 'relative' }} className="desk" ref={curPopRef}>
                <button className={`gh-ic${curOpen ? ' on' : ''}`} type="button"
                  onClick={() => { setCurOpen(p => !p); setUserOpen(false) }}
                  aria-label={`Currency: ${currency}`} aria-haspopup="menu" aria-expanded={curOpen}>
                  <Globe size={14} strokeWidth={1.5} />
                  <span className="gh-curlbl">{currency}</span>
                </button>
                {curOpen && (
                  <div className="gh-pop" role="menu">
                    {(['USD', 'INR'] as Currency[]).map(c => (
                      <button key={c} role="menuitemradio" aria-checked={currency === c}
                        className={`gh-pl${currency === c ? ' hi' : ''}`}
                        onClick={() => { setCurrency(c); setCurOpen(false) }} type="button">
                        {c === 'USD' ? '$ USD' : '₹ INR'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="gh-sep desk" />

              <Link href="/wishlist" className="gh-ic desk" aria-label={`Wishlist${wishCnt > 0 ? `, ${wishCnt} items` : ''}`}>
                <Heart size={15} strokeWidth={1.5} />
                {wishCnt > 0 && <span key={wishCnt} className="gh-badge" suppressHydrationWarning>{fmtCount(wishCnt)}</span>}
              </Link>

              <Link href="/cart" className="gh-cart desk"
                aria-label={cartCnt > 0 ? `Cart, ${cartCnt} item${cartCnt !== 1 ? 's' : ''}` : 'Cart (empty)'}>
                <span className="gh-cart-ico"><ShoppingBag size={18} strokeWidth={1.7} /></span>
                {cartCnt > 0 && <span key={cartCnt} className="gh-cart-ct" suppressHydrationWarning>{fmtCount(cartCnt)}</span>}
              </Link>

              {/* account desktop */}
              <div style={{ position: 'relative' }} className="desk" ref={userPopRef}>
                {user ? (
                  <>
                    <button className={`gh-ic${userOpen ? ' on' : ''}`} type="button"
                      onClick={() => { setUserOpen(p => !p); setCurOpen(false) }}
                      aria-label="Account menu" aria-haspopup="menu" aria-expanded={userOpen}>
                      <User size={15} strokeWidth={1.5} />
                    </button>
                    {userOpen && (
                      <div className="gh-pop" role="menu">
                        {user?.email && <><div className="gh-pem">{user.email}</div><div className="gh-psep" /></>}
                        <Link href="/account" role="menuitem" className="gh-pl" onClick={() => setUserOpen(false)}>My Account</Link>
                        <Link href="/wishlist" role="menuitem" className="gh-pl" onClick={() => setUserOpen(false)}>Wishlist</Link>
                        <div className="gh-psep" />
                        <button className="gh-plo" onClick={logout} type="button"><LogOut size={11} strokeWidth={1.5} /> Logout</button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/auth/signin" className="gh-ic" aria-label="Sign in"><User size={15} strokeWidth={1.5} /></Link>
                )}
              </div>

              {/* desktop: premium WhatsApp contact pill */}
              {waNum && (
                <>
                  <div className="gh-sep desk" />
                  <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer"
                    className="gh-wa desk pill" aria-label="Chat on WhatsApp">
                    <IconWA size={15} />
                    <span className="gh-wa-lbl">WhatsApp</span>
                  </a>
                </>
              )}

              {/* mobile: premium WhatsApp + cart */}
              {waNum && (
                <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer"
                  className="gh-wa mob" aria-label="Chat on WhatsApp">
                  <span className="gh-wa-glow" aria-hidden="true" />
                  <IconWA size={17} />
                </a>
              )}
              <Link href="/cart" className="gh-cart mob"
                aria-label={cartCnt > 0 ? `Cart, ${cartCnt} item${cartCnt !== 1 ? 's' : ''}` : 'Cart (empty)'}>
                <span className="gh-cart-ico"><ShoppingBag size={20} strokeWidth={1.7} /></span>
                {cartCnt > 0 && <span key={cartCnt} className="gh-cart-ct" suppressHydrationWarning>{fmtCount(cartCnt)}</span>}
              </Link>
            </div>
          </div>

          {/* ══ ROW 2 — centered primary nav; collapses first on scroll ══ */}
          <div className="gh-row2wrap">
            <nav className="gh-row2" aria-label="Primary">
              {NAV.map((item, idx) => (
                <div key={item.label} className="gh-ni" style={{ ['--i']: idx } as CSSProperties}
                  onMouseEnter={() => navEnter(item.label)} onMouseLeave={navLeave}
                  onFocus={() => navEnter(item.label)} onBlur={navLeave}>
                  <Link href={item.href} className={`gh-nl${pathname.startsWith(item.href) ? ' on' : ''}`}>
                    {item.label}
                    {(item.drop || item.mega) && (
                      <ChevronDown size={11} strokeWidth={2} className={`gh-chev${activeNav === item.label ? ' r' : ''}`} aria-hidden="true" />
                    )}
                  </Link>
                  {item.drop && (
                    <div className={`gh-dd${activeNav === item.label ? ' open' : ''}`}>
                      {item.drop.map(d => <Link key={d} href={DROP_LINKS[d] || item.href} className="gh-ddl">{d}</Link>)}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ══ DESKTOP MEGA ══ */}
      {activeMega && (
        <div className={`gh-mega-w${activeNav ? ' open' : ''}`} style={{ top: megaTop }}
          onMouseEnter={() => navEnter(activeMega.label)} onMouseLeave={navLeave}
          onFocus={() => navEnter(activeMega.label)} onBlur={navLeave}>
          <div className="gh-mega">
            <div className="gh-mg">
              {activeMega.mega!.map(col => (
                <div key={col.title} className="gh-mc">
                  <div className="gh-mh"><span className="gh-mt">{col.title}</span><div className="gh-md" /></div>
                  {col.links.map(lk => (
                    <Link key={lk.label} href={lk.href} className="gh-ml">
                      <span>{lk.label}</span>
                      <ArrowRight className="gh-ml-ar" size={11} strokeWidth={1.8} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ))}
              {activeMega.label === 'Collection' && (
                <div className="gh-mf">
                  <Link href="/collection?category=rings&style=solitaire" className="gh-fc">
                    <div className="gh-fi"><img src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80" alt="Solitaire Rose" /></div>
                    <div className="gh-fo" />
                    <div className="gh-fb">
                      <span className="gh-ft">Signature Series</span>
                      <h4 className="gh-fh">Solitaire Rose</h4>
                      <span className="gh-fcta">Explore <ArrowRight size={10} strokeWidth={2} /></span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ MOBILE OVERLAY BACKDROP ══ */}
      <div className={`m-ov${menuOpen ? ' open' : ''}`} onClick={() => setMenu(false)} aria-hidden="true" />

      {/* ══ MOBILE PANEL — drops down beneath the header ══ */}
      <div ref={panelRef} className={`m-pn${menuOpen ? ' open' : ''}`}
        role="dialog" aria-modal="true" aria-label="Navigation menu" aria-hidden={!menuOpen}
        suppressHydrationWarning>

        {/* scrollable content */}
        <div className="m-body">

          {/* featured hero */}
          <Link href="/collection" className="m-feat m-rev" style={{ animationDelay: '.05s' }} onClick={() => setMenu(false)}>
            <span className="m-feat-img"><img src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80" alt="" loading="lazy" /></span>
            <span className="m-feat-ov" />
            <span className="m-feat-tx">
              <span className="m-feat-k">Discover</span>
              <span className="m-feat-h">The Signature Collection</span>
              <span className="m-feat-c">Shop Now <ArrowRight size={11} strokeWidth={2} /></span>
            </span>
          </Link>

          {/* category section heading */}
          <div className="m-sec-hd m-rev" style={{ animationDelay: '.1s' }}>
            <span className="m-sec-lbl">Shop by Category</span>
            <div className="m-sec-ln" />
          </div>

          {/* dynamic category cards — image + name, whole card links to the category */}
          <div className="m-cats">
            {cats.map((c, i) => (
              <Link key={c.id} href={`/collection?category=${c.slug}`} className="m-cat m-rev"
                style={{ animationDelay: `${0.14 + i * 0.04}s` }} onClick={() => setMenu(false)}>
                <span className="m-cat-img"><img src={c.image} alt={c.name} loading="lazy" draggable={false} /></span>
                <span className="m-cat-ov" aria-hidden="true" />
                <span className="m-cat-l">
                  <span className="m-cat-nm">{c.name}</span>
                  <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>

          {/* nav section heading */}
          <div className="m-sec-hd m-rev" style={{ animationDelay: '.3s' }}>
            <span className="m-sec-lbl">Explore</span>
            <div className="m-sec-ln" />
          </div>

          {/* nav items */}
          {NAV.map((item, idx) => {
            const hasSub = item.drop || item.mega
            const isExp = mobExp === item.label
            return (
              <div key={item.label} className="m-ni m-rev" style={{ animationDelay: `${0.34 + idx * 0.05}s` }}>
                <div className="m-nrow">
                  <Link href={item.href}
                    className={`m-nlink${pathname.startsWith(item.href) ? ' act' : ''}`}
                    onClick={() => !hasSub && setMenu(false)}>
                    <span className="m-nlink-tx">{item.label}</span>
                  </Link>
                  {hasSub && (
                    <button className={`m-tog${isExp ? ' open' : ''}`} type="button"
                      onClick={() => setMobExp(p => p === item.label ? null : item.label)}
                      aria-label={`${isExp ? 'Collapse' : 'Expand'} ${item.label}`} aria-expanded={isExp}>
                      <ChevronDown size={15} strokeWidth={1.5} className="m-tc" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {hasSub && (
                  <div className={`m-acc${isExp ? ' open' : ''}`}>
                    <div className="m-acc-in">
                      {item.drop?.map(d => (
                        <Link key={d} href={DROP_LINKS[d] || item.href} className="m-asl" onClick={() => setMenu(false)}>{d}</Link>
                      ))}
                      {item.mega?.map((col, ci) => (
                        <div key={col.title} style={ci === item.mega!.length - 1 ? { paddingBottom: '8px' } : {}}>
                          <div className="m-asc">{col.title}</div>
                          {col.links.map(lk => (
                            <Link key={lk.label} href={lk.href} className="m-asl" onClick={() => setMenu(false)}>{lk.label}</Link>
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

        {/* footer */}
        <div className="m-foot">
          <div className="m-cur">
            {(['USD', 'INR'] as Currency[]).map(c => (
              <button key={c} className={`m-cur-b${currency === c ? ' on' : ''}`}
                onClick={() => setCurrency(c)} type="button" aria-pressed={currency === c}>
                {c === 'USD' ? '$ USD' : '₹ INR'}
              </button>
            ))}
          </div>

          {user ? (
            <>
              {/* <div className="m-acct">
                <span className="m-acct-av" aria-hidden="true">
                  {String(user.name||user.email||'?').trim().charAt(0).toUpperCase()||'·'}
                </span>
                <span className="m-acct-meta">
                  <span className="m-acct-hi">Signed in</span>
                  <span className="m-acct-em">{user.email||user.name||'My Account'}</span>
                </span>
                <Link href="/account" className="m-acct-go" onClick={()=>setMenu(false)} aria-label="Open account">
                  <ArrowRight size={15} strokeWidth={2}/>
                </Link>
              </div> */}
              <div className="m-auth">
                <Link href="/account" className="m-a-ghost" onClick={() => setMenu(false)}><User size={12} strokeWidth={1.6} /> Account</Link>
                <button className="m-a-danger" onClick={logout} type="button"><LogOut size={11} strokeWidth={1.5} /> Logout</button>
              </div>
            </>
          ) : (
            <div className="m-auth">
              <Link href="/auth/signin" className="m-a-ghost" onClick={() => setMenu(false)}>Sign In</Link>
              <Link href="/auth/signup" className="m-a-solid" onClick={() => setMenu(false)}>Join <ArrowRight size={11} strokeWidth={2} /></Link>
            </div>
          )}

          <div className="m-contact">
            {waNum && (
              <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer" className="m-cl">
                <IconWA size={13} /> WhatsApp
              </a>
            )}
            <a href={`mailto:${email}`} className="m-cl">
              <Mail size={12} strokeWidth={1.5} /> Email Us
            </a>
          </div>
        </div>
      </div>

      {/* ══ BOTTOM NAV ══ */}
      <nav className="bn" aria-label="Mobile navigation">

        <Link href="/" className={`bn-i${pathname === '/' ? ' act' : ''}`}
          aria-label="Home" aria-current={pathname === '/' ? 'page' : undefined}>
          <span className="bn-icon"><IconHome size={20} /></span>
          <span className="bn-lbl">Home</span>
        </Link>

        <Link href="/collection" className={`bn-i${pathname.startsWith('/collection') ? ' act' : ''}`}
          aria-label="Collection" aria-current={pathname.startsWith('/collection') ? 'page' : undefined}>
          <span className="bn-icon"><IconGem size={20} /></span>
          <span className="bn-lbl">Jewels</span>
        </Link>

        {/* elevated premium center — opens the Atelier concierge widget */}
        <button className="bn-i bn-center" type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))} aria-label="Chat with our concierge">
          <span className="bn-fab"><IconChatNav size={22} /></span>
          <span className="bn-lbl">Chat</span>
        </button>

        <Link href="/wishlist" className={`bn-i${pathname === '/wishlist' ? ' act' : ''}`}
          aria-label={`Wishlist${wishCnt > 0 ? `, ${wishCnt}` : ''}`}
          aria-current={pathname === '/wishlist' ? 'page' : undefined}>
          <span className="bn-icon" style={{ position: 'relative' }}>
            <IconHeartNav size={20} />
            {wishCnt > 0 && <span key={wishCnt} className="bn-badge" suppressHydrationWarning>{fmtCount(wishCnt)}</span>}
          </span>
          <span className="bn-lbl">Saved</span>
        </Link>

        <Link href={user ? '/account' : '/auth/signin'}
          className={`bn-i${(pathname === '/account' || pathname.startsWith('/auth')) ? ' act' : ''}`}
          aria-label={user ? 'My account' : 'Sign in'}
          aria-current={(pathname === '/account' || pathname.startsWith('/auth')) ? 'page' : undefined}>
          <span className="bn-icon"><IconUserNav size={20} /></span>
          <span className="bn-lbl">{user ? 'Account' : 'Sign In'}</span>
        </Link>

      </nav>
    </>
  )
}

export default Header
