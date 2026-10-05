'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, RotateCcw, ArrowLeft, AlertCircle, Gem, Sparkles } from 'lucide-react'

type OptType = 'category' | 'metal'
type Opt = { id: string; type: OptType; label: string; position: number; isEnabled: boolean }

const isFallback = (id: string) => typeof id === 'string' && id.startsWith('default-')

export default function AdminCustomOrderOptionsPage() {
  const [options, setOptions] = useState<Opt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [newLabels, setNewLabels] = useState<Record<OptType, string>>({ category: '', metal: '' })
  const [adding, setAdding] = useState<Record<OptType, boolean>>({ category: false, metal: false })

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(null), 1500)
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/custom-orders/options?all=1', { cache: 'no-store' })
      const j = await r.json()
      setOptions(Array.isArray(j) ? j : [])
    } catch {
      setOptions([])
      setError('Failed to load options')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const hasFallback = options.some((o) => isFallback(o.id))

  async function renameOption(opt: Opt, nextLabel: string) {
    const label = nextLabel.trim()
    if (!label || label === opt.label || isFallback(opt.id)) return
    const prev = opt.label
    setOptions((list) => list.map((o) => o.id === opt.id ? { ...o, label } : o))
    try {
      const r = await fetch(`/api/custom-orders/options/${encodeURIComponent(opt.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Rename failed')
      setOptions((list) => list.map((o) => o.id === opt.id ? { ...o, ...j } : o))
      flash('Saved')
    } catch (err: any) {
      setOptions((list) => list.map((o) => o.id === opt.id ? { ...o, label: prev } : o))
      setError(err?.message || 'Rename failed')
      load()
    }
  }

  async function toggleOption(opt: Opt) {
    if (isFallback(opt.id)) return
    const next = !opt.isEnabled
    setOptions((list) => list.map((o) => o.id === opt.id ? { ...o, isEnabled: next } : o))
    try {
      const r = await fetch(`/api/custom-orders/options/${encodeURIComponent(opt.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: next }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Update failed')
      setOptions((list) => list.map((o) => o.id === opt.id ? { ...o, ...j } : o))
    } catch (err: any) {
      setOptions((list) => list.map((o) => o.id === opt.id ? { ...o, isEnabled: opt.isEnabled } : o))
      setError(err?.message || 'Update failed')
      load()
    }
  }

  async function deleteOption(opt: Opt) {
    if (isFallback(opt.id)) return
    if (!window.confirm(`Delete "${opt.label}"?`)) return
    const snapshot = options
    setOptions((list) => list.filter((o) => o.id !== opt.id))
    try {
      const r = await fetch(`/api/custom-orders/options/${encodeURIComponent(opt.id)}`, { method: 'DELETE' })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j?.error || 'Delete failed')
      }
      flash('Deleted')
    } catch (err: any) {
      setOptions(snapshot)
      setError(err?.message || 'Delete failed')
      load()
    }
  }

  async function addOption(type: OptType) {
    const label = (newLabels[type] || '').trim()
    if (!label) return
    setAdding((a) => ({ ...a, [type]: true }))
    setError(null)
    try {
      const r = await fetch('/api/custom-orders/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, label }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Failed to add option')
      setOptions((list) => [...list, j as Opt])
      setNewLabels((n) => ({ ...n, [type]: '' }))
      flash('Added')
    } catch (err: any) {
      setError(err?.message || 'Failed to add option')
    } finally {
      setAdding((a) => ({ ...a, [type]: false }))
    }
  }

  function renderCard(type: OptType, title: string, sub: string, Icon: any) {
    const rows = options.filter((o) => o.type === type).sort((a, b) => a.position - b.position)
    return (
      <div className="a-card">
        <div className="a-card-head">
          <div>
            <h2 className="a-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={18} /> {title}
            </h2>
            <p className="a-card-sub">{sub}</p>
          </div>
        </div>
        <div className="a-card-body a-card-body--flush">
          <div className="a-table-wrap">
            <div className="a-table-scroll">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Enabled</th>
                    <th className="a-td-right" style={{ width: 90 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3}>
                        <div className="a-loader-row">
                          <span className="a-loader" />
                          <span className="a-loader-label">Loading…</span>
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <div className="a-empty">
                          <div className="a-empty-title">No options yet</div>
                          <div className="a-empty-text">Add one below to show it on the custom order form.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((opt) => {
                      const locked = isFallback(opt.id)
                      return (
                        <tr key={opt.id}>
                          <td>
                            <input
                              className="a-input"
                              defaultValue={opt.label}
                              disabled={locked}
                              placeholder="Label"
                              onBlur={(e) => renameOption(opt, e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <label className="a-switch">
                                <input
                                  type="checkbox"
                                  checked={!!opt.isEnabled}
                                  disabled={locked}
                                  onChange={() => toggleOption(opt)}
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
                                title={locked ? 'Built-in default' : 'Delete'}
                                disabled={locked}
                                onClick={() => deleteOption(opt)}
                              >
                                <Trash2 size={16} />
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
        </div>
        <div className="a-card-foot">
          <div className="a-row" style={{ gap: 12, width: '100%' }}>
            <input
              className="a-input"
              style={{ flex: 1 }}
              value={newLabels[type]}
              placeholder={type === 'category' ? 'e.g. Ring' : 'e.g. Platinum'}
              onChange={(e) => setNewLabels((n) => ({ ...n, [type]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') addOption(type) }}
            />
            <button
              type="button"
              className="a-btn a-btn--subtle"
              onClick={() => addOption(type)}
              disabled={adding[type] || !newLabels[type].trim()}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="a-page">
      <Link href="/admin/custom-orders" className="a-back">
        <ArrowLeft size={16} /> Back to Custom Orders
      </Link>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Custom Orders</div>
          <h1 className="a-title">Manage <em>Options</em></h1>
          <p className="a-subtitle">Jewellery types and metal preferences shown on the custom order form.</p>
        </div>
        <div className="a-head-actions">
          <button type="button" className="a-btn a-btn--ghost" onClick={load} disabled={loading}>
            <RotateCcw size={16} /> Reload
          </button>
          <Link href="/admin/custom-orders" className="a-btn a-btn--ghost">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      {hasFallback && (
        <div
          className="a-badge a-badge--warning"
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}
        >
          <AlertCircle size={16} />
          These are built-in defaults. Run migration 104 (custom_order_options) in Supabase to add, rename, or remove options.
        </div>
      )}

      {error && (
        <div className="a-badge a-badge--danger" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {message && (
        <div className="a-badge a-badge--success" style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
          {message}
        </div>
      )}

      <div className="a-stack" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {renderCard('category', 'Jewellery Types', 'Categories a customer can choose from on the custom order form.', Gem)}
        {renderCard('metal', 'Metal Preferences', 'Metals a customer can request for their custom piece.', Sparkles)}
      </div>
    </div>
  )
}
