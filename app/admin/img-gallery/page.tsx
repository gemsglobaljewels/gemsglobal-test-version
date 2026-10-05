'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus, Trash2, Upload, Save,
  Loader2, GripVertical, Image as ImageIcon,
  ChevronUp, ChevronDown, RotateCw
} from 'lucide-react'

type Product = {
  id: string
  name: string
  slug: string
  image_url: string
  price: number
}

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
  crop_position: string
  product_id?: string | null
  products?: Product | null
}

export default function AdminImgGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
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
      const [galleryRes, productsRes] = await Promise.all([
        // `admin=true` returns the REAL table rows (with uuid ids) instead of the
        // public `g1…g21` fallback placeholders. Without it, an empty table hands
        // the editor fake rows whose non-uuid ids blow up on Save with
        // "invalid input syntax for type uuid".
        fetch('/api/img-gallery?admin=true', { cache: 'no-store' }),
        fetch('/api/products', { cache: 'no-store' })
      ])
      const galleryData = await galleryRes.json()
      const productsData = await productsRes.json()

      console.log('Products loaded:', productsData.products?.length || 0)
      setItems(Array.isArray(galleryData.items) ? galleryData.items : [])
      setProducts(Array.isArray(productsData.products) ? productsData.products : [])
      setIsDirty(false)
    } catch (e) {
      console.error(e)
      notify('Failed to load data', 'error')
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
      show_on_homepage: true,
      crop_position: 'center',
      product_id: null
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
        if (j?.warning) notify(j.warning, 'info')
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
    success: 'var(--c-success)',
    error: 'var(--c-danger)',
    info: 'var(--c-accent)'
  }

  return (
    <div className="a-page">
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            padding: '12px 18px', borderRadius: 'var(--radius)',
            background: '#fff', border: '1px solid var(--c-border)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontFamily: 'var(--font-dmsans)',
            fontSize: '13px', color: 'var(--c-text)',
            animation: 'iggSlideIn 0.2s cubic-bezier(.4,0,.2,1)'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: notifColor[n.type], flexShrink: 0 }} />
            {n.message}
          </div>
        ))}
      </div>

      {/* Page-local styles: drag-reorder visuals + toast keyframe */}
      <style>{`
        @keyframes iggSlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .igg-item { transition: border-color .2s cubic-bezier(.4,0,.2,1), box-shadow .2s cubic-bezier(.4,0,.2,1), opacity .2s ease; }
        .igg-item.is-drag-over { border-color: var(--c-accent) !important; border-style: dashed !important; background: var(--c-accent-soft); }
        .igg-item.is-dragging { opacity: 0.45; }
        .igg-grip { cursor: grab; color: var(--c-text-faint); }
        .igg-grip:active { cursor: grabbing; }
        .igg-thumb { transition: border-color .2s ease; }
        .igg-thumb:hover { border-color: var(--c-accent); }
      `}</style>

      {/* Page Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Lookbook</div>
          <h1 className="a-title">Image <em>Gallery</em></h1>
          <p className="a-subtitle">Manage lookbook images, toggles, and display settings.</p>
        </div>

        <div className="a-head-actions" style={{ alignItems: 'center' }}>
          {isDirty && (
            <span className="a-badge a-badge--accent">
              <span className="a-dot a-dot--accent a-dot--pulse" style={{ background: 'var(--c-accent)' }} /> Unsaved changes
            </span>
          )}
          <button onClick={load} disabled={saving || loading} className="a-btn a-btn--ghost">
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} /> Reload
          </button>
          <button onClick={save} disabled={saving || !isDirty} className="a-btn a-btn--primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Gallery Items */}
      <div className="a-card">
        <div className="a-card-head a-row a-row--between">
          <div className="a-row" style={{ gap: '12px' }}>
            <h2 className="a-card-title" style={{ margin: 0 }}>Gallery <em>Items</em></h2>
            <span className="a-badge a-badge--accent">{items.length}</span>
          </div>
          <button onClick={addItem} disabled={saving} className="a-btn a-btn--primary a-btn--sm">
            <Plus size={14} strokeWidth={2.5} /> Add Item
          </button>
        </div>

        <div className="a-card-body">
          {loading ? (
            <div className="a-loader-row">
              <Loader2 size={20} className="a-loader animate-spin" />
              <span className="a-loader-label">Loading gallery…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="a-empty">
              <ImageIcon className="a-empty-ico" size={32} />
              <div className="a-empty-title">No items yet</div>
              <div className="a-empty-text">Click “Add Item” to get started.</div>
            </div>
          ) : (
            <div className="a-stack" style={{ gap: '14px' }}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`a-card igg-item${dragOverIndex === index ? ' is-drag-over' : ''}${dragIndex === index ? ' is-dragging' : ''}`}
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
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="a-card-body" style={{ display: 'grid', gridTemplateColumns: '48px 132px 1fr', gap: '20px', alignItems: 'flex-start' }}>
                    {/* Position + drag handle */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span className="a-badge a-badge--neutral" style={{ minWidth: '26px', justifyContent: 'center' }}>{index + 1}</span>
                      <GripVertical size={16} className="igg-grip" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          className="a-icon-btn a-icon-btn--sm"
                          onClick={() => moveItem(index, index - 1)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          className="a-icon-btn a-icon-btn--sm"
                          onClick={() => moveItem(index, index + 1)}
                          disabled={index === items.length - 1}
                          title="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Image */}
                    <div
                      className="igg-thumb"
                      onClick={() => fileRefs.current[index]?.click()}
                      title="Click to upload image"
                      style={{
                        width: '132px', height: '92px', borderRadius: 'var(--radius)', overflow: 'hidden',
                        border: '1px solid var(--c-border)', background: 'var(--c-surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', position: 'relative', flexShrink: 0
                      }}
                    >
                      {uploadingIndex === index ? (
                        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--c-accent)' }} />
                      ) : item.image_url ? (
                        <img src={item.image_url} alt={item.alt_text} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: item.crop_position || 'center' }} />
                      ) : (
                        <div style={{ color: 'var(--c-text-muted)', fontFamily: 'var(--font-dmsans)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '10px', letterSpacing: '.04em', padding: '8px', textAlign: 'center' }}>
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

                    {/* Fields */}
                    <div className="a-stack" style={{ gap: '16px' }}>
                      <div className="a-form-grid">
                        {/* Alt Text */}
                        <div className="a-field a-col-span-2">
                          <label className="a-label">Alt Text</label>
                          <input
                            value={item.alt_text}
                            placeholder="Descriptive alt text"
                            onChange={e => updateItem(index, { alt_text: e.target.value })}
                            className="a-input"
                          />
                        </div>

                        {/* Type (Big/Side) */}
                        <div className="a-field">
                          <label className="a-label">Layout Type</label>
                          <label className="a-row" style={{ gap: '10px' }}>
                            <input
                              type="checkbox"
                              className="a-check"
                              checked={item.is_big}
                              onChange={e => updateItem(index, { is_big: e.target.checked })}
                            />
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: 'var(--c-text)' }}>Half-to-Half Big Feature</span>
                          </label>
                          {item.is_big && (
                            <div className="a-segmented" style={{ marginTop: '8px' }}>
                              <button
                                type="button"
                                className={item.side === 'left' ? 'is-active' : ''}
                                onClick={() => updateItem(index, { side: 'left' })}
                              >Left Side</button>
                              <button
                                type="button"
                                className={item.side === 'right' ? 'is-active' : ''}
                                onClick={() => updateItem(index, { side: 'right' })}
                              >Right Side</button>
                            </div>
                          )}
                        </div>

                        {/* Magazine */}
                        <div className="a-field">
                          <label className="a-label">Magazine Text</label>
                          <input
                            value={item.magazine_text}
                            placeholder="e.g. ELLE"
                            onChange={e => updateItem(index, { magazine_text: e.target.value })}
                            className="a-input"
                          />
                          {item.magazine_text && (
                            <div className="a-segmented" style={{ marginTop: '8px' }}>
                              <button
                                type="button"
                                className={item.magazine_position === 'tl' ? 'is-active' : ''}
                                onClick={() => updateItem(index, { magazine_position: 'tl' })}
                              >Top Left</button>
                              <button
                                type="button"
                                className={item.magazine_position === 'br' ? 'is-active' : ''}
                                onClick={() => updateItem(index, { magazine_position: 'br' })}
                              >Bottom Right</button>
                            </div>
                          )}
                        </div>

                        {/* Crop Position */}
                        <div className="a-field">
                          <label className="a-label">Crop Position</label>
                          <div className="a-segmented">
                            <button
                              type="button"
                              className={item.crop_position === 'top' ? 'is-active' : ''}
                              onClick={() => updateItem(index, { crop_position: 'top' })}
                            >Top</button>
                            <button
                              type="button"
                              className={item.crop_position === 'center' ? 'is-active' : ''}
                              onClick={() => updateItem(index, { crop_position: 'center' })}
                            >Center</button>
                            <button
                              type="button"
                              className={item.crop_position === 'bottom' ? 'is-active' : ''}
                              onClick={() => updateItem(index, { crop_position: 'bottom' })}
                            >Bottom</button>
                          </div>
                          <div className="a-segmented" style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              className={item.crop_position === 'left' ? 'is-active' : ''}
                              onClick={() => updateItem(index, { crop_position: 'left' })}
                            >Left</button>
                            <button
                              type="button"
                              className={item.crop_position === 'right' ? 'is-active' : ''}
                              onClick={() => updateItem(index, { crop_position: 'right' })}
                            >Right</button>
                          </div>
                        </div>

                        {/* Product Linking */}
                        <div className="a-field">
                          <label className="a-label">Link to Product (Optional)</label>
                          <select
                            className="a-input"
                            value={item.product_id || ''}
                            onChange={(e) => updateItem(index, { product_id: e.target.value || null })}
                            style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px' }}
                          >
                            <option value="">No product linked</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          {item.product_id && item.products && (
                            <div style={{ marginTop: '8px', padding: '8px', background: 'var(--c-bg-subtle)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {item.products.image_url && (
                                <img src={item.products.image_url} alt={item.products.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                              )}
                              <div style={{ flex: 1, fontSize: '12px', fontFamily: 'var(--font-dmsans)' }}>
                                <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>{item.products.name}</div>
                                <div style={{ color: 'var(--c-text-muted)', marginTop: '2px' }}>₹{item.products.price}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Toggles + delete */}
                      <div className="a-divider" style={{ margin: 0 }} />
                      <div className="a-row a-row--between a-wrap" style={{ gap: '20px' }}>
                        <div className="a-row a-wrap" style={{ gap: '24px' }}>
                          <label className="a-row" style={{ gap: '10px' }}>
                            <span className="a-switch">
                              <input
                                type="checkbox"
                                checked={item.show_shop_now}
                                onChange={e => updateItem(index, { show_shop_now: e.target.checked })}
                              />
                              <span className="a-switch-slider" />
                            </span>
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: 'var(--c-text)' }}>Shop Now</span>
                          </label>

                          <label className="a-row" style={{ gap: '10px' }}>
                            <span className="a-switch">
                              <input
                                type="checkbox"
                                checked={item.show_parallax}
                                onChange={e => updateItem(index, { show_parallax: e.target.checked })}
                              />
                              <span className="a-switch-slider" />
                            </span>
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: 'var(--c-text)' }}>Parallax Effect</span>
                          </label>

                          <label className="a-row" style={{ gap: '10px' }}>
                            <span className="a-switch">
                              <input
                                type="checkbox"
                                checked={item.show_on_homepage}
                                onChange={e => updateItem(index, { show_on_homepage: e.target.checked })}
                              />
                              <span className="a-switch-slider" />
                            </span>
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: 'var(--c-text)' }}>Show on Homepage</span>
                          </label>

                          <label className="a-row" style={{ gap: '10px' }}>
                            <span className="a-switch">
                              <input
                                type="checkbox"
                                checked={item.is_enabled}
                                onChange={e => updateItem(index, { is_enabled: e.target.checked })}
                              />
                              <span className="a-switch-slider" />
                            </span>
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: 'var(--c-text)' }}>Enabled</span>
                          </label>
                        </div>

                        <button
                          className="a-icon-btn a-icon-btn--danger"
                          onClick={() => deleteItem(item.id)}
                          title="Delete item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
