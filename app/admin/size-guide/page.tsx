'use client'

/**
 * Admin editor for the /size-guide page (comprehensive Ring/Bracelet/Diamond
 * guide — DISTINCT from /admin/ring-size-guide). The whole page is one
 * SizeGuideDoc (hero + fully dynamic sections). The admin can add / remove /
 * reorder sections and the tips/steps inside each, upload images & videos to R2
 * (or paste a URL / YouTube-Vimeo embed), and edit every piece of text.
 * Mirrors the About editor conventions (a-* admin CSS, upload-then-store-URL).
 */

import { useEffect, useState } from 'react'
import {
  Save, Plus, Trash2, AlertCircle, Sparkles, ImageIcon, Film, Blocks,
  LayoutTemplate, ArrowUp, ArrowDown, RotateCcw, Link2, Upload,
} from 'lucide-react'
import {
  Ruler, Hand, Scissors, Table2, BadgeCheck, Scale, Gem, Diamond, Eye,
  Search, Target, Sparkles as SparklesIcon, Circle, Info, PencilRuler,
} from 'lucide-react'
import {
  DEFAULT_SIZE_GUIDE, normalizeSizeGuide, blankSection, blankTip, blankStep,
  deriveVideoType, ALLOWED_TIP_ICONS,
  type SizeGuideDoc, type SizeGuideHero, type SizeGuideSection, type Tip, type Step,
} from '@/lib/sizeGuide'

const TIP_ICONS: Record<string, any> = {
  Ruler, Hand, Scissors, Table2, BadgeCheck, Scale, Gem, Diamond, Eye,
  Search, Target, Sparkles: SparklesIcon, Circle, Info, PencilRuler,
}

const CSS = `
.sg-a-thumb{ width:64px; height:64px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--c-border); background:#fff; flex-shrink:0; }
.sg-a-thumb--empty{ display:flex; align-items:center; justify-content:center; color:var(--c-text-faint); }
.sg-a-thumb--video{ width:96px; height:64px; }
.sg-a-media-row{ display:flex; align-items:center; gap:14px; }
.sg-a-media-body{ flex:1; min-width:0; display:flex; flex-direction:column; gap:9px; }
.sg-a-sec{ border:1px solid var(--c-border); border-radius:var(--radius); background:var(--c-surface); padding:18px; }
.sg-a-sec-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
.sg-a-sec-badge{ display:inline-flex; align-items:center; gap:10px; font-size:13px; font-weight:700; letter-spacing:.02em; color:var(--c-text); }
.sg-a-sec-num{ display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:var(--c-accent-soft); border:1px solid var(--c-border); color:var(--c-accent); font-size:12px; font-weight:700; flex-shrink:0; }
.sg-a-sec-actions{ display:flex; align-items:center; gap:6px; }
.sg-a-item{ border:1px dashed var(--c-border); border-radius:var(--radius-sm); padding:14px; background:#fff; }
.sg-a-item-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
.sg-a-item-label{ font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--c-text-muted); }
.sg-a-sub{ font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--c-text-muted); margin:4px 0 2px; }
.sg-a-icon-pick{ display:flex; align-items:center; gap:10px; }
.sg-a-icon-pre{ width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:var(--c-accent-soft); border:1px solid var(--c-border); color:var(--c-accent); flex-shrink:0; }
.sg-a-seg{ display:inline-flex; border:1px solid var(--c-border); border-radius:999px; overflow:hidden; background:#fff; }
.sg-a-seg button{ display:inline-flex; align-items:center; gap:6px; padding:7px 14px; font-size:12px; font-weight:600; color:var(--c-text-muted); background:transparent; cursor:pointer; border:none; }
.sg-a-seg button.is-on{ background:var(--c-accent); color:#fff; }
`

/* ── shared editor atoms ───────────────────────────────────────── */

function Field({ label, hint, span2, children }: {
  label: string; hint?: string; span2?: boolean; children: React.ReactNode
}) {
  return (
    <div className={`a-field${span2 ? ' a-col-span-2' : ''}`}>
      <label className="a-label">
        {label}{hint ? <> <span className="a-hint" style={{ margin: 0 }}>({hint})</span></> : null}
      </label>
      {children}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const Icon = TIP_ICONS[value] || Ruler
  return (
    <div className="sg-a-icon-pick">
      <span className="sg-a-icon-pre"><Icon size={17} strokeWidth={1.6} /></span>
      <select className="a-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {ALLOWED_TIP_ICONS.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}

function ImageField({ label, value, onChange, upload }: {
  label: string; value: string; onChange: (v: string) => void
  upload: (f: File) => Promise<string | null>
}) {
  const id = `sg_up_${label.replace(/\W/g, '_')}_${value.length}`
  return (
    <div className="a-field a-col-span-2">
      <label className="a-label">{label}</label>
      <div className="sg-a-media-row">
        {value
          ? <img src={value} className="sg-a-thumb" alt="" />
          : <div className="sg-a-thumb sg-a-thumb--empty"><ImageIcon size={20} /></div>}
        <div className="sg-a-media-body">
          <input className="a-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" />
          <input type="file" id={id} hidden accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) { const u = await upload(f); if (u) onChange(u) }
            }} />
          <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById(id)?.click()}>
            <Upload size={13} /> Upload Image
          </button>
        </div>
      </div>
    </div>
  )
}

/* Video field: URL + upload + File/Embed toggle. Pasting a YouTube/Vimeo link
   auto-switches to Embed; uploaded files are served from R2 as <video>. */
function MediaField({ urlValue, typeValue, onUrl, onType, upload }: {
  urlValue: string; typeValue: 'file' | 'embed'
  onUrl: (v: string) => void; onType: (v: 'file' | 'embed') => void
  upload: (f: File) => Promise<string | null>
}) {
  const id = `sg_vid_${urlValue.length}`
  return (
    <div className="a-field a-col-span-2">
      <label className="a-label">Video <span className="a-hint" style={{ margin: 0 }}>(upload a file to R2, or paste a YouTube / Vimeo link to embed)</span></label>
      <div className="sg-a-media-row">
        {urlValue && typeValue === 'file'
          ? <video className="sg-a-thumb sg-a-thumb--video" src={urlValue} muted />
          : <div className="sg-a-thumb sg-a-thumb--video sg-a-thumb--empty"><Film size={20} /></div>}
        <div className="sg-a-media-body">
          <input className="a-input" value={urlValue}
            onChange={(e) => { const v = e.target.value; onUrl(v); onType(deriveVideoType(v)) }}
            placeholder="Video URL or embed link" />
          <div className="a-row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div className="sg-a-seg">
              <button className={typeValue === 'file' ? 'is-on' : ''} onClick={() => onType('file')}>
                <Film size={13} /> File
              </button>
              <button className={typeValue === 'embed' ? 'is-on' : ''} onClick={() => onType('embed')}>
                <Link2 size={13} /> Embed
              </button>
            </div>
            <input type="file" id={id} hidden accept="video/*,image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) { const u = await upload(f); if (u) { onUrl(u); onType('file') } }
              }} />
            <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById(id)?.click()}>
              <Upload size={13} /> Upload Video
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Generic repeatable-items editor with add / remove / move controls. */
function ItemList<T>({ items, label, blank, onChange, render }: {
  items: T[]; label: string; blank: () => T
  onChange: (items: T[]) => void
  render: (item: T, upd: (patch: Partial<T>) => void) => React.ReactNode
}) {
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const arr = [...items]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onChange(arr)
  }
  return (
    <div className="a-col-span-2">
      <div className="a-stack" style={{ gap: 12 }}>
        {items.map((it, i) => (
          <div className="sg-a-item" key={i}>
            <div className="sg-a-item-head">
              <span className="sg-a-item-label">{label} {i + 1}</span>
              <div className="sg-a-sec-actions">
                <button className="a-icon-btn a-icon-btn--sm" onClick={() => move(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={13} /></button>
                <button className="a-icon-btn a-icon-btn--sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down"><ArrowDown size={13} /></button>
                <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => onChange(items.filter((_, x) => x !== i))} title={`Delete ${label.toLowerCase()}`}><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="a-form-grid">
              {render(it, (patch) => {
                const arr = [...items]
                arr[i] = { ...arr[i], ...patch }
                onChange(arr)
              })}
            </div>
          </div>
        ))}
      </div>
      <button className="a-btn a-btn--ghost a-btn--sm" style={{ marginTop: 12 }}
        onClick={() => onChange([...items, blank()])}>
        <Plus size={14} /> Add {label}
      </button>
    </div>
  )
}

/* ── page ──────────────────────────────────────────────────────── */

export default function AdminSizeGuidePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)
  const [doc, setDoc] = useState<SizeGuideDoc>(DEFAULT_SIZE_GUIDE)

  const load = () => {
    setLoading(true)
    fetch('/api/size-guide', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setDoc(normalizeSizeGuide(d)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/size-guide', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      })
      const d = await res.json()
      if (res.ok && !d.error) {
        setDoc(normalizeSizeGuide(d))
        showToast('Size guide saved')
      } else throw new Error(d.error || 'Failed to save')
    } catch (e: any) {
      showToast(e.message, true)
    } finally {
      setSaving(false)
    }
  }

  const uploadMedia = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    showToast('Uploading…')
    try {
      const res = await fetch('/api/size-guide/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) { showToast('Uploaded'); return d.url }
      throw new Error(d.error || 'Upload failed')
    } catch (e: any) {
      showToast(e.message || 'Upload failed', true)
      return null
    }
  }

  const setHero = (patch: Partial<SizeGuideHero>) =>
    setDoc((p) => ({ ...p, hero: { ...p.hero, ...patch } }))

  const updSection = (i: number, patch: Partial<SizeGuideSection>) =>
    setDoc((p) => {
      const arr = [...p.sections]
      arr[i] = { ...arr[i], ...patch }
      return { ...p, sections: arr }
    })

  const addSection = () =>
    setDoc((p) => ({ ...p, sections: [...p.sections, blankSection()] }))

  const removeSection = (i: number) => {
    if (!window.confirm('Delete this section? Discard by leaving without saving.')) return
    setDoc((p) => ({ ...p, sections: p.sections.filter((_, x) => x !== i) }))
  }

  const moveSection = (i: number, dir: -1 | 1) =>
    setDoc((p) => {
      const j = i + dir
      if (j < 0 || j >= p.sections.length) return p
      const arr = [...p.sections]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...p, sections: arr }
    })

  if (loading) return null

  return (
    <div className="a-page">
      <style>{CSS}</style>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Content</div>
          <h1 className="a-title">Size <em>Guide</em></h1>
          <p className="a-subtitle">Manage the /size-guide page — hero plus fully dynamic Ring / Bracelet / Diamond charts you can add, remove &amp; reorder</p>
        </div>
        <div className="a-head-actions">
          <button className="a-btn a-btn--ghost" onClick={load} disabled={saving}><RotateCcw size={15} /> Reload</button>
          <a className="a-btn a-btn--ghost" href="/size-guide" target="_blank" rel="noopener noreferrer">View Page</a>
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
              <div><div className="a-card-title">Hero <em>Banner</em></div><div className="a-card-sub">Top of the page — kicker, headline, subtitle &amp; background image</div></div>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <Field label="Eyebrow" hint="small kicker above the heading">
                <input className="a-input" value={doc.hero.eyebrow} onChange={(e) => setHero({ eyebrow: e.target.value })} placeholder="Size Master Guide" /></Field>
              <Field label="Title" hint="main headline">
                <input className="a-input" value={doc.hero.title} onChange={(e) => setHero({ title: e.target.value })} placeholder="Find your perfect jewelry fit" /></Field>
              <Field label="Subtitle" span2>
                <textarea className="a-textarea" rows={3} value={doc.hero.subtitle} onChange={(e) => setHero({ subtitle: e.target.value })} /></Field>
              <ImageField label="Background Image" value={doc.hero.background_url} onChange={(background_url) => setHero({ background_url })} upload={uploadMedia} />
            </div>
          </div>
        </div>

        {/* ── SECTIONS ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Blocks size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Size <em>Charts</em></div><div className="a-card-sub">Each chart has an illustration, tip cards, numbered steps &amp; a video</div></div>
            </div>
            <button className="a-btn a-btn--ghost a-btn--sm" onClick={addSection}><Plus size={14} /> Add Section</button>
          </div>
          <div className="a-card-body">
            {doc.sections.length === 0 ? (
              <p className="a-hint">No sections yet. Click <strong>Add Section</strong> to create a size chart (e.g. Ring, Bracelet, Diamond).</p>
            ) : (
              <div className="a-stack">
                {doc.sections.map((s, i) => (
                  <div className="sg-a-sec" key={s.id}>
                    <div className="sg-a-sec-head">
                      <span className="sg-a-sec-badge">
                        <span className="sg-a-sec-num">{i + 1}</span>
                        {s.title || 'Untitled chart'}
                      </span>
                      <div className="sg-a-sec-actions">
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSection(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSection(i, 1)} disabled={i === doc.sections.length - 1} title="Move down"><ArrowDown size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removeSection(i)} title="Delete section"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div className="a-form-grid">
                      <Field label="Title">
                        <input className="a-input" value={s.title} onChange={(e) => updSection(i, { title: e.target.value })} placeholder="Ring Size Chart" /></Field>
                      <Field label="Subtitle" hint="one line under the title">
                        <input className="a-input" value={s.subtitle} onChange={(e) => updSection(i, { subtitle: e.target.value })} /></Field>

                      <ImageField label="Illustration / Chart Image" value={s.image_url} onChange={(image_url) => updSection(i, { image_url })} upload={uploadMedia} />

                      <MediaField
                        urlValue={s.video_url}
                        typeValue={s.video_type}
                        onUrl={(video_url) => updSection(i, { video_url })}
                        onType={(video_type) => updSection(i, { video_type })}
                        upload={uploadMedia}
                      />

                      <div className="a-col-span-2"><div className="sg-a-sub">Tip cards</div></div>
                      <ItemList<Tip>
                        items={s.tips} label="Tip" blank={blankTip}
                        onChange={(tips) => updSection(i, { tips })}
                        render={(t, u) => (
                          <>
                            <Field label="Icon"><IconPicker value={t.icon} onChange={(icon) => u({ icon })} /></Field>
                            <Field label="Title">
                              <input className="a-input" value={t.title} onChange={(e) => u({ title: e.target.value })} placeholder="Measure Your Finger" /></Field>
                            <Field label="Text" span2>
                              <textarea className="a-textarea" rows={2} value={t.text} onChange={(e) => u({ text: e.target.value })} /></Field>
                          </>
                        )} />

                      <div className="a-col-span-2"><div className="sg-a-sub">Steps</div></div>
                      <ItemList<Step>
                        items={s.steps} label="Step" blank={blankStep}
                        onChange={(steps) => updSection(i, { steps })}
                        render={(st, u) => (
                          <>
                            <ImageField label="Step Image" value={st.image_url} onChange={(image_url) => u({ image_url })} upload={uploadMedia} />
                            <Field label="Text" span2>
                              <textarea className="a-textarea" rows={2} value={st.text} onChange={(e) => u({ text: e.target.value })} /></Field>
                          </>
                        )} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
