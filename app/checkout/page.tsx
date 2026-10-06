'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'

import {
  ChevronDown, AlertCircle, Lock, User, MapPin, CreditCard,
  Loader2, Truck, Diamond, ShieldCheck, Smartphone, ArrowLeft,
  ArrowRight, Mail, Check, Gem, RotateCcw, Pencil,
} from 'lucide-react'
import { Price } from '@/components/Price'
import { getCart, getCartTotals, clearCart, getUser, getCurrency, convertToDisplayPrice, getSettings, SiteSettings, Currency } from '@/lib/authStore'

declare global { interface Window { Razorpay: any } }

/* ============================================================================
   CHECKOUT — "The Atelier Desk" (matches the cart redesign)

   Layout is a collapsing step flow rather than the old stepper-above-one-panel:
   each stage is its own card, the active one is open, completed ones fold down
   to a one-line recap with an Edit affordance, and upcoming ones sit dimmed.
   The order summary is a cream stationery panel — no dark receipt, no black.

   Everything functional is untouched: same state, same field names/types,
   same validation, same handlers, same Razorpay flow. Stripe (USD) still
   redirects to the full-screen Stripe-hosted checkout page (od.url).

   Performance: no page-wide SVG noise filter, no backdrop-filter, and only
   transform/opacity/colour are transitioned.
============================================================================ */

const CSS = `
.ck-root *,.ck-root *::before,.ck-root *::after{box-sizing:border-box;}

.ck-root{
  --w:#FFFFFF; --iv:#FDFCF9; --cr:#F8F4EE; --wa:#EFE9DF;
  --bd:#ECE5DA; --bd2:#E2D9CB;
  --a:#8C7456; --a2:#A8916F; --a3:#C9B68F;
  --al:rgba(140,116,86,.10); --am:rgba(140,116,86,.24);
  --ink:#3A2E22; --mu:rgba(58,46,34,.56); --fa:rgba(58,46,34,.40);
  --err:#B94040;
  /* dark half of the gold ramp so white button labels clear 6:1 contrast */
  --gold:linear-gradient(135deg,var(--a) 0%,#6F5A42 100%);
  --goldline:linear-gradient(90deg,var(--a3),var(--a));
  --gtxt:linear-gradient(120deg,var(--a3),var(--a) 55%,var(--a2));
  --serif:var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
  --display:var(--font-main,var(--font-bodoni)),'Bodoni Moda',Georgia,serif;
  --sans:var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;
  --e:cubic-bezier(.22,1,.36,1);
  --soft:0 1px 2px rgba(58,46,34,.04);
  --soft2:0 1px 2px rgba(58,46,34,.04);
  position:relative;min-height:100vh;display:flex;flex-direction:column;
  background:var(--iv);color:var(--ink);font-family:var(--sans);overflow-x:clip;
}
.ck-root a{text-decoration:none;color:inherit;}
/* Keep explicit link accents above the base rule (same 0-1-1 trap as cart). */
.ck-root a.ck-edit-link{color:var(--a);}
.ck-root a.ck-edit-link:hover{color:var(--ink);}
.ck-root ::selection{background:var(--am);color:var(--ink);}
.ck-root a:focus-visible,.ck-root button:focus-visible{outline:2px solid var(--a);outline-offset:3px;border-radius:6px;}
.ck-root img{display:block;}
.ck-main{flex:1;position:relative;z-index:1;}
.ck-shell{max-width:1280px;margin:0 auto;padding-inline:clamp(18px,4.5vw,52px);}

/* ══ MASTHEAD BAND ══════════════════════════════════════════ */
.ck-band{
  position:relative;overflow:hidden;background:var(--cr);
  border-bottom:1px solid var(--bd);
  padding:clamp(44px,6.4vw,78px) 0 clamp(30px,4vw,48px);
}
.ck-band::after{content:'';position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--goldline);opacity:.5;}
.ck-band-in{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:space-between;gap:clamp(18px,3vw,40px);flex-wrap:wrap;}
.ck-eyebrow-line{display:inline-flex;align-items:center;gap:11px;margin-bottom:15px;font-size:10px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--a);}
.ck-eyebrow-line i{font-style:normal;display:inline-grid;place-items:center;width:23px;height:23px;border:1px solid var(--am);border-radius:50%;color:var(--a);}
.ck-title{font-family:var(--display);font-weight:400;font-size:clamp(34px,5.6vw,64px);line-height:1.02;letter-spacing:-.015em;margin:0;color:var(--ink);}
.ck-title em{font-family:var(--serif);font-style:italic;font-weight:500;color:transparent;background:var(--gtxt);-webkit-background-clip:text;background-clip:text;}
.ck-back{display:inline-flex;align-items:center;gap:9px;font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);padding-bottom:5px;position:relative;margin-bottom:8px;}
.ck-back::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--goldline);transform:scaleX(.3);transform-origin:left;transition:transform .4s var(--e);}
.ck-back:hover::after{transform:scaleX(1);}
.ck-back svg{transition:transform .35s var(--e);}
.ck-back:hover svg{transform:translateX(-3px);}

/* ══ PROGRESS METER — gold fill under the masthead ══════════ */
.ck-meter{position:relative;z-index:1;margin-top:clamp(26px,3.2vw,38px);}
.ck-meter-track{height:2px;background:var(--bd2);position:relative;overflow:hidden;}
.ck-meter-fill{position:absolute;inset:0 auto 0 0;background:var(--goldline);transition:width .6s var(--e);}
.ck-meter-labels{display:flex;justify-content:space-between;margin-top:11px;gap:8px;}
.ck-meter-labels span{
  font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
  color:var(--fa);transition:color .35s;white-space:nowrap;
}
.ck-meter-labels span.done{color:var(--a);}
.ck-meter-labels span.now{color:var(--ink);}

/* ══ LAYOUT ═════════════════════════════════════════════════ */
.ck-body-wrap{padding:clamp(30px,4.2vw,56px) 0 clamp(80px,10vw,120px);}
.ck-layout{display:grid;grid-template-columns:minmax(0,1fr) clamp(320px,29vw,388px);gap:clamp(26px,3.6vw,58px);align-items:start;}
@media(max-width:1023px){.ck-layout{grid-template-columns:minmax(0,1fr);gap:32px;}}

/* ══ STEP FLOW — collapsing cards ═══════════════════════════ */
/* ── the flow reads as a timeline: a gold-tinted rail runs behind the step
   numerals so the three collapsing cards feel like one guided sequence
   rather than a stack of unrelated boxes. Rail collapses away under 720px
   and the numeral falls back into the card header. ── */
.ck-flow{position:relative;display:flex;flex-direction:column;gap:clamp(13px,1.6vw,18px);padding-left:66px;}
.ck-flow::before{
  content:'';position:absolute;left:21px;top:14px;bottom:14px;width:2px;
  background:linear-gradient(180deg,var(--am),var(--bd2));
}

.ck-card{
  position:relative;
  background:var(--w);border:1px solid var(--bd);
  transition:border-color .32s,box-shadow .4s var(--e),opacity .32s;
}
.ck-card.is-open{border-color:var(--bd2);box-shadow:var(--soft);}
.ck-card.is-open::after{content:'';position:absolute;left:0;top:0;width:100%;height:3px;background:var(--goldline);}
.ck-card.is-todo{opacity:.55;}
.ck-card.is-done:hover{border-color:var(--am);}

/* card header */
.ck-card-head{
  width:100%;display:flex;align-items:center;gap:clamp(13px,1.6vw,18px);
  padding:clamp(17px,2.1vw,24px) clamp(18px,2.4vw,28px);
  background:transparent;border:none;text-align:left;font-family:inherit;color:inherit;
}
.ck-card.is-done .ck-card-head{cursor:pointer;}

/* the numeral — rides the rail on desktop */
.ck-node{
  position:absolute;left:-66px;top:clamp(15px,1.9vw,21px);z-index:2;
  width:44px;height:44px;flex-shrink:0;border-radius:50%;
  display:grid;place-items:center;
  font-family:var(--serif);font-style:italic;font-size:16px;font-weight:600;line-height:1;
  border:1px solid var(--bd2);background:var(--w);color:var(--fa);
  transition:background .35s,color .35s,border-color .35s,box-shadow .4s var(--e),transform .4s var(--spring);
}
.ck-card.is-open .ck-node{
  background:var(--gold);color:#fff;border-color:transparent;
  box-shadow:0 0 0 5px var(--al),0 10px 22px -10px rgba(140,116,86,.8);transform:scale(1.05);
}
.ck-card.is-done .ck-node{background:var(--w);color:var(--a);border-color:var(--a);}
@media(max-width:720px){
  .ck-flow{padding-left:0;}
  .ck-flow::before{display:none;}
  .ck-node{position:static;width:40px;height:40px;border-radius:50%;transform:none;box-shadow:none;}
  .ck-card.is-open .ck-node{transform:none;box-shadow:none;}
}

.ck-node-txt{flex:1;min-width:0;}
.ck-node-kicker{font-size:9px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:var(--a);margin-bottom:5px;}
.ck-node-title{font-family:var(--serif);font-size:clamp(19px,2vw,25px);font-weight:500;line-height:1.12;color:var(--ink);margin:0;}
.ck-node-title em{font-style:italic;font-weight:500;color:transparent;background:var(--gtxt);-webkit-background-clip:text;background-clip:text;}
.ck-node-recap{
  margin:7px 0 0;font-size:12px;font-weight:300;line-height:1.6;color:var(--mu);
  overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
}
.ck-edit{
  flex-shrink:0;display:inline-flex;align-items:center;gap:7px;
  padding:10px 17px;cursor:pointer;border-radius:22px;
  background:var(--w);border:1px solid var(--bd2);color:var(--ink);
  font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
  transition:border-color .25s,color .25s,background .25s;
}
.ck-edit:hover{border-color:var(--a2);color:var(--a);background:var(--cr);}
@media(max-width:560px){.ck-edit span{display:none;}.ck-edit{padding:11px;border-radius:50%;}}

/* card body */
.ck-card-body{
  padding:0 clamp(18px,2.4vw,28px) clamp(22px,2.6vw,30px);
  animation:ckFadeUp .38s var(--e);
}
@keyframes ckFadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.ck-card-rule{height:1px;background:var(--bd);margin:0 0 clamp(20px,2.4vw,26px);}

.ck-sub{display:flex;align-items:center;gap:11px;margin:clamp(24px,3vw,32px) 0 16px;}
.ck-sub .tx{font-size:9px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:var(--a);white-space:nowrap;display:inline-flex;align-items:center;gap:8px;}
.ck-sub .ln{flex:1;height:1px;background:linear-gradient(90deg,var(--am),transparent);}

/* ══ FIELDS ═════════════════════════════════════════════════ */
.ck-field-grp{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
@media(max-width:600px){.ck-field-grp{grid-template-columns:1fr;}}
.ck-field{margin-bottom:16px;position:relative;}
.ck-field-grp .ck-field{margin-bottom:0;}
.ck-label{display:block;font-size:9.5px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--fa);margin-bottom:8px;}
.ck-uline-wrap{position:relative;display:flex;align-items:center;}
.ck-uline-icon{position:absolute;left:15px;color:var(--bd2);pointer-events:none;transition:color .25s;}
.ck-uline-wrap:focus-within .ck-uline-icon{color:var(--ink);}
.ck-field{margin-bottom:16px;position:relative;}
.ck-field-grp .ck-field{margin-bottom:0;}
.ck-field:focus-within .ck-label{color:var(--g3);}
.ck-input{
  width:100%;background:var(--iv);
  border:1px solid var(--bd2);border-radius:10px;
  padding:16px 16px 16px 43px;color:var(--ink);
  font-family:var(--sans);font-size:15px;font-weight:500;outline:none;
  transition:border-color .25s,background .25s,box-shadow .3s var(--e);
}
.ck-input.no-icon{padding-left:16px;}
.ck-input:hover{border-color:var(--a3);}
.ck-input:focus{border-color:var(--g3);background:var(--w);box-shadow:0 0 0 3px rgba(140,116,86,.16);}
.ck-input::placeholder{color:var(--fa);font-weight:400;}
.ck-input:-webkit-autofill{box-shadow:0 0 0 60px var(--cr) inset;-webkit-text-fill-color:var(--ink);caret-color:var(--ink);}

.ck-phone-grid{display:grid;grid-template-columns:132px 1fr;gap:12px;}
@media(max-width:380px){.ck-phone-grid{grid-template-columns:1fr;}}
.ck-select-wrap{position:relative;}
.ck-select{
  width:100%;box-sizing:border-box;background:var(--iv);
  border:1px solid var(--bd2);border-radius:10px;
  padding:16px 34px 16px 14px;color:var(--ink);
  font-family:var(--sans);font-size:15px;font-weight:500;outline:none;cursor:pointer;
  transition:border-color .25s,background .25s,box-shadow .3s var(--e);
  -webkit-appearance:none;appearance:none;
}
.ck-select:hover{border-color:var(--a3);}
.ck-select:focus{border-color:var(--g3);background:var(--w);box-shadow:0 0 0 3px rgba(140,116,86,.16);}
.ck-select option{background:var(--w);color:var(--ink);}
.ck-select-icon{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--mu);pointer-events:none;}
.ck-hint{font-size:10.5px;font-weight:300;color:var(--fa);margin-top:7px;letter-spacing:.04em;}

/* ══ CHOICE CARDS ═══════════════════════════════════════════ */
.ck-toggle-pair{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:560px){.ck-toggle-pair{grid-template-columns:1fr;}}
.ck-toggle-btn{
  text-align:left;cursor:pointer;position:relative;overflow:hidden;
  border:1px solid var(--bd2);
  padding:18px;background:var(--w);
  display:flex;flex-direction:column;gap:12px;
  transition:border-color .28s,background .28s,box-shadow .35s var(--e),transform .28s var(--e);
  font-family:inherit;color:inherit;
}
.ck-toggle-btn::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--goldline);transform:scaleY(0);transform-origin:top;transition:transform .4s var(--e);}
.ck-toggle-btn:hover{border-color:var(--a3);transform:translateY(-2px);}
.ck-toggle-btn.sel{border-color:var(--a2);background:var(--cr);box-shadow:0 14px 30px -20px rgba(140,116,86,.55);}
.ck-toggle-btn.sel::before{transform:scaleY(1);}
.ck-toggle-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.ck-toggle-check{
  width:22px;height:22px;border-radius:50%;flex-shrink:0;
  border:1px solid var(--bd2);background:var(--w);
  display:flex;align-items:center;justify-content:center;transition:background .28s,border-color .28s;
}
.ck-toggle-btn.sel .ck-toggle-check{background:var(--gold);border-color:transparent;}
.ck-toggle-check svg{opacity:0;transform:scale(.5);transition:opacity .22s,transform .28s var(--spring);color:#fff;}
.ck-toggle-btn.sel .ck-toggle-check svg{opacity:1;transform:scale(1);}
.ck-toggle-icon{color:var(--a3);transition:color .28s;}
.ck-toggle-btn.sel .ck-toggle-icon{color:var(--a);}
.ck-toggle-title{font-family:var(--serif);font-size:19px;font-weight:600;color:var(--ink);}
.ck-toggle-sub{font-size:10.5px;font-weight:300;letter-spacing:.05em;color:var(--mu);margin-top:3px;}
.ck-toggle-badge{font-size:10.5px;color:var(--a);font-weight:700;letter-spacing:.12em;text-transform:uppercase;}

/* ══ PAYMENT NOTE ═══════════════════════════════════════════ */
.ck-pay-note{
  position:relative;margin-top:24px;padding:19px 21px;
  background:var(--cr);border:1px solid var(--bd);
  font-size:12.5px;font-weight:300;color:var(--mu);line-height:1.8;
  display:flex;gap:13px;align-items:flex-start;
}
.ck-pay-note::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--goldline);}
.ck-pay-note svg{flex-shrink:0;margin-top:2px;color:var(--a);}

/* ══ NAV BUTTONS ════════════════════════════════════════════ */
.ck-nav-btns{display:flex;justify-content:space-between;margin-top:clamp(24px,3vw,34px);gap:14px;align-items:stretch;}
@media(max-width:480px){.ck-nav-btns{flex-direction:column-reverse;gap:10px;}}
/* Primary: gold plate, white label, deepening to ink on hover. Both fills
   sit dark enough that the uppercase label never washes out. */
.ck-btn-next{
  position:relative;overflow:hidden;flex:1;min-height:58px;
  display:inline-flex;align-items:center;justify-content:center;gap:11px;
  padding:17px 26px;border:none;cursor:pointer;
  background:var(--gold);color:#fff;
  font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;
  box-shadow:0 12px 26px -12px rgba(140,116,86,.7);
  transition:box-shadow .35s var(--e),transform .28s var(--e),opacity .25s;
}
.ck-btn-next::after{content:'';position:absolute;inset:0;background:var(--ink);transform:scaleX(0);transform-origin:left;transition:transform .45s var(--e);}
.ck-btn-next > *{position:relative;z-index:1;}
.ck-btn-next:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 18px 34px -14px rgba(58,46,34,.5);}
.ck-btn-next:hover:not(:disabled)::after{transform:scaleX(1);}
.ck-btn-next:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}
.ck-btn-next svg{transition:transform .35s var(--e);}
.ck-btn-next:hover:not(:disabled) svg{transform:translateX(4px);}

.ck-btn-prev{
  display:inline-flex;align-items:center;justify-content:center;gap:9px;white-space:nowrap;
  min-height:58px;padding:17px 26px;cursor:pointer;
  background:var(--w);border:1px solid var(--bd2);color:var(--ink);
  font-family:var(--sans);font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;
  transition:border-color .25s,color .25s,background .25s,transform .28s var(--e);
}
.ck-btn-prev:hover{border-color:var(--ink);color:#fff;background:var(--ink);transform:translateY(-2px);box-shadow:0 14px 28px -14px rgba(58,46,34,.55);}
.ck-btn-prev svg{transition:transform .3s var(--e);}
.ck-btn-prev:hover svg{transform:translateX(-3px);}

/* ══ ALERT ══════════════════════════════════════════════════ */
.ck-alert{
  padding:15px 18px;background:rgba(185,64,64,.05);
  border:1px solid rgba(185,64,64,.24);color:var(--err);
  font-size:12.5px;font-weight:400;letter-spacing:.02em;
  display:flex;align-items:center;gap:11px;margin-bottom:18px;
}
.ck-alert svg{flex-shrink:0;}

/* ══ SUMMARY — cream stationery panel ═══════════════════════ */
.ck-ledger{position:sticky;top:clamp(90px,10vw,112px);}
@media(max-width:1023px){.ck-ledger{position:static;}}

.ck-ledger-card{
  position:relative;background:var(--w);
  border:1px solid var(--bd2);box-shadow:var(--soft);
}
.ck-ledger-card::before{content:'';position:absolute;left:0;top:0;width:100%;height:3px;background:var(--goldline);z-index:2;}
.ck-ledger-in{position:relative;padding:clamp(24px,2.9vw,30px);}

.ck-ledger-eyebrow{display:flex;align-items:center;gap:11px;font-size:9px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--a);margin-bottom:11px;}
.ck-ledger-eyebrow::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--am),transparent);}
.ck-ledger-title{font-family:var(--serif);font-weight:500;font-size:clamp(23px,2.4vw,28px);line-height:1.1;margin:0 0 4px;color:var(--ink);}
.ck-ledger-title em{font-style:italic;font-weight:500;color:transparent;background:var(--gtxt);-webkit-background-clip:text;background-clip:text;}
.ck-ledger-count{font-size:9.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--fa);margin:0 0 18px;}

.ck-ledger-items{max-height:300px;overflow-y:auto;margin-bottom:6px;padding-right:4px;overscroll-behavior:contain;}
.ck-ledger-items::-webkit-scrollbar{width:4px;}
.ck-ledger-items::-webkit-scrollbar-track{background:transparent;}
.ck-ledger-items::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:4px;}

.ck-litem{display:flex;gap:13px;padding:13px 0;border-top:1px solid var(--bd);}
.ck-litem:first-child{border-top:none;padding-top:2px;}
.ck-litem-img{
  width:56px;height:56px;flex-shrink:0;overflow:hidden;
  background:var(--wa);border:1px solid var(--bd);
  display:flex;align-items:center;justify-content:center;
}
.ck-litem-img img{width:100%;height:100%;object-fit:cover;}
.ck-litem-info{flex:1;min-width:0;}
.ck-litem-name{font-family:var(--serif);font-size:15.5px;font-weight:500;color:var(--ink);line-height:1.3;overflow-wrap:anywhere;margin-bottom:4px;}
.ck-litem-meta{font-size:9.5px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--fa);}
.ck-litem-meta span:not(:last-child)::after{content:'·';margin:0 6px;color:var(--a3);}
.ck-litem-price{font-family:var(--sans);font-size:15px;font-weight:800;color:#111;font-variant-numeric:tabular-nums;white-space:nowrap;flex-shrink:0;align-self:center;}

.ck-leader-row{display:flex;align-items:baseline;gap:10px;margin-bottom:13px;}
.ck-leader-label{font-size:12px;font-weight:300;letter-spacing:.02em;color:var(--mu);white-space:nowrap;}
.ck-leader-line{flex:1;border-bottom:1px dotted var(--bd2);transform:translateY(-3px);}
.ck-leader-value{font-family:var(--sans);font-size:15.5px;font-weight:800;color:#111;font-variant-numeric:tabular-nums;white-space:nowrap;}
.ck-leader-free{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--a);}
.ck-ledger-totals{margin-top:16px;padding-top:18px;border-top:1px solid var(--bd);}

.ck-ledger-grand{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-top:16px;padding-top:18px;border-top:1px solid var(--am);}
.ck-grand-lbl{font-size:9.5px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:var(--a);padding-bottom:6px;}
.ck-grand-val{font-family:var(--sans);font-weight:800;font-size:clamp(28px,3vw,36px);line-height:1;color:#111;font-variant-numeric:tabular-nums;}

.ck-edit-link{
  display:block;text-align:center;margin-top:20px;
  font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;
  color:var(--a);transition:color .25s;
}
.ck-edit-link:hover{color:var(--ink);}
.ck-trust-row{
  display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;
  margin-top:16px;padding-top:16px;border-top:1px solid var(--bd);
  font-size:9px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);
}
.ck-trust-row span{display:inline-flex;align-items:center;gap:6px;}
.ck-trust-row svg{color:var(--a);}

/* ══ EMPTY ══════════════════════════════════════════════════ */
.ck-empty{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:clamp(80px,11vw,120px) 24px;}
.ck-empty-icon{color:var(--a2);margin-bottom:22px;}
.ck-empty h2{font-family:var(--serif);font-style:italic;font-weight:400;font-size:clamp(30px,5vw,44px);color:var(--ink);margin:0 0 14px;}
.ck-empty p{font-size:13px;font-weight:300;line-height:1.8;color:var(--mu);max-width:360px;margin:0 0 30px;}
.ck-empty-cta{
  position:relative;overflow:hidden;
  display:inline-flex;align-items:center;justify-content:center;gap:11px;
  min-height:56px;padding:17px 38px;border:none;
  background:var(--gold);color:#fff;cursor:pointer;
  font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;
  box-shadow:0 12px 26px -12px rgba(140,116,86,.7);
  transition:box-shadow .35s var(--e),transform .28s var(--e);
}
.ck-empty-cta::after{content:'';position:absolute;inset:0;background:var(--ink);transform:scaleX(0);transform-origin:left;transition:transform .45s var(--e);}
.ck-empty-cta > *{position:relative;z-index:1;}
.ck-empty-cta:hover{transform:translateY(-2px);box-shadow:0 18px 34px -14px rgba(58,46,34,.5);}
.ck-empty-cta:hover::after{transform:scaleX(1);}

/* clearance for the site's floating bottom pill-nav */
@media(max-width:1023px){.ck-root{padding-bottom:96px;}}

/* ══ MOTION SAFETY ══════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce){
  .ck-root *,.ck-root *::before,.ck-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}
}
`

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', min: 10, max: 10 },
  { code: '+1', country: 'US/CA', min: 10, max: 10 },
  { code: '+44', country: 'GB', min: 10, max: 10 },
  { code: '+971', country: 'AE', min: 9, max: 9 },
  { code: '+61', country: 'AU', min: 9, max: 9 },
  { code: '+92', country: 'PK', min: 10, max: 10 },
  { code: '+880', country: 'BD', min: 10, max: 10 },
  { code: '+65', country: 'SG', min: 8, max: 8 },
  { code: '+49', country: 'DE', min: 10, max: 11 },
  { code: '+33', country: 'FR', min: 9, max: 9 },
  { code: '+81', country: 'JP', min: 10, max: 10 },
  { code: '+86', country: 'CN', min: 11, max: 11 },
]

type Step = 'contact' | 'shipping' | 'payment'

const STEPS: { key: Step; label: string; num: string }[] = [
  { key: 'contact', label: 'Contact', num: 'I' },
  { key: 'shipping', label: 'Shipping', num: 'II' },
  { key: 'payment', label: 'Payment', num: 'III' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [activeStep, setStep] = useState<Step>('contact')
  const [cart, setCart] = useState<any[]>([])
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, shipping: 0, total: 0 })
  const [inrSubtotal, setInrSubtotal] = useState<number>(0)
  const [inrTax, setInrTax] = useState<number>(0)
  const [inrShipping, setInrShipping] = useState<number>(0)
  const [inrTotal, setInrTotal] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [currency, setCurrencyState] = useState<Currency>('USD')
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(() => getSettings())
  const [razorpayReady, setRazorpayReady] = useState(false)

  const [formData, setFormData] = useState({
    email: '', firstName: '', lastName: '', countryCode: '+91', phone: '',
    shippingAddress: '', shippingCity: '', shippingState: '', shippingZip: '',
    sameAsBilling: true,
    billingAddress: '', billingCity: '', billingState: '', billingZip: '',
    saveAddress: true,
    deliveryMethod: 'home_delivery',
    paymentMethod: 'online',
  })

  useEffect(() => {
    setMounted(true)
    const c = getCart()
    setCart(c)

    const onCurUpdate = (e: any) => {
      const newCur = e.detail?.currency
      if (newCur) setCurrencyState(newCur)
    }
    window.addEventListener('currency-updated', onCurUpdate)

    // Check if Razorpay is already loaded (e.g. from previous navigation)
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      setRazorpayReady(true)
    }

    // If user exited Stripe checkout without paying, mark the pending order
    // as payment_failed (same flow as Razorpay popup dismiss)
    const params = new URLSearchParams(window.location.search)
    if (params.get('cancelled') === '1' && params.get('order_id')) {
      fetch('/api/checkout/fail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: params.get('order_id'), reason: 'payment_failed' })
      }).catch(e => console.error('[Checkout] Failed to mark abandoned Stripe order:', e))
    }

    const u = getUser()
    if (u) {
      setUser(u)
      const [first, ...rest] = (u.name || '').split(' ')
      setFormData(p => ({
        ...p,
        email: u.email || '',
        firstName: first || '',
        lastName: rest.join(' ') || '',
        phone: u.phone || ''
      }))
    }

    return () => {
      window.removeEventListener('currency-updated', onCurUpdate)
    }
  }, [])

  useEffect(() => {
    const sync = async () => {
      const t = getCartTotals()
      setTotals(t)
      const curr = getCurrency()
      setCurrencyState(curr)

      if (curr === 'INR' && cart.length > 0) {
        let sub = 0
        for (const item of cart) {
          // Pass false to ensure it DOES convert USD to INR the first time
          const unitInr = await convertToDisplayPrice(item.price, false)
          sub += Math.round(unitInr) * (item.quantity ?? 1)
        }
        setInrSubtotal(sub)

        const tax = Math.round(sub * 0.08)
        setInrTax(tax)

        const ship = formData.deliveryMethod === 'express' ? Math.round(15 * 93.1) : 0
        setInrShipping(ship)

        setInrTotal(sub + tax + ship)
      } else {
        setInrSubtotal(0)
        setInrTax(0)
        setInrShipping(0)
        setInrTotal(0)
      }
    }
    sync()
  }, [formData.deliveryMethod, cart, currency]) // Added currency dependency to sync totals when it changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement

    if (name === 'phone') {
      const digits = value.replace(/\D/g, '')
      const country = COUNTRY_CODES.find(c => c.code === formData.countryCode)
      if (country && digits.length > country.max) return
      setFormData(p => ({ ...p, [name]: digits }))
    } else {
      setFormData(p => ({ ...p, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
    }
  }

  const express = formData.deliveryMethod === 'express'
  const grandTotal = totals.total + (express ? 15 : 0)

  const validateStep = (step: Step) => {
    if (step === 'contact') {
      if (!formData.email || !formData.firstName || !formData.lastName) {
        setError('Please fill in all contact fields'); return false
      }

      if (formData.phone) {
        const country = COUNTRY_CODES.find(c => c.code === formData.countryCode)
        if (country && formData.phone.length < country.min) {
          setError(`Phone number must be at least ${country.min} digits for ${country.country}`)
          return false
        }
      } else {
        setError('Phone number is required'); return false
      }
    }
    if (step === 'shipping') {
      if (!formData.shippingAddress || !formData.shippingCity || !formData.shippingZip) {
        setError('Please provide a complete shipping address'); return false
      }
    }
    setError(''); return true
  }

  const nextStep = (s: Step) => {
    if (validateStep(activeStep)) {
      setStep(s)
      window.scrollTo(0, 0)
    }
  }

  const handleRazorpayPayment = async (od: any, ship: any, bill: any) => {
    const RZP = (window as any).Razorpay
    if (typeof RZP !== 'function' && typeof RZP !== 'object') {
      setError('Payment gateway failed to load. Please wait a moment and try again.')
      setLoading(false)
      return
    }

    // Razorpay can sometimes be an object with a default property if imported via some bundlers,
    // but here it's a global script. Let's be extra safe.
    const RazorpayConstructor = typeof RZP === 'function' ? RZP : RZP.default;

    if (typeof RazorpayConstructor !== 'function') {
      setError('Payment gateway initialization failed. Please refresh the page.')
      setLoading(false)
      return
    }

    const rz = new RazorpayConstructor({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: od.amount, currency: od.currency || 'INR',
      name: siteSettings?.site_name || 'Gems Global Jewels',
      description: 'Luxury Jewellery Purchase',
      image: siteSettings?.logo_url || '/logo.png',
      order_id: od.id,
      handler: async (response: any) => {
        // Optimistically show loader/redirection immediately
        setLoading(true)
        const vr = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...response, orderId: od.orderId, items: cart })
        })
        if (vr.ok) {
          // Clear cart immediately before navigating to speed up perception
          clearCart()
          router.push(`/order/success?order_id=${od.orderId}&payment_id=${response.razorpay_payment_id}`)
        }
        else {
          setError('Verification failed')
          setLoading(false)
        }
      },
      prefill: { name: `${formData.firstName} ${formData.lastName}`, email: formData.email, contact: `${formData.countryCode}${formData.phone}` },
      theme: { color: '#8F7A70' },
      modal: {
        // User exited the Razorpay popup without completing payment.
        // Razorpay only fires payment.failed when the gateway rejects an
        // attempt — exiting mid-payment fires only ondismiss, so treat any
        // dismiss as a failed payment.
        ondismiss: async () => {
          setLoading(false)
          try {
            await fetch('/api/checkout/fail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: od.orderId, reason: 'payment_failed' })
            })
          } catch (e) {
            console.error('[Checkout] Failed to mark order as payment_failed:', e)
          }
        }
      }
    })
    // Payment attempted but rejected by the gateway — mark the order as failed
    rz.on('payment.failed', async (resp: any) => {
      try {
        await fetch('/api/checkout/fail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: od.orderId, reason: 'payment_failed' })
        })
      } catch (e) {
        console.error('[Checkout] Failed to mark order as payment_failed:', e)
      }
      setError(resp?.error?.description || 'Payment failed. Please try again.')
      setLoading(false)
    })
    rz.open()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const fullPhone = `${formData.countryCode}${formData.phone}`
      const ship = {
        street: formData.shippingAddress,
        city: formData.shippingCity,
        state: formData.shippingState,
        zip: formData.shippingZip,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: fullPhone
      }
      const bill = formData.sameAsBilling ? ship : {
        street: formData.billingAddress,
        city: formData.billingCity,
        state: formData.billingState,
        zip: formData.billingZip,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: fullPhone
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart, shippingAddress: ship, billingAddress: bill,
          email: formData.email, deliveryMethod: formData.deliveryMethod,
          userId: user?.id, paymentMethod: formData.paymentMethod, currency
        })
      })

      const od = await res.json()
      if (!res.ok) {
        let errorMsg = od.error || 'Checkout failed'
        if (errorMsg.toLowerCase().includes('product not found') || errorMsg.toLowerCase().includes('product id not found')) {
          errorMsg = 'Product is out of stock'
        }
        throw new Error(errorMsg)
      }

      if (currency === 'INR') {
        const RZP = (window as any).Razorpay
        if (!razorpayReady && !RZP) {
          setError('Payment gateway is still initializing. Please try again in a few seconds.')
          setLoading(false)
          return
        }
        await handleRazorpayPayment(od, ship, bill)
      } else {
        // USD → full-screen Stripe-hosted checkout page
        if (od.url) window.location.href = od.url
        else throw new Error('Payment session could not be created. Please try again.')
      }
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

  if (!mounted) return null

  if (cart.length === 0) return (
    <div className="ck-root">
      <style>{CSS}</style><HeaderMegaMenu />
      <div className="ck-empty">
        <Diamond size={44} strokeWidth={1} className="ck-empty-icon" />
        <h2>Your bag is empty</h2>
        <p>Browse the collection to find a piece worth checking out for.</p>
        <Link href="/collection" className="ck-empty-cta">
          <span>Discover Collection</span>
          <ArrowRight size={15} strokeWidth={1.75} />
        </Link>
      </div>
      <Footer />
    </div>
  )

  const displayTotal = currency === 'INR' ? inrTotal : grandTotal
  const displaySubtotal = currency === 'INR' ? inrSubtotal : totals.subtotal
  const displayTax = currency === 'INR' ? inrTax : totals.tax
  const displayShipping = currency === 'INR' ? inrShipping : (express ? 15 : 0)
  const itemCount = cart.reduce((n, it) => n + (it.quantity ?? 1), 0)
  const selectedCountry = COUNTRY_CODES.find(c => c.code === formData.countryCode)
  const stepIndex = STEPS.findIndex(s => s.key === activeStep)

  /* One-line recap shown on a folded-up completed step. */
  const recapFor = (key: Step): string => {
    if (key === 'contact') {
      return [
        `${formData.firstName} ${formData.lastName}`.trim(),
        formData.email,
        formData.phone ? `${formData.countryCode} ${formData.phone}` : '',
      ].filter(Boolean).join(' · ')
    }
    if (key === 'shipping') {
      const addr = [
        formData.shippingAddress,
        formData.shippingCity,
        formData.shippingState,
        formData.shippingZip,
      ].filter(Boolean).join(', ')
      const method = express ? 'Express delivery' : 'Standard delivery'
      return [addr, method].filter(Boolean).join(' · ')
    }
    return 'Secure online payment'
  }

  /* Fold a completed step back open. Only backwards — forward moves still run
     through nextStep() so validation is never skipped. */
  const editStep = (key: Step) => {
    const target = STEPS.findIndex(s => s.key === key)
    if (target < stepIndex) {
      setError('')
      setStep(key)
    }
  }

  const stateOf = (i: number) => (i === stepIndex ? 'is-open' : i < stepIndex ? 'is-done' : 'is-todo')

  return (
    <div className="ck-root">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
        onError={() => setError('Failed to load payment gateway. Please refresh and try again.')}
      />
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <main className="ck-main">

        {/* MASTHEAD BAND */}
        <section className="ck-band">
          <div className="ck-shell">
            <div className="ck-band-in">
              <div>
                <span className="ck-eyebrow-line">
                  <i><Lock size={10} strokeWidth={1.8} /></i>
                  Secure Checkout
                </span>
                <h1 className="ck-title">The <em>Finale</em></h1>
              </div>
              <Link href="/cart" className="ck-back">
                <ArrowLeft size={13} strokeWidth={1.7} />
                Back to Shopping Bag
              </Link>
            </div>
          </div>
        </section>

        <div className="ck-body-wrap">
          <div className="ck-shell">
            <div className="ck-layout">

              {/* ══ STEP FLOW ══ */}
              <div>
                {error && <div className="ck-alert" role="alert"><AlertCircle size={17} /> {error}</div>}

                <div className="ck-flow">

                  {/* ── I · CONTACT ── */}
                  <section className={`ck-card ${stateOf(0)}`}>
                    <div
                      className="ck-card-head"
                      {...(stepIndex > 0
                        ? { role: 'button', tabIndex: 0, onClick: () => editStep('contact'),
                            onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editStep('contact') } } }
                        : {})}
                    >
                      <span className="ck-node">{stepIndex > 0 ? <Check size={17} strokeWidth={2.4} /> : STEPS[0].num}</span>
                      <span className="ck-node-txt">
                        <span className="ck-node-kicker">Step One</span>
                        <h2 className="ck-node-title">Contact <em>Information</em></h2>
                        {stepIndex > 0 && <p className="ck-node-recap">{recapFor('contact')}</p>}
                      </span>
                      {stepIndex > 0 && (
                        <span className="ck-edit"><Pencil size={12} strokeWidth={1.8} /><span>Edit</span></span>
                      )}
                    </div>

                    {activeStep === 'contact' && (
                      <div className="ck-card-body">
                        <div className="ck-card-rule" />

                        <div className="ck-field">
                          <label className="ck-label" htmlFor="ck-email">Email Address</label>
                          <div className="ck-uline-wrap">
                            <Mail size={16} className="ck-uline-icon" />
                            <input id="ck-email" className="ck-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@luxury.com" />
                          </div>
                        </div>
                        <div className="ck-field-grp">
                          <div className="ck-field">
                            <label className="ck-label" htmlFor="ck-first">First Name</label>
                            <input id="ck-first" className="ck-input no-icon" type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" />
                          </div>
                          <div className="ck-field">
                            <label className="ck-label" htmlFor="ck-last">Last Name</label>
                            <input id="ck-last" className="ck-input no-icon" type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" />
                          </div>
                        </div>
                        <div className="ck-field" style={{ marginTop: 16 }}>
                          <label className="ck-label" htmlFor="ck-phone">Phone Number</label>
                          <div className="ck-phone-grid">
                            <div className="ck-select-wrap">
                              <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="ck-select" aria-label="Country code">
                                {COUNTRY_CODES.map(c => (
                                  <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                                ))}
                              </select>
                              <ChevronDown size={13} className="ck-select-icon" />
                            </div>
                            <div className="ck-uline-wrap">
                              <Smartphone size={16} className="ck-uline-icon" />
                              <input
                                id="ck-phone"
                                className="ck-input"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder={selectedCountry?.max === 10 ? "10-digit number" : "Phone number"}
                              />
                            </div>
                          </div>
                          {formData.countryCode && (
                            <div className="ck-hint">
                              Expected: {selectedCountry?.min === selectedCountry?.max
                                ? `${selectedCountry?.min} digits`
                                : `${selectedCountry?.min}-${selectedCountry?.max} digits`}
                            </div>
                          )}
                        </div>

                        <div className="ck-nav-btns">
                          <button className="ck-btn-next" onClick={() => nextStep('shipping')}>
                            <span>Continue to Shipping</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* ── II · SHIPPING ── */}
                  <section className={`ck-card ${stateOf(1)}`}>
                    <div
                      className="ck-card-head"
                      {...(stepIndex > 1
                        ? { role: 'button', tabIndex: 0, onClick: () => editStep('shipping'),
                            onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editStep('shipping') } } }
                        : {})}
                    >
                      <span className="ck-node">{stepIndex > 1 ? <Check size={17} strokeWidth={2.4} /> : STEPS[1].num}</span>
                      <span className="ck-node-txt">
                        <span className="ck-node-kicker">Step Two</span>
                        <h2 className="ck-node-title">Shipping <em>Address</em></h2>
                        {stepIndex > 1 && <p className="ck-node-recap">{recapFor('shipping')}</p>}
                      </span>
                      {stepIndex > 1 && (
                        <span className="ck-edit"><Pencil size={12} strokeWidth={1.8} /><span>Edit</span></span>
                      )}
                    </div>

                    {activeStep === 'shipping' && (
                      <div className="ck-card-body">
                        <div className="ck-card-rule" />

                        <div className="ck-field">
                          <label className="ck-label" htmlFor="ck-street">Street Address</label>
                          <div className="ck-uline-wrap">
                            <MapPin size={16} className="ck-uline-icon" />
                            <input id="ck-street" className="ck-input" type="text" name="shippingAddress" value={formData.shippingAddress} onChange={handleChange} placeholder="123 Luxury Ave" />
                          </div>
                        </div>
                        <div className="ck-field-grp">
                          <div className="ck-field">
                            <label className="ck-label" htmlFor="ck-city">City</label>
                            <input id="ck-city" className="ck-input no-icon" type="text" name="shippingCity" value={formData.shippingCity} onChange={handleChange} placeholder="Surat" />
                          </div>
                          <div className="ck-field">
                            <label className="ck-label" htmlFor="ck-state">State / Province</label>
                            <input id="ck-state" className="ck-input no-icon" type="text" name="shippingState" value={formData.shippingState} onChange={handleChange} placeholder="Gujarat" />
                          </div>
                        </div>
                        <div className="ck-field" style={{ marginTop: 16 }}>
                          <label className="ck-label" htmlFor="ck-zip">Postal Code</label>
                          <input id="ck-zip" className="ck-input no-icon" type="text" name="shippingZip" value={formData.shippingZip} onChange={handleChange} placeholder="395001" />
                        </div>

                        <div className="ck-sub">
                          <span className="tx"><Truck size={12} /> Delivery Method</span>
                          <span className="ln" />
                        </div>

                        <div className="ck-toggle-pair">
                          <button type="button" className={`ck-toggle-btn ${formData.deliveryMethod === 'home_delivery' ? 'sel' : ''}`} onClick={() => setFormData(p => ({ ...p, deliveryMethod: 'home_delivery' }))}>
                            <div className="ck-toggle-top">
                              <Truck size={18} className="ck-toggle-icon" />
                              <div className="ck-toggle-check"><Check size={12} strokeWidth={3} /></div>
                            </div>
                            <div>
                              <div className="ck-toggle-title">Standard</div>
                              <div className="ck-toggle-sub">3–7 Business Days</div>
                            </div>
                            <div className="ck-toggle-badge">Complimentary</div>
                          </button>
                          <button type="button" className={`ck-toggle-btn ${formData.deliveryMethod === 'express' ? 'sel' : ''}`} onClick={() => setFormData(p => ({ ...p, deliveryMethod: 'express' }))}>
                            <div className="ck-toggle-top">
                              <Truck size={18} className="ck-toggle-icon" />
                              <div className="ck-toggle-check"><Check size={12} strokeWidth={3} /></div>
                            </div>
                            <div>
                              <div className="ck-toggle-title">Express</div>
                              <div className="ck-toggle-sub">1–2 Business Days</div>
                            </div>
                            <div className="ck-toggle-badge"><Price value={15} /></div>
                          </button>
                        </div>

                        <div className="ck-nav-btns">
                          <button className="ck-btn-prev" onClick={() => setStep('contact')}>
                            <ArrowLeft size={14} />
                            <span>Back</span>
                          </button>
                          <button className="ck-btn-next" onClick={() => nextStep('payment')}>
                            <span>Continue to Payment</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* ── III · PAYMENT ── */}
                  <section className={`ck-card ${stateOf(2)}`}>
                    <div className="ck-card-head">
                      <span className="ck-node">{STEPS[2].num}</span>
                      <span className="ck-node-txt">
                        <span className="ck-node-kicker">Step Three</span>
                        <h2 className="ck-node-title">Payment <em>Method</em></h2>
                      </span>
                    </div>

                    {activeStep === 'payment' && (
                      <div className="ck-card-body">
                        <div className="ck-card-rule" />

                        <div className="ck-toggle-pair">
                          <button type="button" className="ck-toggle-btn sel">
                            <div className="ck-toggle-top">
                              <ShieldCheck size={18} className="ck-toggle-icon" />
                              <div className="ck-toggle-check"><Check size={12} strokeWidth={3} /></div>
                            </div>
                            <div>
                              <div className="ck-toggle-title">Secure Online</div>
                              <div className="ck-toggle-sub">Card, UPI, Net Banking</div>
                            </div>
                          </button>
                        </div>

                        <div className="ck-pay-note">
                          <Lock size={16} />
                          <span>
                            You will be securely redirected to our payment partner to complete your investment of <Price value={displayTotal} isAlreadyConverted={currency === 'INR'} />. Your data is fully encrypted.
                          </span>
                        </div>

                        <div className="ck-nav-btns">
                          <button className="ck-btn-prev" onClick={() => setStep('shipping')}>
                            <ArrowLeft size={14} />
                            <span>Back</span>
                          </button>
                          <button
                            className="ck-btn-next"
                            onClick={handleSubmit}
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="animate-spin" size={18} /> :
                              (currency === 'INR' && !razorpayReady && (typeof window !== 'undefined' && !(window as any).Razorpay)) ?
                                <><Loader2 className="animate-spin" size={14} /> Initializing...</> :
                                <><span>Complete Purchase</span><ArrowRight size={14} /></>}
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>

              {/* ══ SUMMARY — cream stationery panel ══ */}
              <aside className="ck-ledger">
                <div className="ck-ledger-card" role="region" aria-label="Order summary">
                  <div className="ck-ledger-in">
                    <div className="ck-ledger-eyebrow">Order Summary</div>
                    <h2 className="ck-ledger-title">Your <em>Selection</em></h2>
                    <p className="ck-ledger-count">{itemCount} {itemCount === 1 ? 'Piece' : 'Pieces'} reserved</p>

                    <div className="ck-ledger-items">
                      {cart.map(item => (
                        <div key={item.id} className="ck-litem">
                          <div className="ck-litem-img">
                            {item.image
                              ? <img src={item.image} alt="" loading="lazy" />
                              : <Gem size={20} strokeWidth={1.2} style={{ color: 'var(--a3)' }} />}
                          </div>
                          <div className="ck-litem-info">
                            <div className="ck-litem-name">{item.productName}</div>
                            <div className="ck-litem-meta">
                              {item.metal && <span>{item.metal}</span>}
                              {item.carat && <span>{item.carat}</span>}
                              {item.size && <span>Size {item.size}</span>}
                              <span>Qty {item.quantity}</span>
                            </div>
                          </div>
                          <div className="ck-litem-price"><Price value={item.price} qty={item.quantity} isAlreadyConverted={false} /></div>
                        </div>
                      ))}
                    </div>

                    <div className="ck-ledger-totals">
                      <div className="ck-leader-row">
                        <span className="ck-leader-label">Subtotal</span>
                        <span className="ck-leader-line" aria-hidden="true" />
                        <span className="ck-leader-value"><Price value={displaySubtotal} isAlreadyConverted={currency === 'INR'} /></span>
                      </div>
                      <div className="ck-leader-row">
                        <span className="ck-leader-label">Tax</span>
                        <span className="ck-leader-line" aria-hidden="true" />
                        <span className="ck-leader-value"><Price value={displayTax} isAlreadyConverted={currency === 'INR'} /></span>
                      </div>
                      <div className="ck-leader-row">
                        <span className="ck-leader-label">Shipping</span>
                        <span className="ck-leader-line" aria-hidden="true" />
                        {displayShipping > 0
                          ? <span className="ck-leader-value"><Price value={displayShipping} isAlreadyConverted={currency === 'INR'} /></span>
                          : <span className="ck-leader-free">Complimentary</span>}
                      </div>
                      <div className="ck-ledger-grand">
                        <span className="ck-grand-lbl">Total</span>
                        <span className="ck-grand-val" aria-live="polite"><Price value={displayTotal} isAlreadyConverted={currency === 'INR'} /></span>
                      </div>
                    </div>

                    <Link href="/cart" className="ck-edit-link">Edit Shopping Bag</Link>
                    <div className="ck-trust-row">
                      <span><Lock size={11} /> Secure Checkout</span>
                      <span><ShieldCheck size={11} /> Buyer Protected</span>
                      <span><RotateCcw size={11} /> 30-Day Returns</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
