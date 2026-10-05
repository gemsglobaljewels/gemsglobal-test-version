'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Instagram, Mail, MapPin, Phone, ArrowRight,
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { getSettings, fetchAndSyncSettings, SiteSettings } from '@/lib/authStore'

/* ════════════════════════════════════════════════════════════════
   GEMS GLOBAL — FOOTER v3  "AURUM · LIGHT"
   • Clean white background, warm taupe-gold accents (matches header).
   • Header's signature link hover: gold gradient underline that
     grows from the left (same as the top-nav .gh-nl::after).
   • Newsletter is calm & static — no ambient animation.
   • Layout: newsletter band → brand + 4 link columns → bottom bar.
════════════════════════════════════════════════════════════════ */
const CSS = `
.gf{
  --w:#FFFFFF; --iv:#FDFCF9; --cr:#F8F4EE; --wa:#EFE9DF; --bd:#ECE5DA; --bd2:#E2D9CB;
  --a:#8C7456; --a2:#A8916F; --a3:#C9B68F;
  --al:rgba(140,116,86,.10); --am:rgba(140,116,86,.22);
  --ink:#3A2E22; --mu:rgba(58,46,34,.56); --fa:rgba(58,46,34,.36); --li:rgba(58,46,34,.07);
  --serif:var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
  --sans:var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;
  --e:cubic-bezier(.22,1,.36,1);
  --spring:cubic-bezier(.34,1.56,.64,1);
  position:relative;
  background:var(--w);
  border-top:1px solid var(--bd);
  color:var(--ink);
}
.gf a:focus-visible,.gf button:focus-visible{ outline:2px solid var(--a);outline-offset:3px;border-radius:6px; }

/* slim static gold hairline along the very top */
.gf::before{
  content:'';position:absolute;top:-1px;left:50%;transform:translateX(-50%);
  width:min(1280px,100%);height:1.5px;
  background:linear-gradient(90deg,transparent,var(--a3),var(--a2),var(--a3),transparent);
}

/* ══ NEWSLETTER BAND ══ */
.gf-nl{ border-bottom:1px solid var(--bd); }
.gf-nl-in{
  max-width:1280px;margin:0 auto;
  padding:clamp(36px,4.5vw,56px) clamp(20px,4vw,48px);
  display:flex;align-items:center;justify-content:space-between;gap:clamp(28px,5vw,64px);
}
.gf-eyebrow{ display:flex;align-items:center;gap:10px;margin-bottom:12px; }
.gf-eyebrow .ln{ width:26px;height:1px;background:linear-gradient(90deg,var(--a3),transparent); }
.gf-eyebrow .tag{
  font-family:var(--sans);font-size:8px;font-weight:600;
  letter-spacing:.32em;text-transform:uppercase;color:var(--a);
}
.gf-nl-h{
  font-family:var(--serif);font-size:clamp(25px,3vw,36px);font-weight:300;
  letter-spacing:.01em;color:var(--ink);line-height:1.14;margin:0;
}
.gf-nl-h em{
  font-style:italic;font-weight:500;color:transparent;
  background:linear-gradient(120deg,var(--a3),var(--a) 50%,var(--a2));
  -webkit-background-clip:text;background-clip:text;
}
.gf-nl-sub{
  margin:9px 0 0;
  font-family:var(--sans);font-size:11px;font-weight:400;letter-spacing:.1em;color:var(--mu);
}
.gf-nl-action{ flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:0;width:min(440px,42vw); }
.gf-nl-form{
  display:flex;align-items:stretch;width:100%;
  background:var(--w);border:1px solid var(--bd2);border-radius:10px;overflow:hidden;
  transition:border-color .25s,box-shadow .25s;
}
.gf-nl-form:focus-within{ border-color:var(--a2);box-shadow:0 0 0 3px var(--al); }
.gf-nl-input{
  flex:1;min-width:0;padding:14px 18px;
  font-family:var(--sans);font-size:12px;letter-spacing:.03em;color:var(--ink);
  background:transparent;border:none;outline:none;
}
.gf-nl-input::placeholder{ color:var(--fa);letter-spacing:.05em; }
.gf-nl-btn{
  flex-shrink:0;display:inline-flex;align-items:center;gap:7px;padding:0 26px;
  background:linear-gradient(135deg,var(--a),var(--a2));color:var(--w);border:none;cursor:pointer;
  font-family:var(--sans);font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  white-space:nowrap;transition:filter .22s,opacity .2s;
}
.gf-nl-btn:hover{ filter:brightness(1.06); }
.gf-nl-btn:disabled{ opacity:.55;cursor:not-allowed; }
.gf-nl-msg{
  display:flex;align-items:center;gap:7px;margin-top:10px;width:100%;justify-content:flex-end;
  font-family:var(--sans);font-size:10.5px;letter-spacing:.03em;
}
.gf-nl-msg.ok{ color:#2D6A4F; }
.gf-nl-msg.err{ color:#B94040; }
@media(max-width:900px){
  .gf-nl-in{ flex-direction:column;align-items:flex-start;gap:24px; }
  .gf-nl-action{ width:100%;align-items:stretch; }
  .gf-nl-msg{ justify-content:flex-start; }
}
@media(max-width:430px){
  .gf-nl-form{ flex-direction:column; }
  .gf-nl-btn{ padding:13px;justify-content:center; }
}

/* ══ MAIN GRID ══ */
.gf-main{
  max-width:1280px;margin:0 auto;
  padding:clamp(44px,5vw,64px) clamp(20px,4vw,48px) clamp(36px,4vw,48px);
  display:grid;grid-template-columns:1.8fr 1fr 1fr 1fr 1.25fr;gap:clamp(28px,3vw,44px);
}
@media(max-width:1023px){ .gf-main{ grid-template-columns:1fr 1fr 1fr;gap:36px 28px; } .gf-brand{ grid-column:1 / -1; } }
@media(max-width:680px){ .gf-main{ grid-template-columns:1fr 1fr; } }
@media(max-width:480px){ .gf-main{ grid-template-columns:1fr;gap:32px; } }

/* ── Brand ── */
.gf-brand{ max-width:330px; }
.gf-logo{
  display:inline-flex;align-items:center;gap:11px;text-decoration:none;margin-bottom:16px;
}
.gf-logo-mark svg{ height:30px;width:auto;display:block; }
.gf-logo-tx{
  font-family:var(--serif);font-size:clamp(20px,2.2vw,25px);font-weight:300;
  letter-spacing:.3em;text-transform:uppercase;color:var(--ink);line-height:1;
}
.gf-logo-tx em{ font-style:italic;font-weight:500;color:var(--a); }
.gf-logo img{ max-height:58px;width:auto;object-fit:contain; }
.gf-tagline{
  margin:0 0 24px;
  font-family:var(--serif);font-size:15px;font-weight:300;font-style:italic;
  letter-spacing:.01em;line-height:1.75;color:var(--mu);
}
.gf-socials{ display:flex;gap:9px; }
.gf-soc{
  width:40px;height:40px;border-radius:11px;flex-shrink:0;
  display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--bd2);background:var(--w);color:var(--mu);text-decoration:none;
  transition:color .2s,border-color .2s,background .25s var(--e),transform .2s var(--spring);
}
.gf-soc:hover{ color:var(--a);border-color:var(--a2);background:var(--al);transform:translateY(-2px); }

/* ── Link columns ── */
.gf-col-h{ display:flex;align-items:center;gap:10px;margin-bottom:18px; }
.gf-col-t{
  font-family:var(--sans);font-size:8px;font-weight:600;
  letter-spacing:.30em;text-transform:uppercase;color:var(--a);white-space:nowrap;
}
.gf-col-h .ln{ flex:1;height:1px;background:var(--bd); }

.gf-links{ list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:1px; }
.gf-link{
  position:relative;display:inline-flex;align-items:center;gap:7px;padding:7px 0;align-self:flex-start;
  font-family:var(--sans);font-size:12px;font-weight:300;letter-spacing:.03em;
  color:var(--mu);text-decoration:none;
  transition:color .25s ease;
}
/* header's signature hover: gold gradient underline grows from the left */
.gf-link::after{
  content:'';position:absolute;left:0;right:0;bottom:3px;height:1.5px;border-radius:1px;
  background:linear-gradient(90deg,var(--a),var(--a3),var(--a2));
  transform:scaleX(0);transform-origin:left;
  transition:transform .38s var(--e);
}
.gf-link:hover{ color:var(--ink); }
.gf-link:hover::after{ transform:scaleX(1); }
.gf-badge{
  position:relative;z-index:1;padding:2px 6px;border-radius:5px;
  font-family:var(--sans);font-size:7px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:var(--a);background:var(--al);border:1px solid var(--am);
}

/* ── Contact column ── */
.gf-contact{ display:flex;flex-direction:column;gap:14px; }
.gf-ci{
  display:flex;align-items:flex-start;gap:9px;
  font-family:var(--sans);font-size:11.5px;font-weight:300;letter-spacing:.02em;
  color:var(--mu);text-decoration:none;transition:color .2s ease;
}
.gf-ci:hover{ color:var(--a); }
.gf-ci > svg{ color:var(--a2);flex-shrink:0;margin-top:1px; }
.gf-ci b{
  display:block;margin-bottom:3px;
  font-family:var(--sans);font-size:8px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ink);
}
.gf-ci span{ line-height:1.55; }

/* ══ BOTTOM BAR ══ */
.gf-bottom{ border-top:1px solid var(--bd); background:var(--iv); }
.gf-bottom-in{
  max-width:1280px;margin:0 auto;padding:18px clamp(20px,4vw,48px);
  display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;
}
.gf-copy{ font-family:var(--sans);font-size:9.5px;font-weight:400;letter-spacing:.08em;color:var(--fa); }
.gf-copy b{ color:var(--a);font-weight:600; }
.gf-legal{ display:flex;align-items:center;flex-wrap:wrap; }
.gf-legal a{
  font-family:var(--sans);font-size:9px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  color:var(--mu);text-decoration:none;padding:4px 14px;border-right:1px solid var(--bd2);
  transition:color .2s ease;
}
.gf-legal a:first-child{ padding-left:0; }
.gf-legal a:last-child{ border-right:none; }
.gf-legal a:hover{ color:var(--a); }
.gf-pay{ display:flex;align-items:center;gap:12px; }
.gf-pay img{ height:15px;width:auto;opacity:.5;transition:opacity .25s; }
.gf-pay img:hover{ opacity:.85; }
@media(max-width:767px){ .gf-bottom-in{ flex-direction:column;align-items:center;text-align:center;gap:13px; } }

@media(prefers-reduced-motion:reduce){
  .gf *{ transition-duration:.01ms!important;animation-duration:.01ms!important; }
}
`

/* ── Faceted gem monogram — same mark used in the header ── */
const GemMark = () => (
  <svg viewBox="0 0 40 34" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="gf-gem" x1="0" y1="0" x2="40" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C9B68F" /><stop offset=".5" stopColor="#A8916F" /><stop offset="1" stopColor="#8C7456" />
      </linearGradient>
    </defs>
    <g stroke="url(#gf-gem)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 4h24l6 8-18 18L2 12Z" fill="rgba(201,182,143,.12)" />
      <path d="M15 4l-7 8 12 18 12-18-7-8" />
      <path d="M2 12h36" />
      <path d="M20 4 15 12l5 18 5-18-5-8" />
    </g>
  </svg>
)

export function Footer() {
  const currentYear = 2026
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [nlEmail, setNlEmail] = useState('')
  const [nlStatus, setNlStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [nlError, setNlError] = useState('')

  useEffect(() => {
    // The newsletter field starts empty on purpose — subscribing must be an
    // explicit choice, so we never prefill the signed-in user's email.
    setSettings(getSettings())
    fetchAndSyncSettings().then(s => { if (s) setSettings(s) })

    const onSettings = (e: any) => setSettings(e?.detail?.settings ?? getSettings())
    window.addEventListener('settings-updated', onSettings as EventListener)
    return () => window.removeEventListener('settings-updated', onSettings as EventListener)
  }, [])

  const handleSubscribe = async () => {
    const email = nlEmail.trim()
    if (!email) return
    setNlStatus('loading')
    setNlError('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')

      if (data.alreadySubscribed) {
        setNlStatus('success')
        setNlError('You are already subscribed to our newsletter.')
      } else {
        setNlStatus('success')
        setNlEmail('')
      }
    } catch (err: any) {
      setNlStatus('error')
      setNlError(err.message || 'Something went wrong. Please try again.')
    }
  }

  const email = settings?.contact_email || 'hello@gemsglobaljewels.com'

  return (
    <footer className="gf" suppressHydrationWarning>
      <style>{CSS}</style>

      {/* ── Newsletter ───────────────────────────────────────── */}
      <div className="gf-nl">
        <div className="gf-nl-in">
          <div className="gf-nl-copy">
            <div className="gf-eyebrow">
              <span className="ln" />
              <span className="tag">Private Access</span>
            </div>
            <h2 className="gf-nl-h">New arrivals, <em>before anyone</em> else</h2>
            <p className="gf-nl-sub">Join our inner circle · No spam, ever</p>
          </div>

          <div className="gf-nl-action">
            <div className="gf-nl-form">
              <input
                type="email"
                placeholder="Your email address"
                className="gf-nl-input"
                value={nlEmail}
                onChange={e => { setNlEmail(e.target.value); setNlStatus('idle') }}
                onKeyDown={e => e.key === 'Enter' && nlStatus !== 'loading' && handleSubscribe()}
                disabled={nlStatus === 'loading' || nlStatus === 'success'}
                aria-label="Email address"
              />
              <button
                className="gf-nl-btn"
                onClick={handleSubscribe}
                disabled={nlStatus === 'loading' || nlStatus === 'success' || !nlEmail.trim()}
              >
                {nlStatus === 'loading' ? 'Subscribing…' : nlStatus === 'success' ? 'Subscribed ✓' : (
                  <>Subscribe <ArrowRight size={11} strokeWidth={2.2} /></>
                )}
              </button>
            </div>
            {nlStatus === 'success' && (
              <div className="gf-nl-msg ok">
                <CheckCircle2 size={13} strokeWidth={1.5} /> {nlError || "You're on the list! Welcome to the inner circle."}
              </div>
            )}
            {nlStatus === 'error' && (
              <div className="gf-nl-msg err">
                <AlertCircle size={13} strokeWidth={1.5} /> {nlError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="gf-main">

        {/* Brand */}
        <div className="gf-brand">
          <Link href="/" className="gf-logo" aria-label="Home">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_name || 'Gems Global Jewels'} />
            ) : (
              <>
                <span className="gf-logo-mark" aria-hidden="true"><GemMark /></span>
                {settings && (
                  <span className="gf-logo-tx">{settings.logo_text}<em>{settings.logo_em}</em></span>
                )}
              </>
            )}
          </Link>
          <p className="gf-tagline">
            Handcrafted fine jewellery for life's most precious moments — designed in India, cherished worldwide.
          </p>
          <div className="gf-socials">
            {settings?.instagram_url && (
              <a href={settings.instagram_url} className="gf-soc" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram size={15} strokeWidth={1.5} />
              </a>
            )}
            {settings?.youtube_url && (
              <a href={settings.youtube_url} className="gf-soc" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
            )}
            {settings?.pinterest_url && (
              <a href={settings.pinterest_url} className="gf-soc" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </a>
            )}
            {settings?.etsy_url && (
              <a href={settings.etsy_url} className="gf-soc" target="_blank" rel="noopener noreferrer" aria-label="Etsy Shop">
                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--serif)' }}>E</span>
              </a>
            )}
          </div>
        </div>

        {/* Collection */}
        <div className="gf-col">
          <div className="gf-col-h"><span className="gf-col-t">Collection</span><span className="ln" /></div>
          <ul className="gf-links">
            <li><Link href="/collection" className="gf-link">All Jewellery</Link></li>
            <li><Link href="/collection?category=rings" className="gf-link">Rings</Link></li>
            <li><Link href="/collection?category=rings&style=solitaire" className="gf-link">Solitaire</Link></li>
            <li><Link href="/collection/necklaces" className="gf-link">Necklaces</Link></li>
            <li><Link href="/collection/earrings" className="gf-link">Earrings</Link></li>
            <li><Link href="/collection/bridal" className="gf-link">Bridal Sets <span className="gf-badge">New</span></Link></li>
          </ul>
        </div>

        {/* Services */}
        <div className="gf-col">
          <div className="gf-col-h"><span className="gf-col-t">Services</span><span className="ln" /></div>
          <ul className="gf-links">
            <li><Link href="/appointments" className="gf-link">Book Appointment</Link></li>
            <li><Link href="/custom-order" className="gf-link">Custom Design</Link></li>
            <li><Link href="/repairs" className="gf-link">Repairs</Link></li>
            <li><Link href="/ring-size-guide" className="gf-link">Ring Size Guide</Link></li>
            <li><Link href="/gift-guide" className="gf-link">Gift Guide</Link></li>
            <li><Link href="/contact-us" className="gf-link">Contact Us</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div className="gf-col">
          <div className="gf-col-h"><span className="gf-col-t">Company</span><span className="ln" /></div>
          <ul className="gf-links">
            <li><Link href="/about" className="gf-link">Our Story</Link></li>
            <li><Link href="/craftsmanship" className="gf-link">Craftsmanship</Link></li>
            <li><Link href="/sustainability" className="gf-link">Sustainability</Link></li>
            <li><Link href="/blog" className="gf-link">Journal</Link></li>
            <li><Link href="/blog" className="gf-link">Education</Link></li>
            <li><Link href="/collection?sort=new" className="gf-link">New Arrivals</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="gf-col">
          <div className="gf-col-h"><span className="gf-col-t">Contact</span><span className="ln" /></div>
          <div className="gf-contact">
            <a href={`mailto:${email}`} className="gf-ci">
              <Mail size={13} strokeWidth={1.5} />
              <span><b>Email</b>{email}</span>
            </a>
            {settings?.india_contact && (
              <a href={`tel:${settings.india_contact}`} className="gf-ci">
                <Phone size={13} strokeWidth={1.5} />
                <span><b>India</b>{settings.india_contact}</span>
              </a>
            )}
            {settings?.canada_contact && (
              <a href={`tel:${settings.canada_contact}`} className="gf-ci">
                <Phone size={13} strokeWidth={1.5} />
                <span><b>Canada</b>{settings.canada_contact}</span>
              </a>
            )}
            {settings?.india_address && (
              <span className="gf-ci">
                <MapPin size={13} strokeWidth={1.5} />
                <span><b>Visit · India</b>{settings.india_address}</span>
              </span>
            )}
            {settings?.canada_address && (
              <span className="gf-ci">
                <MapPin size={13} strokeWidth={1.5} />
                <span><b>Visit · Canada</b>{settings.canada_address}</span>
              </span>
            )}
          </div>
        </div>

      </div>

      {/* ── Bottom bar ───────────────────────────────────────── */}
      <div className="gf-bottom">
        <div className="gf-bottom-in">
          <p className="gf-copy">
            &copy; {currentYear} <b>{settings?.site_name || 'Gems Global Jewels'}</b>. All rights reserved.
          </p>

          <nav className="gf-legal" aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
          </nav>

          <div className="gf-pay">
            {(() => {
              try {
                const logos = JSON.parse(settings?.payment_logos || '[]')
                if (Array.isArray(logos) && logos.length > 0) {
                  return logos.map((url: string, i: number) => (
                    <img key={i} src={url} alt="Payment Method" />
                  ))
                }
              } catch (e) { }

              // Fallback static logos if none configured
              return (
                <>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" title="Visa" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" title="Mastercard" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" title="PayPal" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/Google_Pay_Logo.svg" alt="Google Pay" title="Google Pay" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_Pay_logo.svg" alt="Apple Pay" title="Apple Pay" />
                </>
              )
            })()}
          </div>
        </div>
      </div>

    </footer>
  )
}

export default Footer
