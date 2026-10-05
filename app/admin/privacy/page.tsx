'use client'

import { useEffect, useState } from 'react'
import { Save, AlertCircle, Sparkles, LayoutTemplate, FileText } from 'lucide-react'
import RichTextEditor from '@/components/RichTextEditor'
import { DEFAULT_PRIVACY, normalizePrivacy, LegalConfig } from '@/lib/privacy'

export default function AdminPrivacyPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)
  const [cfg, setCfg] = useState<LegalConfig>(DEFAULT_PRIVACY)

  useEffect(() => {
    fetch('/api/admin/privacy')
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setCfg(normalizePrivacy(d.config)) })
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const set = (k: keyof LegalConfig, v: string) => setCfg((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg }),
      })
      const d = await res.json()
      if (res.ok && !d.error) {
        setCfg(normalizePrivacy(d.config))
        showToast('Privacy page updated')
      } else throw new Error(d.error || 'Failed to update')
    } catch (e: any) {
      showToast(e.message, true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="a-page">
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Legal</div>
          <h1 className="a-title">Privacy <em>Policy</em></h1>
          <p className="a-subtitle">Manage the /privacy page — heading, last-updated line and the full policy text</p>
        </div>
        <div className="a-head-actions">
          <a className="a-btn a-btn--ghost" href="/privacy" target="_blank" rel="noopener noreferrer">View Page</a>
          <button className="a-btn a-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`a-badge ${toast.err ? 'a-badge--danger' : 'a-badge--accent'}`} style={{ marginBottom: 20 }}>
          {toast.err ? <AlertCircle size={14} /> : <Sparkles size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="a-stack">
        {/* ── PAGE HEADER ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><LayoutTemplate size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Page <em>Header</em></div><div className="a-card-sub">The hero band at the top of the page</div></div>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <div className="a-field"><label className="a-label">Eyebrow</label>
                <input className="a-input" value={cfg.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} placeholder="Legal" /></div>
              <div className="a-field"><label className="a-label">Last Updated</label>
                <input className="a-input" value={cfg.updated} onChange={(e) => set('updated', e.target.value)} placeholder="Last updated: 14 July 2026" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Title</label>
                <input className="a-input" value={cfg.title} onChange={(e) => set('title', e.target.value)} placeholder="Privacy Policy" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Subtitle (short lead line)</label>
                <textarea className="a-textarea" value={cfg.subtitle} onChange={(e) => set('subtitle', e.target.value)} rows={2} /></div>
            </div>
          </div>
        </div>

        {/* ── POLICY BODY ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><FileText size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Policy <em>Content</em></div><div className="a-card-sub">The full text — use headings, lists and links to structure it</div></div>
            </div>
          </div>
          <div className="a-card-body">
            <RichTextEditor value={cfg.body} onChange={(v) => set('body', v)} placeholder="Write the privacy policy here…" />
          </div>
        </div>
      </div>
    </div>
  )
}
