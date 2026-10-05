'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, AlertCircle, CheckCircle, Plus, Trash2, Save,
  Video, Store, Sparkles, GripVertical, Settings2,
} from 'lucide-react'

type Mode = 'visit' | 'online' | 'both'

interface ServiceRow {
  key: string
  name: string
  description: string
  duration: string
  tag: string
  mode: Mode
  is_enabled: boolean
  position: number
  _isNew?: boolean
}

// Turn a display name into a url-safe slug for the primary key.
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function AppointmentServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/appointment-services?all=1')
      const data = await res.json()
      const list: ServiceRow[] = (Array.isArray(data) ? data : []).map((d: any, i: number) => ({
        key: d.key,
        name: d.name || '',
        description: d.description || '',
        duration: d.duration || '',
        tag: d.tag || '',
        mode: (['visit', 'online', 'both'].includes(d.mode) ? d.mode : 'both') as Mode,
        is_enabled: d.is_enabled !== false,
        position: typeof d.position === 'number' ? d.position : i,
      }))
      list.sort((a, b) => a.position - b.position)
      setRows(list)
    } catch {
      setError('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  function update(idx: number, patch: Partial<ServiceRow>) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  function addRow() {
    setRows(prev => [
      ...prev,
      {
        key: '', name: '', description: '', duration: '', tag: '',
        mode: 'both', is_enabled: true, position: prev.length, _isNew: true,
      },
    ])
  }

  async function removeRow(idx: number) {
    const row = rows[idx]
    // Newly-added (unsaved) rows just drop from local state.
    if (row._isNew || !row.key) {
      setRows(prev => prev.filter((_, i) => i !== idx))
      return
    }
    if (!confirm(`Delete “${row.name || row.key}”? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/appointment-services?key=${encodeURIComponent(row.key)}`, { method: 'DELETE' })
      if (res.ok) {
        setRows(prev => prev.filter((_, i) => i !== idx))
        setSuccess(`Deleted “${row.name || row.key}”`)
      } else {
        setError('Failed to delete service')
      }
    } catch {
      setError('Failed to delete service')
    }
  }

  async function saveAll() {
    setError(''); setSuccess('')

    // Validate + derive keys for new rows from their name.
    const items = rows.map((r, i) => {
      const key = (r.key || slugify(r.name)).trim()
      return { ...r, key, position: i }
    })

    if (items.some(r => !r.name.trim())) {
      setError('Every service needs a name.')
      return
    }
    if (items.some(r => !r.key)) {
      setError('A service name must contain letters or numbers to build its ID.')
      return
    }
    const keys = items.map(r => r.key)
    if (new Set(keys).size !== keys.length) {
      setError('Two services resolved to the same ID — rename one so they are unique.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/appointment-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ _isNew, ...rest }) => rest),
        }),
      })
      if (res.ok) {
        setSuccess('Services saved successfully')
        load()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d?.error || 'Failed to save services')
      }
    } catch {
      setError('Failed to save services')
    } finally {
      setSaving(false)
    }
  }

  const modeMeta: Record<Mode, { label: string; badge: string; icon: React.ReactNode }> = {
    visit: { label: 'In-Person only', badge: 'accent', icon: <Store size={12} /> },
    online: { label: 'Online only', badge: 'info', icon: <Video size={12} /> },
    both: { label: 'Both', badge: 'neutral', icon: <Sparkles size={12} /> },
  }

  return (
    <div className="a-page">
      <style>{`
        .svc-card{ position:relative; }
        .svc-card + .svc-card{ margin-top:16px; }
        .svc-grid{ display:grid; grid-template-columns:2fr 1fr; gap:16px 20px; }
        @media (max-width:720px){ .svc-grid{ grid-template-columns:1fr; } }
        .svc-toprow{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:16px; }
        .svc-modes{ display:flex; gap:8px; flex-wrap:wrap; }
        .svc-mode-btn{
          display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 12px;
          border:1px solid var(--c-border); border-radius:var(--radius); background:#fff;
          font-family:var(--font-dmsans); font-size:12px; color:var(--c-text-muted); cursor:pointer;
          transition:border-color .18s, color .18s, background .18s;
        }
        .svc-mode-btn:hover{ border-color:var(--c-accent); color:var(--c-accent); }
        .svc-mode-btn.is-on{ border-color:var(--c-accent); color:var(--c-accent); background:var(--c-accent-soft); font-weight:600; }
        .svc-toggle{
          display:inline-flex; align-items:center; gap:8px; cursor:pointer; user-select:none;
          font-family:var(--font-dmsans); font-size:12.5px; color:var(--c-text-muted);
        }
        .svc-switch{ width:38px; height:22px; border-radius:999px; background:var(--c-border); position:relative; transition:background .2s; flex-shrink:0; }
        .svc-switch.is-on{ background:var(--c-accent); }
        .svc-knob{ position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:#fff; transition:left .2s; box-shadow:var(--shadow-sm); }
        .svc-switch.is-on .svc-knob{ left:18px; }
      `}</style>

      <Link href="/admin/appointments" className="a-back">
        <ArrowLeft size={14} />
        Back to Appointments
      </Link>

      {error && (
        <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)' }}>
          <div className="a-card-body a-row" style={{ gap: 12, color: 'var(--c-danger)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{error}</span>
            <button type="button" className="a-icon-btn a-icon-btn--sm" onClick={() => setError('')} aria-label="Dismiss">×</button>
          </div>
        </div>
      )}
      {success && (
        <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-success)', background: 'var(--c-success-bg)' }}>
          <div className="a-card-body a-row" style={{ gap: 12, color: 'var(--c-success)' }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{success}</span>
            <button type="button" className="a-icon-btn a-icon-btn--sm" onClick={() => setSuccess('')} aria-label="Dismiss">×</button>
          </div>
        </div>
      )}

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Bookings</div>
          <h1 className="a-title">Online <em>Services</em></h1>
          <p className="a-subtitle">Add, edit or remove the services customers can book — for visits, online, or both</p>
        </div>
        <div className="a-head-actions">
          <button type="button" className="a-btn a-btn--ghost" onClick={addRow}>
            <Plus size={15} /> Add Service
          </button>
          <button type="button" className="a-btn a-btn--primary" onClick={saveAll} disabled={saving || loading}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save All'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="a-loader-row">
          <span className="a-loader" />
          <span className="a-loader-label">Loading services</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="a-card">
          <div className="a-card-body">
            <div className="a-empty">
              <div className="a-empty-ico"><Settings2 size={20} /></div>
              <div className="a-empty-title">No services yet</div>
              <div className="a-empty-text">Add your first bookable service to get started.</div>
              <button type="button" className="a-btn a-btn--primary" style={{ marginTop: 16 }} onClick={addRow}>
                <Plus size={15} /> Add Service
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {rows.map((r, idx) => {
            const mm = modeMeta[r.mode]
            return (
              <div key={r.key || `new-${idx}`} className="a-card svc-card">
                <div className="a-card-body">
                  <div className="svc-toprow">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <GripVertical size={16} style={{ color: 'var(--c-text-faint)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-main)', fontSize: 16, color: 'var(--c-text)' }}>
                            {r.name || <em style={{ color: 'var(--c-text-faint)' }}>Untitled service</em>}
                          </span>
                          <span className={`a-badge a-badge--${mm.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            {mm.icon} {mm.label}
                          </span>
                          {!r.is_enabled && <span className="a-badge a-badge--danger">Hidden</span>}
                        </div>
                        {r.key && <span className="a-cell-meta">ID: {r.key}</span>}
                      </div>
                    </div>
                    <button type="button" className="a-icon-btn a-icon-btn--danger" onClick={() => removeRow(idx)} aria-label="Delete service">
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="svc-grid">
                    <div className="a-field">
                      <label className="a-label">Service Name <span className="a-req">*</span></label>
                      <input className="a-input" value={r.name} placeholder="e.g. Virtual Consultation"
                        onChange={e => update(idx, { name: e.target.value })} />
                    </div>
                    <div className="a-field">
                      <label className="a-label">Duration</label>
                      <input className="a-input" value={r.duration} placeholder="e.g. 45 min"
                        onChange={e => update(idx, { duration: e.target.value })} />
                    </div>
                    <div className="a-field a-col-span-2">
                      <label className="a-label">Description</label>
                      <input className="a-input" value={r.description} placeholder="Short description shown to customers"
                        onChange={e => update(idx, { description: e.target.value })} />
                    </div>
                    <div className="a-field">
                      <label className="a-label">Tag <span style={{ color: 'var(--c-text-faint)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional badge)</span></label>
                      <input className="a-input" value={r.tag} placeholder="e.g. Most Popular"
                        onChange={e => update(idx, { tag: e.target.value })} />
                    </div>
                    <div className="a-field">
                      <label className="a-label">Availability</label>
                      <div className="svc-modes">
                        {(['visit', 'online', 'both'] as Mode[]).map(m => (
                          <button key={m} type="button"
                            className={`svc-mode-btn ${r.mode === m ? 'is-on' : ''}`}
                            onClick={() => update(idx, { mode: m })}>
                            {modeMeta[m].icon} {m === 'visit' ? 'Visit' : m === 'online' ? 'Online' : 'Both'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--c-border)' }}>
                    <div className="svc-toggle" onClick={() => update(idx, { is_enabled: !r.is_enabled })} role="switch" aria-checked={r.is_enabled}>
                      <span className={`svc-switch ${r.is_enabled ? 'is-on' : ''}`}><span className="svc-knob" /></span>
                      {r.is_enabled ? 'Visible to customers' : 'Hidden from booking page'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button type="button" className="a-btn a-btn--ghost" onClick={addRow}>
              <Plus size={15} /> Add Service
            </button>
            <button type="button" className="a-btn a-btn--primary" onClick={saveAll} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save All'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
