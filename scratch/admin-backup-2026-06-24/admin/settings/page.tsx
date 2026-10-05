'use client'

import { useState, useEffect } from 'react'
import {
  Upload, Smartphone, AlertCircle, X, Check, Save, Mail,
  Globe, Settings, MapPin, Share2, ShoppingCart, Image as ImageIcon,
  Search, Zap
} from 'lucide-react'
import { fetchAndSyncSettings } from '@/lib/authStore'
import { supabase } from '@/lib/supabase'

const CSS = `

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.as-root {
  width: 100%;
  min-height: 100vh;
  background: var(--c-bg);
  font-family: var(--font-main);
  color: var(--c-text);
  display: flex;
  flex-direction: column;
}

.as-topbar {
  position: sticky; top: 0; z-index: 300;
  height: 62px; padding: 0 40px;
  background: rgba(250,245,235,0.95);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.as-topbar-l { display: flex; align-items: center; gap: 14px; }
.as-topbar-badge {
  width: 34px; height: 34px; border-radius: 8px;
  background: rgba(var(--c-accent-rgb),0.12);
  border: 1px solid rgba(var(--c-accent-rgb),0.2);
  display: flex; align-items: center; justify-content: center;
  color: var(--c-accent);
}
.as-topbar-title {
  font-family: var(--font-main);
  font-size: 21px; font-weight: 300; color: var(--c-text);
  letter-spacing: -0.01em;
}
.as-topbar-title em { font-style: italic; color: var(--c-accent); }
.as-breadcrumb {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--c-text-muted); margin-left: 2px;
}
.as-topbar-r { display: flex; align-items: center; gap: 10px; }
.as-chip {
  padding: 5px 13px; border-radius: 50px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--c-text-muted);
  display: flex; align-items: center; gap: 6px;
}
.as-chip-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--c-accent); opacity: 0.8; }
.as-save-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 22px; border-radius: 50px; border: none; cursor: pointer;
  background: var(--c-accent);
  font-family: var(--font-main);
  font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: #080604;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.as-save-btn:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); background: var(--c-text); }
.as-save-btn:active { transform: translateY(0); }
.as-save-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

.as-layout { display: flex; flex: 1; min-height: 0; }

.as-sidebar {
  width: 220px; flex-shrink: 0;
  border-right: 1px solid var(--c-border);
  padding: 28px 0;
  display: flex; flex-direction: column;
}
.as-sidebar-label {
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em;
  color: var(--c-text-muted);
  padding: 0 20px; margin-bottom: 10px;
}
.as-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; margin: 1px 8px; border-radius: 7px;
  border: 1px solid transparent; background: transparent; cursor: pointer;
  font-family: var(--font-main);
  font-size: 12px; font-weight: 400; letter-spacing: 0.03em;
  color: var(--c-text-muted);
  transition: all 0.22s; text-align: left; width: calc(100% - 16px);
}
.as-nav-item:hover { background: var(--c-surface); color: var(--c-text); }
.as-nav-item.active {
  background: rgba(var(--c-accent-rgb),0.08);
  border-color: rgba(var(--c-accent-rgb),0.15);
  color: var(--c-accent);
}
.as-nav-icon { color: rgba(var(--c-accent-rgb),0.45); flex-shrink: 0; transition: color 0.2s; }
.as-nav-item.active .as-nav-icon { color: var(--c-accent); }
.as-nav-sub {
  font-size: 10px; color: var(--c-text-muted); margin-top: 1px;
  font-weight: 300; letter-spacing: 0.02em;
}
.as-nav-item.active .as-nav-sub { color: rgba(var(--c-accent-rgb),0.6); }

.as-content {
  flex: 1; min-width: 0;
  padding: 36px 44px 80px;
  overflow-y: auto;
}
.as-page-hdr {
  margin-bottom: 30px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--c-border);
  display: flex; align-items: flex-end; justify-content: space-between;
}
.as-page-hdr h2 {
  font-family: var(--font-main);
  font-size: 34px; font-weight: 300; color: var(--c-text);
  letter-spacing: -0.02em; line-height: 1;
}
.as-page-hdr h2 em { font-style: italic; color: var(--c-accent); }
.as-page-hdr p { font-size: 12px; color: var(--c-text-muted); margin-top: 7px; }
.as-page-count {
  font-family: var(--font-main);
  font-size: 13px; color: var(--c-text-muted); font-style: italic;
}

.as-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.as-grid1 { display: grid; grid-template-columns: 1fr; gap: 20px; max-width: 640px; }
.as-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 900px) { .as-grid2 { grid-template-columns: 1fr; } }

.as-card {
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  background: #fff;
  overflow: hidden;
  transition: border-color 0.25s, background 0.25s;
  box-shadow: var(--shadow-md);
}
.as-card:hover { border-color: rgba(var(--c-accent-rgb),0.25); }

.as-card-head {
  padding: 17px 22px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
  display: flex; align-items: center; gap: 12px;
}
.as-card-ico {
  width: 32px; height: 32px; border-radius: 7px; flex-shrink: 0;
  background: rgba(var(--c-accent-rgb),0.08);
  border: 1px solid rgba(var(--c-accent-rgb),0.15);
  display: flex; align-items: center; justify-content: center;
  color: var(--c-accent);
}
.as-card-title {
  font-family: var(--font-main);
  font-size: 17px; font-weight: 400; color: var(--c-text);
}
.as-card-title em { font-style: italic; color: var(--c-accent); }
.as-card-sub { font-size: 10px; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.07em; margin-top: 1px; }

.as-card-body { padding: 22px; }

.as-field { margin-bottom: 18px; }
.as-field:last-child { margin-bottom: 0; }

.as-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.13em; color: rgba(var(--c-accent-rgb),0.6);
  margin-bottom: 7px; display: block;
}
.as-hint { font-size: 10px; color: var(--c-text-muted); margin-top: 5px; font-style: italic; line-height: 1.5; }

.as-input, .as-textarea {
  width: 100%; display: block;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius); padding: 10px 14px;
  color: var(--c-text);
  font-family: var(--font-main); font-size: 13px;
  outline: none;
  transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;
}
.as-input::placeholder, .as-textarea::placeholder { color: var(--c-text-muted); }
.as-input:focus, .as-textarea:focus {
  border-color: var(--c-accent);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb),0.08);
}
.as-textarea { resize: vertical; }

.as-irow {
  display: flex; align-items: center; gap: 10px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius); padding: 0 14px;
  transition: border-color 0.22s, background 0.22s;
}
.as-irow:focus-within { border-color: var(--c-accent); background: #fff; }
.as-irow-icon { color: rgba(var(--c-accent-rgb),0.5); flex-shrink: 0; }
.as-irow input {
  flex: 1; background: transparent; border: none; outline: none;
  padding: 10px 0; color: var(--c-text);
  font-family: var(--font-main); font-size: 13px;
}
.as-irow input::placeholder { color: var(--c-text-muted); }
.as-irow-clear {
  background: transparent; border: none; cursor: pointer;
  font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(239,68,68,0.55); padding: 3px; transition: color 0.2s;
}
.as-irow-clear:hover { color: #e74c3c; }

.as-upzone {
  border: 1px dashed var(--c-border);
  border-radius: var(--radius); padding: 14px 16px;
  background: rgba(var(--c-accent-rgb),0.02);
  transition: border-color 0.25s, background 0.25s;
}
.as-upzone:hover { border-color: rgba(var(--c-accent-rgb),0.45); background: rgba(var(--c-accent-rgb),0.04); }
.as-uprow { display: flex; align-items: center; gap: 12px; }
.as-up-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 14px; border-radius: 5px;
  background: rgba(var(--c-accent-rgb),0.1);
  border: 1px solid rgba(var(--c-accent-rgb),0.2);
  color: var(--c-accent);
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
  cursor: pointer; transition: all 0.22s; flex-shrink: 0;
}
.as-up-btn:hover { background: var(--c-accent); color: #080604; border-color: var(--c-accent); }
.as-up-sep { width: 1px; height: 26px; background: var(--c-border); flex-shrink: 0; }
.as-up-meta p { font-size: 10px; color: var(--c-text-muted); line-height: 1.6; }

.as-img-wrap { position: relative; width: 88px; height: 44px; }
.as-img-wrap img { width: 100%; height: 100%; object-fit: contain; border-radius: 4px; }
.as-remove {
  position: absolute; top: -7px; right: -7px;
  width: 17px; height: 17px; border-radius: 50%;
  background: #c0392b; color: #fff; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: transform 0.2s, background 0.2s;
}
.as-remove:hover { transform: scale(1.15); background: #e74c3c; }

.as-logo-prev {
  height: 74px; border-radius: var(--radius);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.as-logo-prev-text {
  font-family: var(--font-main);
  font-size: 26px; font-weight: 300; color: var(--c-text);
}
.as-logo-prev-em { font-style: italic; color: var(--c-accent); }

.as-pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px; margin-top: 14px;
}
.as-pcard {
  position: relative;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 7px; padding: 8px;
  aspect-ratio: 3/2;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.2s;
}
.as-pcard:hover { border-color: rgba(var(--c-accent-rgb),0.28); }
.as-pcard img { max-width: 100%; max-height: 100%; object-fit: contain; }
.as-pcard .as-remove { top: -6px; right: -6px; }

.as-hr { height: 1px; background: var(--c-border); margin: 18px 0; }

.as-toast {
  position: fixed; bottom: 28px; left: 50%;
  transform: translateX(-50%) translateY(70px);
  z-index: 999; transition: transform 0.42s cubic-bezier(0.19,1,0.22,1), opacity 0.42s;
  opacity: 0; pointer-events: none;
}
.as-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
.as-toast-inner {
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: 50px; padding: 10px 20px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: var(--shadow-md);
}
.as-toast-inner.err { border-color: rgba(239,68,68,0.35); }
.as-toast-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.as-toast-dot.ok { background: rgba(var(--c-accent-rgb),0.1); color: var(--c-accent); }
.as-toast-dot.err { background: rgba(239,68,68,0.12); color: #e74c3c; }
.as-toast-msg { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--c-text); }

@media (max-width: 768px) {
  .as-sidebar { display: none; }
  .as-content { padding: 24px 20px 60px; }
  .as-topbar { padding: 0 20px; }
  .as-chip { display: none; }
}
`

interface SiteSettings {
  logo_text: string; logo_em: string; logo_url: string; favicon_url: string
  site_name: string; site_title: string; site_description: string; site_keywords: string
  whatsapp_number: string; contact_email: string
  india_contact: string; canada_contact: string
  india_address: string; canada_address: string
  instagram_url: string; youtube_url: string; pinterest_url: string; etsy_url: string
  payment_logos: string
}

const TABS = [
  { id: 'brand', label: 'Brand Identity', icon: <ImageIcon size={14} strokeWidth={1.5} />, sub: 'Logos & naming' },
  { id: 'seo', label: 'SEO & Meta', icon: <Search size={14} strokeWidth={1.5} />, sub: 'Search optimization' },
  { id: 'contact', label: 'Contact', icon: <Mail size={14} strokeWidth={1.5} />, sub: 'Phone, email, address' },
  { id: 'social', label: 'Social Media', icon: <Share2 size={14} strokeWidth={1.5} />, sub: 'Platform links' },
  { id: 'payments', label: 'Payments', icon: <ShoppingCart size={14} strokeWidth={1.5} />, sub: 'Card logos' },
]

const PAGE_META: Record<string, { title: string; em: string; desc: string }> = {
  brand: { title: 'Brand ', em: 'Identity', desc: 'Site name, text logo and graphical assets' },
  seo: { title: 'SEO & ', em: 'Meta Tags', desc: 'Page title template, description and keywords' },
  contact: { title: 'Contact ', em: 'Details', desc: 'Phone numbers, email and office addresses' },
  social: { title: 'Social ', em: 'Media', desc: 'Instagram, YouTube, Pinterest and Etsy links' },
  payments: { title: 'Payment ', em: 'Gateways', desc: 'Footer payment card logos' },
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="as-label">{children}</span>
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
  })

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
  }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err, show: true })
    setTimeout(() => setToast(p => ({ ...p, show: false })), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))
      const { error } = await supabase.from('site_settings').upsert(updates, { onConflict: 'key' })
      if (error) throw error
      await fetchAndSyncSettings()
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
    <div className="as-root">
      <style>{CSS}</style>

      <div className="as-topbar">
        <div className="as-topbar-l">
          <div className="as-topbar-badge"><Settings size={15} strokeWidth={1.5} /></div>
          <div>
            <div className="as-topbar-title">Site <em>Settings</em></div>
            <div className="as-breadcrumb">Admin · Configuration</div>
          </div>
        </div>
        <div className="as-topbar-r">
          <div className="as-chip">
            <span className="as-chip-dot" />
            <span>All changes live</span>
          </div>
          <button className="as-save-btn" onClick={handleSave} disabled={saving}>
            <Save size={13} strokeWidth={2.5} />
            <span>{saving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="as-layout">
        <aside className="as-sidebar">
          <div className="as-sidebar-label">Configuration</div>
          {TABS.map(t => (
            <button key={t.id} className={`as-nav-item${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="as-nav-icon">{t.icon}</span>
              <div>
                <div>{t.label}</div>
                <div className="as-nav-sub">{t.sub}</div>
              </div>
            </button>
          ))}
        </aside>

        <main className="as-content">
          <div className="as-page-hdr">
            <div>
              <h2>{meta.title}<em>{meta.em}</em></h2>
              <p>{meta.desc}</p>
            </div>
            <div className="as-page-count">{TABS.findIndex(t => t.id === tab) + 1} / {TABS.length}</div>
          </div>

          {tab === 'brand' && (
            <div className="as-grid2">
              <div className="as-card">
                <div className="as-card-head">
                  <div className="as-card-ico"><Zap size={14} strokeWidth={1.5} /></div>
                  <div>
                    <div className="as-card-title">Brand <em>Name</em></div>
                    <div className="as-card-sub">Site name & text logo</div>
                  </div>
                </div>
                <div className="as-card-body">
                  <div className="as-field">
                    <Label>Public Site Name</Label>
                    <input className="as-input" type="text" value={settings.site_name}
                      onChange={e => set('site_name', e.target.value)} placeholder="Gems Global Jewels" />
                  </div>
                  <div className="as-row2">
                    <div className="as-field">
                      <Label>Logo Primary Text</Label>
                      <input className="as-input" type="text" value={settings.logo_text}
                        onChange={e => set('logo_text', e.target.value)} placeholder="e.g. Gems" />
                    </div>
                    <div className="as-field">
                      <Label>Logo Emphasis</Label>
                      <input className="as-input" type="text" value={settings.logo_em}
                        onChange={e => set('logo_em', e.target.value)} placeholder="e.g. Global" />
                    </div>
                  </div>
                  <div className="as-field">
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

              <div className="as-card">
                <div className="as-card-head">
                  <div className="as-card-ico"><Upload size={14} strokeWidth={1.5} /></div>
                  <div>
                    <div className="as-card-title">Graphical <em>Assets</em></div>
                    <div className="as-card-sub">Logo & favicon files</div>
                  </div>
                </div>
                <div className="as-card-body">
                  <div className="as-field">
                    <Label>Graphical Logo</Label>
                    <div className="as-upzone">
                      <div className="as-uprow">
                        {settings.logo_url ? (
                          <div className="as-img-wrap">
                            <img src={settings.logo_url} alt="Logo" />
                            <button className="as-remove" onClick={() => set('logo_url', '')}><X size={8} strokeWidth={3} /></button>
                          </div>
                        ) : (
                          <label className="as-up-btn">
                            <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                            <Upload size={12} strokeWidth={2} />
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
                  <div className="as-hr" />
                  <div className="as-field">
                    <Label>Favicon</Label>
                    <div className="as-upzone">
                      <div className="as-uprow">
                        {settings.favicon_url ? (
                          <div className="as-img-wrap">
                            <img src={settings.favicon_url} alt="Favicon" />
                            <button className="as-remove" onClick={() => set('favicon_url', '')}><X size={8} strokeWidth={3} /></button>
                          </div>
                        ) : (
                          <label className="as-up-btn">
                            <input type="file" accept=".ico,image/png,image/svg+xml" hidden onChange={handleFaviconUpload} />
                            <Upload size={12} strokeWidth={2} />
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
            <div className="as-grid1">
              <div className="as-card">
                <div className="as-card-head">
                  <div className="as-card-ico"><Search size={14} strokeWidth={1.5} /></div>
                  <div>
                    <div className="as-card-title">Meta <em>Tags</em></div>
                    <div className="as-card-sub">Page title, description & keywords</div>
                  </div>
                </div>
                <div className="as-card-body">
                  <div className="as-field">
                    <Label>Page Title Template</Label>
                    <input className="as-input" type="text" value={settings.site_title}
                      onChange={e => set('site_title', e.target.value)} placeholder="Brand | Luxury Jewellery" />
                    <p className="as-hint">Shown in browser tabs and search engine results</p>
                  </div>
                  <div className="as-field">
                    <Label>Meta Description</Label>
                    <textarea className="as-textarea" rows={3} value={settings.site_description}
                      onChange={e => set('site_description', e.target.value)}
                      placeholder="Exquisite handmade jewelry crafted with the finest stones..." />
                    <p className="as-hint">Recommended 150–160 characters for best results</p>
                  </div>
                  <div className="as-field">
                    <Label>Keywords</Label>
                    <input className="as-input" type="text" value={settings.site_keywords}
                      onChange={e => set('site_keywords', e.target.value)} placeholder="jewelry, rings, diamond, handmade..." />
                    <p className="as-hint">Comma-separated keyword list</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div className="as-grid2">
              <div className="as-card">
                <div className="as-card-head">
                  <div className="as-card-ico"><Smartphone size={14} strokeWidth={1.5} /></div>
                  <div>
                    <div className="as-card-title">Contact <em>Channels</em></div>
                    <div className="as-card-sub">Phone & email</div>
                  </div>
                </div>
                <div className="as-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="as-field">
                    <Label>WhatsApp (Primary)</Label>
                    <div className="as-irow">
                      <span className="as-irow-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                        </svg>
                      </span>
                      <input type="tel" value={settings.whatsapp_number}
                        onChange={e => set('whatsapp_number', e.target.value)} placeholder="+91 00000 00000" />
                    </div>
                  </div>
                  <div className="as-field">
                    <Label>India Contact</Label>
                    <div className="as-irow">
                      <span className="as-irow-icon"><Smartphone size={13} strokeWidth={1.5} /></span>
                      <input type="tel" value={settings.india_contact}
                        onChange={e => set('india_contact', e.target.value)} placeholder="+91 72010 04243" />
                    </div>
                  </div>
                  <div className="as-field">
                    <Label>Canada Contact</Label>
                    <div className="as-irow">
                      <span className="as-irow-icon"><Smartphone size={13} strokeWidth={1.5} /></span>
                      <input type="tel" value={settings.canada_contact}
                        onChange={e => set('canada_contact', e.target.value)} placeholder="+1 (226) 899-2997" />
                    </div>
                  </div>
                  <div className="as-field">
                    <Label>Email</Label>
                    <div className="as-irow">
                      <span className="as-irow-icon"><Mail size={13} strokeWidth={1.5} /></span>
                      <input type="email" value={settings.contact_email}
                        onChange={e => set('contact_email', e.target.value)} placeholder="concierge@brand.com" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="as-card">
                <div className="as-card-head">
                  <div className="as-card-ico"><MapPin size={14} strokeWidth={1.5} /></div>
                  <div>
                    <div className="as-card-title">Office <em>Addresses</em></div>
                    <div className="as-card-sub">India & Canada locations</div>
                  </div>
                </div>
                <div className="as-card-body">
                  <div className="as-field">
                    <Label>India Address</Label>
                    <textarea className="as-textarea" rows={3} value={settings.india_address}
                      onChange={e => set('india_address', e.target.value)} placeholder="1011, Cyber City..." />
                  </div>
                  <div className="as-field">
                    <Label>Canada Address</Label>
                    <textarea className="as-textarea" rows={3} value={settings.canada_address}
                      onChange={e => set('canada_address', e.target.value)} placeholder="60, Grassbourne Ave..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'social' && (
            <div className="as-grid1">
              <div className="as-card">
                <div className="as-card-head">
                  <div className="as-card-ico"><Share2 size={14} strokeWidth={1.5} /></div>
                  <div>
                    <div className="as-card-title">Social <em>Links</em></div>
                    <div className="as-card-sub">Online platform presence</div>
                  </div>
                </div>
                <div className="as-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { key: 'instagram_url' as keyof SiteSettings, label: 'Instagram', placeholder: 'https://www.instagram.com/...' },
                    { key: 'youtube_url' as keyof SiteSettings, label: 'YouTube', placeholder: 'https://www.youtube.com/...' },
                    { key: 'pinterest_url' as keyof SiteSettings, label: 'Pinterest', placeholder: 'https://in.pinterest.com/...' },
                    { key: 'etsy_url' as keyof SiteSettings, label: 'Etsy Shop', placeholder: 'https://www.etsy.com/shop/...' },
                  ].map(({ key, label, placeholder }) => (
                    <div className="as-field" key={key}>
                      <Label>{label}</Label>
                      <div className="as-irow">
                        <span className="as-irow-icon"><Globe size={13} strokeWidth={1.5} /></span>
                        <input type="url" value={settings[key]}
                          onChange={e => set(key, e.target.value)} placeholder={placeholder} />
                        {settings[key] && (
                          <button className="as-irow-clear" onClick={() => set(key, '')}>Clear</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div className="as-grid1">
              <div className="as-card">
                <div className="as-card-head">
                  <div className="as-card-ico"><ShoppingCart size={14} strokeWidth={1.5} /></div>
                  <div>
                    <div className="as-card-title">Payment <em>Logos</em></div>
                    <div className="as-card-sub">Footer card & gateway icons</div>
                  </div>
                </div>
                <div className="as-card-body">
                  <div className="as-field">
                    <Label>Card Logos</Label>
                    <div className="as-upzone">
                      <div className="as-uprow">
                        <label className="as-up-btn">
                          <input type="file" accept="image/*" hidden onChange={handlePaymentLogoUpload} />
                          <Upload size={12} strokeWidth={2} />
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
                                <X size={8} strokeWidth={3} />
                              </button>
                            </div>
                          ))
                        } catch { return null }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
