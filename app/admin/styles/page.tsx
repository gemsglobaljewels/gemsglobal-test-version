'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import {
  Plus, Trash2, AlertCircle, Check, ImageIcon,
  Loader2, Sparkles, RefreshCw, Save, Tag, Layers
} from 'lucide-react'
import ScopeCategoryPicker from '@/components/admin/ScopeCategoryPicker'
import { appliesLabel, type CategoryRef } from '@/lib/categoryScope'

type StyleItem = { key: string; name: string; sub?: string; desc?: string; image?: string; is_enabled?: boolean; category_ids?: string[]; section_id?: string | null }
/** A homepage block — "Rings By Style" etc. (table style_sections, mig. 120). */
type SectionRow = { id?: string; key: string; title: string; position: number; is_active: boolean; category_ids?: string[] }
type Notification = { id: number; message: string; type: 'success' | 'error' | 'info' }

export default function AdminStylesPage() {
  const [items, setItems] = useState<StyleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isDirty, setIsDirty] = useState(false)
  // Categories the "applies to" editor can pick from, plus the open row.
  const [categories, setCategories] = useState<CategoryRef[]>([])
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  // Homepage sections (title / order / show-on-home switch).
  const [sections, setSections] = useState<SectionRow[]>([])
  const [sectionsDirty, setSectionsDirty] = useState(false)
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [expandedSectionKey, setExpandedSectionKey] = useState<string | null>(null)
  // Which homepage section the table is showing. null = "first section"
  // (so the list is never one big mixed pile of every category at once).
  const [filter, setFilter] = useState<string | null>(null)
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  function slugify(s: string) {
    return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function notify(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4500)
  }

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/styles', { cache: 'no-store' })
      const j = await r.json()
      setItems(Array.isArray(j) ? j : [])
      setIsDirty(false)
    } catch {
      setItems([])
      notify('Failed to load styles', 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function loadSections() {
    setSectionsLoading(true)
    try {
      const r = await fetch('/api/style-sections', { cache: 'no-store' })
      const j = await r.json()
      setSections(Array.isArray(j) ? j : [])
      setSectionsDirty(false)
    } catch { setSections([]) }
    finally { setSectionsLoading(false) }
  }

  useEffect(() => { loadSections() }, [])

  // ── Section (homepage block) helpers ────────────────────────────────
  const updateSection = (idx: number, patch: Partial<SectionRow>) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
    setSectionsDirty(true)
  }
  const moveSection = (idx: number, dir: -1 | 1) => {
    setSections(prev => {
      const next = [...prev]
      const to = idx + dir
      if (to < 0 || to >= next.length) return prev
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return next.map((s, i) => ({ ...s, position: i + 1 }))
    })
    setSectionsDirty(true)
  }
  const addSection = () => {
    setSections(prev => [
      ...prev,
      { key: '', title: 'New section', position: prev.length + 1, is_active: true, category_ids: [] },
    ])
    setSectionsDirty(true)
    notify('New homepage section added — give it a title.', 'info')
  }
  const removeSection = (idx: number) => {
    const s = sections[idx]
    setSections(prev => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, position: i + 1 })))
    // Styles pointing at it stay safe: the API parks them automatically.
    setItems(prev => prev.map(it => it.section_id && s?.id && it.section_id === s.id ? { ...it, section_id: null } : it))
    setSectionsDirty(true)
    setIsDirty(true)
    if (s?.title) notify(`Section "${s.title}" removed. Save to confirm.`, 'info')
  }
  const toggleSection = (idx: number) => {
    const now = sections[idx]?.is_active === false
    updateSection(idx, { is_active: now })
    notify(now ? `"${sections[idx]?.title}" will show on the homepage.` : `"${sections[idx]?.title}" hidden from the homepage.`, now ? 'success' : 'info')
  }
  const countInSection = (id?: string) =>
    id ? items.filter(it => it.section_id === id).length : 0

  async function saveSections() {
    if (!sections.length) return true
    try {
      const r = await fetch('/api/style-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: sections.map((s, i) => ({ ...s, position: i + 1 })),
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { notify(j?.error || 'Failed to save homepage sections', 'error'); return false }
      // Re-read the saved rows: ids/order come back from the server, so a
      // newly created section is selectable immediately and positions stick.
      await loadSections()
      return true
    } catch { notify('Failed to save homepage sections', 'error'); return false }
  }

  useEffect(() => {
    // Category list for the per-row scope editor.
    ;(async () => {
      try {
        const r = await fetch('/api/categories', { cache: 'no-store' })
        const j = await r.json()
        const rows = Array.isArray(j) ? j : (Array.isArray(j?.categories) ? j.categories : [])
        setCategories(rows
          .filter((c: any) => c?.id && c?.name)
          .map((c: any) => ({ id: String(c.id), name: String(c.name) })))
      } catch { setCategories([]) }
    })()
  }, [])

  function addRow() {
    // Picked tab decides where the row starts; "" (Auto) lets the server drop
    // it into the right section — creating one if this is a new category.
    const startSection =
      filter && filter !== 'ALL' && filter !== 'UNASSIGNED'
        ? (sections.find(s => s.id === filter)?.id || null)
        : null
    setItems(prev => [...prev, { key: '', name: '', sub: '', desc: '', image: '', is_enabled: true, section_id: startSection }])
    setIsDirty(true)
    notify('New style row added — fill in the details.', 'info')
  }

  function removeRow(idx: number) {
    const name = items[idx]?.name
    setItems(prev => prev.filter((_, i) => i !== idx))
    setIsDirty(true)
    if (name) notify(`"${name}" removed. Save to confirm.`, 'info')
  }

  function updateRow(idx: number, patch: Partial<StyleItem>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
    setIsDirty(true)
  }

  function toggleRow(idx: number) {
    const it = items[idx]
    const next = it.is_enabled === false ? true : false
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, is_enabled: !next } : item))
    setIsDirty(true)
    const name = it.name || 'Style'
    notify(next ? `"${name}" hidden from widget.` : `"${name}" is now visible.`, 'info')
  }

  // Correct toggle: is_enabled defaults true, so toggling means flipping
  function handleToggle(idx: number) {
    const it = items[idx]
    const current = it.is_enabled !== false // default true
    const next = !current
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, is_enabled: next } : item))
    setIsDirty(true)
    const name = it.name || 'Style'
    notify(next ? `"${name}" is now visible in the widget.` : `"${name}" hidden from the widget.`, next ? 'success' : 'info')
  }

  async function uploadImage(idx: number, file: File | null) {
    if (!file) return
    setUploadingIdx(idx)
    notify('Uploading image...', 'info')
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/styles/upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (r.ok && j?.url) {
        updateRow(idx, { image: j.url })
        notify(`Image uploaded for "${items[idx]?.name || 'style'}"!`)
      } else {
        notify(j?.error || 'Upload failed. Please try again.', 'error')
      }
    } catch { notify('Image upload failed. Check your connection.', 'error') }
    finally { setUploadingIdx(null) }
  }

  async function deleteRow(idx: number) {
    const it = items[idx]
    if (!it.key && !it.name) { removeRow(idx); return }
    if (!confirm(`Delete "${it.name || it.key}"? This cannot be undone.`)) return
    if (it.key) {
      try {
        await fetch(`/api/styles?key=${encodeURIComponent(it.key)}`, { method: 'DELETE' })
        setItems(prev => prev.filter((_, i) => i !== idx))
        setIsDirty(false)
        notify(`"${it.name}" has been permanently deleted.`, 'info')
        return
      } catch { notify('Delete failed. Please try again.', 'error'); return }
    }
    removeRow(idx)
  }

  async function save() {
    setSaving(true)
    try {
      // Homepage sections first — a style can only be assigned to a section
      // that already exists, and new sections need their ids back.
      if (sectionsDirty) {
        const ok = await saveSections()
        if (!ok) return
      }
      const clean = items
        .map(it => ({ ...it, key: it.key ? slugify(it.key) : slugify(it.name || '') }))
        .filter(it => it.key && it.name)
      const r = await fetch('/api/styles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: clean }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        notify(j?.error || 'Failed to save styles', 'error')
      } else {
        setItems(Array.isArray(j) ? j : clean)
        setIsDirty(false)
        notify(`${clean.length} style${clean.length !== 1 ? 's' : ''} saved successfully!`)
        // Reload data from server to ensure we have the latest — the server may
        // have minted a brand-new section for a new category, so refresh those too.
        await Promise.all([load(), loadSections()])
      }
    } catch { notify('Failed to save styles', 'error') }
    finally { setSaving(false) }
  }

  // ── What the table shows ────────────────────────────────────────────────
  // Rows are sorted by their homepage section and grouped under a header row,
  // so styles never mix. The tab above picks which section is open — it starts
  // on the first one instead of dumping every category together.
  const sectionPos = (id?: string | null) => {
    const i = sections.findIndex(s => s.id && s.id === id)
    return i === -1 ? 999 : i
  }
  const activeFilter = filter ?? (sections.find(s => s.id)?.id ?? 'ALL')
  const isUnassigned = (it: StyleItem) =>
    !it.section_id || !sections.some(s => s.id && s.id === it.section_id)
  const unassignedCount = items.filter(isUnassigned).length
  const matchFilter = (it: StyleItem) =>
    activeFilter === 'ALL' ? true
      : activeFilter === 'UNASSIGNED' ? isUnassigned(it)
        : !!it.section_id && it.section_id === activeFilter
  const visibleRows = items
    .map((it, idx) => ({ it, idx }))
    .filter(({ it }) => matchFilter(it))
    .sort((a, b) => sectionPos(a.it.section_id) - sectionPos(b.it.section_id))
    .map((row, i, arr) => {
      const pos = sectionPos(row.it.section_id)
      const prev = i === 0 ? -2 : sectionPos(arr[i - 1].it.section_id)
      return { ...row, groupPos: prev === pos ? null : pos }
    })
  const groupMeta = (pos: number) =>
    pos === 999
      ? { title: 'Not placed in a section yet', hidden: false }
      : { title: sections[pos]?.title || 'Section', hidden: sections[pos]?.is_active === false }
  const groupCount = (pos: number) =>
    pos === 999 ? unassignedCount : countInSection(sections[pos]?.id)

  const enabledCount = items.filter(i => i.is_enabled !== false).length
  const activeSections = sections.filter(s => s.is_active !== false).length

  return (
    <div className="a-page">
      <style>{`
        .as-notif-wrap{
          position:fixed; top:24px; right:24px; z-index:9999;
          display:flex; flex-direction:column; gap:10px; pointer-events:none;
        }
        .as-notif{
          padding:13px 18px; border-radius:var(--radius); font-size:13px;
          font-family:var(--font-dmsans); display:flex; align-items:center; gap:11px;
          min-width:280px; background:#fff; border:1px solid var(--c-border);
          box-shadow:var(--shadow-md); pointer-events:all;
          animation:asSlide .42s cubic-bezier(.16,1,.3,1) forwards;
        }
        .as-notif svg{ flex-shrink:0; }
        .as-notif--success{ background:var(--c-success-bg); border-color:var(--c-success); color:var(--c-success); }
        .as-notif--error{ background:var(--c-danger-bg); border-color:var(--c-danger); color:var(--c-danger); }
        .as-notif--info{ background:var(--c-info-bg); border-color:var(--c-info); color:var(--c-info); }
        @keyframes asSlide{ from{ transform:translateX(110%); opacity:0; } to{ transform:translateX(0); opacity:1; } }
        .as-savebar{
          position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
          background:#fff; border:1px solid var(--c-border); border-radius:var(--radius-lg);
          padding:12px 14px 12px 22px; display:flex; align-items:center; gap:18px;
          box-shadow:var(--shadow-lg); z-index:100;
          animation:asSlideUp .4s cubic-bezier(.16,1,.3,1);
        }
        @keyframes asSlideUp{ from{ transform:translate(-50%,16px); opacity:0; } to{ transform:translate(-50%,0); opacity:1; } }
        @media (prefers-reduced-motion: reduce){ .as-notif, .as-savebar{ animation:none; } }

        /* Section filter tabs — one jewellery category at a time */
        .a-tabs{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:0 0 14px; }
        .a-tab{
          display:inline-flex; align-items:center; gap:8px; padding:8px 15px;
          border:1px solid var(--c-border); border-radius:999px; background:#fff;
          font-family:var(--a-sans); font-size:12.5px; font-weight:500;
          color:var(--c-text-muted); cursor:pointer; transition:background .16s, color .16s, border-color .16s;
        }
        .a-tab:hover{ border-color:var(--c-accent); color:var(--c-text); }
        .a-tab.is-on{ background:var(--c-text); border-color:var(--c-text); color:#fff; }
        .a-tab.is-on .a-tab-count{ color:#fff; opacity:.7; }
        .a-tab-count{ font-size:11px; color:var(--c-text-muted); }
        .a-tab-dot{ width:6px; height:6px; border-radius:50%; background:var(--c-off); }
        .a-tab.is-on .a-tab-dot{ background:#9BB08F; }

        /* Group header rows inside the styles table */
        .a-grp td{
          background:var(--c-surface-2); border-top:1px solid var(--c-border);
          padding:10px 14px;
        }
        .a-grp-inner{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .a-grp-title{
          font-family:var(--a-serif); font-style:italic; font-size:15px;
          color:var(--c-text); letter-spacing:.01em;
        }
        .a-grp-note{ font-family:var(--a-sans); font-size:11.5px; color:var(--c-text-muted); }
        .a-cell-under{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:8px; }
        .a-key-input{ margin-top:6px; }
      `}</style>

      {/* Notifications */}
      <div className="as-notif-wrap">
        {notifications.map(n => (
          <div key={n.id} className={`as-notif as-notif--${n.type}`}>
            {n.type === 'success' ? <Check size={14} /> : n.type === 'error' ? <AlertCircle size={14} /> : <Sparkles size={14} />}
            {n.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Admin — Styles</div>
          <h1 className="a-title">Styles</h1>
          <p className="a-subtitle">One box per category on the homepage — “Rings By Style”, “Necklaces By Style”, “Bracelets By Style”. The tabs below open one category at a time, the switch above turns a whole box on/off, then hit Save.</p>
        </div>
        <div className="a-head-actions">
          {(isDirty || sectionsDirty) && (
            <span className="a-badge a-badge--accent">
              <span className="a-dot a-dot--info a-dot--pulse" /> Unsaved
            </span>
          )}
          <button className="a-btn a-btn--ghost" onClick={() => { load(); loadSections() }} disabled={saving || loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload
          </button>
          <button className="a-btn a-btn--primary" onClick={save} disabled={saving || (!isDirty && !sectionsDirty)}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="a-stats">
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">Total Styles</span>
            <span className="a-stat-ico"><Tag size={16} /></span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{items.length}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">Visible in Widget</span>
            <span className="a-stat-ico"><Check size={16} /></span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{enabledCount}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">Hidden</span>
            <span className="a-stat-ico"><AlertCircle size={16} /></span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{items.length - enabledCount}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">Homepage Sections</span>
            <span className="a-stat-ico"><Layers size={16} /></span>
          </div>
          <div className={`a-stat-val${sectionsLoading ? ' is-loading' : ''}`}>{activeSections} / {sections.length}</div>
        </div>
      </div>

      {/* ── Homepage sections: one stacked box per section on the homepage ── */}
      <div className="a-card" style={{ marginBottom: 20 }}>
        <div className="a-card-head">
          <div>
            <h2 className="a-card-title">Homepage <em>Sections</em></h2>
            <p className="a-card-sub">
              Each row is its own box on the homepage, stacked in this order
              (Rings By Style → Bracelets By Style → …). The switch is the
              “show on homepage” toggle.
            </p>
          </div>
          <div className="a-row" style={{ gap: 8 }}>
            <button className="a-btn a-btn--subtle" onClick={addSection} disabled={saving}>
              <Plus size={14} /> Add Section
            </button>
            <button className="a-btn a-btn--primary" onClick={save} disabled={saving || !sectionsDirty}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Sections
            </button>
          </div>
        </div>
        <div className="a-card-body">
          {sectionsLoading ? (
            <div className="a-loader-row"><span className="a-loader" /><span className="a-loader-label">Loading sections</span></div>
          ) : sections.length === 0 ? (
            <div className="a-empty" style={{ padding: '22px 0' }}>
              <div className="a-empty-title">No homepage sections yet</div>
              <div className="a-empty-text">Add one (e.g. “Rings By Style”) to start stacking style boxes on the homepage.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sections.map((s, i) => (
                <div key={s.key || `section-${i}`}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    padding: '10px 12px',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--radius)',
                    background: s.is_active !== false ? 'var(--c-surface)' : 'var(--c-bg-muted, #fafafa)',
                    opacity: s.is_active !== false ? 1 : .72,
                  }}
                >
                  <div className="a-row" style={{ gap: 4 }}>
                    <button className="a-icon-btn" title="Move up" onClick={() => moveSection(i, -1)} disabled={i === 0}>↑</button>
                    <button className="a-icon-btn" title="Move down" onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1}>↓</button>
                  </div>
                  <input
                    className="a-input"
                    style={{ flex: '1 1 240px', minWidth: 160 }}
                    value={s.title}
                    placeholder="e.g. Rings By Style"
                    onChange={e => updateSection(i, { title: e.target.value })}
                  />
                  <span className="a-badge a-badge--neutral" title="Styles placed in this section">
                    {countInSection(s.id)} style{countInSection(s.id) === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    className="a-btn a-btn--subtle a-btn--sm"
                    onClick={() => setExpandedSectionKey(expandedSectionKey === (s.key || `section-${i}`) ? null : (s.key || `section-${i}`))}
                    title="Which categories this section is for (used to auto-pick it when a product form adds a style)"
                  >
                    <Layers size={12} />&nbsp;{expandedSectionKey === (s.key || `section-${i}`) ? 'Close' : 'Categories'}
                  </button>
                  <div className="a-row" style={{ gap: 8 }}>
                    <span style={{ fontSize: 11.5, fontFamily: 'var(--font-dmsans)', color: 'var(--c-text-muted)', whiteSpace: 'nowrap' }}>
                      {s.is_active !== false ? 'On homepage' : 'Hidden'}
                    </span>
                    <label className="a-switch">
                      <input
                        type="checkbox"
                        checked={s.is_active !== false}
                        onChange={() => toggleSection(i)}
                      />
                      <span className="a-switch-slider" />
                    </label>
                  </div>
                  <button className="a-icon-btn a-icon-btn--danger" title="Remove section" onClick={() => removeSection(i)}>
                    <Trash2 size={15} />
                  </button>
                </div>
                {expandedSectionKey === (s.key || `section-${i}`) && (
                  <ScopeCategoryPicker
                    rowLabel={s.title || s.key || 'section'}
                    value={s.category_ids || []}
                    categories={categories}
                    onChange={ids => updateSection(i, { category_ids: ids })}
                    onClose={() => setExpandedSectionKey(null)}
                    noun="this section"
                  />
                )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section tabs — open one homepage box at a time (never all mixed) */}
      <div className="a-toolbar" style={{ marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div className="a-tabs">
          <button
            className={`a-tab${activeFilter === 'ALL' ? ' is-on' : ''}`}
            onClick={() => setFilter('ALL')}
            title="Show every style together, grouped by section"
          >
            All styles <span className="a-tab-count">{items.length}</span>
          </button>
          {sections.filter(s => !!s.id).map(s => (
            <button
              key={s.id}
              className={`a-tab${activeFilter === s.id ? ' is-on' : ''}`}
              onClick={() => setFilter(s.id!)}
              title={s.is_active === false ? 'This box is hidden on the homepage — switch it on in “Homepage Sections” above' : 'Styles inside this homepage box'}
            >
              {s.title}
              <span className="a-tab-count">{countInSection(s.id)}</span>
              {s.is_active === false && <span className="a-tab-count">· hidden</span>}
            </button>
          ))}
          {unassignedCount > 0 && (
            <button
              className={`a-tab${activeFilter === 'UNASSIGNED' ? ' is-on' : ''}`}
              onClick={() => setFilter('UNASSIGNED')}
              title="Styles that still need a homepage box (Save to place them)"
            >
              Not placed <span className="a-tab-count">{unassignedCount}</span>
            </button>
          )}
        </div>
        <div className="a-toolbar-group">
          <button className="a-btn a-btn--primary" onClick={addRow} disabled={saving}>
            <Plus size={15} strokeWidth={2.5} /> Add Style
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="a-table-wrap">
        <div className="a-table-scroll">
          <table className="a-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>Image</th>
                <th style={{ minWidth: 175 }}>Name &amp; slug</th>
                <th style={{ minWidth: 140 }}>Subtitle</th>
                <th style={{ minWidth: 230 }}>Description</th>
                <th style={{ minWidth: 200 }}>Homepage box</th>
                <th style={{ width: 84, textAlign: 'center' }}>Visible</th>
                <th style={{ width: 60 }} className="a-td-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Loading styles</span>
                    </div>
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="a-empty">
                      <Layers size={36} className="a-empty-ico" />
                      <div className="a-empty-title">
                        {items.length === 0 ? 'No styles yet' : 'Nothing in this section yet'}
                      </div>
                      <div className="a-empty-text">
                        {items.length === 0
                          ? 'Click “Add Style” to create your first style.'
                          : activeFilter === 'UNASSIGNED'
                            ? 'Every style already sits in a homepage box.'
                            : 'Click “Add Style” — the new row starts in this section.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map(({ it, idx, groupPos }) => {
                  const isEnabled = it.is_enabled !== false
                  const g = groupPos === null ? null : groupMeta(groupPos)
                  const gCount = groupPos === null ? 0 : groupCount(groupPos)
                  return (
                    <Fragment key={idx}>
                      {g && (
                        <tr className="a-grp">
                          <td colSpan={7}>
                            <div className="a-grp-inner">
                              <span className="a-grp-title">{g.title}</span>
                              <span className="a-badge a-badge--neutral">
                                {gCount} style{gCount === 1 ? '' : 's'}
                              </span>
                              {g.hidden && <span className="a-grp-note">Hidden on the homepage</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr>
                        {/* Image */}
                        <td>
                          <div
                            className="a-media"
                            onClick={() => fileRefs.current[idx]?.click()}
                            title="Click to upload image"
                            style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {it.image
                              ? <img src={it.image} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : (uploadingIdx === idx
                                ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--c-accent)' }} />
                                : <ImageIcon size={18} strokeWidth={1.25} style={{ color: 'var(--c-text-faint)' }} />)
                            }
                            {it.image && uploadingIdx === idx && (
                              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.7)' }}>
                                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--c-accent)' }} />
                              </span>
                            )}
                            <input
                              type="file" accept="image/*" style={{ display: 'none' }}
                              ref={el => { fileRefs.current[idx] = el }}
                              onChange={e => uploadImage(idx, e.target.files?.[0] || null)}
                            />
                          </div>
                        </td>

                        {/* Name + slug (slug is secondary, so it sits under) */}
                        <td>
                          <input
                            className="a-input"
                            value={it.name || ''}
                            placeholder="e.g. Solitaire"
                            onChange={e => updateRow(idx, { name: e.target.value })}
                          />
                          <input
                            className="a-input a-mono a-key-input"
                            value={it.key || ''}
                            placeholder="slug (auto from name)"
                            title="Machine id / URL of the style — leave empty to generate it from the name"
                            onChange={e => updateRow(idx, { key: e.target.value })}
                          />
                        </td>

                        {/* Subtitle */}
                        <td>
                          <input
                            className="a-input"
                            value={it.sub || ''}
                            placeholder="Optional subtitle"
                            onChange={e => updateRow(idx, { sub: e.target.value })}
                          />
                        </td>

                        {/* Description */}
                        <td style={{ minWidth: 220 }}>
                          <textarea
                            className="a-textarea"
                            style={{ minHeight: 56, height: 56, resize: 'vertical' }}
                            value={it.desc || ''}
                            placeholder="Detailed description..."
                            onChange={e => updateRow(idx, { desc: e.target.value })}
                          />
                        </td>

                        {/* Homepage box: which stacked box it sits in + filter scope */}
                        <td>
                          <select
                            className="a-select"
                            value={sections.some(s => s.id && s.id === it.section_id) ? (it.section_id || '') : ''}
                            onChange={e => updateRow(idx, { section_id: e.target.value || null })}
                            title="Which homepage box this style appears in"
                          >
                            <option value="">Auto (by category)</option>
                            {sections
                              .filter(s => !!s.id)
                              .map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.title}{s.is_active === false ? ' (hidden)' : ''}
                                </option>
                              ))}
                          </select>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 11.5, color: 'var(--c-text-muted)' }}>
                              {appliesLabel({ category_ids: it.category_ids }, categories)}
                            </span>
                            <button
                              type="button"
                              className="a-btn a-btn--subtle a-btn--sm"
                              onClick={() => setExpandedKey(expandedKey === (it.key || `row-${idx}`) ? null : (it.key || `row-${idx}`))}
                            >
                              <Layers size={12} />&nbsp;{expandedKey === (it.key || `row-${idx}`) ? 'Close' : 'Categories'}
                            </button>
                          </div>
                          {expandedKey === (it.key || `row-${idx}`) && (
                            <ScopeCategoryPicker
                              rowLabel={it.name || it.key || 'style'}
                              value={it.category_ids || []}
                              categories={categories}
                              onChange={ids => updateRow(idx, { category_ids: ids })}
                              onClose={() => setExpandedKey(null)}
                            />
                          )}
                        </td>

                        {/* Toggle */}
                        <td style={{ textAlign: 'center' }}>
                          <label className="a-switch" title={isEnabled ? 'Hide from widget' : 'Show in widget'}>
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => handleToggle(idx)}
                            />
                            <span className="a-switch-slider" />
                          </label>
                        </td>

                        {/* Delete */}
                        <td className="a-td-right">
                          <div className="a-cell-actions">
                            <button className="a-icon-btn a-icon-btn--danger" onClick={() => deleteRow(idx)} title="Delete style">
                              <Trash2 size={15} strokeWidth={1.6} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom save bar if dirty */}
      {(isDirty || sectionsDirty) && !saving && (
        <div className="as-savebar">
          <span className="a-muted" style={{ fontSize: 13, fontFamily: 'var(--font-dmsans)' }}>You have unsaved changes</span>
          <button className="a-btn a-btn--primary" onClick={save}>
            <Save size={14} /> Save All Changes
          </button>
        </div>
      )}
    </div>
  )
}
