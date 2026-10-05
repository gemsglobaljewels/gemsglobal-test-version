'use client'

import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'

/* ════════════════════════════════════════════════════════════════
   LEGAL / POLICY — shared public renderer
   One component drives all four prose pages (Privacy, Terms, Shipping,
   Returns). Each is admin-editable: an eyebrow, title, subtitle and a
   "last updated" line above a rich-text (HTML) body. Same white-canvas /
   warm taupe-gold theme as the rest of the marketing pages. Styles
   scoped `.lgl-`; the injected body HTML is styled under `.lgl-prose`.
════════════════════════════════════════════════════════════════ */

export interface LegalView {
  eyebrow: string
  title: string
  subtitle: string
  updated: string
  body: string
}

export default function LegalContent({ config }: { config: LegalView }) {
  const { eyebrow, title, subtitle, updated, body } = config
  const hasBody = !!String(body || '').trim()

  return (
    <>
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <main className="lgl-page" suppressHydrationWarning>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="lgl-hero">
          <div className="lgl-hero-in">
            {eyebrow && (
              <p className="lgl-kicker">
                <span className="lgl-kicker-line" />
                {eyebrow}
              </p>
            )}
            {title && <h1 className="lgl-title">{title}</h1>}
            {subtitle && <p className="lgl-lead">{subtitle}</p>}
            {updated && (
              <p className="lgl-updated">
                <Clock size={13} strokeWidth={1.7} /> {updated}
              </p>
            )}
          </div>
        </section>

        {/* ── BODY ─────────────────────────────────────────────── */}
        <section className="lgl-body">
          <div className="lgl-body-in">
            {hasBody ? (
              <div className="lgl-prose" dangerouslySetInnerHTML={{ __html: body }} />
            ) : (
              <p className="lgl-empty">This page is being updated. Please check back soon.</p>
            )}

            <div className="lgl-foot">
              <p className="lgl-foot-x">
                Have a question about this policy? We’re happy to help.
              </p>
              <Link href="/contact-us" className="lgl-btn">
                <span>Contact Us</span>
                <ArrowRight size={16} className="lgl-btn-ico" />
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════
   SCOPED CSS  ·  white canvas · site theme taupe-gold accent (no black)
════════════════════════════════════════════════════════════════ */
const CSS = `
.lgl-page{
  --lgl-ink:#2c231e;
  --lgl-body:#5a4f47;
  --lgl-muted:#8b7d71;
  --lgl-paper:#ffffff;
  --lgl-paper-2:#faf7f3;
  --lgl-line:rgba(44,35,30,.12);
  --lgl-line-2:rgba(44,35,30,.20);
  --lgl-accent:#8f7a70;
  --lgl-accent-deep:#6f5a4d;
  --lgl-accent-soft:#f2ebe5;
  --lgl-accent-line:rgba(143,122,112,.34);
  --lgl-serif:var(--font-playfair, 'Cormorant Garamond', Georgia, serif);
  --lgl-display:var(--font-main, 'Bodoni Moda', Georgia, serif);
  --lgl-sans:var(--font-dmsans, system-ui, sans-serif);
  --lgl-e:cubic-bezier(.22,1,.36,1);
  background:var(--lgl-paper); color:var(--lgl-body); min-height:100vh; overflow-x:clip;
}
.lgl-page *{ box-sizing:border-box; }
.lgl-page ::selection{ background:var(--lgl-accent); color:#fff; }

/* ══════════ HERO ══════════ */
.lgl-hero{
  position:relative; background:var(--lgl-paper-2);
  border-bottom:1px solid var(--lgl-line);
  padding:clamp(90px,14vh,150px) clamp(18px,4vw,64px) clamp(46px,7vh,78px);
  overflow:hidden;
}
.lgl-hero::after{
  content:''; position:absolute; left:0; top:0; bottom:0; width:clamp(3px,.4vw,5px);
  background:var(--lgl-accent);
}
.lgl-hero-in{ position:relative; max-width:900px; margin:0 auto; }
.lgl-kicker{
  display:inline-flex; align-items:center; gap:14px;
  font-family:var(--lgl-sans); font-size:11.5px; font-weight:700; letter-spacing:.36em;
  text-transform:uppercase; color:var(--lgl-accent); margin:0 0 22px;
}
.lgl-kicker-line{ display:block; width:46px; height:1px; background:var(--lgl-accent); opacity:.85; }
.lgl-title{
  font-family:var(--lgl-display); font-size:clamp(38px,6vw,72px); font-weight:400; line-height:1.02;
  letter-spacing:-.015em; color:var(--lgl-ink); margin:0 0 22px;
}
.lgl-lead{
  font-family:var(--lgl-serif); font-size:clamp(18px,2.1vw,24px); font-weight:500; font-style:italic;
  line-height:1.5; color:var(--lgl-body); max-width:640px; margin:0 0 26px;
}
.lgl-updated{
  display:inline-flex; align-items:center; gap:8px;
  font-family:var(--lgl-sans); font-size:11.5px; font-weight:600; letter-spacing:.08em;
  text-transform:uppercase; color:var(--lgl-muted);
  padding:8px 14px; border:1px solid var(--lgl-line); border-radius:999px; background:#fff;
  margin:0;
}

/* ══════════ BODY ══════════ */
.lgl-body{ padding:clamp(52px,8vw,104px) clamp(18px,4vw,64px) clamp(64px,9vw,120px); }
.lgl-body-in{ max-width:820px; margin:0 auto; }
.lgl-empty{ font-family:var(--lgl-sans); font-size:16px; font-weight:300; color:var(--lgl-muted); text-align:center; padding:40px 0; }

/* ── injected rich-text prose ── */
.lgl-prose{ font-family:var(--lgl-sans); color:var(--lgl-body); font-size:clamp(15px,1.55vw,16.5px); font-weight:300; line-height:1.9; }
.lgl-prose > *:first-child{ margin-top:0; }
.lgl-prose h1, .lgl-prose h2, .lgl-prose h3, .lgl-prose h4{
  font-family:var(--lgl-serif); color:var(--lgl-ink); font-weight:600; line-height:1.18;
  margin:2em 0 .6em; letter-spacing:.004em;
}
.lgl-prose h1{ font-size:clamp(28px,3.6vw,40px); }
.lgl-prose h2{ font-size:clamp(24px,3vw,32px); }
.lgl-prose h3{ font-size:clamp(20px,2.3vw,25px); }
.lgl-prose h4{ font-size:clamp(17px,1.9vw,20px); }
.lgl-prose h2{ padding-top:.5em; border-top:1px solid var(--lgl-line); }
.lgl-prose p{ margin:0 0 1.15em; }
.lgl-prose a{ color:var(--lgl-accent-deep); text-decoration:underline; text-underline-offset:3px; transition:color .2s ease; }
.lgl-prose a:hover{ color:var(--lgl-accent); }
.lgl-prose strong, .lgl-prose b{ font-weight:600; color:var(--lgl-ink); }
.lgl-prose ul, .lgl-prose ol{ margin:0 0 1.3em; padding-left:1.4em; }
.lgl-prose li{ margin:0 0 .55em; padding-left:.2em; }
.lgl-prose ul li::marker{ color:var(--lgl-accent); }
.lgl-prose ol li::marker{ color:var(--lgl-accent); font-weight:600; }
.lgl-prose blockquote{
  margin:1.6em 0; padding:14px 22px; border-left:3px solid var(--lgl-accent);
  background:var(--lgl-accent-soft); color:var(--lgl-ink); font-style:italic;
}
.lgl-prose hr{ border:0; border-top:1px solid var(--lgl-line); margin:2.2em 0; }
.lgl-prose img{ max-width:100%; height:auto; border-radius:2px; margin:1.4em 0; }
.lgl-prose table{ width:100%; border-collapse:collapse; margin:1.5em 0; font-size:14.5px; }
.lgl-prose th, .lgl-prose td{ border:1px solid var(--lgl-line); padding:10px 14px; text-align:left; }
.lgl-prose th{ background:var(--lgl-accent-soft); color:var(--lgl-ink); font-weight:600; }

/* ── contact foot ── */
.lgl-foot{
  margin-top:clamp(46px,7vw,80px); padding-top:clamp(30px,4vw,44px);
  border-top:1px solid var(--lgl-line);
  display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap;
}
.lgl-foot-x{ font-family:var(--lgl-serif); font-size:clamp(17px,2vw,21px); font-style:italic; color:var(--lgl-ink); margin:0; }
.lgl-btn{
  display:inline-flex; align-items:center; gap:11px; text-decoration:none; cursor:pointer;
  font-family:var(--lgl-sans); font-size:12px; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
  color:#fff; background:var(--lgl-accent); padding:15px 30px; border:1px solid transparent;
  transition:transform .35s var(--lgl-e), background .3s ease, box-shadow .35s var(--lgl-e);
  box-shadow:0 18px 40px -20px rgba(44,35,30,.45); white-space:nowrap;
}
.lgl-btn:hover{ background:var(--lgl-accent-deep); transform:translateY(-2px); box-shadow:0 26px 52px -20px rgba(44,35,30,.4); }
.lgl-btn-ico{ transition:transform .35s var(--lgl-e); }
.lgl-btn:hover .lgl-btn-ico{ transform:translateX(4px); }

@media(max-width:600px){
  .lgl-foot{ flex-direction:column; align-items:flex-start; }
}
`
