'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ArrowUpRight, Loader2,
  Mail, Phone, MessageCircle, MapPin, Send, Globe,
  Clock, CalendarClock, CalendarCheck, Timer, Watch,
  Gem, Diamond, Sparkles, Crown, Gift, PenTool,
  ShieldCheck, BadgeCheck, Award, Star, CircleCheck,
  HeartHandshake, HandHeart, Users, Headphones, LifeBuoy,
  Truck, PackageCheck, RefreshCw, Instagram, Youtube,
  type LucideIcon,
} from 'lucide-react'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import { ContactUsConfig, ContactSection } from '@/lib/contactUs'

/* ════════════════════════════════════════════════════════════════
   CONTACT US — public editorial page  ·  IMAGE-FREE
   The same Swiss-editorial white canvas as /repairs — warm taupe-gold
   accent (#8F7A70), espresso ink, hairline rules, numbered sections —
   but carried entirely by typography: no photography anywhere.

   Driven by the admin-editable ContactUsConfig: typographic hero,
   clickable channel cards (email / appointment / custom order …), a
   premium enquiry form beside the support-hours rail, and reorderable
   info sections with checklist points. Section bodies support
   [label](href) inline links, and bare emails / URLs / +phone numbers
   auto-link (mailto: / tel:) — so "book an appointment" and the support
   email are always one click away. All styles scoped `.ct-`.
════════════════════════════════════════════════════════════════ */

/** name → lucide component (names come from CONTACT_ICONS in the lib). */
const ICONS: Record<string, LucideIcon> = {
  Mail, Phone, MessageCircle, MapPin, Send, Globe,
  Clock, CalendarClock, CalendarCheck, Timer, Watch,
  Gem, Diamond, Sparkles, Crown, Gift, PenTool,
  ShieldCheck, BadgeCheck, Award, Star, CircleCheck,
  HeartHandshake, HandHeart, Users, Headphones, LifeBuoy,
  Truck, PackageCheck, RefreshCw, Instagram, Youtube,
}
const iconFor = (name: string): LucideIcon => ICONS[name] || Mail

/** Split a textarea value into paragraphs on blank lines. */
const toParagraphs = (text: string) =>
  String(text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

/** 1 → "01" — editorial section index. */
const idx = (n: number) => String(n).padStart(2, '0')

/* ── inline rich text: [label](href) links + auto-linked emails / URLs /
 *    +phone numbers. Everything renders as an underlined accent link —
 *    mailto: / tel: are derived automatically. ── */
const INLINE_RE =
  /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<)]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(\+\d[\d\s()-]{6,}\d)/g

function inlineLink(href: string, label: string, key: number) {
  if (href.startsWith('/'))
    return (
      <Link href={href} className="ct-a" key={key}>
        {label}
      </Link>
    )
  const external = /^https?:\/\//i.test(href)
  return (
    <a
      href={href}
      className="ct-a"
      key={key}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {label}
    </a>
  )
}

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let k = 0
  const src = String(text || '')
  INLINE_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = INLINE_RE.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index))
    if (m[1] !== undefined) {
      // [label](href) — mailto:/tel:/path/url all pass through as written
      out.push(inlineLink(m[2], m[1], k++))
    } else if (m[3]) {
      out.push(inlineLink(m[3], m[3].replace(/^https?:\/\//i, ''), k++))
    } else if (m[4]) {
      out.push(inlineLink(`mailto:${m[4]}`, m[4], k++))
    } else if (m[5]) {
      out.push(inlineLink(`tel:${m[5].replace(/[^\d+]/g, '')}`, m[5].trim(), k++))
    }
    last = m.index + m[0].length
  }
  if (last < src.length) out.push(src.slice(last))
  return out
}

/* ── the enquiry form (client-side state + POST /api/contact) ── */
function EnquiryForm({ form }: { form: ContactUsConfig['form'] }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot — humans never see it
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  const subjects = (form.subjects || []).filter(Boolean)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    setError('')
    if (!name.trim()) return setError('Please tell us your name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError('Please enter a valid email address.')
    if (!message.trim()) return setError('Please write a short message.')

    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject,
          message: message.trim(),
          website,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || d?.error) throw new Error(d?.error || 'Something went wrong. Please try again.')
      setStatus('sent')
    } catch (err: any) {
      setStatus('idle')
      setError(err?.message || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="ct-form-done" role="status">
        <span className="ct-form-done-ic">
          <CircleCheck size={30} strokeWidth={1.4} />
        </span>
        <h3 className="ct-form-done-t">{form.success_title || 'Thank You — Message Received'}</h3>
        <p className="ct-form-done-x">
          {form.success_text ||
            'Your message is with our team. We reply personally, usually within one business day.'}
        </p>
      </div>
    )
  }

  return (
    <form className="ct-form" onSubmit={submit} noValidate>
      {/* honeypot — visually hidden, tab-skipped; bots fill it, humans never see it */}
      <div className="ct-hp" aria-hidden="true">
        <label htmlFor="ct-website">Website</label>
        <input
          id="ct-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="ct-form-grid">
        <div className="ct-field">
          <label className="ct-label" htmlFor="ct-name">Full Name<i>*</i></label>
          <input
            id="ct-name" className="ct-input" type="text" value={name} autoComplete="name"
            onChange={(e) => setName(e.target.value)} placeholder="Your name" required
          />
        </div>
        <div className="ct-field">
          <label className="ct-label" htmlFor="ct-email">Email Address<i>*</i></label>
          <input
            id="ct-email" className="ct-input" type="email" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
          />
        </div>
        {form.show_phone && (
          <div className="ct-field">
            <label className="ct-label" htmlFor="ct-phone">Phone <em>(optional)</em></label>
            <input
              id="ct-phone" className="ct-input" type="tel" value={phone} autoComplete="tel"
              onChange={(e) => setPhone(e.target.value)} placeholder="+91 …"
            />
          </div>
        )}
        {subjects.length > 0 && (
          <div className={`ct-field ${form.show_phone ? '' : 'ct-field--span'}`}>
            <label className="ct-label" htmlFor="ct-subject">Subject</label>
            <div className="ct-select-wrap">
              <select
                id="ct-subject" className="ct-input ct-select" value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Choose a topic…</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="ct-field ct-field--span">
          <label className="ct-label" htmlFor="ct-message">Your Message<i>*</i></label>
          <textarea
            id="ct-message" className="ct-input ct-textarea" rows={6} value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your enquiry — order numbers, ring sizes, ideas, anything that helps…"
            required
          />
        </div>
      </div>

      {error && (
        <p className="ct-form-err" role="alert">{error}</p>
      )}

      <button className="ct-btn ct-btn--solid ct-form-btn" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? (
          <>
            <Loader2 size={16} className="ct-spin" />
            <span>Sending…</span>
          </>
        ) : (
          <>
            <span>{form.button_text || 'Send Message'}</span>
            <Send size={15} className="ct-btn-ico" />
          </>
        )}
      </button>
      <p className="ct-form-note">
        Your details are used only to answer your enquiry — never shared, never for marketing.
      </p>
    </form>
  )
}

export default function ContactUsContent({ config }: { config: ContactUsConfig }) {
  const { hero, form, hours } = config
  const channels = (config.channels || []).filter((c) => c.label || c.value)
  const sections = (config.sections || []).filter((s) => s.is_visible)
  const hourRows = (hours.rows || []).filter((r) => r.days || r.hours)
  const showHours = hours.is_visible && hourRows.length > 0

  /* ── scroll-reveal (mirrors the repairs page) ── */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) return

    const els = Array.from(document.querySelectorAll<HTMLElement>('.ct-page [data-reveal]'))
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('ct-in')
            e.target.classList.remove('ct-pre')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    for (const el of els) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
        el.classList.add('ct-pre')
        io.observe(el)
      }
    }
    return () => io.disconnect()
  }, [])

  const renderSection = (s: ContactSection, n: number) => {
    const paras = toParagraphs(s.body)
    const pts = s.points || []
    return (
      <section className="ct-sec" data-reveal key={s.id}>
        <span className="ct-sec-num" aria-hidden="true">{idx(n)}</span>
        <div className="ct-sec-head">
          {s.eyebrow && (
            <span className="ct-eyebrow">
              <span className="ct-eyebrow-line" />
              {s.eyebrow}
              <span className="ct-eyebrow-line" />
            </span>
          )}
          {s.title && <h2 className="ct-sec-title">{s.title}</h2>}
        </div>
        {paras.length > 0 && (
          <div className="ct-sec-copy">
            {paras.map((p, j) => (
              <p key={j} className={j === 0 ? 'ct-sec-lead' : ''}>{renderInline(p)}</p>
            ))}
          </div>
        )}
        {pts.length > 0 && (
          <ul className="ct-checks">
            {pts.map((p) => {
              const Ic = iconFor(p.icon)
              return (
                <li className="ct-check" key={p.id}>
                  <span className="ct-check-ic"><Ic size={18} strokeWidth={1.6} /></span>
                  <div className="ct-check-body">
                    {p.title && <span className="ct-check-t">{p.title}</span>}
                    {p.text && <p className="ct-check-x">{renderInline(p.text)}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <main className="ct-page" suppressHydrationWarning>
        {/* ── HERO — typographic, image-free ───────────────────── */}
        <section className="ct-hero">
          <div className="ct-hero-in" data-reveal>
            <p className="ct-kicker">
              <span className="ct-kicker-line" />
              {hero.eyebrow || 'Contact Us'}
              <span className="ct-kicker-line" />
            </p>
            <h1 className="ct-hero-title">
              {hero.title} {hero.accent && <em>{hero.accent}</em>}
            </h1>
            {hero.subtitle && <p className="ct-hero-lead">{hero.subtitle}</p>}
          </div>
        </section>

        {/* ── CHANNEL CARDS — every card is a link ─────────────── */}
        {channels.length > 0 && (
          <section className="ct-channels" data-reveal>
            <div className="ct-channels-in">
              {channels.map((c) => {
                const Ic = iconFor(c.icon)
                const inner = (
                  <>
                    <span className="ct-chan-ic"><Ic size={21} strokeWidth={1.5} /></span>
                    <span className="ct-chan-label">{c.label}</span>
                    {c.value && <span className="ct-chan-value">{c.value}</span>}
                    {c.note && <span className="ct-chan-note">{c.note}</span>}
                    <span className="ct-chan-go" aria-hidden="true">
                      <ArrowUpRight size={15} strokeWidth={1.8} />
                    </span>
                  </>
                )
                if (!c.href) return <div className="ct-chan" key={c.id}>{inner}</div>
                return c.href.startsWith('/') ? (
                  <Link href={c.href} className="ct-chan" key={c.id}>{inner}</Link>
                ) : (
                  <a
                    href={c.href}
                    className="ct-chan"
                    key={c.id}
                    {...(/^https?:\/\//i.test(c.href)
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {inner}
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* ── FORM + SUPPORT HOURS ─────────────────────────────── */}
        <section className="ct-main" id="ct-form">
          <div className={`ct-main-in ${showHours ? '' : 'ct-main-in--solo'}`}>
            <div className="ct-form-card" data-reveal>
              <div className="ct-panel-head">
                {form.eyebrow && (
                  <span className="ct-eyebrow">
                    <span className="ct-eyebrow-line" />
                    {form.eyebrow}
                  </span>
                )}
                {form.title && <h2 className="ct-panel-title">{form.title}</h2>}
                {form.subtitle && <p className="ct-panel-sub">{form.subtitle}</p>}
              </div>
              <EnquiryForm form={form} />
            </div>

            {showHours && (
              <aside className="ct-hours" data-reveal>
                <div className="ct-hours-card">
                  <div className="ct-panel-head">
                    {hours.eyebrow && (
                      <span className="ct-eyebrow">
                        <span className="ct-eyebrow-line" />
                        {hours.eyebrow}
                      </span>
                    )}
                    {hours.title && <h2 className="ct-panel-title ct-panel-title--sm">{hours.title}</h2>}
                  </div>
                  <ul className="ct-hours-rows">
                    {hourRows.map((r) => (
                      <li className="ct-hours-row" key={r.id}>
                        <span className="ct-hours-days">{r.days}</span>
                        <span className="ct-hours-dots" aria-hidden="true" />
                        <span className="ct-hours-time">{r.hours}</span>
                      </li>
                    ))}
                  </ul>
                  {hours.note && <p className="ct-hours-note">{renderInline(hours.note)}</p>}
                </div>
                <div className="ct-hours-aside">
                  <Clock size={15} strokeWidth={1.6} />
                  <span>We answer in the order messages arrive — thank you for your patience.</span>
                </div>
              </aside>
            )}
          </div>
        </section>

        {/* ── INFO SECTIONS ────────────────────────────────────── */}
        {sections.length > 0 && (
          <section className="ct-info">
            {(config.sections_eyebrow || config.sections_title) && (
              <div className="ct-info-head" data-reveal>
                {config.sections_eyebrow && (
                  <span className="ct-eyebrow">
                    <span className="ct-eyebrow-line" />
                    {config.sections_eyebrow}
                    <span className="ct-eyebrow-line" />
                  </span>
                )}
                {config.sections_title && (
                  <h2 className="ct-info-title">{config.sections_title}</h2>
                )}
              </div>
            )}
            <div className="ct-info-secs">
              {sections.map((s, i) => renderSection(s, i + 1))}
            </div>
          </section>
        )}

        {/* ── SLIM CLOSING RULE ────────────────────────────────── */}
        <section className="ct-close" data-reveal>
          <div className="ct-close-in">
            <p className="ct-close-x">Prefer a conversation? We would be delighted to meet you.</p>
            <Link href="/appointments" className="ct-btn ct-btn--line">
              <span>Book an Appointment</span>
              <ArrowRight size={16} className="ct-btn-ico" />
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════
   SCOPED CSS  ·  white canvas · site theme taupe-gold accent · no images
════════════════════════════════════════════════════════════════ */
const CSS = `
.ct-page{
  /* ── warm monochrome base (white bg + espresso ink + warm greys) ── */
  --ct-ink:#2c231e;
  --ct-body:#5a4f47;
  --ct-muted:#8b7d71;
  --ct-paper:#ffffff;
  --ct-paper-2:#faf7f3;
  --ct-paper-3:#f2ede8;
  --ct-line:rgba(44,35,30,.12);
  --ct-line-2:rgba(44,35,30,.20);
  /* ── the one accent: SITE THEME colour — warm taupe-gold (#8F7A70) ── */
  --ct-accent:#8f7a70;
  --ct-accent-deep:#6f5a4d;
  --ct-accent-soft:#f2ebe5;
  --ct-accent-tint:#f8f3ee;
  --ct-accent-line:rgba(143,122,112,.34);
  --ct-error:#b94040;
  /* ── type ── */
  --ct-serif:var(--font-playfair, 'Cormorant Garamond', Georgia, serif);
  --ct-display:var(--font-main, 'Bodoni Moda', Georgia, serif);
  --ct-sans:var(--font-dmsans, system-ui, sans-serif);
  --ct-e:cubic-bezier(.22,1,.36,1);
  background:var(--ct-paper); color:var(--ct-body); min-height:100vh; overflow-x:clip;
}
.ct-page *{ box-sizing:border-box; }
.ct-page ::selection{ background:var(--ct-accent); color:#fff; }
.ct-page a:focus-visible,
.ct-page button:focus-visible,
.ct-page input:focus-visible,
.ct-page select:focus-visible,
.ct-page textarea:focus-visible{ outline:2px solid var(--ct-accent); outline-offset:2px; border-radius:2px; }

/* ── reveal ── */
.ct-pre{ opacity:0; transform:translateY(28px); }
.ct-in{ animation:ctReveal .9s var(--ct-e) both; }
@keyframes ctReveal{ from{ opacity:0; transform:translateY(28px);} to{ opacity:1; transform:none;} }
@media (prefers-reduced-motion: reduce){
  .ct-pre{ opacity:1; transform:none; }
  .ct-in{ animation:none; }
}

/* ── inline links (underlined — emails, phones, "book an appointment") ── */
.ct-a{
  color:var(--ct-accent-deep); text-decoration:underline; text-underline-offset:3px;
  text-decoration-thickness:1px; transition:color .2s ease;
}
.ct-a:hover{ color:var(--ct-accent); }

/* ── kicker / eyebrow ── */
.ct-kicker{
  display:inline-flex; align-items:center; gap:14px;
  font-family:var(--ct-sans); font-size:11.5px; font-weight:700; letter-spacing:.36em;
  text-transform:uppercase; color:var(--ct-accent); margin:0 0 26px;
}
.ct-kicker-line{ display:block; width:46px; height:1px; background:var(--ct-accent); opacity:.85; }
.ct-eyebrow{
  display:inline-flex; align-items:center; gap:14px;
  font-family:var(--ct-sans); font-size:11px; font-weight:700; letter-spacing:.32em;
  text-transform:uppercase; color:var(--ct-accent); margin-bottom:16px;
}
.ct-eyebrow-line{ display:block; width:34px; height:1px; background:var(--ct-accent-line); }

/* ── buttons ── */
.ct-btn{
  position:relative; display:inline-flex; align-items:center; justify-content:center; gap:11px;
  font-family:var(--ct-sans); font-size:12px; font-weight:600; letter-spacing:.14em;
  text-transform:uppercase; text-decoration:none; cursor:pointer;
  padding:16px 32px; border-radius:0; border:1px solid transparent;
  transition:transform .35s var(--ct-e), box-shadow .35s var(--ct-e), background .3s ease, color .3s ease, border-color .3s ease;
  white-space:nowrap;
}
.ct-btn-ico{ transition:transform .35s var(--ct-e); }
.ct-btn:hover .ct-btn-ico{ transform:translateX(4px); }
.ct-btn--solid{ background:var(--ct-accent); color:#fff; box-shadow:0 18px 40px -20px rgba(44,35,30,.45); }
.ct-btn--solid:hover{ background:var(--ct-accent-deep); transform:translateY(-2px); box-shadow:0 26px 52px -20px rgba(44,35,30,.4); }
.ct-btn--solid:disabled{ opacity:.65; cursor:default; transform:none; }
.ct-btn--line{ background:transparent; color:var(--ct-ink); border-color:var(--ct-line-2); }
.ct-btn--line:hover{ border-color:var(--ct-accent); color:var(--ct-accent); transform:translateY(-2px); }
.ct-spin{ animation:ctSpin 1s linear infinite; }
@keyframes ctSpin{ to{ transform:rotate(360deg); } }

/* ══════════ HERO ══════════ */
.ct-hero{
  position:relative; background:var(--ct-paper-2);
  border-bottom:1px solid var(--ct-line);
  padding:clamp(90px,14vh,150px) clamp(18px,4vw,64px) clamp(56px,8vh,92px);
  text-align:center; overflow:hidden;
}
.ct-hero::before{
  content:''; position:absolute; inset:0; pointer-events:none; opacity:.5;
  background-image:linear-gradient(var(--ct-line) 1px, transparent 1px);
  background-size:100% clamp(58px,7vh,86px);
  -webkit-mask-image:linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
          mask-image:linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
}
.ct-hero::after{
  content:''; position:absolute; left:0; top:0; bottom:0; width:clamp(3px,.4vw,5px);
  background:var(--ct-accent);
}
.ct-hero-in{ position:relative; max-width:860px; margin:0 auto; }
.ct-hero-title{
  font-family:var(--ct-display); font-size:clamp(40px,6.4vw,84px); font-weight:400; line-height:1.02;
  letter-spacing:-.018em; color:var(--ct-ink); margin:0 0 24px;
}
.ct-hero-title em{
  display:block; font-family:var(--ct-serif); font-style:italic; font-weight:500;
  color:var(--ct-accent); margin-top:.06em;
}
.ct-hero-lead{
  font-family:var(--ct-serif); font-size:clamp(18px,2.1vw,24px); font-weight:500; font-style:italic;
  line-height:1.5; color:var(--ct-body); max-width:620px; margin:0 auto;
}

/* ══════════ CHANNEL CARDS ══════════ */
.ct-channels{ padding:clamp(40px,6vw,72px) clamp(18px,4vw,64px) 0; }
.ct-channels-in{
  max-width:1160px; margin:0 auto;
  display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:clamp(14px,2vw,22px);
}
.ct-chan{
  position:relative; display:flex; flex-direction:column; align-items:flex-start;
  gap:6px; padding:clamp(24px,3vw,32px); background:var(--ct-paper);
  border:1px solid var(--ct-line); text-decoration:none;
  transition:border-color .3s ease, transform .35s var(--ct-e), box-shadow .35s var(--ct-e);
}
a.ct-chan:hover{
  border-color:var(--ct-accent); transform:translateY(-3px);
  box-shadow:0 26px 50px -30px rgba(44,35,30,.35);
}
.ct-chan-ic{
  display:inline-flex; align-items:center; justify-content:center;
  width:48px; height:48px; margin-bottom:12px;
  border:1px solid var(--ct-accent-line); color:var(--ct-accent); background:var(--ct-accent-tint);
}
.ct-chan-label{
  font-family:var(--ct-sans); font-size:11px; font-weight:700; letter-spacing:.22em;
  text-transform:uppercase; color:var(--ct-accent);
}
.ct-chan-value{
  font-family:var(--ct-serif); font-size:clamp(17px,1.9vw,20px); font-weight:600;
  color:var(--ct-ink); line-height:1.35; overflow-wrap:anywhere;
}
.ct-chan-note{ font-family:var(--ct-sans); font-size:13px; font-weight:300; line-height:1.6; color:var(--ct-muted); }
.ct-chan-go{
  position:absolute; right:18px; top:18px; color:var(--ct-muted);
  transition:color .3s ease, transform .35s var(--ct-e);
}
a.ct-chan:hover .ct-chan-go{ color:var(--ct-accent); transform:translate(3px,-3px); }

/* ══════════ FORM + HOURS ══════════ */
.ct-main{ padding:clamp(52px,8vw,104px) clamp(18px,4vw,64px); }
.ct-main-in{
  max-width:1160px; margin:0 auto;
  display:grid; grid-template-columns:1.18fr .82fr; gap:clamp(22px,3.4vw,48px); align-items:start;
}
.ct-main-in--solo{ grid-template-columns:1fr; max-width:820px; }

.ct-panel-head{ margin-bottom:clamp(22px,3vw,32px); }
.ct-panel-title{
  font-family:var(--ct-serif); font-size:clamp(27px,3.4vw,40px); font-weight:500; line-height:1.08;
  color:var(--ct-ink); margin:0 0 12px; letter-spacing:.002em;
}
.ct-panel-title--sm{ font-size:clamp(22px,2.6vw,29px); }
.ct-panel-sub{
  font-family:var(--ct-sans); font-size:clamp(14.5px,1.5vw,16px); font-weight:300; line-height:1.8;
  color:var(--ct-body); margin:0; max-width:520px;
}

/* ── form card ── */
.ct-form-card{
  background:var(--ct-paper); border:1px solid var(--ct-line);
  border-top:3px solid var(--ct-accent);
  padding:clamp(26px,4vw,46px);
  box-shadow:0 34px 70px -48px rgba(44,35,30,.4);
}
.ct-form-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:20px 18px; }
.ct-field{ display:flex; flex-direction:column; gap:9px; min-width:0; }
.ct-field--span{ grid-column:1 / -1; }
.ct-label{
  font-family:var(--ct-sans); font-size:10.5px; font-weight:700; letter-spacing:.2em;
  text-transform:uppercase; color:var(--ct-ink);
}
.ct-label i{ color:var(--ct-accent); font-style:normal; margin-left:3px; }
.ct-label em{ color:var(--ct-muted); font-weight:500; letter-spacing:.14em; font-style:normal; text-transform:none; }
.ct-input{
  width:100%; font-family:var(--ct-sans); font-size:15px; font-weight:400; color:var(--ct-ink);
  background:var(--ct-paper-2); border:1px solid var(--ct-line); border-radius:0;
  padding:14px 16px; transition:border-color .25s ease, background .25s ease, box-shadow .25s ease;
  -webkit-appearance:none; appearance:none;
}
.ct-input::placeholder{ color:var(--ct-muted); font-weight:300; opacity:.8; }
.ct-input:hover{ border-color:var(--ct-line-2); }
.ct-input:focus{
  outline:none; border-color:var(--ct-accent); background:#fff;
  box-shadow:0 0 0 3px rgba(143,122,112,.14);
}
.ct-textarea{ resize:vertical; min-height:130px; line-height:1.7; }
.ct-select-wrap{ position:relative; }
.ct-select{ cursor:pointer; padding-right:38px; }
.ct-select-wrap::after{
  content:''; position:absolute; right:16px; top:50%; width:8px; height:8px;
  border-right:1.5px solid var(--ct-muted); border-bottom:1.5px solid var(--ct-muted);
  transform:translateY(-70%) rotate(45deg); pointer-events:none;
}
.ct-form-btn{ width:100%; margin-top:24px; }
.ct-form-err{
  margin:18px 0 0; font-family:var(--ct-sans); font-size:13.5px; font-weight:500;
  color:var(--ct-error); background:rgba(185,64,64,.07); border:1px solid rgba(185,64,64,.25);
  padding:12px 16px;
}
.ct-form-note{
  margin:14px 0 0; font-family:var(--ct-sans); font-size:12px; font-weight:300;
  color:var(--ct-muted); text-align:center; line-height:1.7;
}
/* honeypot — off-canvas, not display:none (some bots skip hidden inputs) */
.ct-hp{ position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden; }

/* ── success state ── */
.ct-form-done{
  display:flex; flex-direction:column; align-items:center; text-align:center;
  padding:clamp(28px,5vw,54px) clamp(10px,3vw,30px);
}
.ct-form-done-ic{
  display:inline-flex; align-items:center; justify-content:center;
  width:64px; height:64px; margin-bottom:20px; color:var(--ct-accent);
  border:1px solid var(--ct-accent-line); background:var(--ct-accent-tint); border-radius:50%;
}
.ct-form-done-t{
  font-family:var(--ct-serif); font-size:clamp(22px,2.8vw,30px); font-weight:500;
  color:var(--ct-ink); margin:0 0 12px;
}
.ct-form-done-x{
  font-family:var(--ct-sans); font-size:15px; font-weight:300; line-height:1.8;
  color:var(--ct-body); max-width:440px; margin:0;
}

/* ── hours rail ── */
.ct-hours{ position:sticky; top:96px; display:flex; flex-direction:column; gap:16px; }
.ct-hours-card{
  background:var(--ct-paper-2); border:1px solid var(--ct-line);
  padding:clamp(24px,3.4vw,38px);
}
.ct-hours-rows{ list-style:none; margin:0; padding:0; }
.ct-hours-row{
  display:flex; align-items:baseline; gap:12px; padding:13px 0;
  border-bottom:1px solid var(--ct-line);
}
.ct-hours-row:last-child{ border-bottom:0; }
.ct-hours-days{
  font-family:var(--ct-sans); font-size:12px; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; color:var(--ct-ink); white-space:nowrap;
}
.ct-hours-dots{ flex:1; border-bottom:1px dotted var(--ct-line-2); transform:translateY(-3px); }
.ct-hours-time{
  font-family:var(--ct-serif); font-size:16px; font-weight:600; color:var(--ct-accent-deep);
  white-space:nowrap;
}
.ct-hours-note{
  margin:18px 0 0; padding-top:16px; border-top:1px solid var(--ct-line);
  font-family:var(--ct-sans); font-size:12.5px; font-weight:300; line-height:1.75; color:var(--ct-muted);
}
.ct-hours-aside{
  display:flex; align-items:flex-start; gap:10px; padding:14px 18px;
  border:1px dashed var(--ct-accent-line); background:var(--ct-accent-tint);
  font-family:var(--ct-sans); font-size:12.5px; font-weight:400; line-height:1.65; color:var(--ct-body);
}
.ct-hours-aside svg{ flex-shrink:0; margin-top:2px; color:var(--ct-accent); }

/* ══════════ INFO SECTIONS ══════════ */
.ct-info{
  padding:clamp(56px,8vw,110px) clamp(18px,4vw,64px) clamp(40px,6vw,80px);
  background:var(--ct-paper-2); border-top:1px solid var(--ct-line);
}
.ct-info-head{
  display:flex; flex-direction:column; align-items:center; text-align:center;
  max-width:1200px; margin:0 auto clamp(40px,6vw,72px);
}
.ct-info-title{
  font-family:var(--ct-serif); font-size:clamp(30px,4.6vw,52px); font-weight:500; line-height:1.06;
  color:var(--ct-ink); margin:0; letter-spacing:.002em;
}
.ct-info-secs{
  max-width:880px; margin:0 auto;
  display:flex; flex-direction:column; gap:clamp(44px,7vw,84px);
}
.ct-sec{
  position:relative; background:var(--ct-paper); border:1px solid var(--ct-line);
  padding:clamp(28px,4.4vw,52px) clamp(22px,4.4vw,56px);
}
.ct-sec-num{
  position:absolute; top:-14px; left:clamp(18px,3.4vw,44px);
  font-family:var(--ct-display); font-size:13px; font-weight:600; letter-spacing:.18em;
  color:var(--ct-accent); background:var(--ct-paper); padding:4px 12px;
  border:1px solid var(--ct-accent-line);
}
.ct-sec-head{ text-align:left; margin-bottom:14px; }
.ct-sec-title{
  font-family:var(--ct-serif); font-size:clamp(23px,2.9vw,33px); font-weight:500; line-height:1.14;
  color:var(--ct-ink); margin:0; letter-spacing:.002em;
}
.ct-sec-copy p{
  font-family:var(--ct-sans); font-size:clamp(14.5px,1.5vw,16px); font-weight:300; line-height:1.85;
  color:var(--ct-body); margin:0 0 14px;
}
.ct-sec-copy p:last-child{ margin-bottom:0; }
.ct-sec-lead{ font-size:clamp(15.5px,1.6vw,17px) !important; color:var(--ct-ink) !important; font-weight:400 !important; }
.ct-checks{
  list-style:none; margin:clamp(20px,3vw,28px) 0 0; padding:clamp(18px,2.6vw,24px) 0 0;
  border-top:1px solid var(--ct-line);
  display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:16px 22px;
}
.ct-check{ display:flex; align-items:flex-start; gap:13px; }
.ct-check-ic{
  display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;
  width:40px; height:40px; border:1px solid var(--ct-accent-line);
  background:var(--ct-accent-tint); color:var(--ct-accent);
}
.ct-check-body{ min-width:0; }
.ct-check-t{
  display:block; font-family:var(--ct-sans); font-size:13.5px; font-weight:600;
  letter-spacing:.02em; color:var(--ct-ink); margin-bottom:3px;
}
.ct-check-x{
  font-family:var(--ct-sans); font-size:13px; font-weight:300; line-height:1.65;
  color:var(--ct-body); margin:0;
}

/* ══════════ SLIM CLOSING ══════════ */
.ct-close{ padding:clamp(44px,6vw,76px) clamp(18px,4vw,64px); border-top:1px solid var(--ct-line); }
.ct-close-in{
  max-width:880px; margin:0 auto;
  display:flex; align-items:center; justify-content:space-between; gap:22px; flex-wrap:wrap;
}
.ct-close-x{
  font-family:var(--ct-serif); font-size:clamp(18px,2.2vw,23px); font-style:italic;
  color:var(--ct-ink); margin:0;
}

/* ══════════ RESPONSIVE ══════════ */
@media(max-width:980px){
  .ct-main-in{ grid-template-columns:1fr; }
  .ct-hours{ position:static; }
}
@media(max-width:640px){
  .ct-hero{ text-align:center; }
  .ct-form-grid{ grid-template-columns:1fr; }
  .ct-checks{ grid-template-columns:1fr; }
  .ct-close-in{ flex-direction:column; align-items:flex-start; }
  .ct-hours-row{ flex-wrap:wrap; gap:4px 12px; }
  .ct-hours-dots{ display:none; }
  .ct-hours-time{ width:100%; }
}
`
