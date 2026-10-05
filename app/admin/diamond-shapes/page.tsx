'use client'

import { useEffect, useState } from 'react'
import { Plus, Save, RotateCw, Upload, Trash2, Gem } from 'lucide-react'

type ShapeItem = { key: string; name: string; sub?: string; image?: string; is_enabled?: boolean }

export default function AdminDiamondShapesPage() {
  const [items, setItems] = useState<ShapeItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function slugify(s: string) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function load() {
    setError(null)
    try {
      const r = await fetch('/api/diamond-shapes', { cache: 'no-store' })
      const j = await r.json()
      setItems(Array.isArray(j) ? j : [])
    } catch {
      setItems([])
    }
  }

  useEffect(() => { load() }, [])

  function addRow() {
    setItems((prev) => [...prev, { key: '', name: '', sub: '', image: '', is_enabled: true }])
  }
  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateRow(idx: number, patch: Partial<ShapeItem>) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function uploadImage(idx: number, file: File | null) {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/diamond-shapes/upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (r.ok && j?.url) {
        updateRow(idx, { image: j.url })
      } else {
        setError(j?.error || 'Upload failed')
      }
    } catch {
      setError('Upload failed')
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

  function toggle(key: string) {
    setItems((prev) => prev.map((it) => it.key === key ? { ...it, is_enabled: !(it.is_enabled !== false) ? false : true } : it))
  }

  return (
    <div className="a-page">
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Catalog Settings</div>
          <h1 className="a-title">Diamond <em>Shapes</em></h1>
          <p className="a-subtitle">Control which diamond shapes show on the homepage Explore Shapes section and collection filters.</p>
        </div>
        <div className="a-head-actions">
          <button className="a-btn a-btn--ghost" onClick={load} disabled={saving}>
            <RotateCw size={15} /> Reload
          </button>
          <button className="a-btn a-btn--subtle" onClick={addRow} disabled={saving}>
            <Plus size={15} /> Add Shape
          </button>
          <button className="a-btn a-btn--primary" onClick={save} disabled={saving}>
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

      <div className="a-card">
        <div className="a-card-head">
          <div>
            <h2 className="a-card-title">Shape <em>Library</em></h2>
            <p className="a-card-sub">{items.length} {items.length === 1 ? 'shape' : 'shapes'} configured</p>
          </div>
        </div>
        <div className="a-card-body a-card-body--flush">
          {items.length === 0 ? (
            <div className="a-empty">
              <div className="a-empty-ico"><Gem size={26} /></div>
              <div className="a-empty-title">No diamond shapes yet</div>
              <div className="a-empty-text">Add your first shape to populate the Explore Shapes section.</div>
              <button className="a-btn a-btn--primary" onClick={addRow} disabled={saving} style={{ marginTop: 16 }}>
                <Plus size={15} /> Add Shape
              </button>
            </div>
          ) : (
            <div className="a-table-wrap">
              <div className="a-table-scroll">
                <table className="a-table">
                  <thead>
                    <tr>
                      <th style={{ width: '44px' }}></th>
                      <th>Name</th>
                      <th>Key (slug)</th>
                      <th>Description</th>
                      <th>Image</th>
                      <th style={{ textAlign: 'center' }}>Visible</th>
                      <th className="a-td-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="a-media">
                            {it.image
                              ? <img src={it.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span className="a-muted" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em' }}>No img</span>}
                          </div>
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <input
                            className="a-input"
                            value={it.name || ''}
                            placeholder="Round"
                            onChange={(e) => updateRow(idx, { name: e.target.value })}
                          />
                        </td>
                        <td style={{ minWidth: 130 }}>
                          <input
                            className="a-input a-mono"
                            value={it.key || ''}
                            placeholder="round"
                            onChange={(e) => updateRow(idx, { key: e.target.value })}
                          />
                        </td>
                        <td style={{ minWidth: 200 }}>
                          <input
                            className="a-input"
                            value={it.sub || ''}
                            placeholder="A classic cut..."
                            onChange={(e) => updateRow(idx, { sub: e.target.value })}
                          />
                        </td>
                        <td style={{ minWidth: 240 }}>
                          <div className="a-row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                            <input
                              className="a-input"
                              value={it.image || ''}
                              placeholder="image URL"
                              onChange={(e) => updateRow(idx, { image: e.target.value })}
                              style={{ flex: 1, minWidth: 0 }}
                            />
                            <label className="a-btn a-btn--subtle a-btn--sm" style={{ flexShrink: 0, cursor: 'pointer' }}>
                              <Upload size={14} /> Upload
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => uploadImage(idx, e.target.files?.[0] || null)}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label className="a-switch">
                            <input
                              type="checkbox"
                              checked={!(it.is_enabled === false)}
                              onChange={() => updateRow(idx, { is_enabled: it.is_enabled === false })}
                            />
                            <span className="a-switch-slider" />
                          </label>
                        </td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="a-card-foot">
          <button className="a-btn a-btn--subtle" onClick={addRow} disabled={saving}>
            <Plus size={15} /> Add Shape
          </button>
          <div className="a-row" style={{ gap: 12, marginLeft: 'auto' }}>
            <button className="a-btn a-btn--ghost" onClick={load} disabled={saving}>
              <RotateCw size={15} /> Reload
            </button>
            <button className="a-btn a-btn--primary" onClick={save} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
