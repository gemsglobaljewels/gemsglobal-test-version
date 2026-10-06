'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import {
  Plus, Minus, Trash2, ArrowRight, Gem, Lock, Diamond,
  ShieldCheck, Truck, RotateCcw, ArrowUpRight,
} from 'lucide-react'
import {
  getCart, removeFromCart, updateCartQuantity, getCartTotals,
} from '@/lib/authStore'
import { Price } from '@/components/Price'
import { useToast } from '@/hooks/use-toast'

/* ─────────────────────────────────────────────────────────────
   CART — "The Vitrine"
   Pieces are shown the way they'd sit in a display case: a 2-up
   grid of tall gold-framed plates, each with its lot number
   stamped on the glass and its line total on a cream tag. The
   summary is a sticky gold-edged invoice beside them.

   Perf: no page-wide SVG noise filter, no backdrop-filter, no
   framer-motion `layout` prop — only transform/opacity/colour
   are transitioned, so scrolling never triggers layout.
───────────────────────────────────────────────────────────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const CSS = `
.ct-root *,.ct-root *::before,.ct-root *::after{box-sizing:border-box;}

.ct-root{
  --w:#FFFFFF; --iv:#FDFCF9; --cr:#F8F4EE; --wa:#EFE9DF;
  --bd:#ECE5DA; --bd2:#E2D9CB;
  --g1:#C9B68F; --g2:#A8916F; --g3:#8C7456;
  --al:rgba(140,116,86,.10); --am:rgba(140,116,86,.24);
  --ink:#3A2E22; --mu:rgba(58,46,34,.56); --fa:rgba(58,46,34,.40);
  /* CTA fill runs dark→darker: white label text on #8C7456 is only ~4:1, on
     #6F5A42 it clears 6:1, so uppercase 11px stays properly readable. */
  --gold:linear-gradient(135deg,var(--g3) 0%,#6F5A42 100%);
  --goldline:linear-gradient(90deg,var(--g1),var(--g3));
  --gtxt:linear-gradient(120deg,var(--g1),var(--g3) 55%,var(--g2));
  --serif:var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
  --display:var(--font-main,var(--font-bodoni)),'Bodoni Moda',Georgia,serif;
  --sans:var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;
  --e:cubic-bezier(.22,1,.36,1);
  --spring:cubic-bezier(.34,1.56,.64,1);
  --soft:0 22px 48px -30px rgba(58,46,34,.3);
  --soft2:0 10px 26px -18px rgba(58,46,34,.24);
  position:relative;min-height:100vh;display:flex;flex-direction:column;
  background:var(--iv);color:var(--ink);font-family:var(--sans);overflow-x:clip;
}
.ct-root a{text-decoration:none;color:inherit;}
/* Link-styled CTAs must beat the base .ct-root a rule above (0-1-1 beats
   0-1-0) — otherwise the white label loses to inherited ink and the gold
   button renders with near-invisible dark text. */
.ct-root a.ct-checkout,.ct-root a.ct-bar-cta,.ct-root a.ct-empty-cta{color:#fff;}
.ct-root a.ct-checkout:hover,.ct-root a.ct-bar-cta:hover,.ct-root a.ct-empty-cta:hover{color:#fff;}
.ct-root a.ct-empty-ghost:hover{color:#fff;}
.ct-root ::selection{background:var(--am);color:var(--ink);}
.ct-root a:focus-visible,.ct-root button:focus-visible{outline:2px solid var(--g3);outline-offset:3px;}
.ct-root img{display:block;}

.ct-main{flex:1;position:relative;z-index:1;}
.ct-shell{max-width:1320px;margin:0 auto;padding-inline:clamp(18px,4.5vw,52px);}

/* ══ MASTHEAD BAND ══════════════════════════════════════════ */
.ct-band{
  position:relative;overflow:hidden;background:var(--cr);
  border-bottom:1px solid var(--bd);
  padding:clamp(44px,6.6vw,82px) 0 clamp(34px,4.6vw,58px);
}
.ct-band::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--goldline);opacity:.5;
}
.ct-band-in{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:space-between;gap:clamp(20px,4vw,48px);flex-wrap:wrap;}
.ct-eyebrow{display:inline-flex;align-items:center;gap:11px;margin-bottom:15px;font-size:10px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--g3);}
.ct-eyebrow i{font-style:normal;display:inline-grid;place-items:center;width:23px;height:23px;border:1px solid var(--am);border-radius:50%;color:var(--g3);}
.ct-title{font-family:var(--display);font-weight:400;font-size:clamp(38px,6.4vw,76px);line-height:1.02;letter-spacing:-.015em;margin:0;color:var(--ink);}
.ct-title em{font-family:var(--serif);font-style:italic;font-weight:500;color:transparent;background:var(--gtxt);-webkit-background-clip:text;background-clip:text;}
.ct-lede{margin:16px 0 0;max-width:46ch;font-size:clamp(13px,1.25vw,15px);font-weight:300;line-height:1.85;color:var(--mu);}
.ct-back{display:inline-flex;align-items:center;gap:9px;margin-top:20px;font-size:10px;font-weight:600;letter-spacing:.17em;text-transform:uppercase;color:var(--ink);padding-bottom:5px;position:relative;}
.ct-back::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--goldline);transform:scaleX(.3);transform-origin:left;transition:transform .45s var(--e);}
.ct-back:hover::after{transform:scaleX(1);}
.ct-back svg{transition:transform .35s var(--e);}
.ct-back:hover svg{transform:translate(-2px,2px);}

/* stat plate */
.ct-plate{
  display:flex;align-items:stretch;gap:clamp(16px,2.4vw,30px);
  background:var(--w);border:1px solid var(--bd);
  padding:clamp(15px,1.9vw,21px) clamp(19px,2.5vw,28px);
  box-shadow:var(--soft2);position:relative;
}
.ct-plate::before{content:'';position:absolute;left:0;top:0;width:100%;height:2px;background:var(--goldline);}
.ct-stat{text-align:right;display:flex;flex-direction:column;justify-content:flex-end;}
.ct-stat-num{font-family:var(--serif);font-style:italic;font-weight:500;font-size:clamp(25px,3.4vw,40px);line-height:1;color:var(--ink);}
.ct-stat-num--price{font-family:var(--sans);font-style:normal;font-weight:800;color:#111;font-variant-numeric:tabular-nums;}
.ct-stat-label{display:block;margin-top:9px;font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--fa);}
.ct-stat-div{width:1px;background:linear-gradient(180deg,transparent,var(--am),transparent);}

/* ══ LAYOUT ═════════════════════════════════════════════════ */
.ct-body-wrap{padding:clamp(32px,4.4vw,58px) 0 clamp(80px,10vw,120px);}
.ct-layout{display:grid;grid-template-columns:minmax(0,1fr) clamp(318px,26vw,376px);gap:clamp(24px,3.2vw,50px);align-items:start;}
@media(max-width:1100px){.ct-layout{grid-template-columns:minmax(0,1fr);gap:34px;}}

.ct-label{display:flex;align-items:center;gap:13px;margin-bottom:clamp(16px,2vw,22px);}
.ct-label .tx{font-size:9.5px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--g3);white-space:nowrap;}
.ct-label .ln{flex:1;height:1px;background:linear-gradient(90deg,var(--am),transparent);}

/* ══ VITRINE GRID ═══════════════════════════════════════════ */
.ct-items{
  display:flex;flex-direction:column;
  gap:clamp(12px,1.6vw,16px);list-style:none;margin:0;padding:0;
}

.ct-card{
  position:relative;display:grid;
  grid-template-columns:clamp(104px,14vw,148px) minmax(0,1fr) auto;
  gap:clamp(14px,2vw,22px);align-items:stretch;
  background:var(--w);border:1px solid var(--bd);
  padding:clamp(12px,1.6vw,16px);
  transition:border-color .35s,box-shadow .42s var(--e),transform .42s var(--e);
}
.ct-card::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--goldline);
  transform:scaleY(0);transform-origin:top;transition:transform .5s var(--e);z-index:3;
}
.ct-card:hover{border-color:var(--bd2);box-shadow:var(--soft);transform:translateY(-2px);}
.ct-card:hover::before{transform:scaleY(1);}

/* the plate — full-bleed thumb that fills its cell */
.ct-media{
  position:relative;display:block;overflow:hidden;
  background:var(--wa);border:1px solid var(--bd);
  min-height:100%;
}
.ct-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.1s var(--e);}
.ct-card:hover .ct-media img{transform:scale(1.05);}
.ct-media-empty{position:absolute;inset:0;display:grid;place-items:center;color:var(--g1);}

/* lot number stamped on the plate */
.ct-idx{
  position:absolute;left:8px;top:8px;z-index:2;
  min-width:28px;height:22px;padding:0 8px;
  display:inline-grid;place-items:center;
  background:var(--gold);color:#fff;
  font-family:var(--sans);font-weight:700;font-size:9px;letter-spacing:.14em;
  box-shadow:0 4px 12px -5px rgba(140,116,86,.8);
}
/* legacy cream tag retired — the line total lives in the right rail now */
.ct-tag-price{display:none;}
/* right rail — line total, ruled off from the body */
.ct-rail{
  display:flex;flex-direction:column;align-items:flex-end;justify-content:center;
  gap:6px;min-width:122px;padding-left:clamp(14px,2vw,22px);
  border-left:1px solid var(--bd);text-align:right;
}
.ct-rail-label{font-size:8.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--fa);}
.ct-rail-price{font-family:var(--sans);font-weight:800;font-size:clamp(18px,2vw,22px);color:#111;font-variant-numeric:tabular-nums;white-space:nowrap;}

/* body — name, tags, unit price, then controls inline */
.ct-body{padding:2px 0;min-width:0;display:flex;flex-direction:column;justify-content:center;}
.ct-name{
  display:block;font-family:var(--serif);font-weight:500;
  font-size:clamp(18px,1.6vw,21px);line-height:1.2;
  color:var(--ink);overflow-wrap:anywhere;transition:color .28s;
}
.ct-name:hover{color:var(--g3);}
.ct-tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px;}
.ct-tag{
  display:inline-flex;align-items:center;padding:4px 10px;
  background:var(--al);border:1px solid var(--am);
  font-size:8.5px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--g3);
}
.ct-unit{margin:11px 0 0;font-size:10px;font-weight:400;letter-spacing:.06em;color:var(--fa);}
.ct-unit em{font-style:normal;font-family:var(--sans);font-weight:700;font-size:12.5px;letter-spacing:.02em;color:#111;font-variant-numeric:tabular-nums;}

/* foot — controls on their own ruled shelf */
/* foot — stepper + remove sit inline under the unit price */
.ct-card-foot{
  margin-top:12px;
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;
}
.ct-qty{display:inline-flex;align-items:center;border:1px solid var(--bd2);background:var(--w);}
.ct-qty-btn{width:33px;height:33px;display:grid;place-items:center;background:transparent;border:none;color:var(--ink);cursor:pointer;transition:background .22s,color .22s;}
.ct-qty-btn:hover:not(:disabled){background:var(--g3);color:#fff;}
.ct-qty-btn:disabled{opacity:.26;cursor:not-allowed;}
.ct-qty-val{min-width:34px;text-align:center;font-size:12.5px;font-weight:600;color:var(--ink);align-self:stretch;display:grid;place-items:center;border-inline:1px solid var(--bd);}
.ct-remove{
  display:inline-flex;align-items:center;gap:6px;background:transparent;border:none;cursor:pointer;
  padding:8px 2px;font-family:var(--sans);font-size:9px;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase;color:var(--fa);transition:color .22s;
}
.ct-remove:hover{color:#B94040;}

@media(max-width:640px){
  .ct-card{grid-template-columns:96px minmax(0,1fr);gap:12px;}
  .ct-media{min-height:112px;}
  .ct-rail{
    grid-column:1/-1;flex-direction:row;align-items:baseline;
    border-left:none;border-top:1px solid var(--bd);
    padding:12px 2px 0;text-align:left;min-width:0;
  }
  .ct-rail-price{margin-left:auto;}
}

/* ══ SUMMARY — sticky gold-edged invoice ════════════════════ */
.ct-aside{position:sticky;top:clamp(90px,10vw,108px);}
@media(max-width:1100px){.ct-aside{position:static;}}

.ct-summary{position:relative;background:var(--w);border:1px solid var(--bd2);box-shadow:var(--soft);}
.ct-summary::before{content:'';position:absolute;left:0;top:0;width:100%;height:3px;background:var(--goldline);}
.ct-summary-in{position:relative;padding:clamp(23px,2.7vw,30px);}

.ct-summary-title{font-family:var(--serif);font-weight:500;font-size:clamp(23px,2.3vw,28px);line-height:1.1;margin:0 0 5px;color:var(--ink);}
.ct-summary-title em{font-style:italic;font-weight:500;color:transparent;background:var(--gtxt);-webkit-background-clip:text;background-clip:text;}
.ct-summary-sub{font-size:9.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--fa);margin:0 0 22px;padding-bottom:19px;border-bottom:1px solid var(--bd);}

.ct-srow{display:flex;align-items:baseline;gap:10px;margin-bottom:13px;}
.ct-srow-label{font-size:12px;font-weight:300;letter-spacing:.02em;color:var(--mu);white-space:nowrap;}
.ct-srow-dots{flex:1;border-bottom:1px dotted var(--bd2);transform:translateY(-3px);}
.ct-srow-val{font-family:var(--sans);font-size:16px;font-weight:800;color:#111;white-space:nowrap;font-variant-numeric:tabular-nums;}
.ct-srow-free{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--g3);}

.ct-total{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-top:20px;padding-top:19px;border-top:1px solid var(--am);}
.ct-total-label{font-size:9.5px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:var(--g3);padding-bottom:7px;}
.ct-total-val{font-family:var(--sans);font-weight:800;font-size:clamp(30px,3.3vw,39px);line-height:1;color:#111;font-variant-numeric:tabular-nums;}
.ct-total-note{font-size:10px;font-weight:300;letter-spacing:.02em;color:var(--fa);margin:10px 0 0;text-align:right;}

/* CTA — gold plate, white label. Fill is the dark half of the ramp so the
   text keeps its contrast; hover deepens rather than lightens. A soft sheen
   glides across every few seconds so the button feels alive. */
.ct-checkout{
  margin-top:23px;width:100%;position:relative;overflow:hidden;
  display:inline-flex;align-items:center;justify-content:center;gap:11px;
  min-height:60px;padding:17px 26px;border:none;
  background:var(--gold);color:#fff;cursor:pointer;
  font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;
  box-shadow:0 12px 26px -12px rgba(140,116,86,.7);
  transition:box-shadow .35s var(--e),transform .28s var(--e);
}
.ct-checkout::before{
  content:'';position:absolute;top:0;bottom:0;left:-70%;width:45%;z-index:0;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);
  transform:skewX(-12deg);animation:ctSheen 4.6s cubic-bezier(.22,1,.36,1) infinite;
}
.ct-checkout::after{
  content:'';position:absolute;inset:0;background:var(--ink);
  transform:scaleX(0);transform-origin:left;transition:transform .45s var(--e);z-index:0;
}
@keyframes ctSheen{0%,62%{left:-70%;}100%{left:130%;}}
.ct-checkout > *{position:relative;z-index:1;}
.ct-checkout:hover{transform:translateY(-2px);box-shadow:0 18px 34px -14px rgba(58,46,34,.5);}
.ct-checkout:hover::after{transform:scaleX(1);}
.ct-checkout svg{transition:transform .35s var(--e);}
.ct-checkout:hover svg{transform:translateX(5px);}
.ct-checkout-dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.65);flex-shrink:0;}
.ct-checkout-total{font-weight:800;letter-spacing:.04em;font-variant-numeric:tabular-nums;}

.ct-secure{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--fa);}
.ct-secure svg{color:var(--g3);}

.ct-trust{display:flex;margin-top:21px;padding-top:19px;border-top:1px solid var(--bd);}
.ct-trust-item{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:9px;color:var(--g3);}
.ct-trust-item + .ct-trust-item{border-left:1px solid var(--bd);}
.ct-trust-item span{font-size:8px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);line-height:1.5;}

/* ══ FLOATING MOBILE BAR ════════════════════════════════════ */
.ct-bar-wrap{position:fixed;inset:auto 0 0 0;z-index:60;display:none;justify-content:center;padding:0 clamp(12px,4vw,24px) calc(clamp(72px,15vw,84px) + env(safe-area-inset-bottom,0px));pointer-events:none;}
@media(max-width:1100px){.ct-bar-wrap{display:flex;}}
.ct-bar{
  pointer-events:auto;width:100%;max-width:560px;display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:10px 10px 10px 19px;position:relative;
  background:var(--w);border:1px solid var(--bd2);
  box-shadow:0 14px 34px -14px rgba(58,46,34,.36);
}
.ct-bar::before{content:'';position:absolute;left:0;top:0;width:100%;height:2px;background:var(--goldline);}
.ct-bar-total{display:flex;flex-direction:column;gap:3px;min-width:0;}
.ct-bar-total-label{font-size:8px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--fa);}
.ct-bar-total-val{font-family:var(--sans);font-weight:800;font-size:clamp(19px,5vw,23px);line-height:1;color:#111;font-variant-numeric:tabular-nums;}
.ct-bar-cta{
  flex-shrink:0;display:inline-flex;align-items:center;gap:9px;
  padding:15px 23px;border:none;position:relative;overflow:hidden;
  background:var(--gold);color:#fff;
  font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;
  box-shadow:0 10px 20px -10px rgba(140,116,86,.8);
  transition:filter .22s,transform .28s var(--e),box-shadow .3s var(--e);
}
.ct-bar-cta::before{
  content:'';position:absolute;top:0;bottom:0;left:-70%;width:45%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);
  transform:skewX(-12deg);animation:ctSheen 4.6s cubic-bezier(.22,1,.36,1) infinite;
}
.ct-bar-cta::after{
  content:'';position:absolute;inset:0;background:var(--ink);
  transform:scaleX(0);transform-origin:left;transition:transform .45s var(--e);
}
.ct-bar-cta > *{position:relative;z-index:1;}
.ct-bar-cta:hover::after{transform:scaleX(1);}
.ct-bar-cta:hover{transform:translateY(-1px);box-shadow:0 14px 26px -12px rgba(58,46,34,.55);}
.ct-bar-cta:active{filter:brightness(.92);}
@media(max-width:1100px){.ct-root .ct-footer-spacer{height:88px;}}

/* ══ EMPTY STATE — "The Open Vault" ═══════════════════════════ */
.ct-empty{
  position:relative;min-height:72vh;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;
  padding:clamp(70px,10vw,110px) 24px;overflow:clip;
}
.ct-empty::before{
  content:'';position:absolute;left:50%;top:8%;width:min(560px,86vw);aspect-ratio:1;
  transform:translateX(-50%);pointer-events:none;
  background:radial-gradient(circle,rgba(140,116,86,.14),transparent 65%);
}
/* floating jewel medallion — gold orbit ring + glow */
.ct-empty-orb{
  position:relative;width:clamp(150px,30vw,190px);aspect-ratio:1;margin-bottom:36px;
  display:grid;place-items:center;color:var(--g3);
  animation:ctOrbFloat 5.2s ease-in-out infinite;
}
.ct-empty-orb::before{
  content:'';position:absolute;inset:0;border-radius:50%;
  border:1px dashed var(--am);
  animation:ctOrbSpin 26s linear infinite;
}
.ct-empty-orb::after{
  content:'';position:absolute;inset:14px;border-radius:50%;
  background:radial-gradient(circle at 50% 32%,#fff, var(--cr) 72%);
  border:1px solid var(--bd2);
  box-shadow:var(--soft), inset 0 0 0 8px rgba(255,255,255,.55);
}
.ct-empty-orb > *{position:relative;z-index:1;}
@keyframes ctOrbFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
@keyframes ctOrbSpin{to{transform:rotate(360deg);}}
.ct-empty-eyebrow{font-size:10px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--g3);display:block;margin-bottom:16px;padding-left:.32em;}
.ct-empty-title{font-family:var(--serif);font-weight:500;font-size:clamp(34px,6vw,54px);line-height:1.04;margin:0 0 16px;color:var(--ink);text-wrap:balance;}
.ct-empty-title em{font-style:italic;font-weight:500;color:transparent;background:var(--gtxt);-webkit-background-clip:text;background-clip:text;}
.ct-empty-text{font-size:13px;font-weight:300;line-height:1.85;color:var(--mu);max-width:400px;margin:0 auto 30px;}
.ct-empty-ctas{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:38px;}
.ct-empty-cta{
  position:relative;overflow:hidden;
  display:inline-flex;align-items:center;justify-content:center;gap:11px;
  min-height:56px;padding:17px 38px;border:none;
  background:var(--gold);color:#fff;cursor:pointer;
  font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;
  box-shadow:0 12px 26px -12px rgba(140,116,86,.7);
  transition:box-shadow .35s var(--e),transform .28s var(--e);
}
.ct-empty-cta::after{content:'';position:absolute;inset:0;background:var(--ink);transform:scaleX(0);transform-origin:left;transition:transform .45s var(--e);}
.ct-empty-cta > *{position:relative;z-index:1;}
.ct-empty-cta:hover{transform:translateY(-2px);box-shadow:0 18px 34px -14px rgba(58,46,34,.5);}
.ct-empty-cta:hover::after{transform:scaleX(1);}
.ct-empty-cta svg{transition:transform .35s var(--e);}
.ct-empty-cta:hover svg{transform:translateX(4px);}
.ct-empty-ghost{
  display:inline-flex;align-items:center;justify-content:center;gap:10px;
  min-height:56px;padding:17px 32px;cursor:pointer;
  background:transparent;border:1px solid var(--bd2);color:var(--ink);
  font-family:var(--sans);font-size:10.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;
  transition:border-color .25s,color .25s,background .25s,transform .28s var(--e);
}
.ct-empty-ghost:hover{border-color:transparent;color:#fff;background:linear-gradient(135deg,var(--g3),#6F5A42);transform:translateY(-2px);box-shadow:0 14px 28px -14px rgba(58,46,34,.55);}
.ct-empty-perks{display:flex;gap:clamp(10px,2vw,16px);flex-wrap:wrap;justify-content:center;}
.ct-empty-perk{
  display:inline-flex;align-items:center;gap:9px;
  padding:11px 18px;background:var(--w);border:1px solid var(--bd);
  font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--mu);
  box-shadow:var(--soft2);
}
.ct-empty-perk svg{color:var(--g3);flex-shrink:0;}

/* ══ SKELETON ═══════════════════════════════════════════════ */
.ct-sk{position:relative;overflow:hidden;background:var(--wa);}
.ct-sk::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.72),transparent);transform:translateX(-100%);animation:ctShimmer 1.6s ease-in-out infinite;}
@keyframes ctShimmer{to{transform:translateX(100%);}}
.ct-sk-grid{display:flex;flex-direction:column;gap:14px;}
.ct-sk-card{border:1px solid var(--bd);background:var(--w);}
.ct-sk-media{width:100%;aspect-ratio:16/9;}
.ct-sk-body{padding:18px;display:flex;flex-direction:column;gap:12px;}
.ct-sk-summary{background:var(--w);border:1px solid var(--bd2);padding:28px 26px;display:flex;flex-direction:column;gap:15px;}

/* ══ MOTION SAFETY ══════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce){
  .ct-root *,.ct-root *::before,.ct-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}
  .ct-card:hover{transform:none;}
  .ct-card:hover .ct-media img{transform:none;}
}
`

/* Pad small counts to two digits for the lot-number look; leave 100+ intact. */
const pad2 = (n: number) => (n < 100 ? String(n).padStart(2, '0') : String(n))

/* ─────────────────────────────────────────────────────────────
   SKELETON — mirrors the vitrine grid
───────────────────────────────────────────────────────────── */
function VitrineSkeleton() {
  return (
    <main className="ct-main">
      <div className="ct-band">
        <div className="ct-shell">
          <div className="ct-sk" style={{ width: 130, height: 12, marginBottom: 18 }} />
          <div className="ct-sk" style={{ width: 'min(340px, 66vw)', height: 54 }} />
        </div>
      </div>
      <div className="ct-body-wrap">
        <div className="ct-shell">
          <div className="ct-layout">
            <div className="ct-sk-grid">
              {[0, 1].map((i) => (
                <div className="ct-sk-card" key={i}>
                  <div className="ct-sk ct-sk-media" />
                  <div className="ct-sk-body">
                    <div className="ct-sk" style={{ width: '72%', height: 20 }} />
                    <div className="ct-sk" style={{ width: '40%', height: 11 }} />
                    <div className="ct-sk" style={{ width: '100%', height: 33, marginTop: 6 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="ct-sk-summary">
              <div className="ct-sk" style={{ width: '58%', height: 26 }} />
              <div className="ct-sk" style={{ width: '40%', height: 11 }} />
              <div className="ct-sk" style={{ width: '100%', height: 12, marginTop: 10 }} />
              <div className="ct-sk" style={{ width: '100%', height: 12 }} />
              <div className="ct-sk" style={{ width: '100%', height: 12 }} />
              <div className="ct-sk" style={{ width: '100%', height: 58, marginTop: 8 }} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────
   CART PAGE — "The Vitrine"
───────────────────────────────────────────────────────────── */
function cartProductHref(item: any): string {
  const slug = String(item?.slug || '').trim()
  if (slug) return `/products/${encodeURIComponent(slug)}`
  // No slug stored (carts created before the slug fix) — fall back to the
  // canonical slug route via productId; /api/products/[id] resolves both
  // UUIDs and slugs, but the page route itself needs a slug so we let the
  // resolver effect below backfill it. Until then, link by id through the
  // legacy redirector which forwards to the canonical page.
  const pid = String(item?.productId || '').trim()
  if (pid) return `/product/${encodeURIComponent(pid)}`
  return '/collection'
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const reduce = useReducedMotion()

  const sync = useCallback(() => {
    setCartItems(getCart())
    setTotals(getCartTotals())
  }, [])

  useEffect(() => {
    sync()
    setLoading(false)
    window.addEventListener('currency-updated', sync)
    window.addEventListener('cart-updated', sync)
    return () => {
      window.removeEventListener('currency-updated', sync)
      window.removeEventListener('cart-updated', sync)
    }
  }, [sync])

  // Backfill missing slugs for carts created before slug was stored.
  // Resolves productId -> slug via /api/products/[id] (handles UUID or slug)
  // and persists the result so future clicks go straight to /products/:slug.
  useEffect(() => {
    let cancelled = false
    async function backfill() {
      let cart: any[] = []
      try {
        cart = getCart()
      } catch { return }
      const missing = cart.filter((i) => !String(i?.slug || '').trim() && String(i?.productId || '').trim())
      if (missing.length === 0) return
      let changed = false
      for (const item of missing) {
        try {
          const res = await fetch(`/api/products/${encodeURIComponent(item.productId)}`, { cache: 'no-store' })
          if (!res.ok) continue
          const p = await res.json().catch(() => null)
          const slug = String(p?.slug || '').trim()
          if (slug) {
            item.slug = slug
            if (!item.productName && p?.name) item.productName = p.name
            if (!item.image && (p?.image || p?.images?.[0])) item.image = p.image || p.images[0]
            changed = true
          }
        } catch { /* keep original link; redirector handles it */ }
        if (cancelled) return
      }
      if (changed && !cancelled) {
        try {
          localStorage.setItem('shopping_cart', JSON.stringify(cart))
        } catch { /* ignore */ }
        sync()
      }
    }
    backfill()
    return () => { cancelled = true }
  }, [loading, sync])

  const handleQty = async (cartItemId: string, q: number) => {
    if (q <= 0) return
    const item = cartItems.find(i => i.id === cartItemId)
    if (!item) return

    if (q > item.quantity) {
      try {
        const res = await fetch(`/api/stock-check?productId=${item.productId}`)
        if (res.ok) {
          const product = await res.json()
          const stock = Number(product.stock_quantity ?? 0)
          if (q > stock) {
            toast({
              title: 'Limited Selection',
              description: `Only ${stock} pieces remain in our collection.`,
              variant: 'destructive',
            })
            return
          }
        }
      } catch (_) { }
    }

    updateCartQuantity(cartItemId, q)
    sync()
  }

  const handleRemove = (cartItemId: string) => {
    removeFromCart(cartItemId)
    sync()
    toast({ title: 'Bag Updated', description: 'The piece has been removed from your bag.' })
  }

  /* ── LOADING ── */
  if (loading) return (
    <div className="ct-root">
      <style>{CSS}</style>
      <HeaderMegaMenu />
      <VitrineSkeleton />
    </div>
  )

  /* ── EMPTY ── */
  if (cartItems.length === 0) return (
    <div className="ct-root">
      <style>{CSS}</style>
      <HeaderMegaMenu />
      <main className="ct-main">
        <div className="ct-empty">
          <motion.div
            className="ct-empty-orb"
            initial={reduce ? undefined : { opacity: 0, scale: 0.9 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
            aria-hidden="true"
          >
            <Diamond size={52} strokeWidth={0.9} />
          </motion.div>
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: EASE }}
          >
            <span className="ct-empty-eyebrow">Shopping Bag</span>
            <h1 className="ct-empty-title">Nothing reserved <em>yet</em></h1>
            <p className="ct-empty-text">
              Your bag awaits its first jewel. Wander the collection and select
              the piece that deserves a place in it.
            </p>
            <div className="ct-empty-ctas">
              <Link href="/collection" className="ct-empty-cta">
                <span>Explore the Collection</span>
                <ArrowRight size={15} strokeWidth={1.75} />
              </Link>
              <Link href="/custom-order" className="ct-empty-ghost">
                <span>Create Custom Order</span>
              </Link>
            </div>
            <div className="ct-empty-perks">
              <span className="ct-empty-perk"><ShieldCheck size={14} strokeWidth={1.6} /> Lifetime Warranty</span>
              <span className="ct-empty-perk"><Truck size={14} strokeWidth={1.6} /> Insured Delivery</span>
              <span className="ct-empty-perk"><RotateCcw size={14} strokeWidth={1.6} /> 30-Day Returns</span>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )

  const pieceWord = totals.itemCount === 1 ? 'Piece' : 'Pieces'

  /* ── POPULATED ── */
  return (
    <div className="ct-root">
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <main className="ct-main">

        {/* MASTHEAD BAND */}
        <section className="ct-band">
          <div className="ct-shell">
            <motion.div
              className="ct-band-in"
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <div>
                <span className="ct-eyebrow">
                  <i><Gem size={11} strokeWidth={1.6} /></i>
                  Shopping Bag
                </span>
                <h1 className="ct-title">Your <em>Selection</em></h1>
                <p className="ct-lede">
                  Every piece here is reserved for you. Review your edit, adjust as you wish,
                  then finalise your order with complimentary, insured delivery.
                </p>
                <Link href="/collection" className="ct-back">
                  <ArrowUpRight size={13} strokeWidth={1.7} style={{ transform: 'rotate(-90deg)' }} />
                  Continue Shopping
                </Link>
              </div>

              <div className="ct-plate">
                <div className="ct-stat">
                  <div className="ct-stat-num">{pad2(totals.itemCount)}</div>
                  <span className="ct-stat-label">{pieceWord} in bag</span>
                </div>
                <div className="ct-stat-div" aria-hidden="true" />
                <div className="ct-stat">
                  <div className="ct-stat-num ct-stat-num--price"><Price value={totals.total} /></div>
                  <span className="ct-stat-label">Total · tax incl.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* GRID + SUMMARY */}
        <div className="ct-body-wrap">
          <div className="ct-shell">
            <div className="ct-layout">

              <section aria-label="Bag items">
                <div className="ct-label">
                  <span className="tx">Your pieces</span>
                  <span className="ln" />
                </div>

                <ul className="ct-items">
                  <AnimatePresence initial={false}>
                    {cartItems.map((item, idx) => {
                      const tags = [
                        item.metal,
                        item.carat,
                        item.size && `Size ${item.size}`,
                      ].filter(Boolean)

                      return (
                        <motion.li
                          key={item.id}
                          className="ct-card"
                          initial={reduce ? undefined : { opacity: 0, y: 18 }}
                          animate={reduce ? undefined : { opacity: 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.26 } }}
                          transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.3), ease: EASE }}
                        >
                          <Link
                            href={cartProductHref(item)}
                            className="ct-media"
                            aria-label={`View ${item.productName}`}
                          >
                            <span className="ct-idx" aria-hidden="true">{pad2(idx + 1)}</span>
                            {item.image
                              ? <img src={item.image} alt={item.productName} loading="lazy" />
                              : <span className="ct-media-empty"><Gem size={38} strokeWidth={0.8} /></span>
                            }
                          </Link>

                          <div className="ct-body">
                            <Link href={cartProductHref(item)} className="ct-name">{item.productName}</Link>
                            {tags.length > 0 && (
                              <div className="ct-tags">
                                {tags.map((t, i) => <span className="ct-tag" key={i}>{t}</span>)}
                              </div>
                            )}
                            <p className="ct-unit">
                              <em><Price value={item.price} /></em> each
                            </p>

                            <div className="ct-card-foot">
                              <div className="ct-qty" role="group" aria-label={`Quantity for ${item.productName}`}>
                                <button
                                  className="ct-qty-btn"
                                  onClick={() => handleQty(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} strokeWidth={1.85} />
                                </button>
                                <span className="ct-qty-val">{item.quantity}</span>
                                <button
                                  className="ct-qty-btn"
                                  onClick={() => handleQty(item.id, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={13} strokeWidth={1.85} />
                                </button>
                              </div>

                              <button
                                className="ct-remove"
                                onClick={() => handleRemove(item.id)}
                                aria-label={`Remove ${item.productName} from your bag`}
                              >
                                <Trash2 size={13} strokeWidth={1.6} />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          <div className="ct-rail" aria-label={`Line total for ${item.productName}`}>
                            <span className="ct-rail-label">Line total</span>
                            <span className="ct-rail-price"><Price value={item.price} qty={item.quantity} /></span>
                          </div>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </ul>
              </section>

              {/* ORDER SUMMARY */}
              <motion.aside
                className="ct-aside"
                initial={reduce ? undefined : { opacity: 0, y: 18 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
              >
                <div className="ct-summary" role="region" aria-label="Order summary">
                  <div className="ct-summary-in">
                    <h2 className="ct-summary-title">Order <em>Summary</em></h2>
                    <p className="ct-summary-sub">{pad2(totals.itemCount)} {pieceWord} reserved</p>

                    <div className="ct-srow">
                      <span className="ct-srow-label">Subtotal</span>
                      <span className="ct-srow-dots" aria-hidden="true" />
                      <span className="ct-srow-val"><Price value={totals.subtotal} /></span>
                    </div>
                    <div className="ct-srow">
                      <span className="ct-srow-label">Estimated tax</span>
                      <span className="ct-srow-dots" aria-hidden="true" />
                      <span className="ct-srow-val"><Price value={totals.tax} /></span>
                    </div>
                    <div className="ct-srow">
                      <span className="ct-srow-label">Shipping &amp; insurance</span>
                      <span className="ct-srow-dots" aria-hidden="true" />
                      <span className="ct-srow-free">Complimentary</span>
                    </div>

                    <div className="ct-total">
                      <span className="ct-total-label">Total</span>
                      <span className="ct-total-val" aria-live="polite"><Price value={totals.total} /></span>
                    </div>
                    <p className="ct-total-note">Duties &amp; taxes calculated at checkout.</p>

                    <Link href="/checkout" className="ct-checkout">
                      <span>Proceed to Checkout</span>
                      <span className="ct-checkout-dot" aria-hidden="true" />
                      <span className="ct-checkout-total"><Price value={totals.total} /></span>
                      <ArrowRight size={15} strokeWidth={1.85} />
                    </Link>

                    <div className="ct-secure">
                      <Lock size={11} strokeWidth={1.9} />
                      Secure encrypted checkout
                    </div>

                    <div className="ct-trust">
                      <div className="ct-trust-item">
                        <ShieldCheck size={17} strokeWidth={1.4} />
                        <span>Lifetime<br />Warranty</span>
                      </div>
                      <div className="ct-trust-item">
                        <Truck size={17} strokeWidth={1.4} />
                        <span>Insured<br />Delivery</span>
                      </div>
                      <div className="ct-trust-item">
                        <RotateCcw size={17} strokeWidth={1.4} />
                        <span>30-Day<br />Returns</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </div>
          </div>

          <div className="ct-footer-spacer" aria-hidden="true" />
        </div>
      </main>

      {/* FLOATING MOBILE CHECKOUT BAR */}
      <motion.div
        className="ct-bar-wrap"
        initial={reduce ? undefined : { opacity: 0, y: 24 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.22, ease: EASE }}
      >
        <div className="ct-bar" role="region" aria-label="Checkout summary">
          <div className="ct-bar-total">
            <span className="ct-bar-total-label">Total · tax incl.</span>
            <span className="ct-bar-total-val" aria-live="polite"><Price value={totals.total} /></span>
          </div>
          <Link href="/checkout" className="ct-bar-cta">
            <span>Checkout</span>
            <ArrowRight size={15} strokeWidth={1.85} />
          </Link>
        </div>
      </motion.div>

      <Footer />
    </div>
  )
}
