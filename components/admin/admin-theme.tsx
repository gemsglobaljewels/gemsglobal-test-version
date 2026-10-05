"use client";

/* ════════════════════════════════════════════════════════════════════
   ADMIN DESIGN SYSTEM  —  "Refined Atelier"
   --------------------------------------------------------------------
   A single, admin-only stylesheet injected by the admin shell.
   globals.css is NEVER touched — this only remaps/extends tokens and
   adds reusable component classes *inside* `.admin-scope`.

   • White surfaces, warm off-white only for hovers / headers / inputs
   • Serif (var(--font-main)) for titles, clean sans (var(--font-dmsans))
     for all data / forms / labels
   • Brand accent (taupe #8F7A70) + refined non-neon status colours
   • Reusable classes are prefixed `a-` and consumed by the primitives
     in components/admin/ui/*

   NOTE: every legacy token name used by not-yet-migrated pages is kept,
   so pages keep rendering correctly mid-migration.
   ════════════════════════════════════════════════════════════════════ */

export const ADMIN_CSS = `
.admin-scope{
  /* ── surfaces ── */
  --c-bg:#FFFFFF;
  --c-bg-rgb:255,255,255;
  --c-surface:#FAF8F5;          /* whisper warm off-white (headers, hover, inputs) */
  --c-surface-2:#F4F1EC;        /* slightly deeper panel */
  --c-border:#ECE8E1;           /* soft warm hairline */
  --c-border-strong:#E0DACF;

  /* ── brand (kept from theme) ── */
  --c-accent:#8F7A70;
  --c-accent-rgb:143,122,112;
  --c-accent-soft:rgba(143,122,112,.10);
  --c-text:#2C231E;
  --c-text-rgb:44,35,30;
  --c-text-muted:#9A8C82;       /* readable desaturated taupe for secondary text */
  --c-text-faint:#BCB2A9;
  --c-off:#C5C6C7;

  /* ── premium soft shadows ── */
  --shadow-sm:0 1px 2px rgba(44,35,30,.04), 0 1px 3px rgba(44,35,30,.05);
  --shadow-md:0 4px 14px -3px rgba(44,35,30,.07), 0 2px 6px -2px rgba(44,35,30,.05);
  --shadow-lg:0 18px 40px -12px rgba(44,35,30,.12), 0 6px 16px -6px rgba(44,35,30,.07);
  --radius:10px;
  --radius-lg:14px;
  --radius-sm:8px;

  /* ── refined status colours (non-neon) ── */
  --c-success:#2E9E6B; --c-success-bg:#EEF8F2;
  --c-warning:#C0892F; --c-warning-bg:#FBF4E7;
  --c-danger:#C0453B;  --c-danger-bg:#FBEDEC;
  --c-info:#3B7FC4;    --c-info-bg:#EEF4FB;

  /* ── design-system fonts ── */
  --a-serif:var(--font-main);
  --a-sans:var(--font-dmsans), ui-sans-serif, system-ui, sans-serif;

  background:var(--c-bg);
  color:var(--c-text);
  font-family:var(--a-sans);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

/* premium scrollbar */
.admin-scope ::-webkit-scrollbar{ width:10px; height:10px; }
.admin-scope ::-webkit-scrollbar-thumb{
  background:#E3DDD3; border-radius:999px;
  border:2px solid transparent; background-clip:padding-box;
}
.admin-scope ::-webkit-scrollbar-thumb:hover{ background:#D4CBBC; }
.admin-scope ::-webkit-scrollbar-track{ background:transparent; }

/* refined selection + focus */
.admin-scope ::selection{ background:rgba(143,122,112,.18); color:var(--c-text); }
.admin-scope :focus-visible{ outline:2px solid var(--c-accent); outline-offset:2px; border-radius:6px; }

/* gentle page entrance */
@keyframes adminScopeIn{ from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:none; } }
.admin-scope > main{ animation:adminScopeIn .45s cubic-bezier(.22,1,.36,1) both; }

/* premium loader (boot) */
.admin-boot{ display:flex; align-items:center; gap:12px; }
.admin-boot-dot{ width:9px; height:9px; border-radius:50%; background:var(--c-accent); opacity:.85; animation:adminBoot 1.1s ease-in-out infinite; }
.admin-boot-dot:nth-child(2){ animation-delay:.16s; }
.admin-boot-dot:nth-child(3){ animation-delay:.32s; }
@keyframes adminBoot{ 0%,80%,100%{ transform:scale(.7); opacity:.35; } 40%{ transform:scale(1); opacity:1; } }


/* ══════════════════════════════════════════════════════════════════
   PAGE SHELL
   ══════════════════════════════════════════════════════════════════ */
.a-page{
  min-height:100vh;
  background:var(--c-bg);
  color:var(--c-text);
  font-family:var(--a-sans);
  padding:clamp(22px,3vw,40px) clamp(20px,3vw,40px) 88px;
}
.a-container{ max-width:1320px; margin:0 auto; }

/* ── page header ── */
.a-head{
  display:flex; align-items:flex-end; justify-content:space-between;
  gap:20px; flex-wrap:wrap;
  margin-bottom:26px; padding-bottom:20px;
  border-bottom:1px solid var(--c-border);
}
.a-eyebrow{
  display:inline-flex; align-items:center; gap:9px;
  font-family:var(--a-sans);
  font-size:10px; font-weight:600; letter-spacing:.2em; text-transform:uppercase;
  color:var(--c-text-muted); margin-bottom:11px;
}
.a-eyebrow::before{ content:""; width:18px; height:1px; background:var(--c-border-strong); }
.a-title{
  font-family:var(--a-serif);
  font-weight:300; font-size:clamp(26px,3.4vw,34px); line-height:1.08;
  letter-spacing:.01em; color:var(--c-text); margin:0;
}
.a-title em{ font-style:italic; color:var(--c-accent); padding-right:.06em; }
.a-subtitle{
  font-family:var(--a-sans);
  font-size:13px; font-weight:400; letter-spacing:.01em;
  color:var(--c-text-muted); margin:7px 0 0;
}
.a-head-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; flex-shrink:0; }

/* back link (edit / detail pages) */
.a-back{
  display:inline-flex; align-items:center; gap:7px;
  font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
  color:var(--c-text-muted); text-decoration:none; margin-bottom:14px;
  transition:color .18s ease, gap .18s ease;
}
.a-back:hover{ color:var(--c-accent); gap:10px; }


/* ══════════════════════════════════════════════════════════════════
   BUTTONS
   ══════════════════════════════════════════════════════════════════ */
.a-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  height:42px; padding:0 20px;
  font-family:var(--a-sans);
  font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
  border:1px solid transparent; border-radius:var(--radius); cursor:pointer;
  text-decoration:none; white-space:nowrap; user-select:none;
  transition:background .2s cubic-bezier(.4,0,.2,1), color .2s, border-color .2s,
             box-shadow .2s, transform .2s cubic-bezier(.34,1.56,.64,1);
}
.a-btn:disabled, .a-btn[aria-disabled="true"]{ opacity:.5; pointer-events:none; }
.a-btn svg{ flex-shrink:0; }

.a-btn--primary{ background:var(--c-accent); color:#fff; border-color:var(--c-accent); }
.a-btn--primary:hover{ background:var(--c-text); border-color:var(--c-text); box-shadow:var(--shadow-md); transform:translateY(-1px); }

.a-btn--ghost{ background:#fff; color:var(--c-text); border-color:var(--c-border); }
.a-btn--ghost:hover{ border-color:var(--c-accent); color:var(--c-accent); background:var(--c-surface); }

.a-btn--subtle{ background:var(--c-surface); color:var(--c-text); border-color:transparent; }
.a-btn--subtle:hover{ background:var(--c-surface-2); }

.a-btn--danger{ background:#fff; color:var(--c-danger); border-color:color-mix(in srgb,var(--c-danger) 30%,transparent); }
.a-btn--danger:hover{ background:var(--c-danger-bg); border-color:var(--c-danger); }

.a-btn--solid-danger{ background:var(--c-danger); color:#fff; border-color:var(--c-danger); }
.a-btn--solid-danger:hover{ filter:brightness(.94); box-shadow:var(--shadow-md); transform:translateY(-1px); }

.a-btn--sm{ height:36px; padding:0 14px; font-size:10px; }
.a-btn--lg{ height:48px; padding:0 26px; font-size:12px; letter-spacing:.14em; }
.a-btn--block{ width:100%; }

/* icon-only button */
.a-icon-btn{
  display:inline-flex; align-items:center; justify-content:center;
  width:36px; height:36px; flex-shrink:0;
  background:#fff; border:1px solid var(--c-border); border-radius:var(--radius);
  color:var(--c-text-muted); cursor:pointer;
  transition:background .18s, border-color .18s, color .18s, transform .18s;
}
.a-icon-btn:hover{ border-color:var(--c-accent); color:var(--c-accent); background:var(--c-surface); }
.a-icon-btn--danger:hover{ border-color:var(--c-danger); color:var(--c-danger); background:var(--c-danger-bg); }
.a-icon-btn:disabled{ opacity:.5; pointer-events:none; }
.a-icon-btn--sm{ width:30px; height:30px; border-radius:var(--radius-sm); }


/* ══════════════════════════════════════════════════════════════════
   CARDS
   ══════════════════════════════════════════════════════════════════ */
.a-card{
  background:#fff;
  border:1px solid var(--c-border);
  border-radius:var(--radius-lg);
  box-shadow:var(--shadow-sm);
  overflow:hidden;
}
.a-card--flush{ overflow:visible; }
.a-card-head{
  display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:18px 22px; border-bottom:1px solid var(--c-border);
}
.a-card-title{
  font-family:var(--a-serif);
  font-size:18px; font-weight:300; letter-spacing:.02em; color:var(--c-text); margin:0;
}
.a-card-title em{ font-style:italic; color:var(--c-accent); padding-right:.06em; }
.a-card-sub{ font-family:var(--a-sans); font-size:12px; color:var(--c-text-muted); margin:3px 0 0; }
.a-card-body{ padding:22px; }
.a-card-body--flush{ padding:0; }
.a-card-foot{
  display:flex; align-items:center; justify-content:flex-end; gap:10px;
  padding:16px 22px; border-top:1px solid var(--c-border); background:var(--c-surface);
}

/* section title inside a card / form */
.a-section-title{
  display:flex; align-items:center; gap:10px;
  font-family:var(--a-sans);
  font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  color:var(--c-text-muted); margin:0 0 16px;
}
.a-section-title::after{ content:""; flex:1; height:1px; background:var(--c-border); }
.a-divider{ height:1px; background:var(--c-border); border:0; margin:22px 0; }


/* ══════════════════════════════════════════════════════════════════
   STAT CARDS
   ══════════════════════════════════════════════════════════════════ */
.a-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
@media (max-width:1200px){ .a-stats{ grid-template-columns:repeat(3,1fr); } }
@media (max-width:860px){ .a-stats{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:480px){ .a-stats{ grid-template-columns:1fr; } }

.a-stat{
  background:#fff; border:1px solid var(--c-border); border-radius:var(--radius-lg);
  box-shadow:var(--shadow-sm); padding:20px 22px;
  display:flex; flex-direction:column; gap:0; position:relative; overflow:hidden;
  transition:border-color .2s, box-shadow .2s, transform .2s;
}
.a-stat:hover{ border-color:var(--c-border-strong); box-shadow:var(--shadow-md); transform:translateY(-2px); }
.a-stat-top{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:14px; }
.a-stat-ico{
  width:38px; height:38px; flex-shrink:0;
  border:1px solid var(--c-border); border-radius:10px; background:var(--c-surface);
  display:flex; align-items:center; justify-content:center; color:var(--c-accent);
}
.a-stat-trend{ display:inline-flex; align-items:center; gap:3px; font-size:11px; font-weight:600; color:var(--c-success); }
.a-stat-trend--down{ color:var(--c-danger); }
.a-stat-label{ font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--c-text-muted); margin-bottom:7px; }
.a-stat-val{ font-family:var(--a-serif); font-size:28px; font-weight:400; letter-spacing:.01em; color:var(--c-text); line-height:1.05; }
.a-stat-sub{ font-size:11px; color:var(--c-text-muted); margin-top:5px; }
.a-stat-val.is-loading, .a-skeleton-text{ color:var(--c-text-faint); animation:aSkel 1.4s ease-in-out infinite; }
@keyframes aSkel{ 0%,100%{opacity:.35} 50%{opacity:.85} }


/* ══════════════════════════════════════════════════════════════════
   TOOLBAR + SEARCH
   ══════════════════════════════════════════════════════════════════ */
.a-toolbar{
  display:flex; align-items:center; justify-content:space-between; gap:14px;
  flex-wrap:wrap; margin-bottom:20px;
}
.a-toolbar-group{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.a-search{ position:relative; flex:1; min-width:220px; max-width:420px; }
.a-search-ico{ position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--c-text-muted); pointer-events:none; }
.a-search-input{
  width:100%; height:42px; padding:0 14px 0 42px;
  background:#fff; border:1px solid var(--c-border); border-radius:var(--radius);
  font-family:var(--a-sans); font-size:13.5px; color:var(--c-text); outline:none;
  transition:border-color .18s, box-shadow .18s;
}
.a-search-input::placeholder{ color:var(--c-text-faint); }
.a-search-input:focus{ border-color:var(--c-accent); box-shadow:0 0 0 3px var(--c-accent-soft); }


/* ══════════════════════════════════════════════════════════════════
   TABLE
   ══════════════════════════════════════════════════════════════════ */
.a-table-wrap{
  background:#fff; border:1px solid var(--c-border); border-radius:var(--radius-lg);
  box-shadow:var(--shadow-sm); overflow:hidden;
}
.a-table-scroll{ overflow-x:auto; }
.a-table{ width:100%; border-collapse:collapse; font-family:var(--a-sans); }
.a-table th{
  text-align:left; padding:13px 18px;
  font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
  color:var(--c-text-muted); background:var(--c-surface);
  border-bottom:1px solid var(--c-border); white-space:nowrap;
}
.a-table td{
  padding:13px 18px; font-size:13.5px; color:var(--c-text); vertical-align:middle;
  border-bottom:1px solid rgba(44,35,30,.055);
}
.a-table tbody tr{ transition:background .15s ease; }
.a-table tbody tr:last-child td{ border-bottom:none; }
.a-table tbody tr:hover{ background:var(--c-surface); }
.a-table .a-td-num{ font-variant-numeric:tabular-nums; }
.a-td-right{ text-align:right; }
.a-cell-actions{ display:flex; align-items:center; gap:7px; justify-content:flex-end; }

/* media / avatar cell */
.a-media{
  width:44px; height:44px; flex-shrink:0; border-radius:var(--radius-sm);
  object-fit:cover; background:var(--c-surface); border:1px solid var(--c-border);
  display:flex; align-items:center; justify-content:center; color:var(--c-text-faint);
}
.a-cell-lead{ display:flex; align-items:center; gap:13px; }
.a-cell-name{ font-family:var(--a-sans); font-size:14px; font-weight:600; color:var(--c-text); }
.a-cell-meta{ font-size:11px; color:var(--c-text-muted); margin-top:2px; }
.a-mono{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; letter-spacing:.02em; color:var(--c-text-muted); }


/* ══════════════════════════════════════════════════════════════════
   BADGES + STATUS DOTS
   ══════════════════════════════════════════════════════════════════ */
.a-badge{
  display:inline-flex; align-items:center; gap:6px;
  padding:4px 10px; border-radius:999px;
  font-family:var(--a-sans); font-size:10px; font-weight:700;
  letter-spacing:.07em; text-transform:uppercase;
  border:1px solid transparent; white-space:nowrap;
}
.a-badge--success{ color:var(--c-success); background:var(--c-success-bg); }
.a-badge--warning{ color:var(--c-warning); background:var(--c-warning-bg); }
.a-badge--danger{ color:var(--c-danger); background:var(--c-danger-bg); }
.a-badge--info{ color:var(--c-info); background:var(--c-info-bg); }
.a-badge--accent{ color:var(--c-accent); background:var(--c-accent-soft); }
.a-badge--neutral{ color:var(--c-text-muted); background:var(--c-surface-2); }

.a-dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.a-dot--success{ background:var(--c-success); }
.a-dot--warning{ background:var(--c-warning); }
.a-dot--danger{ background:var(--c-danger); }
.a-dot--info{ background:var(--c-info); }
.a-dot--pulse{ animation:aDot 2.4s ease-in-out infinite; }
@keyframes aDot{ 0%,100%{opacity:1} 50%{opacity:.45} }


/* ══════════════════════════════════════════════════════════════════
   FORMS
   ══════════════════════════════════════════════════════════════════ */
.a-form-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:18px 20px; }
.a-form-grid--1{ grid-template-columns:1fr; }
.a-form-grid--3{ grid-template-columns:repeat(3,1fr); }
@media (max-width:720px){ .a-form-grid, .a-form-grid--3{ grid-template-columns:1fr; } }
.a-col-span-2{ grid-column:1 / -1; }

.a-field{ display:flex; flex-direction:column; gap:7px; }
.a-label{
  font-family:var(--a-sans);
  font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
  color:var(--c-text-muted);
}
.a-label .a-req{ color:var(--c-danger); margin-left:3px; }
.a-input, .a-select, .a-textarea{
  width:100%; font-family:var(--a-sans); font-size:14px; color:var(--c-text);
  background:#fff; border:1px solid var(--c-border); border-radius:var(--radius);
  outline:none; transition:border-color .18s, box-shadow .18s;
}
.a-input, .a-select{ height:44px; padding:0 14px; }
.a-textarea{ padding:12px 14px; min-height:104px; resize:vertical; line-height:1.55; }
.a-input::placeholder, .a-textarea::placeholder{ color:var(--c-text-faint); }
.a-input:focus, .a-select:focus, .a-textarea:focus{ border-color:var(--c-accent); box-shadow:0 0 0 3px var(--c-accent-soft); }
.a-input:disabled, .a-select:disabled, .a-textarea:disabled{ background:var(--c-surface); color:var(--c-text-muted); cursor:not-allowed; }
.a-select{
  appearance:none; cursor:pointer; padding-right:38px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239A8C82' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 13px center;
}
.a-hint{ font-size:11.5px; color:var(--c-text-muted); }
.a-error-text{ font-size:11.5px; color:var(--c-danger); display:flex; align-items:center; gap:5px; }
.a-field--error .a-input, .a-field--error .a-select, .a-field--error .a-textarea{
  border-color:var(--c-danger); box-shadow:0 0 0 3px var(--c-danger-bg);
}

/* input with leading icon */
.a-input-wrap{ position:relative; }
.a-input-wrap .a-input{ padding-left:42px; }
.a-input-ico{ position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--c-text-faint); pointer-events:none; transition:color .18s; }
.a-input-wrap:focus-within .a-input-ico{ color:var(--c-accent); }

/* checkbox + radio */
.a-check{
  width:18px; height:18px; flex-shrink:0; cursor:pointer;
  appearance:none; border:1.5px solid var(--c-border-strong); border-radius:5px;
  background:#fff; position:relative; transition:background .15s, border-color .15s;
}
.a-check:checked{ background:var(--c-accent); border-color:var(--c-accent); }
.a-check:checked::after{
  content:""; position:absolute; left:5px; top:2px; width:5px; height:9px;
  border:solid #fff; border-width:0 2px 2px 0; transform:rotate(45deg);
}
.a-check--radio{ border-radius:50%; }
.a-check--radio:checked::after{ left:4px; top:4px; width:8px; height:8px; border:none; border-radius:50%; background:#fff; transform:none; }

/* toggle switch */
.a-switch{ position:relative; display:inline-block; width:42px; height:22px; flex-shrink:0; }
.a-switch input{ opacity:0; width:0; height:0; }
.a-switch-slider{
  position:absolute; inset:0; cursor:pointer; border-radius:999px;
  background:#E6E2DB; transition:background .22s cubic-bezier(.4,0,.2,1);
}
.a-switch-slider::before{
  content:""; position:absolute; height:16px; width:16px; left:3px; bottom:3px;
  background:#fff; border-radius:50%; box-shadow:0 1px 3px rgba(44,35,30,.2);
  transition:transform .22s cubic-bezier(.4,0,.2,1);
}
.a-switch input:checked + .a-switch-slider{ background:var(--c-success); }
.a-switch input:checked + .a-switch-slider::before{ transform:translateX(20px); }
.a-switch input:focus-visible + .a-switch-slider{ box-shadow:0 0 0 3px var(--c-accent-soft); }
.a-switch input:disabled + .a-switch-slider{ opacity:.5; cursor:not-allowed; }


/* ══════════════════════════════════════════════════════════════════
   SEGMENTED CONTROL / CHIPS / TABS
   ══════════════════════════════════════════════════════════════════ */
.a-segmented{ display:inline-flex; background:var(--c-surface); border:1px solid var(--c-border); border-radius:var(--radius); padding:3px; gap:3px; }
.a-segmented button{
  border:0; background:transparent; cursor:pointer; border-radius:7px;
  padding:7px 14px; font-family:var(--a-sans); font-size:11px; font-weight:600;
  letter-spacing:.06em; color:var(--c-text-muted); transition:background .15s, color .15s;
}
.a-segmented button.is-active{ background:#fff; color:var(--c-text); box-shadow:var(--shadow-sm); }

.a-chip{
  display:inline-flex; align-items:center; gap:7px;
  padding:7px 12px; border-radius:999px; cursor:pointer;
  font-family:var(--a-sans); font-size:12px; font-weight:500;
  border:1px solid var(--c-border); background:#fff; color:var(--c-text-muted);
  transition:border-color .15s, color .15s, background .15s;
}
.a-chip:hover{ border-color:var(--c-border-strong); color:var(--c-text); }
.a-chip.is-active{ border-color:var(--c-accent); color:var(--c-accent); background:var(--c-accent-soft); }

.a-tabs{ display:flex; gap:4px; border-bottom:1px solid var(--c-border); margin-bottom:24px; overflow-x:auto; }
.a-tab{
  position:relative; border:0; background:transparent; cursor:pointer;
  padding:13px 16px; font-family:var(--a-sans); font-size:12px; font-weight:600;
  letter-spacing:.06em; color:var(--c-text-muted); white-space:nowrap;
  transition:color .18s; display:inline-flex; align-items:center; gap:8px;
}
.a-tab:hover{ color:var(--c-text); }
.a-tab.is-active{ color:var(--c-accent); }
.a-tab.is-active::after{
  content:""; position:absolute; left:12px; right:12px; bottom:-1px; height:2px;
  background:var(--c-accent); border-radius:2px 2px 0 0;
}


/* ══════════════════════════════════════════════════════════════════
   EMPTY / LOADER / PAGINATION
   ══════════════════════════════════════════════════════════════════ */
.a-empty{ display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:64px 24px; gap:14px; }
.a-empty-ico{ color:var(--c-text-faint); opacity:.5; }
.a-empty-title{ font-family:var(--a-serif); font-size:18px; font-weight:300; font-style:italic; color:var(--c-text-muted); }
.a-empty-text{ font-size:13px; color:var(--c-text-muted); max-width:360px; }

.a-loader{ width:30px; height:30px; border-radius:50%; border:2px solid var(--c-border); border-top-color:var(--c-accent); animation:aSpin .7s linear infinite; }
@keyframes aSpin{ to{ transform:rotate(360deg); } }
.a-loader-row{ display:flex; flex-direction:column; align-items:center; gap:14px; padding:72px 0; }
.a-loader-label{ font-size:10px; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:var(--c-text-muted); }

.a-pager{ display:flex; align-items:center; justify-content:flex-end; gap:7px; margin-top:24px; flex-wrap:wrap; }
.a-pager-btn{
  min-width:40px; height:40px; padding:0 12px;
  display:inline-flex; align-items:center; justify-content:center;
  background:#fff; border:1px solid var(--c-border); border-radius:var(--radius);
  font-family:var(--a-sans); font-size:13px; color:var(--c-text); cursor:pointer;
  transition:border-color .15s, color .15s, background .15s;
}
.a-pager-btn:hover:not(:disabled){ border-color:var(--c-accent); color:var(--c-accent); }
.a-pager-btn.is-active{ background:var(--c-accent); color:#fff; border-color:var(--c-accent); }
.a-pager-btn:disabled{ opacity:.4; cursor:not-allowed; }


/* ══════════════════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════════════════ */
.a-modal-overlay{
  position:fixed; inset:0; z-index:1100;
  background:rgba(44,35,30,.42); backdrop-filter:blur(2px);
  display:flex; align-items:center; justify-content:center; padding:20px;
  /* scroll the overlay (not the page) if a modal is ever taller than the viewport */
  overflow-y:auto; overscroll-behavior:contain;
  animation:aFade .18s ease both;
}
@keyframes aFade{ from{opacity:0} to{opacity:1} }
.a-modal{
  width:100%; max-width:480px; background:#fff;
  border:1px solid var(--c-border); border-radius:var(--radius-lg);
  box-shadow:var(--shadow-lg); overflow:hidden;
  /* Never exceed the viewport: header + footer stay pinned, the body scrolls.
     Fixes tall modals (e.g. testimonials) getting cropped top & bottom. */
  max-height:calc(100vh - 40px);
  max-height:calc(100dvh - 40px);
  display:flex; flex-direction:column; margin:auto;
  animation:aModalIn .26s cubic-bezier(.22,1,.36,1) both;
}
@keyframes aModalIn{ from{opacity:0; transform:translateY(12px) scale(.98)} to{opacity:1; transform:none} }
.a-modal-head{ padding:20px 22px 0; flex-shrink:0; }
.a-modal-title{ font-family:var(--a-serif); font-size:20px; font-weight:300; color:var(--c-text); margin:0; }
.a-modal-title em{ font-style:italic; color:var(--c-accent); padding-right:.06em; }
.a-modal-body{ padding:14px 22px 22px; font-size:14px; color:var(--c-text-muted); line-height:1.6; overflow-y:auto; overscroll-behavior:contain; flex:1 1 auto; }
.a-modal-foot{ display:flex; align-items:center; justify-content:flex-end; gap:10px; padding:16px 22px; border-top:1px solid var(--c-border); background:var(--c-surface); flex-shrink:0; }


/* ══════════════════════════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════════════════════════ */
.a-row{ display:flex; align-items:center; gap:10px; }
.a-row--between{ justify-content:space-between; }
.a-wrap{ flex-wrap:wrap; }
.a-muted{ color:var(--c-text-muted); }
.a-grid-2{ display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:start; }
@media (max-width:1000px){ .a-grid-2{ grid-template-columns:1fr; } }
.a-stack{ display:flex; flex-direction:column; gap:16px; }

@media (prefers-reduced-motion: reduce){
  .admin-scope *{ animation-duration:.001ms !important; transition-duration:.001ms !important; }
}
`;

/** Inject the admin design system once, inside the admin shell. */
export function AdminStyles() {
  return <style data-admin-theme dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />;
}
