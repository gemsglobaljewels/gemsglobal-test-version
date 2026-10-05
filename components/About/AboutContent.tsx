'use client'

/**
 * Public renderer for the admin-managed /about page.
 * Receives the normalized AboutConfig (server-fetched in app/about/page.tsx)
 * and renders the hero plus every visible section in admin-defined order.
 * The design is the original hand-coded About page, unchanged — only the
 * content now comes from the config.
 */

import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { useRef, useState } from 'react'
import type {
  AboutConfig, AboutSection, AboutStepsSection, AboutFeaturesSection,
  AboutStorySection, AboutValuesSection, AboutStatsSection, AboutCtaSection,
  AboutServicesSection, AboutTextImageSection,
} from '@/lib/aboutPage'
import { aboutIcon } from '@/components/About/aboutIcons'

const CSS = `
.abx{
  --w:#FFFFFF; --iv:#FDFCF9; --cr:#F8F4EE; --wa:#EFE9DF; --bd:#ECE5DA; --bd2:#E2D9CB;
  --a:#8C7456; --a2:#A8916F; --a3:#C9B68F; --al:rgba(140,116,86,.10); --am:rgba(140,116,86,.22);
  --ink:#3A2E22; --mu:rgba(58,46,34,.56); --fa:rgba(58,46,34,.40); --li:rgba(58,46,34,.08);
  --serif:var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
  --sans:var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;
  --e:cubic-bezier(.22,1,.36,1);
  --spring:cubic-bezier(.34,1.56,.64,1);
  --grad:linear-gradient(135deg,var(--a),var(--a2));
  --gtxt:linear-gradient(120deg,var(--a3),var(--a) 50%,var(--a2));
  --soft:0 30px 70px -32px rgba(58,46,34,.30);
  --soft2:0 16px 44px -24px rgba(58,46,34,.24);
  background:var(--iv);
  color:var(--ink);
  font-family:var(--sans);
  overflow-x:clip;
  position:relative;
  min-height:100vh;
}
.abx *{ box-sizing:border-box; }
.abx ::selection{ background:var(--am);color:var(--ink); }
.abx a{ text-decoration:none;color:inherit; }
.abx :focus-visible{ outline:2px solid var(--a);outline-offset:3px;border-radius:6px; }
.abx .gemtxt{
  font-style:italic;color:transparent;
  background:var(--gtxt);-webkit-background-clip:text;background-clip:text;
}

/* shared label / eyebrow */
.abx-eyebrow{ display:inline-flex;align-items:center;gap:11px;margin-bottom:18px; }
.abx-eyebrow .ln{ width:34px;height:1px;background:linear-gradient(90deg,var(--a3),transparent); }
.abx-eyebrow .tag{
  font-family:var(--sans);font-size:10px;font-weight:600;
  letter-spacing:.34em;text-transform:uppercase;color:var(--a);
}
.abx-eyebrow.center{ justify-content:center; }
.abx-eyebrow.center .ln{ background:linear-gradient(90deg,transparent,var(--a3),transparent);width:46px; }

.abx-shell{ max-width:1280px;margin:0 auto;padding:0 clamp(20px,4vw,48px); }

/* ════════ HERO — asymmetric editorial split ════════ */
.abx-hero{
  position:relative;
  padding:clamp(120px,15vw,180px) 0 clamp(70px,9vw,120px);
  overflow:hidden;
}
.abx-hero::before{
  content:'';position:absolute;top:-12%;right:-8%;
  width:min(620px,70vw);height:min(620px,70vw);border-radius:50%;
  background:radial-gradient(circle,var(--al),transparent 70%);
  pointer-events:none;z-index:0;
}
.abx-hero-grid{
  position:relative;z-index:1;
  display:grid;grid-template-columns:1.05fr .95fr;
  gap:clamp(40px,6vw,90px);align-items:center;
}
.abx-hero-h{
  font-family:var(--serif);font-weight:300;
  font-size:clamp(46px,7.2vw,96px);line-height:1.02;letter-spacing:-.01em;
  color:var(--ink);margin:0 0 26px;
}
.abx-hero-h .gemtxt{ font-weight:500; }
.abx-hero-p{
  font-size:clamp(15px,1.4vw,18px);font-weight:300;line-height:1.85;
  color:var(--mu);max-width:30em;margin:0 0 36px;
}
.abx-hero-actions{ display:flex;flex-wrap:wrap;gap:14px;align-items:center; }
.abx-meta{
  margin-top:clamp(38px,5vw,56px);display:flex;flex-wrap:wrap;gap:clamp(26px,4vw,52px);
  padding-top:28px;border-top:1px solid var(--bd);
}
.abx-meta-i .n{
  font-family:var(--serif);font-size:clamp(28px,3.4vw,40px);font-weight:400;line-height:1;
  color:transparent;background:var(--gtxt);-webkit-background-clip:text;background-clip:text;
}
.abx-meta-i .l{
  margin-top:7px;font-size:9.5px;font-weight:600;letter-spacing:.22em;
  text-transform:uppercase;color:var(--mu);
}
/* hero visual cluster */
.abx-hero-art{ position:relative; }
.abx-hero-frame{
  position:relative;aspect-ratio:4/5;border-radius:18px;overflow:hidden;
  box-shadow:var(--soft);border:1px solid var(--bd);background:var(--cr);
}
.abx-hero-frame img{ width:100%;height:118%;object-fit:cover;display:block; }
.abx-hero-frame::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(180deg,transparent 55%,rgba(58,46,34,.16));
}
.abx-hero-badge{
  position:absolute;left:-22px;bottom:34px;z-index:2;
  background:var(--w);border:1px solid var(--bd);border-radius:14px;
  padding:16px 20px;box-shadow:var(--soft2);
  display:flex;align-items:center;gap:13px;
}
.abx-hero-badge .mk{
  width:42px;height:42px;border-radius:11px;flex-shrink:0;
  display:grid;place-items:center;color:var(--w);background:var(--grad);
}
.abx-hero-badge .bt{ font-family:var(--serif);font-size:21px;font-weight:500;color:var(--ink);line-height:1; }
.abx-hero-badge .bs{ margin-top:4px;font-size:8.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--a); }
.abx-hero-chip{
  position:absolute;top:26px;right:-18px;z-index:2;
  background:var(--w);border:1px solid var(--bd);border-radius:50px;
  padding:9px 18px 9px 14px;box-shadow:var(--soft2);
  display:flex;align-items:center;gap:9px;
  font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);
}
.abx-hero-chip svg{ color:var(--a); }

/* buttons */
.abx-btn{
  display:inline-flex;align-items:center;gap:9px;
  padding:15px 30px;border-radius:50px;cursor:pointer;
  font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
  transition:transform .3s var(--spring),box-shadow .3s var(--e),filter .25s;
  min-height:48px;
}
.abx-btn-p{ background:var(--grad);color:var(--w);border:1px solid transparent;box-shadow:0 14px 30px -14px rgba(140,116,86,.7); }
.abx-btn-p:hover{ transform:translateY(-2px);filter:brightness(1.05); }
.abx-btn-o{ background:var(--w);color:var(--ink);border:1px solid var(--bd2); }
.abx-btn-o:hover{ transform:translateY(-2px);border-color:var(--a2);color:var(--a); }

/* section heads */
.abx-sec{ padding:clamp(72px,9vw,128px) 0; }
.abx-head{ max-width:720px; }
.abx-head.center{ margin:0 auto;text-align:center; }
.abx-h2{
  font-family:var(--serif);font-weight:300;
  font-size:clamp(32px,4.6vw,58px);line-height:1.1;letter-spacing:-.005em;
  color:var(--ink);margin:0;
}
.abx-h2 .gemtxt{ font-weight:500; }
.abx-lead{
  margin:20px 0 0;font-size:clamp(14px,1.3vw,17px);font-weight:300;line-height:1.8;color:var(--mu);
}

/* ════════ SERVICES strip ════════ */
.abx-serv{
  background:var(--w);border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);
}
.abx-serv-in{ display:grid;grid-template-columns:repeat(var(--serv-n,5),1fr);gap:0; }
.abx-serv-i{
  padding:clamp(32px,4vw,52px) clamp(16px,2vw,28px);
  display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;
  border-right:1px solid var(--bd);transition:background .35s var(--e);
}
.abx-serv-i:last-child{ border-right:none; }
.abx-serv-i:hover{ background:var(--iv); }
.abx-serv-ic{
  width:54px;height:54px;border-radius:14px;display:grid;place-items:center;
  color:var(--a);background:var(--al);border:1px solid var(--am);
  transition:transform .4s var(--spring),color .3s,background .3s;
}
.abx-serv-i:hover .abx-serv-ic{ transform:translateY(-3px);background:var(--grad);color:var(--w);border-color:transparent; }
.abx-serv-t{ font-family:var(--serif);font-size:20px;font-weight:500;color:var(--ink);line-height:1.15; }
.abx-serv-s{ font-size:9px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--mu); }

/* ════════ STEPS — interactive numbered timeline ════════ */
.abx-craft{ background:var(--cr); }
.abx-craft-head{ display:flex;justify-content:space-between;align-items:flex-end;gap:30px;flex-wrap:wrap;margin-bottom:clamp(40px,5vw,64px); }
.abx-craft-count{
  font-family:var(--serif);font-size:clamp(54px,7vw,92px);font-weight:300;line-height:.85;
  color:transparent;background:var(--gtxt);-webkit-background-clip:text;background-clip:text;
}
.abx-craft-count small{ font-size:.34em;letter-spacing:.04em;color:var(--mu);-webkit-text-fill-color:var(--mu); }
.abx-craft-body{ display:grid;grid-template-columns:1fr 1.18fr;gap:clamp(36px,4.5vw,72px);align-items:start; }

/* timeline rail (left) */
.abx-rail{ position:relative;padding-left:34px; }
.abx-rail::before{
  content:'';position:absolute;left:11px;top:8px;bottom:8px;width:1px;background:var(--bd2);
}
.abx-node{
  position:relative;width:100%;text-align:left;background:none;border:none;cursor:pointer;
  padding:15px 0;display:flex;align-items:center;gap:18px;
  transition:transform .35s var(--e);
}
.abx-node::before{
  content:'';position:absolute;left:-29px;top:50%;transform:translateY(-50%);
  width:11px;height:11px;border-radius:50%;background:var(--w);border:1.5px solid var(--bd2);
  transition:all .35s var(--spring);
}
.abx-node-n{
  font-family:var(--serif);font-size:15px;font-weight:500;color:var(--fa);width:26px;flex-shrink:0;
  transition:color .3s;
}
.abx-node-t{
  font-family:var(--serif);font-size:clamp(19px,2vw,25px);font-weight:400;color:var(--mu);line-height:1.15;
  transition:color .3s,transform .35s var(--e);
}
.abx-node:hover .abx-node-t{ color:var(--ink); }
.abx-node.on::before{ background:var(--grad);border-color:transparent;box-shadow:0 0 0 5px var(--al); }
.abx-node.on .abx-node-n{ color:var(--a); }
.abx-node.on .abx-node-t{ color:var(--ink);transform:translateX(4px); }

/* detail card (right) */
.abx-card{
  position:sticky;top:96px;
  background:var(--w);border:1px solid var(--bd);border-radius:20px;
  padding:clamp(34px,4vw,56px);box-shadow:var(--soft);overflow:hidden;
}
.abx-card::before{
  content:'';position:absolute;top:-90px;right:-90px;width:280px;height:280px;border-radius:50%;
  background:radial-gradient(circle,var(--al),transparent 70%);pointer-events:none;
}
.abx-card-ic{
  width:74px;height:74px;border-radius:18px;display:grid;place-items:center;
  color:var(--w);background:var(--grad);margin-bottom:30px;
  box-shadow:0 16px 34px -16px rgba(140,116,86,.8);
}
.abx-card-n{
  font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;
  color:var(--a);margin-bottom:14px;
}
.abx-card-h{
  font-family:var(--serif);font-size:clamp(28px,3.4vw,42px);font-weight:400;line-height:1.1;
  color:var(--ink);margin:0 0 18px;
}
.abx-card-p{ font-size:clamp(14px,1.3vw,17px);font-weight:300;line-height:1.8;color:var(--mu);margin:0 0 26px; }
.abx-card-d{
  display:inline-flex;align-items:center;
  padding:11px 20px;border-radius:10px;background:var(--cr);border-left:2px solid var(--a);
  font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--a);line-height:1.6;
}

/* ════════ FEATURES — feature band ════════ */
.abx-lab{ background:var(--w);border-top:1px solid var(--bd);border-bottom:1px solid var(--bd); }
.abx-lab-grid{ display:grid;grid-template-columns:.92fr 1.08fr;gap:clamp(40px,5vw,80px);align-items:center; }
.abx-lab-points{ display:grid;grid-template-columns:1fr 1fr;gap:clamp(16px,1.8vw,24px); }
.abx-lab-p{
  background:var(--iv);border:1px solid var(--bd);border-radius:16px;
  padding:clamp(22px,2.4vw,30px);transition:transform .4s var(--e),box-shadow .4s var(--e),border-color .3s;
}
.abx-lab-p:hover{ transform:translateY(-5px);box-shadow:var(--soft2);border-color:var(--bd2); }
.abx-lab-p-ic{
  width:46px;height:46px;border-radius:12px;display:grid;place-items:center;
  color:var(--a);background:var(--al);border:1px solid var(--am);margin-bottom:18px;
}
.abx-lab-p-t{ font-family:var(--serif);font-size:23px;font-weight:500;color:var(--ink);margin-bottom:9px;line-height:1.1; }
.abx-lab-p-d{ font-size:13.5px;font-weight:300;line-height:1.65;color:var(--mu); }

/* ════════ STORY — alternating image / text rows ════════ */
.abx-story{ background:var(--cr); }
.abx-row{
  display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,5vw,84px);align-items:center;
}
.abx-row + .abx-row{ margin-top:clamp(56px,7vw,104px); }
.abx-row.flip .abx-row-media{ order:2; }
.abx-row-media{ position:relative; }
.abx-row-frame{
  position:relative;aspect-ratio:5/4;border-radius:20px;overflow:hidden;
  border:1px solid var(--bd);box-shadow:var(--soft);background:var(--wa);
}
.abx-row-frame img{ width:100%;height:100%;object-fit:cover;display:block;transition:transform 1.1s var(--e); }
.abx-row-media:hover .abx-row-frame img{ transform:scale(1.05); }
.abx-row-tag{
  position:absolute;bottom:18px;left:18px;z-index:2;
  background:var(--w);border:1px solid var(--bd);border-radius:12px;padding:12px 18px;box-shadow:var(--soft2);
}
.abx-row-tag .t{ font-family:var(--serif);font-size:18px;font-weight:500;color:var(--ink);line-height:1; }
.abx-row-tag .s{ margin-top:5px;font-size:8.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--a); }
.abx-story-p{ font-size:clamp(14px,1.3vw,17px);font-weight:300;line-height:1.85;color:var(--mu);margin:0 0 18px; }
.abx-story-p:last-child{ margin-bottom:0; }
.abx-quote{
  margin-top:30px;padding-left:22px;border-left:2px solid var(--a3);
  font-family:var(--serif);font-style:italic;font-size:clamp(18px,2vw,24px);font-weight:400;
  line-height:1.4;color:var(--ink);
}

/* ════════ VALUES ════════ */
.abx-vals{ display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,2.4vw,32px);margin-top:clamp(44px,5vw,64px); }
.abx-val{
  position:relative;background:var(--w);border:1px solid var(--bd);border-radius:20px;
  padding:clamp(34px,3.5vw,48px) clamp(28px,3vw,40px);overflow:hidden;
  transition:transform .45s var(--e),box-shadow .45s var(--e),border-color .3s;
}
.abx-val::after{
  content:'';position:absolute;left:0;top:0;width:100%;height:3px;
  background:var(--grad);transform:scaleX(0);transform-origin:left;transition:transform .5s var(--e);
}
.abx-val:hover{ transform:translateY(-8px);box-shadow:var(--soft);border-color:var(--bd2); }
.abx-val:hover::after{ transform:scaleX(1); }
.abx-val-ic{
  width:60px;height:60px;border-radius:16px;display:grid;place-items:center;
  color:var(--a);background:var(--al);border:1px solid var(--am);margin-bottom:26px;
  transition:transform .5s var(--spring),background .4s,color .4s;
}
.abx-val:hover .abx-val-ic{ background:var(--grad);color:var(--w);border-color:transparent;transform:rotate(-6deg) scale(1.04); }
.abx-val-n{
  font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.2em;color:var(--a3);margin-bottom:14px;
}
.abx-val-t{ font-family:var(--serif);font-size:clamp(23px,2.4vw,29px);font-weight:500;color:var(--ink);margin-bottom:14px;line-height:1.1; }
.abx-val-d{ font-size:14px;font-weight:300;line-height:1.7;color:var(--mu); }

/* ════════ STATS — quiet band ════════ */
.abx-stats{ background:var(--ink); }
.abx-stats-in{ display:grid;grid-template-columns:repeat(var(--stats-n,4),1fr);gap:0; }
.abx-stat{
  padding:clamp(48px,6vw,80px) clamp(18px,2vw,30px);text-align:center;
  border-right:1px solid rgba(255,255,255,.08);
}
.abx-stat:last-child{ border-right:none; }
.abx-stat-n{
  font-family:var(--serif);font-size:clamp(40px,5vw,66px);font-weight:300;line-height:1;
  color:transparent;background:linear-gradient(120deg,var(--a3),#E8DCC4 50%,var(--a3));
  -webkit-background-clip:text;background-clip:text;
}
.abx-stat-l{
  margin-top:14px;font-size:10px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;
  color:rgba(253,252,249,.55);
}

/* ════════ CTA ════════ */
.abx-cta-wrap{ padding:clamp(72px,9vw,120px) 0; }
.abx-cta{
  position:relative;border-radius:26px;overflow:hidden;
  background:var(--w);border:1px solid var(--bd);box-shadow:var(--soft);
  padding:clamp(48px,7vw,96px) clamp(28px,5vw,72px);text-align:center;
}
.abx-cta::before{
  content:'';position:absolute;top:-30%;left:50%;transform:translateX(-50%);
  width:min(720px,90%);height:60%;
  background:radial-gradient(ellipse at center,var(--al),transparent 70%);pointer-events:none;
}
.abx-cta-mk{
  position:relative;width:64px;height:64px;border-radius:18px;margin:0 auto 26px;
  display:grid;place-items:center;color:var(--w);background:var(--grad);
  box-shadow:0 18px 36px -16px rgba(140,116,86,.8);
}
.abx-cta-h{
  position:relative;font-family:var(--serif);font-weight:300;
  font-size:clamp(32px,4.4vw,56px);line-height:1.08;color:var(--ink);margin:0 0 18px;
}
.abx-cta-h .gemtxt{ font-weight:500; }
.abx-cta-p{
  position:relative;max-width:34em;margin:0 auto 38px;
  font-size:clamp(14px,1.3vw,17px);font-weight:300;line-height:1.8;color:var(--mu);
}
.abx-cta-actions{ position:relative;display:flex;flex-wrap:wrap;gap:16px;justify-content:center; }

/* ════════ TEXT+IMAGE free-form block ════════ */
.abx-ti{ background:var(--w);border-top:1px solid var(--bd); }
.abx-ti .abx-row{ margin-top:clamp(38px,4vw,54px); }
.abx-ti .abx-row:first-child{ margin-top:0; }

/* ════════ RESPONSIVE ════════ */
@media(max-width:1023px){
  .abx{ padding-bottom:108px; } /* clear floating bottom pill-nav */
}
@media(max-width:980px){
  .abx-hero-grid{ grid-template-columns:1fr;gap:54px; }
  .abx-hero-art{ max-width:480px;margin:0 auto;width:100%; }
  .abx-craft-body{ grid-template-columns:1fr;gap:44px; }
  .abx-card{ position:static; }
  .abx-lab-grid{ grid-template-columns:1fr;gap:44px; }
  .abx-serv-in{ grid-template-columns:repeat(3,1fr); }
  .abx-serv-i:nth-child(3n){ border-right:none; }
  .abx-serv-i:nth-child(n+4){ border-top:1px solid var(--bd); }
}
@media(max-width:760px){
  .abx-row{ grid-template-columns:1fr;gap:34px; }
  .abx-row.flip .abx-row-media{ order:0; }
  .abx-vals{ grid-template-columns:1fr; }
  .abx-stats-in{ grid-template-columns:1fr 1fr; }
  .abx-stat:nth-child(2n){ border-right:none; }
  .abx-stat:nth-child(n+3){ border-top:1px solid rgba(255,255,255,.08); }
}
@media(max-width:560px){
  .abx-serv-in{ grid-template-columns:1fr 1fr; }
  .abx-serv-i{ border-right:1px solid var(--bd); }
  .abx-serv-i:nth-child(2n){ border-right:none; }
  .abx-serv-i:nth-child(n+3){ border-top:1px solid var(--bd); }
  .abx-serv-i:last-child:nth-child(odd){ grid-column:1 / -1; }
  .abx-lab-points{ grid-template-columns:1fr; }
  .abx-hero-badge{ left:0;padding:13px 16px; }
  .abx-hero-chip{ right:0; }
  .abx-meta{ gap:22px; }
}
@media(prefers-reduced-motion:reduce){
  .abx *{ transition-duration:.01ms!important;animation-duration:.01ms!important; }
}
`

const pad2 = (n: number) => String(n).padStart(2, '0')
const paras = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

/* Renders "Title <accent>" with the accent in the gradient-italic style. */
function AccentTitle({ title, accent, className }: { title: string; accent: string; className: string }) {
  return (
    <h2 className={className}>
      {title}{title && accent ? ' ' : ''}
      {accent && <span className="gemtxt">{accent}</span>}
    </h2>
  )
}

function useFadeUp() {
  const reduce = useReducedMotion()
  return reduce
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' as const },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
      }
}

/* ── HERO ── */
function Hero({ hero }: { hero: AboutConfig['hero'] }) {
  const heroRef = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '16%'])
  const ChipIcon = aboutIcon(hero.chip_icon)
  const BadgeIcon = aboutIcon(hero.badge_icon)

  return (
    <section className="abx-hero" ref={heroRef}>
      <div className="abx-shell abx-hero-grid">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 30 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {hero.eyebrow && (
            <div className="abx-eyebrow">
              <span className="ln" />
              <span className="tag">{hero.eyebrow}</span>
            </div>
          )}
          <h1 className="abx-hero-h">
            {hero.title}
            {hero.accent && <><br /><span className="gemtxt">{hero.accent}</span></>}
          </h1>
          {hero.paragraph && <p className="abx-hero-p">{hero.paragraph}</p>}
          <div className="abx-hero-actions">
            {hero.primary_cta_text && (
              <Link href={hero.primary_cta_link || '/'} className="abx-btn abx-btn-p">
                {hero.primary_cta_text} <ArrowUpRight size={15} strokeWidth={2.2} />
              </Link>
            )}
            {hero.secondary_cta_text && (
              <Link href={hero.secondary_cta_link || '/'} className="abx-btn abx-btn-o">
                {hero.secondary_cta_text}
              </Link>
            )}
          </div>

          {hero.meta.length > 0 && (
            <div className="abx-meta">
              {hero.meta.map((m, i) => (
                <div className="abx-meta-i" key={i}>
                  <div className="n">{m.num}</div>
                  <div className="l">{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          className="abx-hero-art"
          initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <div className="abx-hero-frame">
            <motion.img src={hero.image} alt="About us" style={{ y: imgY }} />
          </div>
          {hero.chip_text && (
            <div className="abx-hero-chip">
              <ChipIcon size={14} strokeWidth={1.8} /> {hero.chip_text}
            </div>
          )}
          {hero.badge_title && (
            <div className="abx-hero-badge">
              <span className="mk"><BadgeIcon size={20} strokeWidth={1.6} /></span>
              <span>
                <span className="bt">{hero.badge_title}</span>
                <span className="bs">{hero.badge_subtitle}</span>
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

/* ── SERVICES strip ── */
function Services({ s }: { s: AboutServicesSection }) {
  const reduce = useReducedMotion()
  return (
    <section className="abx-serv">
      <div className="abx-serv-in" style={{ ['--serv-n' as any]: s.items.length || 1 }}>
        {s.items.map((it, i) => {
          const Icon = aboutIcon(it.icon)
          return (
            <motion.div
              key={i}
              className="abx-serv-i"
              initial={reduce ? undefined : { opacity: 0, y: 22 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
            >
              <span className="abx-serv-ic"><Icon size={24} strokeWidth={1.4} /></span>
              <div>
                <div className="abx-serv-t">{it.title}</div>
                <div className="abx-serv-s">{it.sub}</div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

/* ── STEPS timeline ── */
function Steps({ s }: { s: AboutStepsSection }) {
  const [active, setActive] = useState(0)
  const reduce = useReducedMotion()
  const fadeUp = useFadeUp()
  const idx = Math.min(active, Math.max(0, s.steps.length - 1))
  const step = s.steps[idx]
  if (!step) return null
  const ActiveIcon = aboutIcon(step.icon)

  return (
    <section className="abx-craft abx-sec">
      <div className="abx-shell">
        <div className="abx-craft-head">
          <motion.div className="abx-head" {...fadeUp}>
            {s.eyebrow && (
              <div className="abx-eyebrow"><span className="ln" /><span className="tag">{s.eyebrow}</span></div>
            )}
            <AccentTitle title={s.title} accent={s.accent} className="abx-h2" />
            {s.lead && <p className="abx-lead">{s.lead}</p>}
          </motion.div>
          <div className="abx-craft-count" aria-hidden="true">
            {pad2(idx + 1)}<small>&nbsp;/ {pad2(s.steps.length)}</small>
          </div>
        </div>

        <div className="abx-craft-body">
          <div className="abx-rail" role="tablist" aria-label={s.title || 'Steps'}>
            {s.steps.map((st, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={idx === i}
                className={`abx-node ${idx === i ? 'on' : ''}`}
                onClick={() => setActive(i)}
              >
                <span className="abx-node-n">{pad2(i + 1)}</span>
                <span className="abx-node-t">{st.title}</span>
              </button>
            ))}
          </div>

          <motion.div
            key={idx}
            className="abx-card"
            initial={reduce ? undefined : { opacity: 0, y: 18 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="abx-card-ic"><ActiveIcon size={30} strokeWidth={1.4} /></div>
            <div className="abx-card-n">Step {pad2(idx + 1)} of {pad2(s.steps.length)}</div>
            <h3 className="abx-card-h">{step.title}</h3>
            <p className="abx-card-p">{step.desc}</p>
            {step.details && <div className="abx-card-d">{step.details}</div>}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ── FEATURES grid ── */
function Features({ s }: { s: AboutFeaturesSection }) {
  const reduce = useReducedMotion()
  const fadeUp = useFadeUp()
  return (
    <section className="abx-lab abx-sec">
      <div className="abx-shell abx-lab-grid">
        <motion.div {...fadeUp}>
          {s.eyebrow && (
            <div className="abx-eyebrow"><span className="ln" /><span className="tag">{s.eyebrow}</span></div>
          )}
          <AccentTitle title={s.title} accent={s.accent} className="abx-h2" />
          {s.lead && <p className="abx-lead">{s.lead}</p>}
        </motion.div>
        <div className="abx-lab-points">
          {s.points.map((p, i) => {
            const Icon = aboutIcon(p.icon)
            return (
              <motion.div
                key={i}
                className="abx-lab-p"
                initial={reduce ? undefined : { opacity: 0, y: 24 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.1, duration: 0.55 }}
              >
                <span className="abx-lab-p-ic"><Icon size={20} strokeWidth={1.5} /></span>
                <div className="abx-lab-p-t">{p.title}</div>
                <div className="abx-lab-p-d">{p.desc}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── STORY rows ── */
function Story({ s }: { s: AboutStorySection }) {
  const fadeUp = useFadeUp()
  return (
    <section className="abx-story abx-sec">
      <div className="abx-shell">
        <motion.div className="abx-head" {...fadeUp}>
          {s.eyebrow && (
            <div className="abx-eyebrow"><span className="ln" /><span className="tag">{s.eyebrow}</span></div>
          )}
          <AccentTitle title={s.title} accent={s.accent} className="abx-h2" />
        </motion.div>

        <div style={{ marginTop: 'clamp(44px,5vw,64px)' }}>
          {s.rows.map((row, i) => (
            <motion.div className={`abx-row${row.flip ? ' flip' : ''}`} key={i} {...fadeUp}>
              <div className="abx-row-media">
                <div className="abx-row-frame">
                  <img src={row.image} alt={row.tag_title || 'Our story'} />
                </div>
                {row.tag_title && (
                  <div className="abx-row-tag">
                    <div className="t">{row.tag_title}</div>
                    <div className="s">{row.tag_sub}</div>
                  </div>
                )}
              </div>
              <div>
                {paras(row.body).map((p, x) => (
                  <p className="abx-story-p" key={x}>{p}</p>
                ))}
                {row.quote && <div className="abx-quote">"{row.quote}"</div>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── VALUES cards ── */
function Values({ s }: { s: AboutValuesSection }) {
  const reduce = useReducedMotion()
  const fadeUp = useFadeUp()
  return (
    <section className="abx-sec" style={{ background: 'var(--w)', borderTop: '1px solid var(--bd)' }}>
      <div className="abx-shell">
        <motion.div className="abx-head center" {...fadeUp}>
          {s.eyebrow && (
            <div className="abx-eyebrow center"><span className="ln" /><span className="tag">{s.eyebrow}</span></div>
          )}
          <AccentTitle title={s.title} accent={s.accent} className="abx-h2" />
          {s.lead && <p className="abx-lead">{s.lead}</p>}
        </motion.div>

        <div className="abx-vals">
          {s.values.map((v, i) => {
            const Icon = aboutIcon(v.icon)
            return (
              <motion.div
                key={i}
                className="abx-val"
                initial={reduce ? undefined : { opacity: 0, y: 30 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
              >
                <div className="abx-val-ic"><Icon size={26} strokeWidth={1.4} /></div>
                <div className="abx-val-n">{pad2(i + 1)}</div>
                <h3 className="abx-val-t">{v.title}</h3>
                <p className="abx-val-d">{v.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── STATS band ── */
function Stats({ s }: { s: AboutStatsSection }) {
  const reduce = useReducedMotion()
  return (
    <section className="abx-stats">
      <div className="abx-stats-in" style={{ ['--stats-n' as any]: s.stats.length || 1 }}>
        {s.stats.map((st, i) => (
          <motion.div
            key={i}
            className="abx-stat"
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          >
            <div className="abx-stat-n">{st.num}</div>
            <div className="abx-stat-l">{st.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ── CTA banner ── */
function Cta({ s }: { s: AboutCtaSection }) {
  const fadeUp = useFadeUp()
  const Icon = aboutIcon(s.icon)
  return (
    <section className="abx-cta-wrap">
      <div className="abx-shell">
        <motion.div className="abx-cta" {...fadeUp}>
          <div className="abx-cta-mk"><Icon size={28} strokeWidth={1.5} /></div>
          <AccentTitle title={s.title} accent={s.accent} className="abx-cta-h" />
          {s.paragraph && <p className="abx-cta-p">{s.paragraph}</p>}
          <div className="abx-cta-actions">
            {s.primary_cta_text && (
              <Link href={s.primary_cta_link || '/'} className="abx-btn abx-btn-p">
                {s.primary_cta_text} <ArrowRight size={15} strokeWidth={2.2} />
              </Link>
            )}
            {s.secondary_cta_text && (
              <Link href={s.secondary_cta_link || '/'} className="abx-btn abx-btn-o">
                {s.secondary_cta_text}
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Free-form TEXT+IMAGE block ── */
function TextImage({ s }: { s: AboutTextImageSection }) {
  const fadeUp = useFadeUp()
  return (
    <section className="abx-ti abx-sec">
      <div className="abx-shell">
        {(s.eyebrow || s.title || s.accent) && (
          <motion.div className="abx-head" style={{ marginBottom: 'clamp(38px,4vw,54px)' }} {...fadeUp}>
            {s.eyebrow && (
              <div className="abx-eyebrow"><span className="ln" /><span className="tag">{s.eyebrow}</span></div>
            )}
            <AccentTitle title={s.title} accent={s.accent} className="abx-h2" />
          </motion.div>
        )}
        <motion.div className={`abx-row${s.image_side === 'right' ? ' flip' : ''}`} {...fadeUp}>
          <div className="abx-row-media">
            <div className="abx-row-frame">
              <img src={s.image} alt={s.title || 'About us'} />
            </div>
          </div>
          <div>
            {paras(s.body).map((p, x) => (
              <p className="abx-story-p" key={x}>{p}</p>
            ))}
            {s.cta_text && (
              <div style={{ marginTop: 28 }}>
                <Link href={s.cta_link || '/'} className="abx-btn abx-btn-p">
                  {s.cta_text} <ArrowRight size={15} strokeWidth={2.2} />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function SectionRenderer({ section }: { section: AboutSection }) {
  switch (section.type) {
    case 'services': return <Services s={section} />
    case 'steps': return <Steps s={section} />
    case 'features': return <Features s={section} />
    case 'story': return <Story s={section} />
    case 'values': return <Values s={section} />
    case 'stats': return <Stats s={section} />
    case 'cta': return <Cta s={section} />
    case 'text_image': return <TextImage s={section} />
    default: return null
  }
}

export default function AboutContent({ config }: { config: AboutConfig }) {
  return (
    <div className="abx">
      <style>{CSS}</style>
      <HeaderMegaMenu />
      <main>
        {config.hero.is_visible && <Hero hero={config.hero} />}
        {config.sections.filter((s) => s.is_visible).map((s) => (
          <SectionRenderer key={s.id} section={s} />
        ))}
      </main>
      <Footer />
    </div>
  )
}
