'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus, Trash2, AlertCircle, Check, Upload, ImageIcon,
  Loader2, Sparkles, Eye, EyeOff, ToggleLeft, ToggleRight,
  RefreshCw, Save, GripVertical, Tag
} from 'lucide-react'

type StyleItem = { key: string; name: string; sub?: string; desc?: string; image?: string; is_enabled?: boolean }
type Notification = { id: number; message: string; type: 'success' | 'error' | 'info' }

const CSS = `
.as-root {
  min-height: 100vh;
  background: var(--c-bg);
  font-family: var(--font-main);
  padding: 50px 40px 120px;
  color: var(--c-text);
  position: relative;
  overflow-x: hidden;
}
.as-wrap { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; }
@media (max-width: 767px) { .as-root { padding: 28px 16px 80px; } }

/* ── Notifications ── */
.as-notif-wrap {
  position: fixed; top: 24px; right: 24px; z-index: 9999;
  display: flex; flex-direction: column; gap: 10px; pointer-events: none;
}
.as-notif {
  padding: 14px 22px; border-radius: 6px; font-size: 13px;
  display: flex; align-items: center; gap: 12px;
  animation: slideNotif 0.45s cubic-bezier(0.16,1,0.3,1) forwards;
  backdrop-filter: blur(20px); min-width: 280px;
  box-shadow: var(--shadow-md); pointer-events: all;
}
.as-notif.success { background: rgba(20,200,100,0.12); border: 1px solid rgba(20,200,100,0.25); color: #4ade80; }
.as-notif.error   { background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.25); color: #f87171; }
.as-notif.info    { background: rgba(var(--c-accent-rgb),0.12); border: 1px solid rgba(var(--c-accent-rgb),0.25); color: var(--c-accent); }
@keyframes slideNotif {
  from { transform: translateX(110%) scale(0.95); opacity: 0; }
  to   { transform: translateX(0)   scale(1);    opacity: 1; }
}

/* ── Header ── */
.as-hdr { margin-bottom: 48px; }
.as-hdr-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.as-hdr-dash { width: 28px; height: 1px; background: linear-gradient(90deg, var(--c-accent) 0%, transparent 100%); }
.as-hdr-tag { font-size: 9px; font-weight: 500; letter-spacing: 0.5em; text-transform: uppercase; color: rgba(var(--c-accent-rgb),0.7); }
.as-hdr-title {
  font-family: var(--font-main);
  font-size: 54px; font-weight: 300; letter-spacing: 0.015em;
  color: var(--c-text); line-height: 1.05; margin: 0;
}
.as-hdr-title em { font-style: italic; color: var(--c-accent); }
.as-hdr-sub { font-size: 13px; font-weight: 300; color: var(--c-text-muted); margin-top: 12px; line-height: 1.7; }
.as-hdr-stats { display: flex; gap: 20px; margin-top: 28px; flex-wrap: wrap; }
.as-stat {
  display: flex; flex-direction: column; gap: 4px;
  padding: 14px 22px; background: rgba(var(--c-accent-rgb),0.04);
  border: 1px solid rgba(var(--c-accent-rgb),0.1); border-radius: 6px;
}
.as-stat-val { font-family: var(--font-main); font-size: 28px; font-weight: 300; color: var(--c-accent); line-height: 1; }
.as-stat-label { font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--c-text-muted); }

/* ── Toolbar ── */
.as-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px; gap: 16px; flex-wrap: wrap;
}
.as-toolbar-left { display: flex; gap: 10px; align-items: center; }
.as-btn-add {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 22px; background: var(--c-accent); color: #070605; border: none; cursor: pointer;
  font-family: var(--font-main); font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.18em; border-radius: 6px; transition: all 0.25s;
}
.as-btn-add:hover { background: var(--c-text); transform: translateY(-1px); box-shadow: var(--shadow-md); }
.as-btn-add:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
.as-btn-outline {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 20px; background: transparent;
  border: 1px solid var(--c-border); color: var(--c-accent);
  font-family: var(--font-main); font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.12em; border-radius: 6px;
  cursor: pointer; transition: all 0.25s;
}
.as-btn-outline:hover { border-color: var(--c-accent); color: var(--c-accent); background: rgba(var(--c-accent-rgb),0.05); }
.as-btn-outline:disabled { opacity: 0.3; cursor: not-allowed; }
.as-btn-save {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 28px; background: rgba(var(--c-accent-rgb),0.12);
  border: 1px solid var(--c-border); color: var(--c-accent);
  font-family: var(--font-main); font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.15em; border-radius: 6px;
  cursor: pointer; transition: all 0.25s;
}
.as-btn-save:hover { background: var(--c-accent); color: #070605; box-shadow: var(--shadow-md); }
.as-btn-save:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Card wrapper ── */
.as-card {
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: 8px; overflow: hidden;
  box-shadow: var(--shadow-md);
}
.as-table-head {
  display: grid;
  grid-template-columns: 32px 80px 1fr 1fr 1fr 1.5fr 160px 80px 60px;
  gap: 12px; padding: 14px 20px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
}
.as-table-head span {
  font-size: 9px; font-weight: 600; letter-spacing: 0.3em;
  text-transform: uppercase; color: var(--c-accent);
}
@media (max-width: 900px) {
  .as-table-head { display: none; }
}

/* ── Row ── */
.as-row {
  display: grid;
  grid-template-columns: 32px 80px 1fr 1fr 1fr 1.5fr 160px 80px 60px;
  gap: 12px; padding: 14px 20px;
  border-bottom: 1px solid rgba(var(--c-accent-rgb),0.06);
  align-items: center; transition: background 0.2s;
  animation: rowIn 0.3s cubic-bezier(0.16,1,0.3,1);
}
@keyframes rowIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
.as-row:last-child { border-bottom: none; }
.as-row:hover { background: var(--c-surface); }
@media (max-width: 900px) {
  .as-row {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    gap: 10px; padding: 18px 16px;
    border-bottom: 1px solid var(--c-border);
  }
}

/* ── Drag handle ── */
.as-drag { color: var(--c-border); cursor: grab; display: flex; align-items: center; }
.as-drag:hover { color: var(--c-accent); }

/* ── Image cell ── */
.as-img-cell { position: relative; }
.as-img-box {
  width: 64px; height: 64px; border-radius: 6px; overflow: hidden;
  border: 1px solid var(--c-border); background: var(--c-surface);
  position: relative; cursor: pointer; flex-shrink: 0;
}
.as-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.as-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--c-border); }
.as-img-hover {
  position: absolute; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.as-img-box:hover .as-img-hover { opacity: 1; }
.as-upload-dot {
  width: 28px; height: 28px; border-radius: 50%; background: var(--c-accent);
  color: #070605; display: flex; align-items: center; justify-content: center;
}

/* ── Input ── */
.as-input {
  width: 100%; height: 40px; padding: 0 13px; background: var(--c-surface);
  border: 1px solid var(--c-border); color: var(--c-text);
  font-family: var(--font-main); font-size: 13px; outline: none;
  transition: all 0.2s; border-radius: 5px; box-sizing: border-box;
}
.as-input:focus { border-color: var(--c-accent); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb),0.05); }
.as-input::placeholder { color: var(--c-text-muted); }

/* ── Toggle ── */
.as-toggle-btn {
  background: none; border: none; cursor: pointer; padding: 0;
  display: flex; align-items: center; gap: 8px; transition: all 0.2s;
  color: var(--c-text-muted);
}
.as-toggle-btn.on { color: #4ade80; }
.as-toggle-btn:hover { transform: scale(1.1); }
.as-toggle-label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }

/* ── Delete btn ── */
.as-del-btn {
  width: 34px; height: 34px; border-radius: 5px; border: 1px solid rgba(248,113,113,0.15);
  background: rgba(248,113,113,0.05); color: rgba(248,113,113,0.4);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.as-del-btn:hover { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.35); color: #f87171; transform: scale(1.05); }

/* ── Empty / Loading ── */
.as-empty { text-align: center; padding: 80px 30px; }
.as-empty-icon { margin: 0 auto 16px; opacity: 0.3; }
.as-empty-text { font-size: 13px; color: var(--c-text-muted); }
.as-loading { display: flex; flex-direction: column; align-items: center; padding: 80px 30px; gap: 14px; color: var(--c-accent); font-size: 13px; }

/* ── Unsaved badge ── */
.as-unsaved {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; background: rgba(var(--c-accent-rgb),0.1); border: 1px solid var(--c-border);
  border-radius: 20px; font-size: 10px; color: var(--c-accent); letter-spacing: 0.05em;
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
`

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
    <div className="as-root">
      <style>{CSS}</style>

      {/* Notifications */}
      <div className="as-notif-wrap">
        {notifications.map(n => (
          <div key={n.id} className={`as-notif ${n.type}`}>
            {n.type === 'success' ? <Check size={14} /> : n.type === 'error' ? <AlertCircle size={14} /> : <Sparkles size={14} />}
            {n.message}
          </div>
        ))}
      </div>

      <div className="as-wrap">
        {/* Header */}
        <div className="as-hdr">
          <div className="as-hdr-eyebrow">
            <div className="as-hdr-dash" />
            <span className="as-hdr-tag">Admin — Ring Styles</span>
          </div>
          <h1 className="as-hdr-title">Ring <em>Styles</em></h1>
          <p className="as-hdr-sub">Manage which styles appear in the Rings by Style widget and filters. Toggle visibility per style without deleting.</p>
          <div className="as-hdr-stats">
            <div className="as-stat">
              <span className="as-stat-val">{items.length}</span>
              <span className="as-stat-label">Total Styles</span>
            </div>
            <div className="as-stat">
              <span className="as-stat-val">{enabledCount}</span>
              <span className="as-stat-label">Visible in Widget</span>
            </div>
            <div className="as-stat">
              <span className="as-stat-val">{items.length - enabledCount}</span>
              <span className="as-stat-label">Hidden</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="as-toolbar">
          <div className="as-toolbar-left">
            <button className="as-btn-add" onClick={addRow} disabled={saving}>
              <Plus size={15} strokeWidth={2.5} /> Add Style
            </button>
            <button className="as-btn-outline" onClick={load} disabled={saving || loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Reload
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isDirty && (
              <span className="as-unsaved">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-accent)', display: 'inline-block' }} />
                Unsaved changes
              </span>
            )}
            <button className="as-btn-save" onClick={save} disabled={saving || !isDirty}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save All Changes'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="as-card">
          {/* Head */}
          <div className="as-table-head">
            <span></span>
            <span>Image</span>
            <span>Name</span>
            <span>Slug / Key</span>
            <span>Subtitle</span>
            <span>Description</span>
            <span>Visibility</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span></span>
          </div>

          {loading ? (
            <div className="as-loading">
              <Loader2 size={22} className="animate-spin" />
              Loading styles...
            </div>
          ) : items.length === 0 ? (
            <div className="as-empty">
              <Tag size={36} className="as-empty-icon" />
              <p className="as-empty-text">No styles yet. Click "Add Style" to get started.</p>
            </div>
          ) : (
            items.map((it, idx) => {
              const isEnabled = it.is_enabled !== false
              return (
                <div key={idx} className="as-row">
                  {/* Drag */}
                  <div className="as-drag"><GripVertical size={16} /></div>

                  {/* Image */}
                  <div
                    className="as-img-box"
                    onClick={() => fileRefs.current[idx]?.click()}
                    title="Click to upload image"
                  >
                    {it.image
                      ? <img src={it.image} alt={it.name} className="as-img" />
                      : <div className="as-img-placeholder"><ImageIcon size={20} strokeWidth={1} /></div>
                    }
                    <div className="as-img-hover">
                      <div className="as-upload-dot">
                        {uploadingIdx === idx ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      </div>
                    </div>
                    <input
                      type="file" accept="image/*" style={{ display: 'none' }}
                      ref={el => { fileRefs.current[idx] = el }}
                      onChange={e => uploadImage(idx, e.target.files?.[0] || null)}
                    />
                  </div>

                  {/* Name */}
                  <input
                    className="as-input"
                    value={it.name || ''}
                    placeholder="e.g. Solitaire"
                    onChange={e => updateRow(idx, { name: e.target.value })}
                  />

                  {/* Key */}
                  <input
                    className="as-input"
                    value={it.key || ''}
                    placeholder="auto-generated"
                    onChange={e => updateRow(idx, { key: e.target.value })}
                    style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--c-accent)' }}
                  />

                  {/* Subtitle */}
                  <input
                    className="as-input"
                    value={it.sub || ''}
                    placeholder="Optional subtitle"
                    onChange={e => updateRow(idx, { sub: e.target.value })}
                  />

                  {/* Description */}
                  <textarea
                    className="as-input"
                    style={{ height: '40px', padding: '8px 13px', resize: 'none' }}
                    value={it.desc || ''}
                    placeholder="Detailed description..."
                    onChange={e => updateRow(idx, { desc: e.target.value })}
                  />

                  {/* Toggle */}
                  <button
                    className={`as-toggle-btn ${isEnabled ? 'on' : ''}`}
                    onClick={() => handleToggle(idx)}
                    title={isEnabled ? 'Hide from widget' : 'Show in widget'}
                  >
                    {isEnabled
                      ? <ToggleRight size={30} />
                      : <ToggleLeft size={30} />
                    }
                    <span className="as-toggle-label" style={{ color: isEnabled ? 'rgba(74,222,128,0.8)' : 'var(--c-text-muted)' }}>
                      {isEnabled ? 'Visible' : 'Hidden'}
                    </span>
                  </button>

                  {/* Status badge */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {isEnabled
                      ? <span style={{ padding: '3px 10px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 20, fontSize: 9, color: '#4ade80', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Eye size={9} /> Live
                      </span>
                      : <span style={{ padding: '3px 10px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 20, fontSize: 9, color: 'var(--c-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <EyeOff size={9} /> Off
                      </span>
                    }
                  </div>

                  {/* Delete */}
                  <button className="as-del-btn" onClick={() => deleteRow(idx)} title="Delete style">
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Bottom save bar if dirty */}
        {isDirty && !saving && (
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            background: '#fff', border: '1px solid var(--c-border)',
            borderRadius: 8, padding: '14px 28px', display: 'flex', alignItems: 'center',
            gap: 20, boxShadow: 'var(--shadow-md)', zIndex: 100,
            animation: 'rowIn 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>You have unsaved changes</span>
            <button className="as-btn-save" onClick={save}>
              <Save size={14} /> Save All Changes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
