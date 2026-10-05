'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, Upload, X,
  Save, AlertCircle, Sparkles, Quote, MapPin,
  Check, Search, Filter, Loader2,
} from 'lucide-react'

/* ── Page-local styles: only genuinely bespoke bits (star picker, toast, skeleton) ── */
const CSS = `
.tm-star-pick { display: flex; align-items: center; gap: 6px; }
.tm-star-btn {
  background: none; border: none; padding: 2px; cursor: pointer;
  display: inline-flex; line-height: 0; color: var(--c-text-faint);
  transition: transform 0.15s cubic-bezier(.34,1.56,.64,1);
}
.tm-star-btn:hover { transform: scale(1.18); }
.tm-star-btn.is-on { color: var(--c-accent); }

.tm-star-row { display: inline-flex; gap: 2px; color: var(--c-text-faint); }
.tm-star-row .is-on { color: var(--c-accent); }

.tm-toast {
  position: fixed; bottom: 28px; right: 28px; z-index: 10000;
  padding: 12px 22px; background: #fff;
  border: 1px solid var(--c-accent); border-radius: 999px;
  color: var(--c-text); font-family: var(--font-dmsans); font-size: 13px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: var(--shadow-lg);
  animation: tmSlideUp 0.25s ease;
}
.tm-toast.error { border-color: var(--c-danger); color: var(--c-danger); }
@keyframes tmSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.tm-skeleton {
  background: linear-gradient(90deg, var(--c-surface) 25%, var(--c-surface-2) 50%, var(--c-surface) 75%);
  background-size: 200% 100%;
  animation: tmShimmer 1.5s infinite;
  border-radius: var(--radius-lg);
  border: 1px solid var(--c-border);
}
@keyframes tmShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface Testimonial {
  id: string
  name: string
  location: string
  email: string
  avatar_url: string
  rating: number
  review: string
  product_name: string
  product_image_url: string
  product_images: string[]
  tag: string
  source: string
  source_url: string
  is_visible: boolean
  is_featured: boolean
  is_verified: boolean
  sort_order: number
  review_date: string
  created_at: string
  updated_at: string
}

const EMPTY_FORM: Omit<Testimonial, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  location: '',
  email: '',
  avatar_url: '',
  rating: 5,
  review: '',
  product_name: '',
  product_image_url: '',
  product_images: [],
  tag: '',
  source: 'manual',
  source_url: '',
  is_visible: true,
  is_featured: false,
  is_verified: true,
  sort_order: 0,
  review_date: new Date().toISOString().split('T')[0],
}

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)
  const [search, setSearch] = useState('')
  const [filterVisible, setFilterVisible] = useState<'all' | 'visible' | 'hidden'>('all')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Refs for file inputs
  const avatarRef = useRef<HTMLInputElement>(null)
  const productImgRef = useRef<HTMLInputElement>(null)
  const multipleProductImgRef = useRef<HTMLInputElement>(null)

  /* ── Load ── */
  useEffect(() => {
    loadItems()
  }, [])

  /* ── Lock the background page scroll while the modal is open, so only the
        popup itself scrolls (not the whole page behind it). ── */
  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [modalOpen])

  const loadItems = async () => {
    try {
      const res = await fetch('/api/testimonials?admin=true', { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data)) {
        const processedData = data.map((item: any) => {
          let productImages = item.product_images
          if (typeof productImages === 'string') {
            try {
              productImages = JSON.parse(productImages)
            } catch (e) {
              productImages = []
            }
          }
          return {
            ...item,
            product_images: Array.isArray(productImages) ? productImages : [],
          }
        })
        setItems(processedData)
      }
    } catch (e) {
      console.error('Failed to load testimonials:', e)
    } finally {
      setLoading(false)
    }
  }

  /* ── Toast ── */
  const showToast = (msg: string, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  /* ── Upload image ── */
  const handleUpload = async (field: 'avatar_url' | 'product_image_url' | 'product_images', file: File) => {
    showToast('Uploading image...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/storage/upload-testimonial', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        if (field === 'product_images') {
          setForm(p => ({ ...p, product_images: [...(p.product_images || []), data.url] }))
        } else {
          setForm(p => ({ ...p, [field]: data.url }))
        }
        showToast('Image uploaded')
      } else throw new Error(data.error || 'Upload failed')
    } catch (e: any) {
      showToast(e.message || 'Upload failed', true)
    }
  }

  /* ── Open modal for add ── */
  const openAdd = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, review_date: new Date().toISOString().split('T')[0] })
    setModalOpen(true)
  }

  /* ── Open modal for edit ── */
  const openEdit = (item: Testimonial) => {
    let productImages = item.product_images
    if (typeof productImages === 'string') {
      try {
        productImages = JSON.parse(productImages)
      } catch (e) {
        productImages = []
      }
    }

    setEditingId(item.id)
    setForm({
      name: item.name,
      location: item.location,
      email: item.email,
      avatar_url: item.avatar_url,
      rating: item.rating,
      review: item.review,
      product_name: item.product_name,
      product_image_url: item.product_image_url,
      product_images: Array.isArray(productImages) ? productImages : [],
      tag: item.tag,
      source: item.source,
      source_url: item.source_url,
      is_visible: item.is_visible,
      is_featured: item.is_featured,
      is_verified: item.is_verified,
      sort_order: item.sort_order,
      review_date: item.review_date ? item.review_date.split('T')[0] : '',
    })
    setModalOpen(true)
  }

  /* ── Save (create or update) ── */
  const handleSave = async () => {
    if (!form.name.trim() || !form.review.trim()) {
      showToast('Name and review are required', true)
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/testimonials/${editingId}` : '/api/testimonials'
      const method = editingId ? 'PUT' : 'POST'
      const body = {
        ...form,
        review_date: form.review_date ? new Date(form.review_date).toISOString() : new Date().toISOString(),
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      showToast(editingId ? 'Testimonial updated' : 'Testimonial created')
      setModalOpen(false)
      loadItems()
    } catch (e: any) {
      showToast(e.message, true)
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      showToast('Testimonial deleted')
      setDeletingId(null)
      loadItems()
    } catch (e: any) {
      showToast(e.message, true)
    }
  }

  /* ── Quick toggle visibility ── */
  const toggleVisibility = async (item: Testimonial) => {
    try {
      await fetch(`/api/testimonials/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, is_visible: !item.is_visible }),
      })
      loadItems()
    } catch { }
  }

  /* ── Filter + search ── */
  const filtered = items.filter(i => {
    if (filterVisible === 'visible' && !i.is_visible) return false
    if (filterVisible === 'hidden' && i.is_visible) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        i.name.toLowerCase().includes(q) ||
        i.review.toLowerCase().includes(q) ||
        i.product_name.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.tag.toLowerCase().includes(q)
      )
    }
    return true
  })

  const stats = {
    total: items.length,
    visible: items.filter(i => i.is_visible).length,
    featured: items.filter(i => i.is_featured).length,
    avgRating: items.length ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1) : '0',
  }

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="a-page">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Customer Reviews</div>
          <h1 className="a-title">Manage <em>Testimonials</em></h1>
          <p className="a-subtitle">Add, edit, and manage customer reviews</p>
        </div>
        <div className="a-head-actions">
          <button className="a-btn a-btn--primary" onClick={openAdd}>
            <Plus size={16} strokeWidth={2} /> Add Testimonial
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="a-stats">
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico"><Quote size={16} /></span>
            <span className="a-stat-label">Total</span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{stats.total}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico"><Eye size={16} /></span>
            <span className="a-stat-label">Visible</span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{stats.visible}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico"><Star size={16} /></span>
            <span className="a-stat-label">Featured</span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{stats.featured}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico"><Sparkles size={16} /></span>
            <span className="a-stat-label">Avg Rating</span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{stats.avgRating}</div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="a-toolbar">
        <div className="a-search">
          <Search size={16} className="a-search-ico" />
          <input
            className="a-search-input"
            placeholder="Search testimonials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="a-toolbar-group">
          {(['all', 'visible', 'hidden'] as const).map(f => (
            <button
              key={f}
              className={`a-chip${filterVisible === f ? ' is-active' : ''}`}
              onClick={() => setFilterVisible(f)}
            >
              {f === 'all' && <Filter size={13} />}
              {f === 'visible' && <Eye size={13} />}
              {f === 'hidden' && <EyeOff size={13} />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="a-grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="tm-skeleton" style={{ height: 280 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="a-empty">
          <div className="a-empty-ico"><Quote size={28} /></div>
          <div className="a-empty-title">No testimonials {search ? 'found' : 'yet'}</div>
          <div className="a-empty-text">
            {search ? 'Try a different search term' : 'Add your first customer review to get started'}
          </div>
          {!search && (
            <button className="a-btn a-btn--primary" onClick={openAdd} style={{ marginTop: 18 }}>
              <Plus size={16} /> Add Testimonial
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(item => (
            <div
              key={item.id}
              className="a-card"
              style={{ position: 'relative', overflow: 'hidden', opacity: item.is_visible ? 1 : 0.6 }}
            >
              {/* Delete confirmation overlay */}
              {deletingId === item.id && (
                <div
                  style={{
                    position: 'absolute', inset: 0, zIndex: 5,
                    background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(6px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 14, padding: 24, borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <Trash2 size={24} color="var(--c-danger)" />
                  <div style={{ fontSize: 13, color: 'var(--c-text-muted)', textAlign: 'center', fontFamily: 'var(--font-dmsans)' }}>
                    Delete "{item.name}"'s testimonial?
                  </div>
                  <div className="a-row">
                    <button className="a-btn a-btn--ghost a-btn--sm" onClick={() => setDeletingId(null)}>Cancel</button>
                    <button className="a-btn a-btn--solid-danger a-btn--sm" onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                </div>
              )}

              {/* Product image area */}
              <div style={{ position: 'relative', height: 140, background: 'var(--c-surface)', overflow: 'hidden' }}>
                {item.product_image_url ? (
                  <img
                    src={item.product_image_url}
                    alt={item.product_name || 'Product'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(var(--c-accent-rgb),0.08), rgba(var(--c-accent-rgb),0.02))' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0) 30%, rgba(255,255,255,0.92))' }} />

                {/* Badges */}
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap', zIndex: 2 }}>
                  {item.is_featured && <span className="a-badge a-badge--accent">★ Featured</span>}
                  {item.is_verified && <span className="a-badge a-badge--success">✓ Verified</span>}
                  {!item.is_visible && <span className="a-badge a-badge--danger">Hidden</span>}
                  {item.source !== 'manual' && <span className="a-badge a-badge--info">{item.source}</span>}
                </div>

                {/* Actions */}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 2 }}>
                  <button className="a-icon-btn a-icon-btn--sm" title="Toggle visibility" onClick={() => toggleVisibility(item)}>
                    {item.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button className="a-icon-btn a-icon-btn--sm" title="Edit" onClick={() => openEdit(item)}>
                    <Pencil size={14} />
                  </button>
                  <button className="a-icon-btn a-icon-btn--sm a-icon-btn--danger" title="Delete" onClick={() => setDeletingId(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="a-card-body">
                <div className="a-cell-lead" style={{ marginBottom: 12 }}>
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.name}
                      style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--c-border-strong)', flexShrink: 0, background: 'var(--c-surface)' }}
                    />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid var(--c-border-strong)', flexShrink: 0, background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-main)', fontSize: 16, color: 'var(--c-accent)' }}>
                      {item.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="a-cell-name">{item.name}</div>
                    {item.location && (
                      <div className="a-cell-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={10} /> {item.location}
                      </div>
                    )}
                  </div>
                </div>

                <div className="tm-star-row" style={{ marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} className={s <= item.rating ? 'is-on' : ''} fill={s <= item.rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  ))}
                </div>

                <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, lineHeight: 1.65, color: 'var(--c-text-muted)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>
                  "{item.review}"
                </div>

                <div className="a-row a-row--between" style={{ paddingTop: 12, borderTop: '1px solid var(--c-border)' }}>
                  {item.tag ? <span className="a-badge a-badge--neutral">{item.tag}</span> : <span />}
                  <span className="a-cell-meta">{item.product_name || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODAL — Add / Edit
          ═══════════════════════════════════════════ */}
      {modalOpen && (
        <div className="a-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>

            <div className="a-modal-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <h2 className="a-modal-title">
                {editingId ? <>Edit <em>Testimonial</em></> : <>Add <em>Testimonial</em></>}
              </h2>
              <button className="a-icon-btn a-icon-btn--sm" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="a-modal-body">
              {/* Customer info */}
              <div className="a-form-grid">
                <div className="a-field">
                  <label className="a-label">Name <span className="a-req">*</span></label>
                  <input className="a-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Customer name" />
                </div>
                <div className="a-field">
                  <label className="a-label">Location</label>
                  <input className="a-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Surat, Gujarat" />
                </div>
              </div>

              <div className="a-form-grid" style={{ marginTop: 16 }}>
                <div className="a-field">
                  <label className="a-label">Email</label>
                  <input className="a-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="customer@email.com" type="email" />
                </div>
                <div className="a-field">
                  <label className="a-label">Product Name</label>
                  <input className="a-input" value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="e.g. Diamond Solitaire Ring" />
                </div>
              </div>

              {/* Avatar upload */}
              <div className="a-field" style={{ marginTop: 16 }}>
                <label className="a-label">Customer Photo</label>
                <div style={{ border: '1px dashed var(--c-border-strong)', borderRadius: 'var(--radius)', padding: 14, background: 'var(--c-surface)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Avatar" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--c-border-strong)', flexShrink: 0, background: '#fff' }} />
                  ) : (
                    <div style={{ width: 50, height: 50, borderRadius: '50%', border: '1px solid var(--c-border-strong)', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-faint)', fontSize: 18 }}>?</div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input className="a-input" value={form.avatar_url} onChange={e => set('avatar_url', e.target.value)} placeholder="Image URL or upload" style={{ fontSize: 12 }} />
                    <input type="file" ref={avatarRef} hidden accept="image/*" onChange={e => e.target.files?.[0] && handleUpload('avatar_url', e.target.files[0])} />
                    <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => avatarRef.current?.click()}><Upload size={13} /> Upload Photo</button>
                  </div>
                </div>
              </div>

              {/* Product image upload */}
              <div className="a-field" style={{ marginTop: 16 }}>
                <label className="a-label">Product Image</label>
                <div style={{ border: '1px dashed var(--c-border-strong)', borderRadius: 'var(--radius)', padding: 14, background: 'var(--c-surface)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  {form.product_image_url ? (
                    <img src={form.product_image_url} alt="Product" style={{ width: 60, height: 60, borderRadius: 'var(--radius)', objectFit: 'cover', border: '1px solid var(--c-border)', flexShrink: 0, background: '#fff' }} />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: 'var(--radius)', border: '1px solid var(--c-border)', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-faint)', fontSize: 16 }}>📷</div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input className="a-input" value={form.product_image_url} onChange={e => set('product_image_url', e.target.value)} placeholder="Image URL or upload" style={{ fontSize: 12 }} />
                    <input type="file" ref={productImgRef} hidden accept="image/*" onChange={e => e.target.files?.[0] && handleUpload('product_image_url', e.target.files[0])} />
                    <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => productImgRef.current?.click()}><Upload size={13} /> Upload Image</button>
                  </div>
                </div>
              </div>

              {/* Additional Product Images */}
              <div className="a-field" style={{ marginTop: 16 }}>
                <label className="a-label">Additional Product Images</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6, marginBottom: 10 }}>
                  {form.product_images?.map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={img} alt={`Product ${i + 1}`} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--c-border)' }} />
                      <button onClick={() => set('product_images', form.product_images.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: 'var(--c-danger)', color: '#fff', border: 'none', borderRadius: '50%', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <input className="a-input" id="new-product-img" placeholder="Image URL to add" style={{ fontSize: 12, flex: 1, minWidth: 160 }} />
                  <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => {
                    const input = document.getElementById('new-product-img') as HTMLInputElement
                    if (input.value.trim()) {
                      set('product_images', [...(form.product_images || []), input.value.trim()])
                      input.value = ''
                    }
                  }}><Plus size={13} /> Add URL</button>
                  <input type="file" ref={multipleProductImgRef} hidden accept="image/*" multiple onChange={async (e) => {
                    const files = e.target.files
                    if (files && files.length > 0) {
                      for (let i = 0; i < files.length; i++) {
                        await handleUpload('product_images', files[i])
                      }
                      if (multipleProductImgRef.current) {
                        multipleProductImgRef.current.value = ''
                      }
                    }
                  }} />
                  <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => multipleProductImgRef.current?.click()}><Upload size={13} /> Upload Images</button>
                </div>
              </div>

              {/* Rating */}
              <div className="a-field" style={{ marginTop: 16 }}>
                <label className="a-label">Rating</label>
                <div className="tm-star-pick">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`tm-star-btn${s <= form.rating ? ' is-on' : ''}`}
                      onClick={() => set('rating', s)}
                      aria-label={`Rate ${s}`}
                    >
                      <Star size={24} fill={s <= form.rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                    </button>
                  ))}
                  <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 12, color: 'var(--c-text-muted)', marginLeft: 8 }}>{form.rating}/5</span>
                </div>
              </div>

              {/* Review text */}
              <div className="a-field" style={{ marginTop: 16 }}>
                <label className="a-label">Review <span className="a-req">*</span></label>
                <textarea className="a-textarea" value={form.review} onChange={e => set('review', e.target.value)} placeholder="Customer review text..." rows={4} />
              </div>

              {/* Tag, Source, Date */}
              <div className="a-form-grid a-form-grid--3" style={{ marginTop: 16 }}>
                <div className="a-field">
                  <label className="a-label">Tag</label>
                  <input className="a-input" value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="e.g. Verified Buyer" />
                </div>
                <div className="a-field">
                  <label className="a-label">Source</label>
                  <select className="a-select" value={form.source} onChange={e => set('source', e.target.value)}>
                    <option value="manual">Manual</option>
                    <option value="google">Google</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div className="a-field">
                  <label className="a-label">Review Date</label>
                  <input className="a-input" type="date" value={form.review_date} onChange={e => set('review_date', e.target.value)} />
                </div>
              </div>

              {/* Source URL + Sort order */}
              <div className="a-form-grid" style={{ marginTop: 16 }}>
                <div className="a-field">
                  <label className="a-label">Source URL</label>
                  <input className="a-input" value={form.source_url} onChange={e => set('source_url', e.target.value)} placeholder="Link to original review" />
                </div>
                <div className="a-field">
                  <label className="a-label">Sort Order</label>
                  <input className="a-input" type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} placeholder="0" />
                </div>
              </div>

              {/* Toggles */}
              <div className="a-divider" />
              <div className="a-wrap" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { key: 'is_visible', label: 'Visible' },
                  { key: 'is_featured', label: 'Featured' },
                  { key: 'is_verified', label: 'Verified' },
                ].map(t => (
                  <label key={t.key} className="a-switch">
                    <input
                      type="checkbox"
                      checked={!!form[t.key as keyof typeof form]}
                      onChange={() => set(t.key, !form[t.key as keyof typeof form])}
                    />
                    <span className="a-switch-slider" />
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, color: 'var(--c-text-muted)' }}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="a-modal-foot">
              <button className="a-btn a-btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="a-btn a-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`tm-toast${toast.err ? ' error' : ''}`}>
          {toast.err ? <AlertCircle size={14} /> : <Check size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
