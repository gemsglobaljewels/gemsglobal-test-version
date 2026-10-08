'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Save, RotateCw, Trash2, Gem, Layers, Check, EyeOff, ImageIcon, Loader2 } from 'lucide-react'
import ScopeCategoryPicker from '@/components/admin/ScopeCategoryPicker'
import { appliesLabel, type CategoryRef } from '@/lib/categoryScope'

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
  // Scope filter — picking a category narrows the list to the shapes that
  // category actually sees and hides the scope editing.
  const [scopeFilter, setScopeFilter] = useState<string>('all')
  // "Which show on the homepage" filter — same pick-what-you-see tabs the
  // Styles admin has, just over one list instead of sections.
  const [homeFilter, setHomeFilter] = useState<'all' | 'on' | 'hidden'>('all')
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
    setItems((prev) => [...prev, {
      key: '', name: '', sub: '', image: '', is_enabled: true,
      // Created while a category chip is on → belongs to that category, so it
      // shows up right away instead of silently landing as "all categories".
      category_ids: scopeFilter === 'all' ? [] : [scopeFilter],
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
  // A → Z by name (kept on screen even after a local edit, before Save),
  // narrowed by the category chip and then by the homepage tab.
  const isEnabled = (it: ShapeItem) => it.is_enabled !== false
  const scopeMatch = (it: ShapeItem) => {
    if (scopeFilter === 'all') return true
    // Strict: a category chip lists only the shapes assigned to THAT category.
    // A row scoped to "All categories" (empty list) is not a Bracelets row —
    // it lives in the "All categories" view, so it must not leak in here.
    const ids = Array.isArray(it.category_ids) ? it.category_ids : []
    return ids.includes(scopeFilter)
  }
  const byName = (a: { it: ShapeItem }, b: { it: ShapeItem }) =>
    String(a.it.name || '').localeCompare(String(b.it.name || ''), undefined, { sensitivity: 'base' })
  const scopedRows = items
    .map((it, idx) => ({ it, idx }))
    .filter(({ it }) => scopeMatch(it))
    .sort(byName)
  const sortedRows = scopedRows
    .filter(({ it }) =>
      homeFilter === 'all' ? true
        : homeFilter === 'on' ? isEnabled(it)
          : !isEnabled(it)
    )
  const scopeCatName = categories.find(c => c.id === scopeFilter)?.name || ''
  const showScopeEditor = scopeFilter === 'all'

  const totalOn = items.filter(isEnabled).length
  const scopedOn = scopedRows.filter(({ it }) => isEnabled(it)).length
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

        /* Scope filter bar — same visual language as the size picker */
        .sz-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 0 12px; }
        .sz-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .sz-chip {
          display: inline-flex; align-items: center; gap: 6px;
          height: 30px; padding: 0 14px; cursor: pointer;
          background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 999px;
          font-family: var(--font-dmsans); font-size: 11.5px; font-weight: 500;
          color: var(--c-text-muted); transition: background .15s, color .15s, border-color .15s;
        }
        .sz-chip:hover { border-color: var(--c-accent); color: var(--c-text); }
        .sz-chip.is-on { background: var(--c-text); border-color: var(--c-text); color: #fff; }
        .sz-hint { font-family: var(--font-dmsans); font-size: 11px; color: var(--c-text-muted); }
        .sz-bar .sz-hint { margin-left: auto; }
        .sz-scope-chip {
          font-family: var(--font-dmsans); font-size: 10.5px; color: var(--c-text-muted);
          background: var(--c-surface-2); border: 1px solid var(--c-border);
          border-radius: 999px; padding: 2px 9px; white-space: nowrap;
        }

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
            One shared list of stone cuts. The tabs pick which rows you see — <strong>On homepage</strong> is exactly
            what the Explore Shapes widget shows, so a row switched off disappears from the homepage. The category
            chips open that category’s <em>own</em> shapes only (rows marked “All categories” stay in the first
            chip); rows stay A → Z.
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

      {/* Which shapes: everything / only homepage / only hidden */}
      <div className="a-toolbar" style={{ marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div className="a-tabs">
          <button
            className={`a-tab${homeFilter === 'all' ? ' is-on' : ''}`}
            onClick={() => setHomeFilter('all')}
            title="Every shape, homepage or not"
          >
            All shapes <span className="a-tab-count">{scopedRows.length}</span>
          </button>
          <button
            className={`a-tab${homeFilter === 'on' ? ' is-on' : ''}`}
            onClick={() => setHomeFilter('on')}
            title="Shapes the Explore Shapes widget shows"
          >
            On homepage <span className="a-tab-count">{scopedOn}</span>
          </button>
          <button
            className={`a-tab${homeFilter === 'hidden' ? ' is-on' : ''}`}
            onClick={() => setHomeFilter('hidden')}
            title="Switched off — not on the homepage"
          >
            Hidden <span className="a-tab-count">{scopedRows.length - scopedOn}</span>
          </button>
        </div>
        <div className="a-toolbar-group">
          <button className="a-btn a-btn--primary" onClick={addRow} disabled={saving}>
            <Plus size={15} strokeWidth={2.5} /> Add Shape
          </button>
        </div>
      </div>

      {/* Category chips — pick a category to see only its shapes (A → Z). */}
      <div className="sz-bar">
        <div className="sz-chips" role="group" aria-label="Which category's shapes to list">
          <button
            type="button"
            className={`sz-chip${scopeFilter === 'all' ? ' is-on' : ''}`}
            onClick={() => setScopeFilter('all')}
            title="Every shape, with its scope chip and category editor"
          >
            All categories
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              className={`sz-chip${scopeFilter === c.id ? ' is-on' : ''}`}
              onClick={() => setScopeFilter(c.id)}
              title={`Only the shapes ${c.name} is offered`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <span className="sz-hint">
          {scopeFilter === 'all'
            ? 'Scope chips and “Categories” editing are on the rows below'
            : `Only shapes assigned to ${scopeCatName} — “All categories” rows stay in the first view (scope editing happens there)`}
        </span>
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
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="a-empty">
                      <div className="a-empty-ico"><Gem size={26} /></div>
                      <div className="a-empty-title">
                        {scopeFilter !== 'all'
                          ? `No shapes assigned to ${scopeCatName} yet`
                          : homeFilter === 'hidden' ? 'Nothing hidden' : 'Nothing on the homepage yet'}
                      </div>
                      <div className="a-empty-text">
                        {scopeFilter !== 'all'
                          ? `“All categories” rows don’t count here. Tick Categories → ${scopeCatName} on a shape in the first view, or hit “Add Shape” — a row added while this chip is on starts in ${scopeCatName}.`
                          : homeFilter === 'hidden'
                            ? 'Every shape is switched on — flip a row’s “On homepage” switch off to hide it.'
                            : 'Switch a row’s “On homepage” switch on and save to publish it.'}
                      </div>
                      <button
                        className="a-btn a-btn--subtle"
                        onClick={() => { setScopeFilter('all'); setHomeFilter('all') }}
                        style={{ marginTop: 16 }}
                      >
                        Show all shapes
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRows.map(({ it, idx }) => {
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

                      {/* Scope: label + editor (only in the All-categories view) */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {showScopeEditor ? (
                            <>
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
                            </>
                          ) : (
                            <span className="sz-scope-chip">Offered to {scopeCatName}</span>
                          )}
                        </div>
                        {showScopeEditor && expandedKey === (it.key || `row-${idx}`) && (
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
