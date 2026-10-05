'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, ChevronDown, Smartphone, Upload, X as CloseIcon,
  CheckCircle2, ArrowRight, Loader2,
} from 'lucide-react'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import { getUser } from '@/lib/authStore'
import { authedFetch } from '@/lib/authedFetch'
import { useToast } from '@/hooks/use-toast'

// Dialing codes reused from the checkout flow (digit min/max per country).
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

const DEFAULT_CATEGORIES = ['Ring', 'Necklace', 'Pendant', 'Earrings', 'Bracelet', 'Bangle', 'Chain', 'Nose Pin', 'Anklet', 'Other']
const DEFAULT_METALS = ['Yellow Gold', 'White Gold', 'Rose Gold', 'Platinum', 'Silver', 'Not sure']

const MAX_IMAGES = 8

export default function CustomOrderPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [ready, setReady] = useState(false)       // auth check finished
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    country: '',
    countryCode: '+91',
    phone: '',
    title: '',
    category: '',
    metalPreference: '',
    budgetCurrency: 'INR' as 'INR' | 'USD',
    budgetAmount: '',
    processingTime: '',
    quantity: 1,
    description: '',
  })
  const [images, setImages] = useState<string[]>([])
  const [referenceProduct, setReferenceProduct] = useState('')
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [metals, setMetals] = useState<string[]>(DEFAULT_METALS)

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const activeCode = useMemo(
    () => COUNTRY_CODES.find((c) => c.code === form.countryCode) || COUNTRY_CODES[0],
    [form.countryCode]
  )

  // ── Auth gate + prefill (client-only; session lives in localStorage) ──
  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.replace('/login?redirect=/custom-order')
      return
    }
    const sp = new URLSearchParams(window.location.search)
    const product = (sp.get('product') || '').trim()
    if (product) setReferenceProduct(product)
    setForm((f) => ({
      ...f,
      customerName: user.name || f.customerName,
      customerEmail: user.email || f.customerEmail,
      phone: (user.phone || '').replace(/\D/g, '').slice(0, 15) || f.phone,
      title: product ? `Custom order inspired by ${product}` : f.title,
    }))
    setReady(true)
  }, [router])

  // ── Admin-managed dropdown options (public; fall back to defaults) ──
  useEffect(() => {
    let alive = true
    fetch('/api/custom-orders/options')
      .then((r) => r.json())
      .then((data) => {
        if (!alive || !Array.isArray(data)) return
        const cats = data.filter((o: any) => o?.type === 'category').map((o: any) => o.label)
        const mets = data.filter((o: any) => o?.type === 'metal').map((o: any) => o.label)
        if (cats.length) setCategories(cats)
        if (mets.length) setMetals(mets)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  function onPhoneChange(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, activeCode.max)
    set('phone', digits)
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (images.length + files.length > MAX_IMAGES) {
      toast({ variant: 'destructive', title: 'Too many images', description: `You can attach up to ${MAX_IMAGES} images.` })
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach((f) => fd.append('files', f))
      const res = await authedFetch('/api/custom-orders/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data.urls)) {
        setImages((prev) => [...prev, ...data.urls].slice(0, MAX_IMAGES))
      } else {
        toast({ variant: 'destructive', title: 'Upload failed', description: data?.error || 'Please try again.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Please try again.' })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.customerName.trim()) return setError('Please enter your name.')
    if (!form.title.trim()) return setError('Please give your custom order a title.')
    if (!form.description.trim()) return setError('Please describe what you have in mind.')
    if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
      return setError('Please enter a valid email address.')
    }
    if (!form.phone || form.phone.length < activeCode.min) {
      return setError(`Please enter a valid ${activeCode.min}-digit phone number for ${activeCode.country}.`)
    }

    setSubmitting(true)
    try {
      const res = await authedFetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: `${form.countryCode} ${form.phone}`,
          country: form.country.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          metalPreference: form.metalPreference,
          budgetCurrency: form.budgetCurrency,
          budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
          processingTime: form.processingTime.trim(),
          quantity: form.quantity,
          referenceImages: images,
          referenceProduct,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Session fully expired (refresh token gone) — authedFetch couldn't
        // attach a valid token. Send them to login rather than a dead-end
        // "Unauthorized" message; they return here after signing back in.
        if (res.status === 401) {
          router.replace('/login?redirect=/custom-order')
          return
        }
        setError(data?.error || 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
      toast({ title: 'Request submitted', description: 'Our team will be in touch soon.' })
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="co-root">
      <HeaderMegaMenu />
      <style>{CSS}</style>

      <main className="co-main">
        {!ready ? (
          <div className="co-boot"><Loader2 className="co-spin" size={22} /></div>
        ) : submitted ? (
          <div className="co-done">
            <div className="co-done-ic"><CheckCircle2 size={30} /></div>
            <h1 className="co-done-h">Your request is in.</h1>
            <p className="co-done-p">
              Thank you, {form.customerName.split(' ')[0] || 'there'}. We've received your custom order
              request and our atelier will review it and reach out to you shortly
              {form.customerEmail ? <> at <strong>{form.customerEmail}</strong></> : null}.
            </p>
            <div className="co-done-cta">
              <Link href="/collection" className="co-btn co-btn--solid">Continue browsing <ArrowRight size={16} /></Link>
              <Link href="/account" className="co-btn co-btn--ghost">Go to my account</Link>
            </div>
          </div>
        ) : (
          <>
            <header className="co-hero">
              <div className="co-eyebrow"><Sparkles size={13} /> Bespoke Atelier</div>
              <h1 className="co-title">Create a <em>Custom Order</em></h1>
              <p className="co-sub">
                Dreaming of something one-of-a-kind? Share your vision and our artisans will craft a
                piece made just for you. Tell us the details below.
              </p>
            </header>

            <form className="co-card" onSubmit={handleSubmit} noValidate>
              {referenceProduct && (
                <div className="co-refnote">
                  <Sparkles size={14} /> Inspired by product <strong>{referenceProduct}</strong>
                </div>
              )}

              <div className="co-grid">
                <div className="co-field">
                  <label className="co-label">Full name <span className="co-req">*</span></label>
                  <input className="co-input" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="Your name" />
                </div>
                <div className="co-field">
                  <label className="co-label">Email</label>
                  <input className="co-input" type="email" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} placeholder="you@example.com" />
                </div>

                <div className="co-field">
                  <label className="co-label">Country</label>
                  <input className="co-input" value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="Where are you based?" />
                </div>
                <div className="co-field">
                  <label className="co-label">Contact number <span className="co-req">*</span></label>
                  <div className="co-phone">
                    <div className="co-select-wrap co-cc">
                      <select className="co-input co-select" value={form.countryCode} onChange={(e) => set('countryCode', e.target.value)}>
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code + c.country} value={c.code}>{c.code} {c.country}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="co-select-ic" />
                    </div>
                    <div className="co-input-ic">
                      <Smartphone size={15} className="co-lead-ic" />
                      <input className="co-input co-input--ic" type="tel" inputMode="numeric" value={form.phone} onChange={(e) => onPhoneChange(e.target.value)} placeholder={`${activeCode.max}-digit number`} />
                    </div>
                  </div>
                </div>

                <div className="co-field co-col-2">
                  <label className="co-label">Title <span className="co-req">*</span></label>
                  <input className="co-input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Emerald halo engagement ring" />
                </div>

                <div className="co-field">
                  <label className="co-label">Jewellery type</label>
                  <div className="co-select-wrap">
                    <select className="co-input co-select" value={form.category} onChange={(e) => set('category', e.target.value)}>
                      <option value="">Select a type…</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="co-select-ic" />
                  </div>
                </div>
                <div className="co-field">
                  <label className="co-label">Metal preference</label>
                  <div className="co-select-wrap">
                    <select className="co-input co-select" value={form.metalPreference} onChange={(e) => set('metalPreference', e.target.value)}>
                      <option value="">Select a metal…</option>
                      {metals.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="co-select-ic" />
                  </div>
                </div>

                <div className="co-field">
                  <label className="co-label">Budget</label>
                  <div className="co-cur">
                    <div className="co-cur-seg">
                      <button type="button" className={`co-cur-btn ${form.budgetCurrency === 'INR' ? 'is-active' : ''}`} onClick={() => set('budgetCurrency', 'INR')}>₹ INR</button>
                      <button type="button" className={`co-cur-btn ${form.budgetCurrency === 'USD' ? 'is-active' : ''}`} onClick={() => set('budgetCurrency', 'USD')}>$ USD</button>
                    </div>
                    <div className="co-cur-amt">
                      <span className="co-cur-sym">{form.budgetCurrency === 'USD' ? '$' : '₹'}</span>
                      <input className="co-input co-cur-input" inputMode="decimal" value={form.budgetAmount} onChange={(e) => set('budgetAmount', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Amount" />
                    </div>
                  </div>
                </div>
                <div className="co-field">
                  <label className="co-label">Desired timeline</label>
                  <input className="co-input" value={form.processingTime} onChange={(e) => set('processingTime', e.target.value)} placeholder="e.g. Within 4 weeks" />
                </div>

                <div className="co-field">
                  <label className="co-label">Quantity</label>
                  <input className="co-input" type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', Math.max(1, Number(e.target.value) || 1))} />
                </div>
                <div className="co-field" />

                <div className="co-field co-col-2">
                  <label className="co-label">Describe your custom piece <span className="co-req">*</span></label>
                  <textarea className="co-input co-textarea" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell us about the design, stones, engravings, sizing, occasion — anything that helps us bring it to life." />
                </div>

                <div className="co-field co-col-2">
                  <label className="co-label">Reference images <span className="co-hint">(optional, up to {MAX_IMAGES})</span></label>
                  <div className="co-uploads">
                    {images.map((url) => (
                      <div key={url} className="co-thumb">
                        <img src={url} alt="reference" />
                        <button type="button" className="co-thumb-x" onClick={() => removeImage(url)} aria-label="Remove image"><CloseIcon size={13} /></button>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <label className={`co-upload ${uploading ? 'is-loading' : ''}`}>
                        {uploading ? <Loader2 className="co-spin" size={16} /> : <Upload size={16} />}
                        <span>{uploading ? 'Uploading…' : 'Add image'}</span>
                        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} disabled={uploading} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {error && <div className="co-error">{error}</div>}

              <div className="co-actions">
                <button type="submit" className="co-btn co-btn--solid co-submit" disabled={submitting || uploading}>
                  {submitting ? <><Loader2 className="co-spin" size={16} /> Submitting…</> : <>Submit request <ArrowRight size={16} /></>}
                </button>
                <p className="co-note">Our team typically responds within 1–2 business days.</p>
              </div>
            </form>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

const CSS = `
.co-root{ background:var(--c-bg); color:var(--c-text); min-height:100vh; }
.co-main{ max-width:900px; margin:0 auto; padding:48px 20px 80px; }
.co-boot{ display:flex; justify-content:center; padding:120px 0; color:var(--c-accent); }
.co-spin{ animation:co-rot 0.8s linear infinite; }
@keyframes co-rot{ to{ transform:rotate(360deg); } }

.co-hero{ text-align:center; margin-bottom:34px; }
.co-eyebrow{
  display:inline-flex; align-items:center; gap:7px; font-family:var(--font-montserrat,var(--font-dmsans));
  font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:var(--c-accent);
  border:1px solid var(--c-border); border-radius:999px; padding:7px 15px; margin-bottom:18px;
}
.co-title{ font-family:var(--font-main); font-weight:400; font-size:clamp(30px,5vw,46px); line-height:1.1; margin:0 0 14px; color:var(--c-text); }
.co-title em{ font-style:italic; color:var(--c-accent); }
.co-sub{ max-width:560px; margin:0 auto; font-size:15px; line-height:1.75; color:var(--c-text-muted,#6b625b); }

.co-card{
  background:var(--c-surface,#fff); border:1px solid var(--c-border); border-radius:calc(var(--radius,0.3rem) * 2);
  padding:32px; box-shadow:0 1px 2px rgba(0,0,0,0.03);
}
@media (max-width:640px){ .co-card{ padding:20px; } }

.co-refnote{
  display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--c-accent);
  background:var(--c-accent-soft,rgba(143,122,112,0.08)); border:1px solid var(--c-border);
  border-radius:var(--radius,0.3rem); padding:10px 14px; margin-bottom:22px;
}

.co-grid{ display:grid; grid-template-columns:1fr 1fr; gap:20px; }
@media (max-width:640px){ .co-grid{ grid-template-columns:1fr; gap:16px; } }
.co-col-2{ grid-column:1 / -1; }
.co-field{ display:flex; flex-direction:column; gap:7px; min-width:0; }

.co-label{ font-family:var(--font-montserrat,var(--font-dmsans)); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--c-text-muted,#6b625b); font-weight:600; }
.co-req{ color:var(--c-error,#b94040); }
.co-hint{ text-transform:none; letter-spacing:0; font-weight:400; color:var(--c-text-faint,#9a8f86); }

.co-input{
  width:100%; background:var(--c-bg); border:1px solid var(--c-border); border-radius:var(--radius,0.3rem);
  padding:12px 14px; font-size:14px; color:var(--c-text); font-family:var(--font-dmsans,inherit);
  transition:border-color .15s ease, box-shadow .15s ease; outline:none;
}
.co-input::placeholder{ color:var(--c-text-faint,#a99f96); }
.co-input:focus{ border-color:var(--c-accent); box-shadow:0 0 0 3px var(--c-accent-soft,rgba(143,122,112,0.12)); }
.co-textarea{ resize:vertical; min-height:120px; line-height:1.6; }

.co-select-wrap{ position:relative; }
.co-select{ appearance:none; -webkit-appearance:none; padding-right:34px; cursor:pointer; }
.co-select-ic{ position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--c-text-muted,#6b625b); pointer-events:none; }

.co-phone{ display:grid; grid-template-columns:132px 1fr; gap:10px; }
.co-cc .co-select{ padding-left:12px; }
.co-input-ic{ position:relative; }
.co-lead-ic{ position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--c-text-muted,#6b625b); }
.co-input--ic{ padding-left:36px; }

.co-cur{ display:flex; flex-direction:column; gap:10px; }
.co-cur-seg{ display:inline-flex; gap:6px; }
.co-cur-btn{
  flex:1; padding:9px 12px; font-size:12.5px; font-weight:600; cursor:pointer;
  background:var(--c-bg); color:var(--c-text-muted,#6b625b); border:1px solid var(--c-border);
  border-radius:var(--radius,0.3rem); font-family:var(--font-dmsans,inherit);
  transition:border-color .15s ease, color .15s ease, background .15s ease;
}
.co-cur-btn:hover{ border-color:var(--c-accent); color:var(--c-accent); }
.co-cur-btn.is-active{ background:var(--c-accent); color:#fff; border-color:var(--c-accent); }
.co-cur-amt{ position:relative; }
.co-cur-sym{ position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--c-text-muted,#6b625b); font-size:14px; pointer-events:none; }
.co-cur-input{ padding-left:30px; }

.co-uploads{ display:flex; flex-wrap:wrap; gap:12px; }
.co-thumb{ position:relative; width:88px; height:88px; border-radius:var(--radius,0.3rem); overflow:hidden; border:1px solid var(--c-border); }
.co-thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
.co-thumb-x{
  position:absolute; top:4px; right:4px; width:22px; height:22px; border-radius:50%;
  background:rgba(0,0,0,0.55); color:#fff; border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
}
.co-upload{
  width:88px; height:88px; border:1px dashed var(--c-border); border-radius:var(--radius,0.3rem);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px;
  cursor:pointer; color:var(--c-accent); font-size:11px; background:var(--c-bg);
  transition:border-color .15s ease, background .15s ease;
}
.co-upload:hover{ border-color:var(--c-accent); background:var(--c-accent-soft,rgba(143,122,112,0.06)); }
.co-upload.is-loading{ cursor:default; opacity:.7; }

.co-error{
  margin-top:20px; background:rgba(185,64,64,0.06); border:1px solid rgba(185,64,64,0.3);
  color:var(--c-error,#b94040); border-radius:var(--radius,0.3rem); padding:12px 15px; font-size:13.5px;
}

.co-actions{ margin-top:26px; display:flex; flex-direction:column; align-items:center; gap:12px; }
.co-note{ font-size:12px; color:var(--c-text-faint,#9a8f86); margin:0; }

.co-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer;
  font-family:var(--font-montserrat,var(--font-dmsans)); font-size:12.5px; letter-spacing:0.14em; text-transform:uppercase;
  font-weight:600; padding:15px 34px; border-radius:var(--radius,0.3rem); text-decoration:none; border:1px solid transparent;
  transition:background .2s ease, color .2s ease, border-color .2s ease, opacity .2s ease;
}
.co-btn--solid{ background:var(--c-accent); color:#fff; }
.co-btn--solid:hover{ background:var(--c-text); }
.co-btn--solid:disabled{ opacity:.6; cursor:default; }
.co-btn--ghost{ background:transparent; color:var(--c-text); border-color:var(--c-border); }
.co-btn--ghost:hover{ border-color:var(--c-accent); color:var(--c-accent); }
.co-submit{ min-width:220px; }

.co-done{ text-align:center; padding:60px 16px; max-width:560px; margin:0 auto; }
.co-done-ic{
  width:66px; height:66px; border-radius:50%; margin:0 auto 22px; display:flex; align-items:center; justify-content:center;
  background:var(--c-accent-soft,rgba(143,122,112,0.1)); color:var(--c-accent); border:1px solid var(--c-border);
}
.co-done-h{ font-family:var(--font-main); font-weight:400; font-size:clamp(26px,4vw,36px); margin:0 0 14px; color:var(--c-text); }
.co-done-p{ font-size:15px; line-height:1.75; color:var(--c-text-muted,#6b625b); margin:0 0 28px; }
.co-done-cta{ display:flex; flex-wrap:wrap; gap:12px; justify-content:center; }
`
