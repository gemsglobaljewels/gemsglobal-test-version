'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { Plus, Save, RotateCw, Trash2, Gem, Layers, Check, EyeOff, ImageIcon, Loader2 } from 'lucide-react'
import ScopeCategoryPicker from '@/components/admin/ScopeCategoryPicker'
import { appliesLabel, categoryFamily, groupByFamily, type CategoryRef } from '@/lib/categoryScope'

type ShapeItem = { key: string; name: string; sub?: string; image?: string; is_enabled?: boolean; category_ids?: string[] }

export default function AdminDiamondShapesPage() {
  const [items, setItems] = useState<ShapeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  // Category rows for the per-row scope editor + the row currently open.
  const [categories, setCategories] = useState<CategoryRef[]>([])
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  // Homepage-box tabs — one jewellery family at a time, exactly like the
  // Styles admin ("All shapes" shows every box grouped). 'ALL' = everything.
  const [tab, setTab] = useState<string>('ALL')
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  function slugify(s: string) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function load() {
    setError(null)
    setLoading(true)
    try {
      // Cache-buster: this API is CDN-cached for the storefront (5 min), so
      // the admin must never read a stale copy right after a save.
      const r = await fetch(`/api/diamond-shapes?t=${Date.now()}`, { cache: 'no-store' })
      const j = await r.json()
      setItems(Array.isArray(j) ? j : [])
      setIsDirty(false)
    } catch {
      setItems([])
      setError('Failed to load diamond shapes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    // Category list for the "applies to" editor (a shape can be limited to a
    // category instead of showing in every Explore Shapes row).
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
    // A row added inside a box starts in that box (its categories stamped),
    // so it shows up right away instead of landing somewhere unexpected.
    // Added from "All shapes" it starts unscoped ("Featured").
    const famIds = tab === 'ALL'
      ? []
      : categories.filter(c => categoryFamily(c.name) === tab).map(c => c.id)
    setItems((prev) => [...prev, {
      key: '', name: '', sub: '', image: '', is_enabled: true,
      category_ids: famIds,
    }])
    setIsDirty(true)
  }
  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
    setIsDirty(true)
  }
  function updateRow(idx: number, patch: Partial<ShapeItem>) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
    setIsDirty(true)
  }

  // Homepage visibility — one switch per row, exactly like the Styles table.
  // is_enabled drives both the Explore Shapes widget and the category filters.
  function handleToggle(idx: number) {
    const it = items[idx]
    const next = !(it.is_enabled !== false)
    updateRow(idx, { is_enabled: next })
    setMessage(next ? `"${it.name || it.key || 'Shape'}" shows on the homepage` : `"${it.name || it.key || 'Shape'}" hidden from the homepage`)
    setTimeout(() => setMessage(null), 2400)
  }

  async function uploadImage(idx: number, file: File | null) {
    if (!file) return
    setUploadingIdx(idx)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/diamond-shapes/upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (r.ok && j?.url) {
        updateRow(idx, { image: j.url })
      } else {
        setError(j?.error || 'Upload failed')
        setTimeout(() => setError(null), 2400)
      }
    } catch {
      setError('Upload failed')
      setTimeout(() => setError(null), 2400)
    } finally {
      setUploadingIdx(null)
    }
  }

  async function deleteRow(key: string) {
    try {
      await fetch(`/api/diamond-shapes?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((it) => it.key !== key))
      setMessage('Deleted')
      setTimeout(() => setMessage(null), 1200)
    } catch {
      setError('Delete failed')
    }
  }

  async function save() {
    setSaving(true); setError(null); setMessage(null)
    try {
      const clean = items
        .map((it) => {
          const key = it.key ? slugify(it.key) : slugify(it.name || '')
          return { ...it, key }
        })
        .filter((it) => it.key && it.name)
      const r = await fetch('/api/diamond-shapes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: clean }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(j?.error || 'Failed to save diamond shapes')
      } else {
        setMessage('Saved')
        setItems(Array.isArray(j) ? j : clean)
        // Reload data from server to ensure we have the latest
        await load()
      }
    } catch {
      setError('Failed to save diamond shapes')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 1500)
    }
  }

  // ── What the table shows ────────────────────────────────────────────────
  // Same model as the Styles admin: one homepage box (jewellery family) at a
  // time, A → Z inside each box; "All shapes" stacks every box with a header
  // row so nothing ever mixes silently. Tick "Categories" on a row to move it
  // into another box — it jumps there live, even before Save.
  const isEnabled = (it: ShapeItem) => it.is_enabled !== false
  const byName = (a: ShapeItem, b: ShapeItem) =>
    String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
  const boxSections = groupByFamily(items, categories)
  const visibleSections = tab === 'ALL' ? boxSections : boxSections.filter(s => s.title === tab)
  // groupByFamily hands back the same row refs, so the original index (needed
  // by edit/upload/delete) is recovered through identity.
  const idxOf = new Map<ShapeItem, number>(items.map((it, i) => [it, i]))
  const totalOn = items.filter(isEnabled).length
  const noImage = items.filter(it => !it.image).length

  return (
    <div className="a-page">
      <style>{`
        /* Pick what you see — same pill tabs as the Styles admin */
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

        /* Group header rows inside the table — same as the Styles admin */
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

        /* Name + slug stacked, switch caption */
        .a-key-input{ margin-top:6px; }
        .a-home-cap{
          font-family: var(--font-dmsans); font-size: 10.5px; color: var(--c-text-muted);
          margin-top: 5px; white-space: nowrap;
        }

        /* Floating save bar when there are unsaved changes (as on Styles) */
        .as-savebar{
          position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
          background:#fff; border:1px solid var(--c-border); border-radius:var(--radius-lg);
          padding:12px 14px 12px 22px; display:flex; align-items:center; gap:18px;
          box-shadow:var(--shadow-lg); z-index:100;
          animation:asSlideUp .4s cubic-bezier(.16,1,.3,1);
        }
        @keyframes asSlideUp{ from{ transform:translate(-50%,16px); opacity:0; } to{ transform:translate(-50%,0); opacity:1; } }
        @media (prefers-reduced-motion: reduce){ .as-savebar{ animation:none; } }
      `}</style>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Catalog Settings</div>
          <h1 className="a-title">Diamond <em>Shapes</em></h1>
          <p className="a-subtitle">
            One box per jewellery family on the homepage — <strong>Bracelets</strong>, <strong>Diamonds</strong>…
            The tabs open one box at a time (“All shapes” stacks every box grouped). Tick <strong>Categories</strong> on
            a row to move it into another box; the switch turns a row on/off on the homepage. Rows stay A → Z.
          </p>
        </div>
        <div className="a-head-actions">
          {isDirty && (
            <span className="a-badge a-badge--accent">
              <span className="a-dot a-dot--info a-dot--pulse" /> Unsaved
            </span>
          )}
          <button className="a-btn a-btn--ghost" onClick={load} disabled={saving || loading}>
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} /> Reload
          </button>
          <button className="a-btn a-btn--subtle" onClick={addRow} disabled={saving}>
            <Plus size={15} /> Add Shape
          </button>
          <button className="a-btn a-btn--primary" onClick={save} disabled={saving || !isDirty}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="a-badge a-badge--danger" style={{ display: 'block', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>{error}</div>
      )}
      {message && (
        <div className="a-badge a-badge--success" style={{ display: 'block', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>{message}</div>
      )}

      {/* Stats — how much is on / off the homepage at a glance */}
      <div className="a-stats">
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">Total Shapes</span>
            <span className="a-stat-ico"><Gem size={16} /></span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{items.length}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">On Homepage</span>
            <span className="a-stat-ico"><Check size={16} /></span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{totalOn}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">Hidden</span>
            <span className="a-stat-ico"><EyeOff size={16} /></span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{items.length - totalOn}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">Missing Image</span>
            <span className="a-stat-ico"><ImageIcon size={16} /></span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{noImage}</div>
        </div>
      </div>

      {/* Which box: everything grouped, or one box at a time */}
      <div className="a-toolbar" style={{ marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div className="a-tabs">
          <button
            className={`a-tab${tab === 'ALL' ? ' is-on' : ''}`}
            onClick={() => setTab('ALL')}
            title="Every box stacked and grouped, like the homepage"
          >
            All shapes <span className="a-tab-count">{items.length}</span>
          </button>
          {boxSections.map(s => (
            <button
              key={s.title}
              className={`a-tab${tab === s.title ? ' is-on' : ''}`}
              onClick={() => setTab(s.title)}
              title={`Only the shapes in the “${s.title}” homepage box`}
            >
              {s.title} <span className="a-tab-count">{s.rows.length}</span>
            </button>
          ))}
        </div>
        <div className="a-toolbar-group">
          <button className="a-btn a-btn--primary" onClick={addRow} disabled={saving}>
            <Plus size={15} strokeWidth={2.5} /> Add Shape{tab === 'ALL' ? '' : ` to ${tab}`}
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
                <th style={{ minWidth: 220 }}>Description</th>
                <th style={{ minWidth: 210 }}>Applies to</th>
                <th style={{ width: 110, textAlign: 'center' }}>On homepage</th>
                <th style={{ width: 60 }} className="a-td-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Loading shapes</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="a-empty">
                      <div className="a-empty-ico"><Gem size={26} /></div>
                      <div className="a-empty-title">No diamond shapes yet</div>
                      <div className="a-empty-text">Add your first shape to populate the Explore Shapes section.</div>
                      <button className="a-btn a-btn--primary" onClick={addRow} style={{ marginTop: 16 }}>
                        <Plus size={15} /> Add Shape
                      </button>
                    </div>
                  </td>
                </tr>
              ) : visibleSections.length === 0 || visibleSections.every(s => s.rows.length === 0) ? (
                <tr>
                  <td colSpan={6}>
                    <div className="a-empty">
                      <div className="a-empty-ico"><Gem size={26} /></div>
                      <div className="a-empty-title">
                        {tab !== 'ALL' ? `No shapes in ${tab} yet` : 'Nothing here yet'}
                      </div>
                      <div className="a-empty-text">
                        {tab !== 'ALL'
                          ? `Click “Add Shape to ${tab}” — the new row starts in this box. Or tick Categories on any row to move it here.`
                          : 'Click “Add Shape” to create your first shape.'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {tab !== 'ALL' && (
                          <button className="a-btn a-btn--primary" onClick={addRow}>
                            <Plus size={15} /> Add Shape to {tab}
                          </button>
                        )}
                        <button
                          className="a-btn a-btn--subtle"
                          onClick={() => setTab('ALL')}
                        >
                          Show all shapes
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleSections.map(sec => {
                  const rows = [...sec.rows].sort(byName)
                  const offCount = rows.filter(it => !isEnabled(it)).length
                  return (
                    <Fragment key={sec.title}>
                      {tab === 'ALL' && (
                        <tr className="a-grp">
                          <td colSpan={6}>
                            <div className="a-grp-inner">
                              <span className="a-grp-title">{sec.title === 'Featured' ? 'Featured shapes' : sec.title}</span>
                              <span className="a-badge a-badge--neutral">
                                {rows.length} shape{rows.length === 1 ? '' : 's'}
                              </span>
                              {offCount > 0 && <span className="a-grp-note">{offCount} hidden on the homepage</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                      {rows.map((it) => {
                        const idx = idxOf.get(it) ?? -1
                        const enabled = isEnabled(it)
                  return (
                    <tr key={it.key || `row-${idx}`}>
                      {/* Image — click the thumb to upload (same as Styles) */}
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
                      <td style={{ minWidth: 150 }}>
                        <input
                          className="a-input"
                          value={it.name || ''}
                          placeholder="e.g. Round"
                          onChange={(e) => updateRow(idx, { name: e.target.value })}
                        />
                        <input
                          className="a-input a-mono a-key-input"
                          value={it.key || ''}
                          placeholder="slug (auto from name)"
                          title="Machine id of the shape — leave empty to generate it from the name"
                          onChange={(e) => updateRow(idx, { key: e.target.value })}
                        />
                      </td>

                      {/* Description */}
                      <td>
                        <input
                          className="a-input"
                          value={it.sub || ''}
                          placeholder="A classic cut…"
                          onChange={(e) => updateRow(idx, { sub: e.target.value })}
                        />
                      </td>

                      {/* Scope: which box this row lives in + editor */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                            rowLabel={it.name || it.key || 'shape'}
                            value={it.category_ids || []}
                            categories={categories}
                            onChange={(ids) => updateRow(idx, { category_ids: ids })}
                            onClose={() => setExpandedKey(null)}
                            noun="this shape"
                          />
                        )}
                      </td>

                      {/* Homepage visibility */}
                      <td style={{ textAlign: 'center' }}>
                        <label className="a-switch" title={enabled ? 'Hide from the homepage' : 'Show on the homepage'}>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => handleToggle(idx)}
                          />
                          <span className="a-switch-slider" />
                        </label>
                        <div className="a-home-cap">{enabled ? 'On homepage' : 'Hidden'}</div>
                      </td>

                      {/* Delete */}
                      <td className="a-td-right">
                        <div className="a-cell-actions">
                          <button
                            className="a-icon-btn a-icon-btn--danger"
                            title="Delete"
                            onClick={() => it.key ? deleteRow(it.key) : removeRow(idx)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                      )
                      })}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom save bar if dirty */}
      {isDirty && !saving && (
        <div className="as-savebar">
          <span style={{ fontSize: 13, fontFamily: 'var(--font-dmsans)', color: 'var(--c-text-muted)' }}>You have unsaved changes</span>
          <button className="a-btn a-btn--primary" onClick={save}>
            <Save size={14} /> Save Changes
          </button>
        </div>
      )}
    </div>
  )
}
