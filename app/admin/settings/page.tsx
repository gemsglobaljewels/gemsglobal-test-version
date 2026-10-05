'use client'

import { useState, useEffect } from 'react'
import {
  Upload, Smartphone, AlertCircle, X, Check, Save, Mail,
  Globe, MapPin, Share2, ShoppingCart, Image as ImageIcon,
  Search, Zap
} from 'lucide-react'
import { fetchAndSyncSettings } from '@/lib/authStore'
import { supabase } from '@/lib/supabase'

interface SiteSettings {
  logo_text: string; logo_em: string; logo_url: string; favicon_url: string
  site_name: string; site_title: string; site_description: string; site_keywords: string
  whatsapp_number: string; contact_email: string
  india_contact: string; canada_contact: string
  india_address: string; canada_address: string
  instagram_url: string; youtube_url: string; pinterest_url: string; etsy_url: string
  payment_logos: string
  usd_inr_rate: string
}

const TABS = [
  { id: 'brand', label: 'Brand Identity', icon: <ImageIcon size={14} strokeWidth={1.5} />, sub: 'Logos & naming' },
  { id: 'seo', label: 'SEO & Meta', icon: <Search size={14} strokeWidth={1.5} />, sub: 'Search optimization' },
  { id: 'contact', label: 'Contact', icon: <Mail size={14} strokeWidth={1.5} />, sub: 'Phone, email, address' },
  { id: 'social', label: 'Social Media', icon: <Share2 size={14} strokeWidth={1.5} />, sub: 'Platform links' },
  { id: 'payments', label: 'Payments', icon: <ShoppingCart size={14} strokeWidth={1.5} />, sub: 'Card logos' },
  { id: 'currency', label: 'Currency', icon: <Globe size={14} strokeWidth={1.5} />, sub: 'USD → INR rate' },
]

const PAGE_META: Record<string, { title: string; em: string; desc: string }> = {
  brand: { title: 'Brand ', em: 'Identity', desc: 'Site name, text logo and graphical assets' },
  seo: { title: 'SEO & ', em: 'Meta Tags', desc: 'Page title template, description and keywords' },
  contact: { title: 'Contact ', em: 'Details', desc: 'Phone numbers, email and office addresses' },
  social: { title: 'Social ', em: 'Media', desc: 'Instagram, YouTube, Pinterest and Etsy links' },
  payments: { title: 'Payment ', em: 'Gateways', desc: 'Footer payment card logos' },
  currency: { title: 'Currency ', em: 'Rate', desc: 'Fixed USD → INR rate for the whole site' },
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="a-label">{children}</span>
)

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState('brand')
  const [toast, setToast] = useState({ msg: '', err: false, show: false })
  const [settings, setSettings] = useState<SiteSettings>({
    logo_text: '', logo_em: '', logo_url: '', favicon_url: '',
    site_name: '', site_title: '', site_description: '', site_keywords: '',
    whatsapp_number: '', contact_email: '',
    india_contact: '', canada_contact: '',
    india_address: '', canada_address: '',
    instagram_url: '', youtube_url: '', pinterest_url: '', etsy_url: '',
    payment_logos: '[]',
    usd_inr_rate: '',
  })
  const [liveRate, setLiveRate] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('site_settings').select('*')
        if (error) throw error
        const mapped = data.reduce((acc: any, item: any) => { acc[item.key] = item.value; return acc }, {})
        setSettings(p => ({ ...p, ...mapped }))
      } catch (e: any) { showToast(e.message || 'Failed to load settings', true) }
      finally { setLoading(false) }
    }
    load()
    // Live market rate for reference (independent of any fixed rate).
    fetch('/api/exchange-rate?live=1', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const v = Number(d?.rate)
        if (isFinite(v) && v > 0) setLiveRate(String(Math.round(v * 100) / 100))
      })
      .catch(() => { })
  }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err, show: true })
    setTimeout(() => setToast(p => ({ ...p, show: false })), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Write via the admin-guarded API (service role) instead of a direct
      // anon upsert — site_settings is now protected by RLS (public read only).
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Update failed')
      }
      await fetchAndSyncSettings()
      // Keep every admin tab on the same rate immediately.
      try {
        const r = Number((settings as any).usd_inr_rate)
        if (isFinite(r) && r > 0) localStorage.setItem('admin_fx_rate', String(r))
      } catch { }
      showToast('Settings updated successfully')
    } catch (e: any) { showToast(e.message || 'Update failed', true) }
    finally { setSaving(false) }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/storage/upload-logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      set('logo_url', data.url); showToast('Logo uploaded')
    } catch (e: any) { showToast(e.message || 'Upload failed', true) }
    finally { setUploading(false) }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const validTypes = ['image/x-icon', 'image/png', 'image/svg+xml', 'image/vnd.microsoft.icon']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.ico')) { showToast('Invalid file type. Please use ICO, PNG or SVG.', true); return }
    if (file.size > 512 * 1024) { showToast('File too large. Max 512KB for favicon.', true); return }
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/storage/upload-favicon', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      set('favicon_url', data.url); showToast('Favicon uploaded')
    } catch (e: any) { showToast(e.message || 'Upload failed', true) }
    finally { setUploading(false) }
  }

  const handlePaymentLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/storage/upload-logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const cur = JSON.parse(settings.payment_logos || '[]')
      set('payment_logos', JSON.stringify([...cur, data.url]))
      showToast('Payment logo added')
    } catch (e: any) { showToast(e.message || 'Upload failed', true) }
    finally { setUploading(false) }
  }

  const removePaymentLogo = (i: number) => {
    const cur = JSON.parse(settings.payment_logos || '[]')
    set('payment_logos', JSON.stringify(cur.filter((_: any, idx: number) => idx !== i)))
  }

  const set = (key: keyof SiteSettings, val: string) =>
    setSettings(p => ({ ...p, [key]: val }))

  if (loading) return null

  const meta = PAGE_META[tab]

  return (
    <div className="a-page">
      <style>{`
        .as-upzone {
          border: 1px dashed var(--c-border-strong);
          border-radius: var(--radius);
          padding: 14px 16px;
          background: var(--c-surface);
          transition: border-color 0.25s ease, background 0.25s ease;
        }
        .as-upzone:hover { border-color: rgba(var(--c-accent-rgb),0.45); background: var(--c-surface-2); }
        .as-uprow { display: flex; align-items: center; gap: 12px; }
        .as-up-meta p { font-size: 11px; color: var(--c-text-muted); line-height: 1.6; }
        .as-up-sep { width: 1px; height: 26px; background: var(--c-border); flex-shrink: 0; }
        .as-img-wrap { position: relative; width: 88px; height: 44px; flex-shrink: 0; }
        .as-img-wrap img { width: 100%; height: 100%; object-fit: contain; border-radius: 4px; }
        .as-remove {
          position: absolute; top: -7px; right: -7px;
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--c-danger); color: #fff; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: transform 0.2s ease, filter 0.2s ease;
          box-shadow: var(--shadow-sm);
        }
        .as-remove:hover { transform: scale(1.12); filter: brightness(1.08); }
        .as-logo-prev {
          height: 74px; border-radius: var(--radius);
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          display: flex; align-items: center; justify-content: center;
        }
        .as-logo-prev-text { font-family: var(--font-main); font-size: 26px; font-weight: 300; color: var(--c-text); }
        .as-logo-prev-em { font-style: italic; color: var(--c-accent); }
        .as-pgrid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
          gap: 10px; margin-top: 14px;
        }
        .as-pcard {
          position: relative; background: var(--c-surface);
          border: 1px solid var(--c-border); border-radius: var(--radius-sm);
          padding: 8px; aspect-ratio: 3/2;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s ease;
        }
        .as-pcard:hover { border-color: rgba(var(--c-accent-rgb),0.28); }
        .as-pcard img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .as-toast {
          position: fixed; bottom: 28px; left: 50%;
          transform: translateX(-50%) translateY(70px);
          z-index: 999; transition: transform 0.42s cubic-bezier(0.19,1,0.22,1), opacity 0.42s;
          opacity: 0; pointer-events: none;
        }
        .as-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
        .as-toast-inner {
          background: #fff; border: 1px solid var(--c-border);
          border-radius: 50px; padding: 10px 20px;
          display: flex; align-items: center; gap: 10px;
          box-shadow: var(--shadow-lg);
        }
        .as-toast-inner.err { border-color: var(--c-danger); }
        .as-toast-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .as-toast-dot.ok { background: var(--c-success-bg); color: var(--c-success); }
        .as-toast-dot.err { background: var(--c-danger-bg); color: var(--c-danger); }
        .as-toast-msg { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--c-text); }
      `}</style>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Admin · Configuration</div>
          <h1 className="a-title">Site <em>Settings</em></h1>
          <p className="a-subtitle">Configure brand, SEO, contact, social, payment and currency options</p>
        </div>
        <div className="a-head-actions">
          <button className="a-btn a-btn--primary" onClick={handleSave} disabled={saving}>
            <Save size={15} strokeWidth={2} />
            <span>{saving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="a-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`a-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ margin: '20px 0 22px' }}>
        <div className="a-row a-row--between" style={{ gap: 14 }}>
          <div className="a-section-title" style={{ margin: 0, flex: 'unset' }}>{meta.title}<em style={{ fontStyle: 'italic', color: 'var(--c-accent)' }}>{meta.em}</em></div>
          <span className="a-muted" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {TABS.findIndex(t => t.id === tab) + 1} / {TABS.length}
          </span>
        </div>
        <p className="a-muted" style={{ marginTop: 6 }}>{meta.desc}</p>
      </div>

      {tab === 'brand' && (
        <div className="a-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="a-card">
            <div className="a-card-head">
              <div>
                <div className="a-card-title">Brand <em>Name</em></div>
                <div className="a-card-sub">Site name & text logo</div>
              </div>
              <Zap size={16} strokeWidth={1.5} style={{ color: 'var(--c-accent)' }} />
            </div>
            <div className="a-card-body">
              <div className="a-field">
                <Label>Public Site Name</Label>
                <input className="a-input" type="text" value={settings.site_name}
                  onChange={e => set('site_name', e.target.value)} placeholder="Gems Global Jewels" />
              </div>
              <div className="a-form-grid">
                <div className="a-field">
                  <Label>Logo Primary Text</Label>
                  <input className="a-input" type="text" value={settings.logo_text}
                    onChange={e => set('logo_text', e.target.value)} placeholder="e.g. Gems" />
                </div>
                <div className="a-field">
                  <Label>Logo Emphasis</Label>
                  <input className="a-input" type="text" value={settings.logo_em}
                    onChange={e => set('logo_em', e.target.value)} placeholder="e.g. Global" />
                </div>
              </div>
              <div className="a-field" style={{ marginTop: 16 }}>
                <Label>Preview</Label>
                <div className="as-logo-prev">
                  <span className="as-logo-prev-text">
                    {settings.logo_text || (!settings.logo_em ? (settings.site_name || 'Brand') : '')}
                    <em className="as-logo-prev-em">{settings.logo_em}</em>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="a-card">
            <div className="a-card-head">
              <div>
                <div className="a-card-title">Graphical <em>Assets</em></div>
                <div className="a-card-sub">Logo & favicon files</div>
              </div>
              <Upload size={16} strokeWidth={1.5} style={{ color: 'var(--c-accent)' }} />
            </div>
            <div className="a-card-body">
              <div className="a-field">
                <Label>Graphical Logo</Label>
                <div className="as-upzone">
                  <div className="as-uprow">
                    {settings.logo_url ? (
                      <div className="as-img-wrap">
                        <img src={settings.logo_url} alt="Logo" />
                        <button className="as-remove" onClick={() => set('logo_url', '')}><X size={9} strokeWidth={3} /></button>
                      </div>
                    ) : (
                      <label className="a-btn a-btn--subtle a-btn--sm" style={{ cursor: 'pointer' }}>
                        <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                        <Upload size={13} strokeWidth={2} />
                        <span>{uploading ? 'Uploading…' : 'Upload'}</span>
                      </label>
                    )}
                    <div className="as-up-sep" />
                    <div className="as-up-meta">
                      <p>PNG or SVG · height 60px recommended</p>
                      <p>Overrides text logo when set</p>
                    </div>
                  </div>
                </div>
              </div>
              <hr className="a-divider" />
              <div className="a-field">
                <Label>Favicon</Label>
                <div className="as-upzone">
                  <div className="as-uprow">
                    {settings.favicon_url ? (
                      <div className="as-img-wrap">
                        <img src={settings.favicon_url} alt="Favicon" />
                        <button className="as-remove" onClick={() => set('favicon_url', '')}><X size={9} strokeWidth={3} /></button>
                      </div>
                    ) : (
                      <label className="a-btn a-btn--subtle a-btn--sm" style={{ cursor: 'pointer' }}>
                        <input type="file" accept=".ico,image/png,image/svg+xml" hidden onChange={handleFaviconUpload} />
                        <Upload size={13} strokeWidth={2} />
                        <span>{uploading ? 'Uploading…' : 'Upload'}</span>
                      </label>
                    )}
                    <div className="as-up-sep" />
                    <div className="as-up-meta">
                      <p>ICO, PNG or SVG · 32×32px</p>
                      <p>Appears in browser tabs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'seo' && (
        <div className="a-card" style={{ maxWidth: 680 }}>
          <div className="a-card-head">
            <div>
              <div className="a-card-title">Meta <em>Tags</em></div>
              <div className="a-card-sub">Page title, description & keywords</div>
            </div>
            <Search size={16} strokeWidth={1.5} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div className="a-card-body">
            <div className="a-field">
              <Label>Page Title Template</Label>
              <input className="a-input" type="text" value={settings.site_title}
                onChange={e => set('site_title', e.target.value)} placeholder="Brand | Luxury Jewellery" />
              <p className="a-hint">Shown in browser tabs and search engine results</p>
            </div>
            <div className="a-field">
              <Label>Meta Description</Label>
              <textarea className="a-textarea" rows={3} value={settings.site_description}
                onChange={e => set('site_description', e.target.value)}
                placeholder="Exquisite handmade jewelry crafted with the finest stones..." />
              <p className="a-hint">Recommended 150–160 characters for best results</p>
            </div>
            <div className="a-field">
              <Label>Keywords</Label>
              <input className="a-input" type="text" value={settings.site_keywords}
                onChange={e => set('site_keywords', e.target.value)} placeholder="jewelry, rings, diamond, handmade..." />
              <p className="a-hint">Comma-separated keyword list</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'contact' && (
        <div className="a-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="a-card">
            <div className="a-card-head">
              <div>
                <div className="a-card-title">Contact <em>Channels</em></div>
                <div className="a-card-sub">Phone & email</div>
              </div>
              <Smartphone size={16} strokeWidth={1.5} style={{ color: 'var(--c-accent)' }} />
            </div>
            <div className="a-card-body">
              <div className="a-field">
                <Label>WhatsApp (Primary)</Label>
                <div className="a-input-wrap">
                  <span className="a-input-ico">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                    </svg>
                  </span>
                  <input className="a-input" type="tel" value={settings.whatsapp_number}
                    onChange={e => set('whatsapp_number', e.target.value)} placeholder="+91 00000 00000" />
                </div>
              </div>
              <div className="a-field">
                <Label>India Contact</Label>
                <div className="a-input-wrap">
                  <span className="a-input-ico"><Smartphone size={14} strokeWidth={1.5} /></span>
                  <input className="a-input" type="tel" value={settings.india_contact}
                    onChange={e => set('india_contact', e.target.value)} placeholder="+91 72010 04243" />
                </div>
              </div>
              <div className="a-field">
                <Label>Canada Contact</Label>
                <div className="a-input-wrap">
                  <span className="a-input-ico"><Smartphone size={14} strokeWidth={1.5} /></span>
                  <input className="a-input" type="tel" value={settings.canada_contact}
                    onChange={e => set('canada_contact', e.target.value)} placeholder="+1 (226) 899-2997" />
                </div>
              </div>
              <div className="a-field">
                <Label>Email</Label>
                <div className="a-input-wrap">
                  <span className="a-input-ico"><Mail size={14} strokeWidth={1.5} /></span>
                  <input className="a-input" type="email" value={settings.contact_email}
                    onChange={e => set('contact_email', e.target.value)} placeholder="concierge@brand.com" />
                </div>
              </div>
            </div>
          </div>

          <div className="a-card">
            <div className="a-card-head">
              <div>
                <div className="a-card-title">Office <em>Addresses</em></div>
                <div className="a-card-sub">India & Canada locations</div>
              </div>
              <MapPin size={16} strokeWidth={1.5} style={{ color: 'var(--c-accent)' }} />
            </div>
            <div className="a-card-body">
              <div className="a-field">
                <Label>India Address</Label>
                <textarea className="a-textarea" rows={3} value={settings.india_address}
                  onChange={e => set('india_address', e.target.value)} placeholder="1011, Cyber City..." />
              </div>
              <div className="a-field">
                <Label>Canada Address</Label>
                <textarea className="a-textarea" rows={3} value={settings.canada_address}
                  onChange={e => set('canada_address', e.target.value)} placeholder="60, Grassbourne Ave..." />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'social' && (
        <div className="a-card" style={{ maxWidth: 680 }}>
          <div className="a-card-head">
            <div>
              <div className="a-card-title">Social <em>Links</em></div>
              <div className="a-card-sub">Online platform presence</div>
            </div>
            <Share2 size={16} strokeWidth={1.5} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div className="a-card-body">
            {[
              { key: 'instagram_url' as keyof SiteSettings, label: 'Instagram', placeholder: 'https://www.instagram.com/...' },
              { key: 'youtube_url' as keyof SiteSettings, label: 'YouTube', placeholder: 'https://www.youtube.com/...' },
              { key: 'pinterest_url' as keyof SiteSettings, label: 'Pinterest', placeholder: 'https://in.pinterest.com/...' },
              { key: 'etsy_url' as keyof SiteSettings, label: 'Etsy Shop', placeholder: 'https://www.etsy.com/shop/...' },
            ].map(({ key, label, placeholder }) => (
              <div className="a-field" key={key}>
                <Label>{label}</Label>
                <div className="a-row" style={{ gap: 8 }}>
                  <div className="a-input-wrap" style={{ flex: 1 }}>
                    <span className="a-input-ico"><Globe size={14} strokeWidth={1.5} /></span>
                    <input className="a-input" type="url" value={settings[key]}
                      onChange={e => set(key, e.target.value)} placeholder={placeholder} />
                  </div>
                  {settings[key] && (
                    <button className="a-btn a-btn--ghost a-btn--sm" onClick={() => set(key, '')}>Clear</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="a-card" style={{ maxWidth: 680 }}>
          <div className="a-card-head">
            <div>
              <div className="a-card-title">Payment <em>Logos</em></div>
              <div className="a-card-sub">Footer card & gateway icons</div>
            </div>
            <ShoppingCart size={16} strokeWidth={1.5} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div className="a-card-body">
            <div className="a-field">
              <Label>Card Logos</Label>
              <div className="as-upzone">
                <div className="as-uprow">
                  <label className="a-btn a-btn--subtle a-btn--sm" style={{ cursor: 'pointer' }}>
                    <input type="file" accept="image/*" hidden onChange={handlePaymentLogoUpload} />
                    <Upload size={13} strokeWidth={2} />
                    <span>{uploading ? 'Uploading…' : 'Add Logo'}</span>
                  </label>
                  <div className="as-up-sep" />
                  <div className="as-up-meta">
                    <p>Add Visa, Mastercard, UPI, etc.</p>
                    <p>SVG or PNG recommended</p>
                  </div>
                </div>
              </div>
              <div className="as-pgrid">
                {(() => {
                  try {
                    return JSON.parse(settings.payment_logos || '[]').map((url: string, i: number) => (
                      <div key={i} className="as-pcard">
                        <img src={url} alt="Payment logo" />
                        <button className="as-remove" onClick={() => removePaymentLogo(i)}>
                          <X size={9} strokeWidth={3} />
                        </button>
                      </div>
                    ))
                  } catch { return null }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'currency' && (
        <div className="a-card" style={{ maxWidth: 680 }}>
          <div className="a-card-head">
            <div>
              <div className="a-card-title">Currency <em>Rate</em></div>
              <div className="a-card-sub">USD → INR for the whole site</div>
            </div>
            <Globe size={16} strokeWidth={1.5} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div className="a-card-body">
            <div className="a-field">
              <Label>Fixed USD → INR Rate (optional)</Label>
              <input className="a-input" type="number" step="0.01" min="0"
                value={settings.usd_inr_rate}
                onChange={e => set('usd_inr_rate', e.target.value)}
                placeholder="e.g. 94.81" />
              <p className="a-hint">
                When set, EVERY price on the site — storefront, admin, checkout — uses this rate.
                Empty means live market rate (right now {liveRate ? `₹${liveRate}` : '…'} per $1).
              </p>
            </div>
            <div className="a-field">
              <Label>Quick actions</Label>
              <div className="a-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="a-btn a-btn--subtle a-btn--sm"
                  disabled={!liveRate}
                  onClick={() => set('usd_inr_rate', liveRate)}>
                  Use live rate ({liveRate ? `₹${liveRate}` : '…'})
                </button>
                {settings.usd_inr_rate && (
                  <button type="button" className="a-btn a-btn--ghost a-btn--sm"
                    onClick={() => set('usd_inr_rate', '')}>
                    Clear (back to live)
                  </button>
                )}
              </div>
              <p className="a-hint">Press Save Changes on top to apply. New fixed rate applies everywhere within a minute.</p>
            </div>
          </div>
        </div>
      )}

      <div className={`as-toast${toast.show ? ' show' : ''}`}>
        <div className={`as-toast-inner${toast.err ? ' err' : ''}`}>
          <div className={`as-toast-dot ${toast.err ? 'err' : 'ok'}`}>
            {toast.err ? <AlertCircle size={12} /> : <Check size={12} />}
          </div>

          <span className="as-toast-msg">{toast.msg}</span>
        </div>
      </div>
    </div>
  )
}
