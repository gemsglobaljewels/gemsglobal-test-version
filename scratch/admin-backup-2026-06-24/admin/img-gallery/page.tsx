'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus, Trash2, Check, Upload, Settings, Save,
  Loader2, X, Eye, EyeOff, GripVertical, Image as ImageIcon,
  ChevronUp, ChevronDown
} from 'lucide-react'

type GalleryItem = {
  id: string
  image_url: string
  alt_text: string
  is_big: boolean
  side: 'left' | 'right'
  show_shop_now: boolean
  magazine_text: string
  magazine_position: 'tl' | 'br'
  show_parallax: boolean
  position: number
  is_enabled: boolean
  show_on_homepage: boolean
}

export default function AdminImgGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  function notify(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4500)
  }

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/img-gallery', { cache: 'no-store' })
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
      setIsDirty(false)
    } catch (e) {
      console.error(e)
      notify('Failed to load gallery', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function addItem() {
    const newId = `item-${Date.now()}`
    setItems(prev => [...prev, {
      id: newId,
      image_url: '',
      alt_text: '',
      is_big: false,
      side: 'left',
      show_shop_now: false,
      magazine_text: '',
      magazine_position: 'tl',
      show_parallax: false,
      position: prev.length,
      is_enabled: true,
      show_on_homepage: true
    }])
    setIsDirty(true)
    notify('New item added', 'info')
  }

  function updateItem(index: number, patch: Partial<GalleryItem>) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it))
    setIsDirty(true)
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next.map((item, i) => ({ ...item, position: i }))
    })
    setIsDirty(true)
  }

  async function uploadImage(index: number, file: File | null) {
    if (!file) return
    setUploadingIndex(index)
    notify('Uploading image...', 'info')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/img-gallery/upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (r.ok && j?.url) {
        updateItem(index, { image_url: j.url })
        notify('Image uploaded', 'success')
      } else {
        notify(j?.error || 'Upload failed', 'error')
      }
    } catch {
      notify('Upload failed', 'error')
    } finally {
      setUploadingIndex(null)
    }
  }

  async function save() {
    setSaving(true)
    try {
      const r = await fetch('/api/img-gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      const j = await r.json()
      if (!r.ok) {
        notify(j?.error || 'Failed to save', 'error')
      } else {
        setItems(Array.isArray(j.items) ? j.items : [])
        setIsDirty(false)
        notify('Saved successfully!', 'success')
        await load()
      }
    } catch {
      notify('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    try {
      await fetch(`/api/img-gallery?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setItems(prev => prev.filter(item => item.id !== id))
      notify('Item deleted', 'success')
      await load()
    } catch {
      notify('Delete failed', 'error')
    }
  }

  const notifColor: Record<string, string> = {
    success: '#4ade80',
    error: '#f87171',
    info: 'var(--c-accent)'
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: 'var(--font-main, system-ui, sans-serif)', color: 'var(--c-text)' }}>
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            padding: '12px 18px', borderRadius: '8px',
            background: 'var(--c-surface)', border: `1px solid ${notifColor[n.type]}33`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '13px', color: 'var(--c-text)',
            animation: 'slideIn 0.2s ease'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: notifColor[n.type], flexShrink: 0 }} />
            {n.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .item-row:hover { background: rgba(var(--c-accent-rgb, 201 169 110), 0.03) !important; }
        .item-row.drag-over { border: 1px dashed var(--c-accent) !important; background: rgba(var(--c-accent-rgb, 201 169 110), 0.06) !important; }
        .item-row.dragging { opacity: 0.4; }
        .btn-primary { background: var(--c-accent) !important; color: #070605 !important; border: none !important; }
        .btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
        .btn-ghost { background: transparent !important; color: var(--c-accent) !important; border: 1px solid var(--c-border) !important; }
        .btn-ghost:hover:not(:disabled) { border-color: var(--c-accent) !important; }
        .input-field { background: var(--c-bg) !important; border: 1px solid var(--c-border) !important; color: var(--c-text) !important; outline: none !important; transition: border-color 0.2s; }
        .input-field:focus { border-color: var(--c-accent) !important; }
        .section-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 14px; overflow: hidden; }
        .section-header { padding: 18px 24px; border-bottom: 1px solid var(--c-border); display: flex; align-items: center; justify-content: space-between; }
        .label-pill { font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--c-accent); font-weight: 600; }
      `}</style>

      <div style={{ padding: '40px 28px 120px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '36px', margin: '0 0 8px', fontWeight: '300', color: 'var(--c-text)', lineHeight: 1.1 }}>
              Image Gallery
            </h1>
            <p style={{ margin: 0, color: 'var(--c-text-muted)', fontSize: '14px' }}>
              Manage lookbook images, toggles, and display settings
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isDirty && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', background: 'rgba(var(--c-accent-rgb, 201 169 110), 0.08)',
                border: '1px solid var(--c-border)', borderRadius: '20px',
                fontSize: '11px', color: 'var(--c-accent)', letterSpacing: '0.05em'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c-accent)' }} />
                Unsaved changes
              </span>
            )}
            <button
              onClick={load}
              disabled={saving || loading}
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase' }}
            >
              <Loader2 size={13} className={loading ? 'animate-spin' : ''} /> Reload
            </button>
            <button
              onClick={save}
              disabled={saving || !isDirty}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 22px', borderRadius: '7px', cursor: saving || !isDirty ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: isDirty ? 1 : 0.5 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Gallery Items Section */}
        <div className="section-card">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ImageIcon size={16} style={{ color: 'var(--c-accent)' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-text)' }}>Gallery Items</span>
              <span style={{
                padding: '2px 10px', borderRadius: '20px',
                background: 'rgba(var(--c-accent-rgb, 201 169 110), 0.12)',
                color: 'var(--c-accent)', fontSize: '11px', fontWeight: 600
              }}>{items.length}</span>
            </div>
            <button
              onClick={addItem}
              disabled={saving}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase' }}
            >
              <Plus size={14} strokeWidth={2.5} /> Add Item
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--c-text-muted)' }}>
              <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto 10px', display: 'block' }} />
              Loading gallery…
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--c-text-muted)' }}>
              <ImageIcon size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No items yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.6 }}>Click "Add Item" to get started.</p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div style={{
                display: 'grid', gridTemplateColumns: '44px 120px 200px 120px 100px 120px 100px 80px',
                gap: '12px', padding: '10px 24px',
                background: 'rgba(var(--c-accent-rgb, 201 169 110), 0.04)',
                borderBottom: '1px solid var(--c-border)',
                alignItems: 'center'
              }}>
                <span className="label-pill">#</span>
                <span className="label-pill">Image</span>
                <span className="label-pill">Alt Text</span>
                <span className="label-pill">Type</span>
                <span className="label-pill">Shop Now</span>
                <span className="label-pill">Magazine</span>
                <span className="label-pill">Homepage</span>
                <span className="label-pill" style={{ textAlign: 'right' }}>Actions</span>
              </div>

              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`item-row`}
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(index)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverIndex(index)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragIndex !== null && dragIndex !== index) {
                      moveItem(dragIndex, index)
                      notify(`Item moved to position ${index + 1}`, 'info')
                    }
                    setDragIndex(null)
                    setDragOverIndex(null)
                  }}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                  style={{
                    display: 'grid', gridTemplateColumns: '44px 120px 200px 120px 100px 120px 100px 80px',
                    gap: '12px', padding: '14px 24px', alignItems: 'center',
                    borderBottom: '1px solid rgba(var(--c-accent-rgb, 201 169 110), 0.06)',
                    transition: 'background 0.15s'
                  }}
                >
                  {/* Position + drag handle */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '1px' }}>
                      <button
                        onClick={() => moveItem(index, index - 1)}
                        disabled={index === 0}
                        style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', padding: '2px', color: index === 0 ? 'var(--c-border)' : 'var(--c-text-muted)' }}
                        title="Move up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => moveItem(index, index + 1)}
                        disabled={index === items.length - 1}
                        style={{ background: 'none', border: 'none', cursor: index === items.length - 1 ? 'not-allowed' : 'pointer', padding: '2px', color: index === items.length - 1 ? 'var(--c-border)' : 'var(--c-text-muted)' }}
                        title="Move down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                    <GripVertical size={14} style={{ color: 'var(--c-border)', cursor: 'grab' }} />
                    <span style={{ fontSize: '10px', color: 'var(--c-text-muted)', fontWeight: 600 }}>{index + 1}</span>
                  </div>

                  {/* Image */}
                  <div
                    onClick={() => fileRefs.current[index]?.click()}
                    title="Click to upload image"
                    style={{
                      width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden',
                      border: '1px solid var(--c-border)', background: 'var(--c-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', position: 'relative', flexShrink: 0
                    }}
                  >
                    {uploadingIndex === index ? (
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--c-accent)' }} />
                    ) : item.image_url ? (
                      <img src={item.image_url} alt={item.alt_text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ color: 'var(--c-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '10px', padding: '8px', textAlign: 'center' }}>
                        <Upload size={18} style={{ opacity: 0.5 }} />
                        Upload image
                      </div>
                    )}
                    <input
                      type="file" accept="image/*" style={{ display: 'none' }}
                      ref={el => { fileRefs.current[index] = el }}
                      onChange={e => uploadImage(index, e.target.files?.[0] || null)}
                    />
                  </div>

                  {/* Alt Text */}
                  <div>
                    <input
                      value={item.alt_text}
                      placeholder="Alt text"
                      onChange={e => updateItem(index, { alt_text: e.target.value })}
                      className="input-field"
                      style={{ width: '100%', height: '36px', padding: '0 12px', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>

                  {/* Type (Big/Side) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--c-text-muted)' }}>
                      <input
                        type="checkbox"
                        checked={item.is_big}
                        onChange={e => updateItem(index, { is_big: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                      />
                      Big Feature
                    </label>
                    {item.is_big && (
                      <select
                        value={item.side}
                        onChange={e => updateItem(index, { side: e.target.value as 'left' | 'right' })}
                        className="input-field"
                        style={{ height: '32px', padding: '0 8px', borderRadius: '4px', fontSize: '12px' }}
                      >
                        <option value="left">Left Side</option>
                        <option value="right">Right Side</option>
                      </select>
                    )}
                  </div>

                  {/* Shop Now Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => updateItem(index, { show_shop_now: !item.show_shop_now })}
                      title={item.show_shop_now ? 'Hide Shop Now' : 'Show Shop Now'}
                      style={{
                        width: '36px', height: '36px', borderRadius: '7px',
                        border: '1px solid var(--c-border)',
                        background: item.show_shop_now ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                        color: item.show_shop_now ? '#4ade80' : 'var(--c-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <Check size={14} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Magazine Text/Position */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      value={item.magazine_text}
                      placeholder="Magazine (e.g. ELLE)"
                      onChange={e => updateItem(index, { magazine_text: e.target.value })}
                      className="input-field"
                      style={{ height: '32px', padding: '0 8px', borderRadius: '4px', fontSize: '12px' }}
                    />
                    {item.magazine_text && (
                      <select
                        value={item.magazine_position}
                        onChange={e => updateItem(index, { magazine_position: e.target.value as 'tl' | 'br' })}
                        className="input-field"
                        style={{ height: '28px', padding: '0 6px', borderRadius: '4px', fontSize: '11px' }}
                      >
                        <option value="tl">Top Left</option>
                        <option value="br">Bottom Right</option>
                      </select>
                    )}
                  </div>

                  {/* Homepage Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateItem(index, { show_on_homepage: !item.show_on_homepage })}
                      title={item.show_on_homepage ? 'Hide on homepage' : 'Show on homepage'}
                      style={{
                        width: '36px', height: '36px', borderRadius: '7px',
                        border: '1px solid var(--c-border)',
                        background: item.show_on_homepage ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                        color: item.show_on_homepage ? '#4ade80' : 'var(--c-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <Eye size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => updateItem(index, { is_enabled: !item.is_enabled })}
                      title={item.is_enabled ? 'Disable item' : 'Enable item'}
                      style={{
                        width: '36px', height: '36px', borderRadius: '7px',
                        border: '1px solid var(--c-border)',
                        background: item.is_enabled ? 'transparent' : 'rgba(248,113,113,0.1)',
                        color: item.is_enabled ? 'var(--c-text-muted)' : '#f87171',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <EyeOff size={14} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Delete */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => deleteItem(item.id)}
                      title="Delete item"
                      style={{
                        width: '36px', height: '36px', borderRadius: '7px',
                        border: '1px solid rgba(248,113,113,0.2)',
                        background: 'rgba(248,113,113,0.06)',
                        color: 'rgba(248,113,113,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
