'use client'

import { useEffect, useState } from 'react'
import { Plus, Save, RefreshCw, Trash2, Diamond } from 'lucide-react'

type CaratItem = { key: string; name: string; price_modifier?: number; is_enabled?: boolean; position?: number }

export default function AdminCaratOptionsPage() {
  const [items, setItems] = useState<CaratItem[]>([])
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
      const r = await fetch('/api/carat-options', { cache: 'no-store' })
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
  function updateRow(idx: number, patch: Partial<CaratItem>) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function deleteRow(key: string) {
    try {
      const res = await fetch(`/api/carat-options?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
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
      const r = await fetch('/api/carat-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: clean }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(j?.error || 'Failed to save carat options')
      } else {
        setMessage('Saved')
        setItems(Array.isArray(j) ? j : clean)
      }
    } catch {
      setError('Failed to save carat options')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 1500)
    }
  }

  return (
    <div className="a-page">
      <header className="a-head">
        <div>
          <div className="a-eyebrow">Catalog</div>
          <h1 className="a-title">Diamond Carat <em>Options</em></h1>
          <p className="a-subtitle">Control which diamond carat weight options are available globally for products and their default price modifiers.</p>
        </div>
        <div className="a-head-actions">
          <button className="a-btn a-btn--ghost" onClick={load} disabled={saving}>
            <RefreshCw size={15} /> Reload
          </button>
          <button className="a-btn a-btn--subtle" onClick={addRow} disabled={saving}>
            <Plus size={15} /> Add Carat Option
          </button>
          <button className="a-btn a-btn--primary" onClick={save} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </header>

      {error && (
        <div className="a-card" style={{ borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)', marginBottom: 18 }}>
          <div className="a-card-body" style={{ color: 'var(--c-danger)', fontSize: 13 }}>{error}</div>
        </div>
      )}
      {message && (
        <div className="a-card" style={{ borderColor: 'var(--c-success)', background: 'var(--c-success-bg)', marginBottom: 18 }}>
          <div className="a-card-body" style={{ color: 'var(--c-success)', fontSize: 13 }}>{message}</div>
        </div>
      )}

      <div className="a-card">
        <div className="a-card-head">
          <div className="a-card-title">Available <em>Carats</em></div>
          <div className="a-card-sub">{items.length} option{items.length === 1 ? '' : 's'}</div>
        </div>
        <div className="a-card-body a-card-body--flush">
          <div className="a-table-wrap">
            <div className="a-table-scroll">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Name (e.g., 1.50 Carat)</th>
                    <th>Key (slug)</th>
                    <th>Price Modifier ($)</th>
                    <th>Position</th>
                    <th className="a-td-right">Visible</th>
                    <th className="a-td-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="a-empty">
                          <div className="a-empty-ico"><Diamond size={22} /></div>
                          <div className="a-empty-title">No carat options yet</div>
                          <div className="a-empty-text">Add your first diamond carat option to make it available across products.</div>
                          <button className="a-btn a-btn--primary a-btn--sm" onClick={addRow} disabled={saving}>
                            <Plus size={15} /> Add Carat Option
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <input className="a-input" value={it.name || ''} placeholder="1.50 Carat" onChange={(e) => updateRow(idx, { name: e.target.value })} />
                        </td>
                        <td>
                          <input className="a-input a-mono" value={it.key || ''} placeholder="1-50-ct" onChange={(e) => updateRow(idx, { key: e.target.value })} />
                        </td>
                        <td>
                          <input type="number" step="0.01" className="a-input" value={it.price_modifier || 0} placeholder="0" onChange={(e) => updateRow(idx, { price_modifier: Number(e.target.value) || 0 })} />
                        </td>
                        <td>
                          <input type="number" className="a-input" value={it.position ?? idx} placeholder={String(idx)} onChange={(e) => updateRow(idx, { position: Number(e.target.value) || idx })} />
                        </td>
                        <td className="a-td-right">
                          <label className="a-switch" style={{ justifyContent: 'flex-end' }}>
                            <input type="checkbox" checked={!(it.is_enabled === false)} onChange={() => updateRow(idx, { is_enabled: it.is_enabled === false })} />
                            <span className="a-switch-slider" />
                          </label>
                        </td>
                        <td className="a-td-right">
                          <div className="a-cell-actions">
                            <button className="a-icon-btn a-icon-btn--danger" title="Delete" onClick={() => it.key ? deleteRow(it.key) : removeRow(idx)}>
                              <Trash2 size={15} />
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
          <button className="a-btn a-btn--subtle" onClick={addRow} disabled={saving}>
            <Plus size={15} /> Add Carat Option
          </button>
          <button className="a-btn a-btn--primary" onClick={save} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
