'use client'

/**
 * Admin editor for the /about page.
 * The page is a hero + an ordered list of typed sections. The admin can add
 * any number of sections of any type, remove, reorder, hide and edit each —
 * including the repeatable items INSIDE a section (services, steps, rows…).
 * Mirrors the craftsmanship editor conventions (singleton JSONB config,
 * a-* admin CSS, upload via /api/storage/upload-about).
 */

import { useEffect, useState } from 'react'
import {
  Save, Plus, Trash2, AlertCircle, Sparkles, ImageIcon, LayoutTemplate,
  ArrowUp, ArrowDown, ArrowLeftRight, Eye, EyeOff, Blocks, X,
} from 'lucide-react'
import {
  DEFAULT_ABOUT, normalizeAbout, blankAboutSection,
  ABOUT_SECTION_TYPE_META, ABOUT_ICON_NAMES,
  AboutConfig, AboutSection, AboutSectionType, AboutHero,
} from '@/lib/aboutPage'
import { aboutIcon } from '@/components/About/aboutIcons'

const CSS = `
.ab-a-thumb{ width:64px; height:64px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--c-border); background:#fff; flex-shrink:0; }
.ab-a-thumb--empty{ display:flex; align-items:center; justify-content:center; color:var(--c-text-faint); }
.ab-a-media-row{ display:flex; align-items:center; gap:14px; }
.ab-a-media-body{ flex:1; min-width:0; display:flex; flex-direction:column; gap:9px; }
.ab-a-sec{ border:1px solid var(--c-border); border-radius:var(--radius); background:var(--c-surface); padding:18px; }
.ab-a-sec--hidden{ opacity:.55; }
.ab-a-sec-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
.ab-a-sec-badge{
  display:inline-flex; align-items:center; gap:8px; font-size:12px; font-weight:700;
  letter-spacing:.04em; color:var(--c-accent); text-transform:uppercase;
}
.ab-a-sec-num{
  display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px;
  border-radius:50%; background:var(--c-accent-soft); border:1px solid var(--c-border);
  color:var(--c-accent); font-size:12px; font-weight:700; flex-shrink:0;
}
.ab-a-sec-type{
  font-size:10px; font-weight:600; letter-spacing:.06em; color:var(--c-text-muted);
  border:1px solid var(--c-border); border-radius:999px; padding:3px 10px; background:#fff;
  text-transform:uppercase;
}
.ab-a-sec-actions{ display:flex; align-items:center; gap:6px; }
.ab-a-item{
  border:1px dashed var(--c-border); border-radius:var(--radius-sm);
  padding:14px; background:#fff;
}
.ab-a-item-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
.ab-a-item-label{ font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--c-text-muted); }
.ab-a-icon-pick{ display:flex; align-items:center; gap:10px; }
.ab-a-icon-pre{
  width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center;
  background:var(--c-accent-soft); border:1px solid var(--c-border); color:var(--c-accent); flex-shrink:0;
}
.ab-a-add-menu{
  display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:10px; margin-top:14px;
}
.ab-a-add-opt{
  display:flex; flex-direction:column; gap:4px; text-align:left; cursor:pointer;
  border:1px solid var(--c-border); border-radius:var(--radius-sm); background:#fff; padding:12px 14px;
  transition:border-color .15s, box-shadow .15s;
}
.ab-a-add-opt:hover{ border-color:var(--c-accent); box-shadow:0 2px 10px rgba(0,0,0,.05); }
.ab-a-add-opt b{ font-size:13px; color:var(--c-text); }
.ab-a-add-opt span{ font-size:11.5px; color:var(--c-text-muted); line-height:1.4; }
.ab-a-side{
  display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px;
  border:1px solid var(--c-border); background:#fff; font-size:12px; font-weight:600;
  color:var(--c-text); cursor:pointer; transition:border-color .15s, color .15s;
}
.ab-a-side:hover{ border-color:var(--c-accent); color:var(--c-accent); }
.ab-a-side em{ font-style:normal; color:var(--c-text-muted); font-weight:500; }
`

/* ── small shared editor atoms ─────────────────────────────────── */

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
  const Icon = aboutIcon(value)
  return (
    <div className="ab-a-icon-pick">
      <span className="ab-a-icon-pre"><Icon size={17} strokeWidth={1.6} /></span>
      <select className="a-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {ABOUT_ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}

function ImageField({ label, value, onChange, upload }: {
  label: string; value: string; onChange: (v: string) => void
  upload: (f: File) => Promise<string | null>
}) {
  const id = `ab_up_${label.replace(/\W/g, '_')}_${value.length}`
  return (
    <div className="a-field a-col-span-2">
      <label className="a-label">{label}</label>
      <div className="ab-a-media-row">
        {value
          ? <img src={value} className="ab-a-thumb" alt="" />
          : <div className="ab-a-thumb ab-a-thumb--empty"><ImageIcon size={20} /></div>}
        <div className="ab-a-media-body">
          <input className="a-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" />
          <input type="file" id={id} hidden accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) { const u = await upload(f); if (u) onChange(u) }
            }} />
          <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById(id)?.click()}>Upload Image</button>
        </div>
      </div>
    </div>
  )
}

/* Generic repeatable-items editor: renders each item via `render`, with
   add / remove / move controls. Used for services, steps, points, rows… */
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
          <div className="ab-a-item" key={i}>
            <div className="ab-a-item-head">
              <span className="ab-a-item-label">{label} {i + 1}</span>
              <div className="ab-a-sec-actions">
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

/* Shared eyebrow/title/accent(/lead) heading block used by most sections. */
function HeadingFields({ s, upd, withLead }: {
  s: { eyebrow: string; title: string; accent: string; lead?: string }
  upd: (patch: any) => void; withLead?: boolean
}) {
  return (
    <>
      <Field label="Eyebrow" hint="small kicker above the heading">
        <input className="a-input" value={s.eyebrow} onChange={(e) => upd({ eyebrow: e.target.value })} /></Field>
      <Field label="Accent" hint="italic gold part of the heading">
        <input className="a-input" value={s.accent} onChange={(e) => upd({ accent: e.target.value })} /></Field>
      <Field label="Heading" span2>
        <input className="a-input" value={s.title} onChange={(e) => upd({ title: e.target.value })} /></Field>
      {withLead && (
        <Field label="Lead Paragraph" span2>
          <textarea className="a-textarea" rows={3} value={s.lead || ''} onChange={(e) => upd({ lead: e.target.value })} /></Field>
      )}
    </>
  )
}

/* ── per-type section editors ──────────────────────────────────── */

function SectionEditor({ s, upd, upload }: {
  s: AboutSection
  upd: (patch: any) => void
  upload: (f: File) => Promise<string | null>
}) {
  switch (s.type) {
    case 'services':
      return (
        <div className="a-form-grid">
          <ItemList items={s.items} label="Service" blank={() => ({ icon: 'truck', title: '', sub: '' })}
            onChange={(items) => upd({ items })}
            render={(it, u) => (
              <>
                <Field label="Icon"><IconPicker value={it.icon} onChange={(icon) => u({ icon })} /></Field>
                <Field label="Title">
                  <input className="a-input" value={it.title} onChange={(e) => u({ title: e.target.value })} placeholder="Free Shipping" /></Field>
                <Field label="Subtitle" span2>
                  <input className="a-input" value={it.sub} onChange={(e) => u({ sub: e.target.value })} placeholder="Worldwide" /></Field>
              </>
            )} />
        </div>
      )
    case 'steps':
      return (
        <div className="a-form-grid">
          <HeadingFields s={s} upd={upd} withLead />
          <ItemList items={s.steps} label="Step" blank={() => ({ icon: 'pencil-ruler', title: '', desc: '', details: '' })}
            onChange={(steps) => upd({ steps })}
            render={(st, u) => (
              <>
                <Field label="Icon"><IconPicker value={st.icon} onChange={(icon) => u({ icon })} /></Field>
                <Field label="Title">
                  <input className="a-input" value={st.title} onChange={(e) => u({ title: e.target.value })} placeholder="Design Selection" /></Field>
                <Field label="Description" span2>
                  <textarea className="a-textarea" rows={3} value={st.desc} onChange={(e) => u({ desc: e.target.value })} /></Field>
                <Field label="Details" hint="short bullet line, e.g. A • B • C" span2>
                  <input className="a-input" value={st.details} onChange={(e) => u({ details: e.target.value })} /></Field>
              </>
            )} />
        </div>
      )
    case 'features':
      return (
        <div className="a-form-grid">
          <HeadingFields s={s} upd={upd} withLead />
          <ItemList items={s.points} label="Feature" blank={() => ({ icon: 'sparkles', title: '', desc: '' })}
            onChange={(points) => upd({ points })}
            render={(p, u) => (
              <>
                <Field label="Icon"><IconPicker value={p.icon} onChange={(icon) => u({ icon })} /></Field>
                <Field label="Title">
                  <input className="a-input" value={p.title} onChange={(e) => u({ title: e.target.value })} placeholder="Sustainable" /></Field>
                <Field label="Description" span2>
                  <textarea className="a-textarea" rows={2} value={p.desc} onChange={(e) => u({ desc: e.target.value })} /></Field>
              </>
            )} />
        </div>
      )
    case 'story':
      return (
        <div className="a-form-grid">
          <HeadingFields s={s} upd={upd} />
          <ItemList items={s.rows} label="Row"
            blank={() => ({ image: '', tag_title: '', tag_sub: '', body: '', quote: '', flip: s.rows.length % 2 === 0 })}
            onChange={(rows) => upd({ rows })}
            render={(r, u) => (
              <>
                <ImageField label="Image" value={r.image} onChange={(image) => u({ image })} upload={upload} />
                <Field label="Image Tag Title" hint="small card on the image">
                  <input className="a-input" value={r.tag_title} onChange={(e) => u({ tag_title: e.target.value })} placeholder="Fine Jewelry" /></Field>
                <Field label="Image Tag Subtitle">
                  <input className="a-input" value={r.tag_sub} onChange={(e) => u({ tag_sub: e.target.value })} placeholder="Handcrafted with love" /></Field>
                <Field label="Body" hint="blank line = new paragraph" span2>
                  <textarea className="a-textarea" rows={4} value={r.body} onChange={(e) => u({ body: e.target.value })} /></Field>
                <Field label="Pull Quote" hint="optional, shown in italics">
                  <input className="a-input" value={r.quote} onChange={(e) => u({ quote: e.target.value })} /></Field>
                <div className="a-field">
                  <label className="a-label">Image Side</label>
                  <button className="ab-a-side" onClick={() => u({ flip: !r.flip })}>
                    <ArrowLeftRight size={13} /> Image <em>{r.flip ? 'Right' : 'Left'}</em>
                  </button>
                </div>
              </>
            )} />
        </div>
      )
    case 'values':
      return (
        <div className="a-form-grid">
          <HeadingFields s={s} upd={upd} withLead />
          <ItemList items={s.values} label="Value" blank={() => ({ icon: 'sparkles', title: '', desc: '' })}
            onChange={(values) => upd({ values })}
            render={(v, u) => (
              <>
                <Field label="Icon"><IconPicker value={v.icon} onChange={(icon) => u({ icon })} /></Field>
                <Field label="Title">
                  <input className="a-input" value={v.title} onChange={(e) => u({ title: e.target.value })} placeholder="Ethical Sourcing" /></Field>
                <Field label="Description" span2>
                  <textarea className="a-textarea" rows={2} value={v.desc} onChange={(e) => u({ desc: e.target.value })} /></Field>
              </>
            )} />
        </div>
      )
    case 'stats':
      return (
        <div className="a-form-grid">
          <ItemList items={s.stats} label="Stat" blank={() => ({ num: '', label: '' })}
            onChange={(stats) => upd({ stats })}
            render={(st, u) => (
              <>
                <Field label="Number" hint="e.g. 10K+">
                  <input className="a-input" value={st.num} onChange={(e) => u({ num: e.target.value })} placeholder="10K+" /></Field>
                <Field label="Label">
                  <input className="a-input" value={st.label} onChange={(e) => u({ label: e.target.value })} placeholder="Happy Customers" /></Field>
              </>
            )} />
        </div>
      )
    case 'cta':
      return (
        <div className="a-form-grid">
          <Field label="Icon"><IconPicker value={s.icon} onChange={(icon) => upd({ icon })} /></Field>
          <Field label="Accent" hint="italic gold part of the heading">
            <input className="a-input" value={s.accent} onChange={(e) => upd({ accent: e.target.value })} /></Field>
          <Field label="Heading" span2>
            <input className="a-input" value={s.title} onChange={(e) => upd({ title: e.target.value })} /></Field>
          <Field label="Paragraph" span2>
            <textarea className="a-textarea" rows={3} value={s.paragraph} onChange={(e) => upd({ paragraph: e.target.value })} /></Field>
          <Field label="Primary Button Text">
            <input className="a-input" value={s.primary_cta_text} onChange={(e) => upd({ primary_cta_text: e.target.value })} placeholder="Shop Now" /></Field>
          <Field label="Primary Button Link">
            <input className="a-input" value={s.primary_cta_link} onChange={(e) => upd({ primary_cta_link: e.target.value })} placeholder="/collection" /></Field>
          <Field label="Secondary Button Text" hint="optional">
            <input className="a-input" value={s.secondary_cta_text} onChange={(e) => upd({ secondary_cta_text: e.target.value })} /></Field>
          <Field label="Secondary Button Link">
            <input className="a-input" value={s.secondary_cta_link} onChange={(e) => upd({ secondary_cta_link: e.target.value })} /></Field>
        </div>
      )
    case 'text_image':
      return (
        <div className="a-form-grid">
          <HeadingFields s={s} upd={upd} />
          <Field label="Body" hint="blank line = new paragraph" span2>
            <textarea className="a-textarea" rows={5} value={s.body} onChange={(e) => upd({ body: e.target.value })} /></Field>
          <ImageField label="Image" value={s.image} onChange={(image) => upd({ image })} upload={upload} />
          <div className="a-field">
            <label className="a-label">Image Side</label>
            <button className="ab-a-side" onClick={() => upd({ image_side: s.image_side === 'left' ? 'right' : 'left' })}>
              <ArrowLeftRight size={13} /> Image <em>{s.image_side === 'left' ? 'Left' : 'Right'}</em>
            </button>
          </div>
          <div />
          <Field label="Button Text" hint="optional">
            <input className="a-input" value={s.cta_text} onChange={(e) => upd({ cta_text: e.target.value })} /></Field>
          <Field label="Button Link">
            <input className="a-input" value={s.cta_link} onChange={(e) => upd({ cta_link: e.target.value })} /></Field>
        </div>
      )
    default:
      return null
  }
}

/* ── page ──────────────────────────────────────────────────────── */

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)
  const [cfg, setCfg] = useState<AboutConfig>(DEFAULT_ABOUT)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    fetch('/api/admin/about')
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setCfg(normalizeAbout(d.config)) })
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg }),
      })
      const d = await res.json()
      if (res.ok && !d.error) {
        setCfg(normalizeAbout(d.config))
        showToast('About page updated')
      } else throw new Error(d.error || 'Failed to update')
    } catch (e: any) {
      showToast(e.message, true)
    } finally {
      setSaving(false)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    showToast('Uploading image…')
    try {
      const res = await fetch('/api/storage/upload-about', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) { showToast('Image uploaded'); return d.url }
      throw new Error(d.error || 'Upload failed')
    } catch (e: any) {
      showToast(e.message || 'Upload failed', true)
      return null
    }
  }

  const setHero = (patch: Partial<AboutHero>) =>
    setCfg((p) => ({ ...p, hero: { ...p.hero, ...patch } }))

  const updSection = (i: number, patch: any) =>
    setCfg((p) => {
      const arr = [...p.sections]
      arr[i] = { ...arr[i], ...patch }
      return { ...p, sections: arr }
    })

  const addSection = (type: AboutSectionType) => {
    setCfg((p) => ({ ...p, sections: [...p.sections, blankAboutSection(type)] }))
    setAddOpen(false)
  }

  const removeSection = (i: number) => {
    if (!window.confirm('Delete this section? You can still discard by leaving without saving.')) return
    setCfg((p) => ({ ...p, sections: p.sections.filter((_, x) => x !== i) }))
  }

  const moveSection = (i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const j = i + dir
      if (j < 0 || j >= p.sections.length) return p
      const arr = [...p.sections]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...p, sections: arr }
    })

  if (loading) return null

  const sectionTitle = (s: AboutSection): string => {
    if ('title' in s && s.title) return s.title
    if (s.type === 'services') return s.items[0]?.title || 'Services'
    if (s.type === 'stats') return s.stats[0]?.label || 'Stats'
    return ABOUT_SECTION_TYPE_META[s.type].label
  }

  return (
    <div className="a-page">
      <style>{CSS}</style>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Marketing</div>
          <h1 className="a-title">About <em>Page</em></h1>
          <p className="a-subtitle">Manage the /about page — hero plus fully flexible sections you can add, remove and reorder</p>
        </div>
        <div className="a-head-actions">
          <a className="a-btn a-btn--ghost" href="/about" target="_blank" rel="noopener noreferrer">View Page</a>
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
              <div><div className="a-card-title">Hero <em>Intro</em></div><div className="a-card-sub">Top of the page — headline, buttons, image &amp; floating badges</div></div>
            </div>
            <button className="a-icon-btn a-icon-btn--sm" onClick={() => setHero({ is_visible: !cfg.hero.is_visible })}
              title={cfg.hero.is_visible ? 'Visible — click to hide' : 'Hidden — click to show'}>
              {cfg.hero.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <Field label="Eyebrow">
                <input className="a-input" value={cfg.hero.eyebrow} onChange={(e) => setHero({ eyebrow: e.target.value })} placeholder="The House of Gems Global" /></Field>
              <Field label="Accent Line" hint="italic gold second line">
                <input className="a-input" value={cfg.hero.accent} onChange={(e) => setHero({ accent: e.target.value })} placeholder="since day one" /></Field>
              <Field label="Title" span2>
                <input className="a-input" value={cfg.hero.title} onChange={(e) => setHero({ title: e.target.value })} placeholder="Crafting elegance," /></Field>
              <Field label="Paragraph" span2>
                <textarea className="a-textarea" rows={4} value={cfg.hero.paragraph} onChange={(e) => setHero({ paragraph: e.target.value })} /></Field>

              <Field label="Primary Button Text">
                <input className="a-input" value={cfg.hero.primary_cta_text} onChange={(e) => setHero({ primary_cta_text: e.target.value })} /></Field>
              <Field label="Primary Button Link">
                <input className="a-input" value={cfg.hero.primary_cta_link} onChange={(e) => setHero({ primary_cta_link: e.target.value })} /></Field>
              <Field label="Secondary Button Text" hint="optional">
                <input className="a-input" value={cfg.hero.secondary_cta_text} onChange={(e) => setHero({ secondary_cta_text: e.target.value })} /></Field>
              <Field label="Secondary Button Link">
                <input className="a-input" value={cfg.hero.secondary_cta_link} onChange={(e) => setHero({ secondary_cta_link: e.target.value })} /></Field>

              <ImageField label="Hero Image" value={cfg.hero.image} onChange={(image) => setHero({ image })} upload={uploadImage} />

              <Field label="Chip Icon" hint="pill on the image, top-right">
                <IconPicker value={cfg.hero.chip_icon} onChange={(chip_icon) => setHero({ chip_icon })} /></Field>
              <Field label="Chip Text" hint="empty = hidden">
                <input className="a-input" value={cfg.hero.chip_text} onChange={(e) => setHero({ chip_text: e.target.value })} placeholder="IGI Certified" /></Field>
              <Field label="Badge Icon" hint="card on the image, bottom-left">
                <IconPicker value={cfg.hero.badge_icon} onChange={(badge_icon) => setHero({ badge_icon })} /></Field>
              <Field label="Badge Title + Subtitle" hint="empty title = hidden">
                <div className="a-row" style={{ gap: 8 }}>
                  <input className="a-input" style={{ width: 90 }} value={cfg.hero.badge_title} onChange={(e) => setHero({ badge_title: e.target.value })} placeholder="100%" />
                  <input className="a-input" style={{ flex: 1 }} value={cfg.hero.badge_subtitle} onChange={(e) => setHero({ badge_subtitle: e.target.value })} placeholder="Handmade with love" />
                </div></Field>

              <ItemList items={cfg.hero.meta} label="Hero Stat" blank={() => ({ num: '', label: '' })}
                onChange={(meta) => setHero({ meta })}
                render={(m, u) => (
                  <>
                    <Field label="Number" hint="e.g. 15+">
                      <input className="a-input" value={m.num} onChange={(e) => u({ num: e.target.value })} /></Field>
                    <Field label="Label">
                      <input className="a-input" value={m.label} onChange={(e) => u({ label: e.target.value })} /></Field>
                  </>
                )} />
            </div>
          </div>
        </div>

        {/* ── SECTIONS (typed, repeatable, reorderable) ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Blocks size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Page <em>Sections</em></div><div className="a-card-sub">Add, remove &amp; reorder any mix of section types</div></div>
            </div>
            <button className="a-btn a-btn--ghost a-btn--sm" onClick={() => setAddOpen((v) => !v)}>
              {addOpen ? <X size={14} /> : <Plus size={14} />} {addOpen ? 'Close' : 'Add Section'}
            </button>
          </div>
          <div className="a-card-body">
            {addOpen && (
              <div className="ab-a-add-menu" style={{ marginTop: 0, marginBottom: 18 }}>
                {(Object.keys(ABOUT_SECTION_TYPE_META) as AboutSectionType[]).map((t) => (
                  <button className="ab-a-add-opt" key={t} onClick={() => addSection(t)}>
                    <b>{ABOUT_SECTION_TYPE_META[t].label}</b>
                    <span>{ABOUT_SECTION_TYPE_META[t].hint}</span>
                  </button>
                ))}
              </div>
            )}

            {cfg.sections.length === 0 ? (
              <p className="a-hint">No sections yet. Click <strong>Add Section</strong> and pick a section type to start building the page.</p>
            ) : (
              <div className="a-stack">
                {cfg.sections.map((s, i) => (
                  <div className={`ab-a-sec${s.is_visible ? '' : ' ab-a-sec--hidden'}`} key={s.id}>
                    <div className="ab-a-sec-head">
                      <span className="ab-a-sec-badge">
                        <span className="ab-a-sec-num">{i + 1}</span>
                        {sectionTitle(s)}
                        <span className="ab-a-sec-type">{ABOUT_SECTION_TYPE_META[s.type].label}</span>
                      </span>
                      <div className="ab-a-sec-actions">
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => updSection(i, { is_visible: !s.is_visible })}
                          title={s.is_visible ? 'Visible — click to hide' : 'Hidden — click to show'}>
                          {s.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSection(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSection(i, 1)} disabled={i === cfg.sections.length - 1} title="Move down"><ArrowDown size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removeSection(i)} title="Delete section"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <SectionEditor s={s} upd={(patch) => updSection(i, patch)} upload={uploadImage} />
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
