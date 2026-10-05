'use client'

import { useEffect, useState } from 'react'
import {
  Save, Plus, Trash2, AlertCircle, Sparkles,
  ImageIcon, LayoutTemplate, Wrench, Megaphone, Award,
  ArrowUp, ArrowDown, ArrowLeftRight, Eye, EyeOff,
} from 'lucide-react'
import {
  DEFAULT_REPAIRS,
  normalizeRepairs,
  newSectionId,
  newPointId,
  REPAIRS_ICONS,
  RepairsConfig,
  RepairSection,
  RepairPoint,
} from '@/lib/repairs'

const CSS = `
.rp-a-thumb{ width:64px; height:64px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--c-border); background:#fff; flex-shrink:0; }
.rp-a-thumb--empty{ display:flex; align-items:center; justify-content:center; color:var(--c-text-faint); }
.rp-a-media-row{ display:flex; align-items:center; gap:14px; }
.rp-a-media-body{ flex:1; min-width:0; display:flex; flex-direction:column; gap:9px; }
.rp-a-sec{ border:1px solid var(--c-border); border-radius:var(--radius); background:var(--c-surface); padding:18px; }
.rp-a-sec-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
.rp-a-sec-badge{
  display:inline-flex; align-items:center; gap:8px; font-size:12px; font-weight:700;
  letter-spacing:.04em; color:var(--c-accent); text-transform:uppercase;
}
.rp-a-sec-num{
  display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px;
  border-radius:50%; background:var(--c-accent-soft); border:1px solid var(--c-border);
  color:var(--c-accent); font-size:12px; font-weight:700;
}
.rp-a-sec-actions{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.rp-a-side{
  display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px;
  border:1px solid var(--c-border); background:#fff; font-size:12px; font-weight:600;
  color:var(--c-text); cursor:pointer; transition:border-color .15s, color .15s;
}
.rp-a-side:hover{ border-color:var(--c-accent); color:var(--c-accent); }
.rp-a-side em{ font-style:normal; color:var(--c-text-muted); font-weight:500; }
.rp-a-stat{ display:flex; align-items:center; gap:8px; }
.rp-a-pts{ display:flex; flex-direction:column; gap:10px; }
.rp-a-pts-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:4px; }
.rp-a-pt{
  display:flex; align-items:flex-start; gap:8px; padding:12px;
  border:1px solid var(--c-border); border-radius:var(--radius-sm); background:#fff;
}
.rp-a-pt-fields{ flex:1; min-width:0; display:flex; flex-direction:column; gap:8px; }
.rp-a-pt-row{ display:flex; gap:8px; }
.rp-a-pt-actions{ display:flex; flex-direction:column; gap:6px; flex-shrink:0; }
`

export default function AdminRepairsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)
  const [cfg, setCfg] = useState<RepairsConfig>(DEFAULT_REPAIRS)

  useEffect(() => {
    fetch('/api/admin/repairs')
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setCfg(normalizeRepairs(d.config)) })
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg }),
      })
      const d = await res.json()
      if (res.ok && !d.error) {
        setCfg(normalizeRepairs(d.config))
        showToast('Repairs page updated')
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
      const res = await fetch('/api/storage/upload-repairs', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) { showToast('Image uploaded'); return d.url }
      throw new Error(d.error || 'Upload failed')
    } catch (e: any) {
      showToast(e.message || 'Upload failed', true)
      return null
    }
  }

  // ── typed setters ──
  const setHero = (k: keyof RepairsConfig['hero'], v: string) =>
    setCfg((p) => ({ ...p, hero: { ...p.hero, [k]: v } }))
  const setClosing = (k: keyof RepairsConfig['closing'], v: string) =>
    setCfg((p) => ({ ...p, closing: { ...p.closing, [k]: v } as RepairsConfig['closing'] }))

  // ── trust stats CRUD / reorder ──
  const updStat = (i: number, patch: Partial<RepairsConfig['stats'][number]>) =>
    setCfg((p) => {
      const arr = [...p.stats]
      arr[i] = { ...arr[i], ...patch }
      return { ...p, stats: arr }
    })

  const addStat = () =>
    setCfg((p) => ({
      ...p,
      stats: [...p.stats, { id: `st_${Date.now().toString(36)}_${p.stats.length}`, value: '', label: '' }],
    }))

  const removeStat = (i: number) =>
    setCfg((p) => ({ ...p, stats: p.stats.filter((_, x) => x !== i) }))

  const moveStat = (i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const j = i + dir
      if (j < 0 || j >= p.stats.length) return p
      const arr = [...p.stats]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...p, stats: arr }
    })

  // ── section CRUD / reorder ──
  const updSection = (i: number, patch: Partial<RepairSection>) =>
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
          layout: 'split',
          eyebrow: '',
          title: '',
          body: '',
          image: '',
          // new blocks default to the opposite side of the last one so they
          // keep alternating out of the box
          image_side:
            p.sections[p.sections.length - 1]?.image_side === 'left' ? 'right' : 'left',
          points: [],
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

  // ── point CRUD / reorder (scoped to a single section) ──
  const addPoint = (si: number) =>
    setCfg((p) => {
      const arr = [...p.sections]
      arr[si] = {
        ...arr[si],
        points: [...arr[si].points, { id: newPointId(), icon: 'Wrench', title: '', text: '' }],
      }
      return { ...p, sections: arr }
    })

  const removePoint = (si: number, pi: number) =>
    setCfg((p) => {
      const arr = [...p.sections]
      arr[si] = { ...arr[si], points: arr[si].points.filter((_, x) => x !== pi) }
      return { ...p, sections: arr }
    })

  const movePoint = (si: number, pi: number, dir: -1 | 1) =>
    setCfg((p) => {
      const arr = [...p.sections]
      const pts = [...arr[si].points]
      const j = pi + dir
      if (j < 0 || j >= pts.length) return p
      ;[pts[pi], pts[j]] = [pts[j], pts[pi]]
      arr[si] = { ...arr[si], points: pts }
      return { ...p, sections: arr }
    })

  const updPoint = (si: number, pi: number, patch: Partial<RepairPoint>) =>
    setCfg((p) => {
      const arr = [...p.sections]
      const pts = [...arr[si].points]
      pts[pi] = { ...pts[pi], ...patch }
      arr[si] = { ...arr[si], points: pts }
      return { ...p, sections: arr }
    })

  if (loading) return null

  return (
    <div className="a-page">
      <style>{CSS}</style>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Marketing</div>
          <h1 className="a-title">Repairs <em>Page</em></h1>
          <p className="a-subtitle">Manage the /repairs page — hero, trust stats, the reorderable content sections &amp; their points, and the closing banner</p>
        </div>
        <div className="a-head-actions">
          <a className="a-btn a-btn--ghost" href="/repairs" target="_blank" rel="noopener noreferrer">View Page</a>
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
                <input className="a-input" value={cfg.hero.eyebrow} onChange={(e) => setHero('eyebrow', e.target.value)} placeholder="Jewellery Repairs & Restoration" /></div>
              <div className="a-field"><label className="a-label">Accent (italic, after title)</label>
                <input className="a-input" value={cfg.hero.accent} onChange={(e) => setHero('accent', e.target.value)} placeholder="Pieces You Treasure" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Title</label>
                <input className="a-input" value={cfg.hero.title} onChange={(e) => setHero('title', e.target.value)} placeholder="Expert Care for" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Subtitle (short lead line)</label>
                <textarea className="a-textarea" value={cfg.hero.subtitle} onChange={(e) => setHero('subtitle', e.target.value)} rows={2} /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Intro Paragraphs <span className="a-hint" style={{ margin: 0 }}>(leave a blank line between paragraphs)</span></label>
                <textarea className="a-textarea" value={cfg.hero.intro} onChange={(e) => setHero('intro', e.target.value)} rows={6} /></div>
              <div className="a-field"><label className="a-label">Badge Text <span className="a-hint" style={{ margin: 0 }}>(pill on the image)</span></label>
                <input className="a-input" value={cfg.hero.badge_text} onChange={(e) => setHero('badge_text', e.target.value)} placeholder="In-House Workshop" /></div>

              <div className="a-field a-col-span-2">
                <label className="a-label">Hero Image</label>
                <div className="rp-a-media-row">
                  {cfg.hero.image
                    ? <img src={cfg.hero.image} className="rp-a-thumb" alt="" />
                    : <div className="rp-a-thumb rp-a-thumb--empty"><ImageIcon size={20} /></div>}
                  <div className="rp-a-media-body">
                    <input className="a-input" value={cfg.hero.image} onChange={(e) => setHero('image', e.target.value)} placeholder="Image URL" />
                    <input type="file" id="rp_hero_up" hidden accept="image/*"
                      onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setHero('image', u) } }} />
                    <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById('rp_hero_up')?.click()}>Upload Image</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TRUST STATS (repeatable, reorderable) ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Award size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Trust <em>Stats</em></div><div className="a-card-sub">Small stat strip under the hero</div></div>
            </div>
            <button className="a-btn a-btn--ghost a-btn--sm" onClick={addStat}><Plus size={14} /> Add Stat</button>
          </div>
          <div className="a-card-body">
            {cfg.stats.length === 0 ? (
              <p className="a-hint">No stats yet. Click <strong>Add Stat</strong> to build the trust strip — or leave it empty to hide it.</p>
            ) : (
              <div className="a-stack">
                {cfg.stats.map((st, i) => (
                  <div className="rp-a-stat" key={st.id}>
                    <input className="a-input" value={st.value} onChange={(e) => updStat(i, { value: e.target.value })} placeholder="12-Month" style={{ maxWidth: 150 }} />
                    <input className="a-input" value={st.label} onChange={(e) => updStat(i, { label: e.target.value })} placeholder="Repair Guarantee" style={{ flex: 1 }} />
                    <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveStat(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={14} /></button>
                    <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveStat(i, 1)} disabled={i === cfg.stats.length - 1} title="Move down"><ArrowDown size={14} /></button>
                    <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removeStat(i)} title="Delete stat"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── CONTENT SECTIONS (repeatable, reorderable) ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Wrench size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Content <em>Sections</em></div><div className="a-card-sub">Statement, split image + points, or points-grid blocks — add as many as you need</div></div>
            </div>
            <button className="a-btn a-btn--ghost a-btn--sm" onClick={addSection}><Plus size={14} /> Add Section</button>
          </div>
          <div className="a-card-body">
            <div className="a-row" style={{ gap: 12, marginBottom: 18 }}>
              <div className="a-field" style={{ flex: 1 }}><label className="a-label">Sections Eyebrow</label>
                <input className="a-input" value={cfg.sections_eyebrow} onChange={(e) => setCfg((p) => ({ ...p, sections_eyebrow: e.target.value }))} placeholder="What We Do" /></div>
              <div className="a-field" style={{ flex: 1 }}><label className="a-label">Sections Heading</label>
                <input className="a-input" value={cfg.sections_title} onChange={(e) => setCfg((p) => ({ ...p, sections_title: e.target.value }))} placeholder="Repairs & Restoration Services" /></div>
            </div>

            {cfg.sections.length === 0 ? (
              <p className="a-hint">No sections yet. Click <strong>Add Section</strong> to create your first content block.</p>
            ) : (
              <div className="a-stack">
                {cfg.sections.map((s, i) => (
                  <div className="rp-a-sec" key={s.id}>
                    <div className="rp-a-sec-head">
                      <span className="rp-a-sec-badge">
                        <span className="rp-a-sec-num">{i + 1}</span>
                        {s.title || 'Untitled section'}
                      </span>
                      <div className="rp-a-sec-actions">
                        <select className="a-select" style={{ maxWidth: 190 }} value={s.layout}
                          onChange={(e) => updSection(i, { layout: e.target.value as RepairSection['layout'] })} title="Section layout">
                          <option value="statement">Statement</option>
                          <option value="split">Split (image + points)</option>
                          <option value="points">Points grid</option>
                        </select>
                        {s.layout === 'split' && (
                          <button className="rp-a-side" onClick={() => flipSide(i)} title="Flip image side">
                            <ArrowLeftRight size={13} />
                            Image <em>{s.image_side === 'left' ? 'Left' : 'Right'}</em>
                          </button>
                        )}
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
                        <input className="a-input" value={s.eyebrow} onChange={(e) => updSection(i, { eyebrow: e.target.value })} placeholder="Ring Repairs" /></div>
                      <div className="a-field"><label className="a-label">Heading</label>
                        <input className="a-input" value={s.title} onChange={(e) => updSection(i, { title: e.target.value })} placeholder="Resizing, Re-Tipping & Rebuilding" /></div>
                      <div className="a-field a-col-span-2"><label className="a-label">Body <span className="a-hint" style={{ margin: 0 }}>(blank line = new paragraph)</span></label>
                        <textarea className="a-textarea" value={s.body} onChange={(e) => updSection(i, { body: e.target.value })} rows={5} /></div>

                      <div className="a-field a-col-span-2">
                        <label className="a-label">Section Image</label>
                        <div className="rp-a-media-row">
                          {s.image
                            ? <img src={s.image} className="rp-a-thumb" alt="" />
                            : <div className="rp-a-thumb rp-a-thumb--empty"><ImageIcon size={20} /></div>}
                          <div className="rp-a-media-body">
                            <input className="a-input" value={s.image} onChange={(e) => updSection(i, { image: e.target.value })} placeholder="Image URL" />
                            <input type="file" id={`rp_sec_up_${s.id}`} hidden accept="image/*"
                              onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) updSection(i, { image: u }) } }} />
                            <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById(`rp_sec_up_${s.id}`)?.click()}>Upload Image</button>
                          </div>
                        </div>
                      </div>

                      <div className="a-field"><label className="a-label">Button Text <span className="a-hint" style={{ margin: 0 }}>(optional)</span></label>
                        <input className="a-input" value={s.cta_text} onChange={(e) => updSection(i, { cta_text: e.target.value })} placeholder="Book a Repair" /></div>
                      <div className="a-field"><label className="a-label">Button Link</label>
                        <input className="a-input" value={s.cta_link} onChange={(e) => updSection(i, { cta_link: e.target.value })} placeholder="/appointments" /></div>

                      {/* ── nested points editor ── */}
                      <div className="a-field a-col-span-2">
                        <div className="rp-a-pts-head">
                          <label className="a-label" style={{ margin: 0 }}>Points <span className="a-hint" style={{ margin: 0 }}>(checklist / icon cards for this section)</span></label>
                          <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => addPoint(i)}><Plus size={13} /> Add Point</button>
                        </div>
                        {s.points.length === 0 ? (
                          <p className="a-hint">No points yet. Click <strong>Add Point</strong> to add an icon + title + short text.</p>
                        ) : (
                          <div className="rp-a-pts">
                            {s.points.map((pt, pi) => (
                              <div className="rp-a-pt" key={pt.id}>
                                <div className="rp-a-pt-fields">
                                  <div className="rp-a-pt-row">
                                    <select className="a-select" style={{ maxWidth: 170 }} value={pt.icon}
                                      onChange={(e) => updPoint(i, pi, { icon: e.target.value })} title="Icon">
                                      {REPAIRS_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                                    </select>
                                    <input className="a-input" value={pt.title} onChange={(e) => updPoint(i, pi, { title: e.target.value })} placeholder="Point title" style={{ flex: 1 }} />
                                  </div>
                                  <textarea className="a-textarea" value={pt.text} onChange={(e) => updPoint(i, pi, { text: e.target.value })} rows={2} placeholder="Short description" />
                                </div>
                                <div className="rp-a-pt-actions">
                                  <button className="a-icon-btn a-icon-btn--sm" onClick={() => movePoint(i, pi, -1)} disabled={pi === 0} title="Move up"><ArrowUp size={14} /></button>
                                  <button className="a-icon-btn a-icon-btn--sm" onClick={() => movePoint(i, pi, 1)} disabled={pi === s.points.length - 1} title="Move down"><ArrowDown size={14} /></button>
                                  <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removePoint(i, pi)} title="Delete point"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                <div className="rp-a-media-row">
                  {cfg.closing.bg_image
                    ? <img src={cfg.closing.bg_image} className="rp-a-thumb" alt="" />
                    : <div className="rp-a-thumb rp-a-thumb--empty"><ImageIcon size={20} /></div>}
                  <div className="rp-a-media-body">
                    <input className="a-input" value={cfg.closing.bg_image} onChange={(e) => setClosing('bg_image', e.target.value)} placeholder="Image URL (leave blank to use a section image)" />
                    <div className="a-row" style={{ gap: 8 }}>
                      <input type="file" id="rp_cta_up" hidden accept="image/*"
                        onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setClosing('bg_image', u) } }} />
                      <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById('rp_cta_up')?.click()}>Upload Image</button>
                      {cfg.closing.bg_image && (
                        <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => setClosing('bg_image', '')}>Clear</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="a-field a-col-span-2"><label className="a-label">Banner Theme</label>
                <select className="a-select" value={cfg.closing.theme} onChange={(e) => setClosing('theme', e.target.value)}>
                  <option value="accent">Warm Taupe</option>
                  <option value="dark">Deep Espresso</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
