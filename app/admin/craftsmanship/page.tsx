'use client'

import { useEffect, useState } from 'react'
import {
  Save, Plus, Trash2, AlertCircle, Sparkles,
  ImageIcon, LayoutTemplate, Hammer, Megaphone,
  ArrowUp, ArrowDown, ArrowLeftRight, Eye, EyeOff,
} from 'lucide-react'
import {
  DEFAULT_CRAFTSMANSHIP,
  normalizeCraftsmanship,
  newSectionId,
  CraftsmanshipConfig,
  CraftsmanshipSection,
} from '@/lib/craftsmanship'

const CSS = `
.cr-a-thumb{ width:64px; height:64px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--c-border); background:#fff; flex-shrink:0; }
.cr-a-thumb--empty{ display:flex; align-items:center; justify-content:center; color:var(--c-text-faint); }
.cr-a-media-row{ display:flex; align-items:center; gap:14px; }
.cr-a-media-body{ flex:1; min-width:0; display:flex; flex-direction:column; gap:9px; }
.cr-a-sec{ border:1px solid var(--c-border); border-radius:var(--radius); background:var(--c-surface); padding:18px; }
.cr-a-sec-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px; }
.cr-a-sec-badge{
  display:inline-flex; align-items:center; gap:8px; font-size:12px; font-weight:700;
  letter-spacing:.04em; color:var(--c-accent); text-transform:uppercase;
}
.cr-a-sec-num{
  display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px;
  border-radius:50%; background:var(--c-accent-soft); border:1px solid var(--c-border);
  color:var(--c-accent); font-size:12px; font-weight:700;
}
.cr-a-sec-actions{ display:flex; align-items:center; gap:6px; }
.cr-a-side{
  display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px;
  border:1px solid var(--c-border); background:#fff; font-size:12px; font-weight:600;
  color:var(--c-text); cursor:pointer; transition:border-color .15s, color .15s;
}
.cr-a-side:hover{ border-color:var(--c-accent); color:var(--c-accent); }
.cr-a-side em{ font-style:normal; color:var(--c-text-muted); font-weight:500; }
`

export default function AdminCraftsmanshipPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)
  const [cfg, setCfg] = useState<CraftsmanshipConfig>(DEFAULT_CRAFTSMANSHIP)

  useEffect(() => {
    fetch('/api/admin/craftsmanship')
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setCfg(normalizeCraftsmanship(d.config)) })
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/craftsmanship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg }),
      })
      const d = await res.json()
      if (res.ok && !d.error) {
        setCfg(normalizeCraftsmanship(d.config))
        showToast('Craftsmanship page updated')
      } else throw new Error(d.error || 'Failed to update')
    } catch (e: any) {
      showToast(e.message, true)
    } finally {
      setSaving(false)
    }
  }

  // ── generic uploader ──
  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    showToast('Uploading image…')
    try {
      const res = await fetch('/api/storage/upload-craftsmanship', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) { showToast('Image uploaded'); return d.url }
      throw new Error(d.error || 'Upload failed')
    } catch (e: any) {
      showToast(e.message || 'Upload failed', true)
      return null
    }
  }

  // ── typed setters ──
  const setHero = (k: keyof CraftsmanshipConfig['hero'], v: string) =>
    setCfg((p) => ({ ...p, hero: { ...p.hero, [k]: v } }))
  const setClosing = (k: keyof CraftsmanshipConfig['closing'], v: string) =>
    setCfg((p) => ({ ...p, closing: { ...p.closing, [k]: v } as CraftsmanshipConfig['closing'] }))

  // ── section CRUD / reorder ──
  const updSection = (i: number, patch: Partial<CraftsmanshipSection>) =>
    setCfg((p) => {
      const arr = [...p.sections]
      arr[i] = { ...arr[i], ...patch }
      return { ...p, sections: arr }
    })

  const addSection = () =>
    setCfg((p) => ({
      ...p,
      sections: [
        ...p.sections,
        {
          id: newSectionId(),
          eyebrow: '',
          title: '',
          body: '',
          image: '',
          // new blocks default to the opposite side of the last one so they
          // keep alternating out of the box
          image_side:
            p.sections[p.sections.length - 1]?.image_side === 'left' ? 'right' : 'left',
          is_visible: true,
          cta_text: '',
          cta_link: '',
        },
      ],
    }))

  const removeSection = (i: number) =>
    setCfg((p) => ({ ...p, sections: p.sections.filter((_, x) => x !== i) }))

  const moveSection = (i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const j = i + dir
      if (j < 0 || j >= p.sections.length) return p
      const arr = [...p.sections]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...p, sections: arr }
    })

  const flipSide = (i: number) =>
    updSection(i, { image_side: cfg.sections[i].image_side === 'left' ? 'right' : 'left' })

  if (loading) return null

  return (
    <div className="a-page">
      <style>{CSS}</style>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Marketing</div>
          <h1 className="a-title">Craftsmanship <em>Page</em></h1>
          <p className="a-subtitle">Manage the /craftsmanship page — hero, the alternating image &amp; text sections, and the closing banner</p>
        </div>
        <div className="a-head-actions">
          <a className="a-btn a-btn--ghost" href="/craftsmanship" target="_blank" rel="noopener noreferrer">View Page</a>
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

        {/* ── HERO ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><LayoutTemplate size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Hero <em>Intro</em></div><div className="a-card-sub">Top of the page — title &amp; introduction</div></div>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <div className="a-field"><label className="a-label">Eyebrow</label>
                <input className="a-input" value={cfg.hero.eyebrow} onChange={(e) => setHero('eyebrow', e.target.value)} placeholder="The Atelier" /></div>
              <div className="a-field"><label className="a-label">Accent (italic, after title)</label>
                <input className="a-input" value={cfg.hero.accent} onChange={(e) => setHero('accent', e.target.value)} placeholder="Bespoke Fine Jewellery" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Title</label>
                <input className="a-input" value={cfg.hero.title} onChange={(e) => setHero('title', e.target.value)} placeholder="Craftsmanship: How We Make Our" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Subtitle (short lead line)</label>
                <textarea className="a-textarea" value={cfg.hero.subtitle} onChange={(e) => setHero('subtitle', e.target.value)} rows={2} /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Intro Paragraphs <span className="a-hint" style={{ margin: 0 }}>(leave a blank line between paragraphs)</span></label>
                <textarea className="a-textarea" value={cfg.hero.intro} onChange={(e) => setHero('intro', e.target.value)} rows={6} /></div>

              <div className="a-field a-col-span-2">
                <label className="a-label">Hero Image</label>
                <div className="cr-a-media-row">
                  {cfg.hero.image
                    ? <img src={cfg.hero.image} className="cr-a-thumb" alt="" />
                    : <div className="cr-a-thumb cr-a-thumb--empty"><ImageIcon size={20} /></div>}
                  <div className="cr-a-media-body">
                    <input className="a-input" value={cfg.hero.image} onChange={(e) => setHero('image', e.target.value)} placeholder="Image URL" />
                    <input type="file" id="cr_hero_up" hidden accept="image/*"
                      onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setHero('image', u) } }} />
                    <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById('cr_hero_up')?.click()}>Upload Image</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTIONS (repeatable, reorderable) ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Hammer size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Content <em>Sections</em></div><div className="a-card-sub">Alternating image + text blocks — add as many as you need</div></div>
            </div>
            <button className="a-btn a-btn--ghost a-btn--sm" onClick={addSection}><Plus size={14} /> Add Section</button>
          </div>
          <div className="a-card-body">
            <div className="a-row" style={{ gap: 12, marginBottom: 18 }}>
              <div className="a-field" style={{ flex: 1 }}><label className="a-label">Sections Eyebrow</label>
                <input className="a-input" value={cfg.sections_eyebrow} onChange={(e) => setCfg((p) => ({ ...p, sections_eyebrow: e.target.value }))} placeholder="The Process" /></div>
              <div className="a-field" style={{ flex: 1 }}><label className="a-label">Sections Heading</label>
                <input className="a-input" value={cfg.sections_title} onChange={(e) => setCfg((p) => ({ ...p, sections_title: e.target.value }))} placeholder="Every Step, Made by Hand" /></div>
            </div>

            {cfg.sections.length === 0 ? (
              <p className="a-hint">No sections yet. Click <strong>Add Section</strong> to create your first image + text block.</p>
            ) : (
              <div className="a-stack">
                {cfg.sections.map((s, i) => (
                  <div className="cr-a-sec" key={s.id}>
                    <div className="cr-a-sec-head">
                      <span className="cr-a-sec-badge">
                        <span className="cr-a-sec-num">{i + 1}</span>
                        {s.title || 'Untitled section'}
                      </span>
                      <div className="cr-a-sec-actions">
                        <button className="cr-a-side" onClick={() => flipSide(i)} title="Flip image side">
                          <ArrowLeftRight size={13} />
                          Image <em>{s.image_side === 'left' ? 'Left' : 'Right'}</em>
                        </button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => updSection(i, { is_visible: !s.is_visible })} title={s.is_visible ? 'Visible — click to hide' : 'Hidden — click to show'}>
                          {s.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSection(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSection(i, 1)} disabled={i === cfg.sections.length - 1} title="Move down"><ArrowDown size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removeSection(i)} title="Delete section"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div className="a-form-grid">
                      <div className="a-field"><label className="a-label">Eyebrow (small kicker)</label>
                        <input className="a-input" value={s.eyebrow} onChange={(e) => updSection(i, { eyebrow: e.target.value })} placeholder="Step One" /></div>
                      <div className="a-field"><label className="a-label">Heading</label>
                        <input className="a-input" value={s.title} onChange={(e) => updSection(i, { title: e.target.value })} placeholder="The Design Consultation" /></div>
                      <div className="a-field a-col-span-2"><label className="a-label">Body <span className="a-hint" style={{ margin: 0 }}>(blank line = new paragraph)</span></label>
                        <textarea className="a-textarea" value={s.body} onChange={(e) => updSection(i, { body: e.target.value })} rows={5} /></div>

                      <div className="a-field a-col-span-2">
                        <label className="a-label">Section Image</label>
                        <div className="cr-a-media-row">
                          {s.image
                            ? <img src={s.image} className="cr-a-thumb" alt="" />
                            : <div className="cr-a-thumb cr-a-thumb--empty"><ImageIcon size={20} /></div>}
                          <div className="cr-a-media-body">
                            <input className="a-input" value={s.image} onChange={(e) => updSection(i, { image: e.target.value })} placeholder="Image URL" />
                            <input type="file" id={`cr_sec_up_${s.id}`} hidden accept="image/*"
                              onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) updSection(i, { image: u }) } }} />
                            <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById(`cr_sec_up_${s.id}`)?.click()}>Upload Image</button>
                          </div>
                        </div>
                      </div>

                      <div className="a-field"><label className="a-label">Button Text <span className="a-hint" style={{ margin: 0 }}>(optional)</span></label>
                        <input className="a-input" value={s.cta_text} onChange={(e) => updSection(i, { cta_text: e.target.value })} placeholder="Start Your Bespoke Piece" /></div>
                      <div className="a-field"><label className="a-label">Button Link</label>
                        <input className="a-input" value={s.cta_link} onChange={(e) => updSection(i, { cta_link: e.target.value })} placeholder="/custom-order" /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── CLOSING BANNER ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Megaphone size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Closing <em>Banner</em></div><div className="a-card-sub">Call-to-action at the bottom</div></div>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <div className="a-field"><label className="a-label">Eyebrow</label>
                <input className="a-input" value={cfg.closing.eyebrow} onChange={(e) => setClosing('eyebrow', e.target.value)} /></div>
              <div className="a-field"><label className="a-label">Accent Word (italic)</label>
                <input className="a-input" value={cfg.closing.accent} onChange={(e) => setClosing('accent', e.target.value)} /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Title</label>
                <input className="a-input" value={cfg.closing.title} onChange={(e) => setClosing('title', e.target.value)} /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Subtitle</label>
                <textarea className="a-textarea" value={cfg.closing.subtitle} onChange={(e) => setClosing('subtitle', e.target.value)} /></div>
              <div className="a-field"><label className="a-label">Button Text</label>
                <input className="a-input" value={cfg.closing.cta_text} onChange={(e) => setClosing('cta_text', e.target.value)} /></div>
              <div className="a-field"><label className="a-label">Button Link</label>
                <input className="a-input" value={cfg.closing.cta_link} onChange={(e) => setClosing('cta_link', e.target.value)} /></div>

              <div className="a-field a-col-span-2">
                <label className="a-label">Background Image <span className="a-hint" style={{ margin: 0 }}>(sits behind the banner, under the color tint)</span></label>
                <div className="cr-a-media-row">
                  {cfg.closing.bg_image
                    ? <img src={cfg.closing.bg_image} className="cr-a-thumb" alt="" />
                    : <div className="cr-a-thumb cr-a-thumb--empty"><ImageIcon size={20} /></div>}
                  <div className="cr-a-media-body">
                    <input className="a-input" value={cfg.closing.bg_image} onChange={(e) => setClosing('bg_image', e.target.value)} placeholder="Image URL (leave blank to use a section image)" />
                    <div className="a-row" style={{ gap: 8 }}>
                      <input type="file" id="cr_cta_up" hidden accept="image/*"
                        onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setClosing('bg_image', u) } }} />
                      <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById('cr_cta_up')?.click()}>Upload Image</button>
                      {cfg.closing.bg_image && (
                        <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => setClosing('bg_image', '')}>Clear</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="a-field a-col-span-2"><label className="a-label">Banner Theme</label>
                <select className="a-select" value={cfg.closing.theme} onChange={(e) => setClosing('theme', e.target.value)}>
                  <option value="accent">Taupe (accent)</option>
                  <option value="dark">Deep Brown (dark)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
