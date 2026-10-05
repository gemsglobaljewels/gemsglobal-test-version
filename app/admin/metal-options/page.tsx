'use client'

import { useEffect, useState } from 'react'
import { Plus, Save, RotateCcw, Trash2 } from 'lucide-react'

type MetalItem = { key: string; name: string; price_modifier?: number; is_enabled?: boolean; position?: number }

export default function AdminMetalOptionsPage() {
  const [items, setItems] = useState<MetalItem[]>([])
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
      const r = await fetch('/api/metal-options', { cache: 'no-store' })
      const j = await r.json()
      setItems(Array.isArray(j) ? j : [])
    } catch {
      setItems([])
    }
  }

  useEffect(() => { load() }, [])

  function addRow() {
    setItems((prev) => [...prev, { key: '', name: '', price_modifier: 0, is_enabled: true, position: prev.length }])
  }
  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateRow(idx: number, patch: Partial<MetalItem>) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function deleteRow(key: string) {
    try {
      const res = await fetch(`/api/metal-options?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Delete failed')
      }
      setItems((prev) => prev.filter((it) => it.key !== key))
      setMessage('Deleted')
      setTimeout(() => setMessage(null), 1200)
    } catch (err: any) {
      setError(err?.message || 'Delete failed')
    }
  }

  async function save() {
    setSaving(true); setError(null); setMessage(null)
    try {
      const clean = items
        .map((it, idx) => {
          const key = it.key ? slugify(it.key) : slugify(it.name || '')
          return { ...it, key, position: idx }
        })
        .filter((it) => it.key && it.name)
      const r = await fetch('/api/metal-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: clean }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(j?.error || 'Failed to save metal options')
      } else {
        setMessage('Saved')
        setItems(Array.isArray(j) ? j : clean)
      }
    } catch {
      setError('Failed to save metal options')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 1500)
    }
  }

  return (
    <div className="a-page">
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Catalog Settings</div>
          <h1 className="a-title">Metal <em>Options</em></h1>
          <p className="a-subtitle">Control which metal options are available for products and their price modifiers.</p>
        </div>
        <div className="a-head-actions">
          <button type="button" className="a-btn a-btn--ghost" onClick={load} disabled={saving}>
            <RotateCcw size={16} /> Reload
          </button>
          <button type="button" className="a-btn a-btn--subtle" onClick={addRow} disabled={saving}>
            <Plus size={16} /> Add Metal Option
          </button>
          <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="a-badge a-badge--danger" style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
          {error}
        </div>
      )}
      {message && (
        <div className="a-badge a-badge--success" style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
          {message}
        </div>
      )}

      <div className="a-card">
        <div className="a-card-head">
          <div>
            <h2 className="a-card-title">Available <em>Metals</em></h2>
            <p className="a-card-sub">Name, slug, price modifier and display position for each option.</p>
          </div>
        </div>
        <div className="a-card-body a-card-body--flush">
          <div className="a-table-wrap">
            <div className="a-table-scroll">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Key (slug)</th>
                    <th>Price Modifier ($)</th>
                    <th>Position</th>
                    <th style={{ textAlign: 'center' }}>Visible</th>
                    <th className="a-td-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="a-empty">
                          <div className="a-empty-title">No metal options yet</div>
                          <div className="a-empty-text">Add a metal option to get started.</div>
                          <button type="button" className="a-btn a-btn--subtle" onClick={addRow} disabled={saving} style={{ marginTop: 12 }}>
                            <Plus size={16} /> Add Metal Option
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            className="a-input"
                            value={it.name || ''}
                            placeholder="18k White Gold"
                            onChange={(e) => updateRow(idx, { name: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="a-input a-mono"
                            value={it.key || ''}
                            placeholder="18k-white-gold"
                            onChange={(e) => updateRow(idx, { key: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="a-input"
                            value={it.price_modifier || 0}
                            placeholder="0"
                            onChange={(e) => updateRow(idx, { price_modifier: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="a-input"
                            value={it.position ?? idx}
                            placeholder={String(idx)}
                            onChange={(e) => updateRow(idx, { position: Number(e.target.value) || idx })}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <label className="a-switch">
                              <input
                                type="checkbox"
                                checked={!(it.is_enabled === false)}
                                onChange={() => updateRow(idx, { is_enabled: it.is_enabled === false })}
                              />
                              <span className="a-switch-slider" />
                            </label>
                          </div>
                        </td>
                        <td className="a-td-right">
                          <div className="a-cell-actions">
                            <button
                              type="button"
                              className="a-icon-btn a-icon-btn--danger"
                              title="Delete"
                              onClick={() => it.key ? deleteRow(it.key) : removeRow(idx)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="a-card-foot">
          <button type="button" className="a-btn a-btn--subtle" onClick={addRow} disabled={saving}>
            <Plus size={16} /> Add Metal Option
          </button>
          <div className="a-row" style={{ gap: 12 }}>
            <button type="button" className="a-btn a-btn--ghost" onClick={load} disabled={saving}>
              <RotateCcw size={16} /> Reload
            </button>
            <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
