'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus, Trash2, AlertCircle, Check, ImageIcon,
  Loader2, Sparkles, RefreshCw, Save, Tag
} from 'lucide-react'

type StyleItem = { key: string; name: string; sub?: string; desc?: string; image?: string; is_enabled?: boolean }
type Notification = { id: number; message: string; type: 'success' | 'error' | 'info' }

export default function AdminStylesPage() {
  const [items, setItems] = useState<StyleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isDirty, setIsDirty] = useState(false)
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

  function addRow() {
    setItems(prev => [...prev, { key: '', name: '', sub: '', desc: '', image: '', is_enabled: true }])
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
        // Reload data from server to ensure we have the latest
        await load()
      }
    } catch { notify('Failed to save styles', 'error') }
    finally { setSaving(false) }
  }

  const enabledCount = items.filter(i => i.is_enabled !== false).length

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
          <div className="a-eyebrow">Admin — Ring Styles</div>
          <h1 className="a-title">Ring <em>Styles</em></h1>
          <p className="a-subtitle">Manage which styles appear in the Rings by Style widget and filters. Toggle visibility per style without deleting.</p>
        </div>
        <div className="a-head-actions">
          {isDirty && (
            <span className="a-badge a-badge--accent">
              <span className="a-dot a-dot--info a-dot--pulse" /> Unsaved
            </span>
          )}
          <button className="a-btn a-btn--ghost" onClick={load} disabled={saving || loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload
          </button>
          <button className="a-btn a-btn--primary" onClick={save} disabled={saving || !isDirty}>
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
      </div>

      {/* Toolbar */}
      <div className="a-toolbar">
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
                <th>Name</th>
                <th>Slug / Key</th>
                <th>Subtitle</th>
                <th>Description</th>
                <th style={{ width: 90, textAlign: 'center' }}>Visible</th>
                <th style={{ width: 110, textAlign: 'center' }}>Status</th>
                <th style={{ width: 60 }} className="a-td-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Loading styles</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="a-empty">
                      <Tag size={36} className="a-empty-ico" />
                      <div className="a-empty-title">No styles yet</div>
                      <div className="a-empty-text">Click "Add Style" to create your first ring style.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const isEnabled = it.is_enabled !== false
                  return (
                    <tr key={idx}>
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

                      {/* Name */}
                      <td>
                        <input
                          className="a-input"
                          value={it.name || ''}
                          placeholder="e.g. Solitaire"
                          onChange={e => updateRow(idx, { name: e.target.value })}
                        />
                      </td>

                      {/* Key */}
                      <td>
                        <input
                          className="a-input a-mono"
                          value={it.key || ''}
                          placeholder="auto-generated"
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
                          style={{ minHeight: 44, height: 44 }}
                          value={it.desc || ''}
                          placeholder="Detailed description..."
                          onChange={e => updateRow(idx, { desc: e.target.value })}
                        />
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

                      {/* Status badge */}
                      <td style={{ textAlign: 'center' }}>
                        {isEnabled
                          ? <span className="a-badge a-badge--success"><span className="a-dot a-dot--success" /> Live</span>
                          : <span className="a-badge a-badge--neutral"><span className="a-dot" style={{ background: 'var(--c-text-faint)' }} /> Off</span>
                        }
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
          <span className="a-muted" style={{ fontSize: 13, fontFamily: 'var(--font-dmsans)' }}>You have unsaved changes</span>
          <button className="a-btn a-btn--primary" onClick={save}>
            <Save size={14} /> Save All Changes
          </button>
        </div>
      )}
    </div>
  )
}
