'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, Upload, X,
  Save, AlertCircle, Sparkles, Quote, MapPin, ExternalLink,
  GripVertical, Check, Search, Filter, Loader2,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════
   STYLES — matches global theme
   ═══════════════════════════════════════════════════════ */
const CSS = `

.tm-root {
  width: 100%; min-height: 100vh;
  background: var(--c-bg);
  font-family: var(--font-main);
  color: var(--c-text);
  padding-bottom: 60px;
}

.tm-container {
  max-width: 1280px; margin: 0 auto; padding: 40px 32px 0;
}

/* ── Header ── */
.tm-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; margin-bottom: 32px; flex-wrap: wrap;
}

.tm-header-left { display: flex; align-items: center; gap: 16px; }

.tm-header-icon {
  width: 48px; height: 48px; background: rgba(var(--c-accent-rgb),0.06);
  border: 1px solid rgba(var(--c-accent-rgb),0.15); border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: var(--c-accent);
}

.tm-header-title {
  font-family: var(--font-main); font-size: 28px; color: var(--c-text); margin: 0;
}
.tm-header-title em { font-style: italic; color: var(--c-accent); }

.tm-header-sub {
  font-size: 12px; color: var(--c-text-muted); margin-top: 4px;
}

/* ── Toolbar ── */
.tm-toolbar {
  display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
  flex-wrap: wrap;
}

.tm-search-wrap {
  position: relative; flex: 1; min-width: 200px; max-width: 400px;
}
.tm-search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: rgba(var(--c-accent-rgb),0.4); pointer-events: none;
}
.tm-search {
  width: 100%; padding: 10px 14px 10px 38px;
  background: #fff; border: 1px solid var(--c-border);
  border-radius: 8px; font-family: var(--font-main); font-size: 13px;
  color: var(--c-text); outline: none; transition: border-color 0.2s;
}
.tm-search:focus { border-color: var(--c-accent); }
.tm-search::placeholder { color: var(--c-text-muted); }

.tm-filter-btn {
  padding: 10px 16px; background: transparent;
  border: 1px solid var(--c-border); border-radius: 8px;
  font-family: var(--font-main); font-size: 11px; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--c-text-muted); cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
}
.tm-filter-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }
.tm-filter-btn.active { border-color: var(--c-accent); color: var(--c-accent); background: rgba(var(--c-accent-rgb),0.06); }

.tm-add-btn {
  padding: 10px 20px; background: var(--c-accent); border: none; border-radius: 8px;
  font-family: var(--font-main); font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: #070604; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
  box-shadow: var(--shadow-md);
  margin-left: auto;
}
.tm-add-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); background: var(--c-text); }

/* ── Stats bar ── */
.tm-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  margin-bottom: 28px;
}
@media(max-width:700px) { .tm-stats { grid-template-columns: repeat(2, 1fr); } }

.tm-stat {
  background: #fff; border: 1px solid var(--c-border);
  border-radius: 10px; padding: 16px 18px;
  display: flex; align-items: center; gap: 14px;
}
.tm-stat-icon {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(var(--c-accent-rgb),0.06); color: var(--c-accent);
}
.tm-stat-num {
  font-family: var(--font-main); font-size: 22px; color: var(--c-text);
  line-height: 1;
}
.tm-stat-label {
  font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em;
  color: var(--c-text-muted); margin-top: 2px;
}

/* ── Grid ── */
.tm-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}
@media(max-width:500px) { .tm-grid { grid-template-columns: 1fr; } }

/* ── Card ── */
.tm-card {
  background: #fff; border: 1px solid var(--c-border);
  border-radius: 12px; overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.tm-card:hover { border-color: rgba(var(--c-accent-rgb),0.25); box-shadow: var(--shadow-md); }
.tm-card.hidden-card { opacity: 0.5; }

.tm-card-product {
  position: relative; height: 140px; background: var(--c-surface); overflow: hidden;
}
.tm-card-product img {
  width: 100%; height: 100%; object-fit: cover;
  filter: brightness(0.7);
}
.tm-card-product-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, transparent 30%, rgba(255,255,255,0.9));
}
.tm-card-badges {
  position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; z-index: 2;
}
.tm-card-badge {
  padding: 3px 8px; border-radius: 100px; font-size: 8px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.tm-card-badge.featured { background: rgba(var(--c-accent-rgb),0.2); color: var(--c-accent); border: 1px solid rgba(var(--c-accent-rgb),0.3); }
.tm-card-badge.verified { background: rgba(16,185,129,0.15); color: #6EE7B7; border: 1px solid rgba(16,185,129,0.3); }
.tm-card-badge.hidden { background: rgba(239,68,68,0.15); color: #FCA5A5; border: 1px solid rgba(239,68,68,0.3); }
.tm-card-badge.source { background: rgba(59,130,246,0.15); color: #93C5FD; border: 1px solid rgba(59,130,246,0.3); }

.tm-card-actions {
  position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; z-index: 2;
}
.tm-card-act-btn {
  width: 30px; height: 30px; border-radius: 6px;
  background: rgba(255,255,255,0.8); backdrop-filter: blur(4px);
  border: 1px solid rgba(var(--c-accent-rgb),0.2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: rgba(var(--c-accent-rgb),0.6); transition: all 0.2s;
}
.tm-card-act-btn:hover { color: var(--c-text); border-color: rgba(var(--c-accent-rgb),0.5); background: rgba(255,255,255,0.95); }
.tm-card-act-btn.danger:hover { color: #ef4444; border-color: rgba(239,68,68,0.5); }

.tm-card-body { padding: 16px; }

.tm-card-user {
  display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
}
.tm-card-avatar {
  width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
  border: 2px solid rgba(var(--c-accent-rgb),0.2); flex-shrink: 0;
  background: rgba(var(--c-accent-rgb),0.06);
}
.tm-card-avatar-placeholder {
  width: 40px; height: 40px; border-radius: 50%;
  border: 2px solid rgba(var(--c-accent-rgb),0.2); flex-shrink: 0;
  background: rgba(var(--c-accent-rgb),0.06);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600; color: var(--c-accent);
}
.tm-card-name {
  font-size: 14px; font-weight: 600; color: var(--c-text);
}
.tm-card-loc {
  font-size: 10px; color: var(--c-text-muted);
  display: flex; align-items: center; gap: 4px; margin-top: 2px;
}

.tm-card-stars { display: flex; gap: 4px; margin-bottom: 8px; }

.tm-card-review {
  font-size: 12px; line-height: 1.65; color: var(--c-text-muted);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden; margin-bottom: 10px; font-style: italic;
}

.tm-card-meta {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 10px; border-top: 1px solid rgba(var(--c-accent-rgb),0.06);
  font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--c-text-muted);
}
.tm-card-tag {
  background: rgba(var(--c-accent-rgb),0.08); color: var(--c-accent);
  padding: 2px 8px; border-radius: 100px; font-size: 8px;
  font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
}

/* ── Empty state ── */
.tm-empty {
  text-align: center; padding: 80px 24px;
  background: #fff; border: 1px dashed var(--c-border);
  border-radius: 16px;
}
.tm-empty-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(var(--c-accent-rgb),0.06); border: 1px solid rgba(var(--c-accent-rgb),0.12);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px; color: rgba(var(--c-accent-rgb),0.4);
}
.tm-empty-title {
  font-family: var(--font-main); font-size: 20px; color: var(--c-text); margin-bottom: 8px;
}
.tm-empty-sub { font-size: 13px; color: var(--c-text-muted); margin-bottom: 24px; }

/* ── Modal ── */
.tm-modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 40px 24px; overflow-y: auto;
  animation: tmFadeIn 0.2s ease;
}
@keyframes tmFadeIn { from { opacity: 0; } to { opacity: 1; } }

.tm-modal {
  background: #fff; border: 1px solid var(--c-border);
  border-radius: 16px; width: 100%; max-width: 680px;
  box-shadow: var(--shadow-md);
  animation: tmSlideUp 0.25s cubic-bezier(.34,1.56,.64,1);
  margin-bottom: 40px;
}
@keyframes tmSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.tm-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid var(--c-border);
  background: linear-gradient(110deg, rgba(var(--c-accent-rgb),0.05) 0%, transparent 70%);
  border-radius: 16px 16px 0 0;
}
.tm-modal-title {
  font-family: var(--font-main); font-size: 20px; color: var(--c-text);
}
.tm-modal-title em { font-style: italic; color: var(--c-accent); }
.tm-modal-close {
  width: 34px; height: 34px; border-radius: 8px;
  background: rgba(var(--c-accent-rgb),0.03); border: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--c-text-muted); transition: all 0.2s;
}
.tm-modal-close:hover { color: var(--c-text); border-color: var(--c-accent); }

.tm-modal-body { padding: 24px; }

.tm-form-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin-bottom: 16px;
}
@media(max-width:560px) { .tm-form-row { grid-template-columns: 1fr; } }

.tm-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.tm-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(var(--c-accent-rgb),0.6); display: flex; align-items: center; gap: 6px;
}
.tm-label-dot { width: 3px; height: 3px; background: var(--c-accent); border-radius: 50%; }
.tm-label-req { color: #ef4444; }

.tm-input {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 6px; padding: 10px 14px; font-family: var(--font-main);
  font-size: 13px; color: var(--c-text); outline: none; width: 100%;
  box-sizing: border-box; transition: all 0.2s;
}
.tm-input:focus { border-color: var(--c-accent); background: #fff; }

.tm-textarea {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 6px; padding: 10px 14px; font-family: var(--font-main);
  font-size: 13px; color: var(--c-text); outline: none; width: 100%;
  box-sizing: border-box; transition: all 0.2s; resize: vertical; min-height: 90px;
}
.tm-textarea:focus { border-color: var(--c-accent); background: #fff; }

.tm-select {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 6px; padding: 10px 14px; font-family: var(--font-main);
  font-size: 13px; color: var(--c-text); outline: none; width: 100%;
  box-sizing: border-box; transition: all 0.2s; cursor: pointer;
  appearance: none;
}
.tm-select:focus { border-color: var(--c-accent); }
.tm-select option { background: #fff; color: var(--c-text); }

/* ── Upload box ── */
.tm-upload {
  border: 1px dashed var(--c-border); border-radius: 8px; padding: 14px;
  background: rgba(var(--c-accent-rgb),0.02); display: flex; align-items: center; gap: 14px;
}
.tm-upload-preview {
  width: 60px; height: 60px; border-radius: 8px; object-fit: cover;
  border: 1px solid var(--c-border); flex-shrink: 0;
  background: rgba(var(--c-accent-rgb),0.04);
}
.tm-upload-avatar-preview {
  width: 50px; height: 50px; border-radius: 50%; object-fit: cover;
  border: 2px solid rgba(var(--c-accent-rgb),0.2); flex-shrink: 0;
  background: rgba(var(--c-accent-rgb),0.04);
}
.tm-upload-btn {
  padding: 8px 14px; background: transparent; border: 1px solid var(--c-border);
  color: var(--c-accent); font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; border-radius: 4px; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 6px;
}
.tm-upload-btn:hover { background: rgba(var(--c-accent-rgb),0.05); border-color: var(--c-accent); }

/* ── Toggles ── */
.tm-toggles {
  display: flex; gap: 20px; flex-wrap: wrap;
  padding: 16px 0; margin-bottom: 8px;
  border-top: 1px solid rgba(var(--c-accent-rgb),0.06);
}
.tm-toggle-item {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
}
.tm-toggle-box {
  width: 36px; height: 20px; border-radius: 10px;
  background: rgba(var(--c-accent-rgb),0.06); border: 1px solid rgba(var(--c-accent-rgb),0.12);
  position: relative; transition: all 0.25s; flex-shrink: 0;
}
.tm-toggle-box.on {
  background: rgba(var(--c-accent-rgb),0.2); border-color: var(--c-accent);
}
.tm-toggle-dot {
  position: absolute; top: 2px; left: 2px;
  width: 14px; height: 14px; border-radius: 50%;
  background: rgba(var(--c-accent-rgb),0.4); transition: all 0.25s;
}
.tm-toggle-box.on .tm-toggle-dot {
  left: 18px; background: var(--c-accent);
}
.tm-toggle-label {
  font-size: 11px; color: var(--c-text-muted); letter-spacing: 0.04em;
}

/* ── Rating picker ── */
.tm-rating-pick { display: flex; gap: 4px; }
.tm-rating-star {
  cursor: pointer; transition: transform 0.15s;
}
.tm-rating-star:hover { transform: scale(1.2); }

/* ── Modal footer ── */
.tm-modal-footer {
  padding: 16px 24px; border-top: 1px solid var(--c-border);
  display: flex; justify-content: flex-end; gap: 12px;
  background: rgba(var(--c-accent-rgb),0.02); border-radius: 0 0 16px 16px;
}
.tm-btn-cancel {
  padding: 10px 20px; background: transparent;
  border: 1px solid var(--c-border); border-radius: 8px;
  font-family: var(--font-main); font-size: 11px; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--c-text-muted); cursor: pointer; transition: all 0.2s;
}
.tm-btn-cancel:hover { border-color: var(--c-accent); color: var(--c-text); }
.tm-btn-save {
  padding: 10px 24px; background: var(--c-accent); border: none; border-radius: 8px;
  font-family: var(--font-main); font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: #070604; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
  box-shadow: var(--shadow-md);
}
.tm-btn-save:hover { box-shadow: var(--shadow-md); background: var(--c-text); }
.tm-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Delete confirmation ── */
.tm-delete-confirm {
  position: absolute; inset: 0; z-index: 5;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(6px);
  border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 24px;
  animation: tmFadeIn 0.15s ease;
}
.tm-delete-text {
  font-size: 13px; color: var(--c-text-muted); text-align: center;
}
.tm-delete-btns { display: flex; gap: 10px; }
.tm-btn-del-cancel {
  padding: 8px 18px; background: transparent;
  border: 1px solid var(--c-border); border-radius: 6px;
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--c-text-muted); cursor: pointer;
  font-family: var(--font-main); transition: all 0.2s;
}
.tm-btn-del-cancel:hover { border-color: var(--c-accent); color: var(--c-text); }
.tm-btn-del-confirm {
  padding: 8px 18px; background: #ef4444; border: none; border-radius: 6px;
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.1em; color: #fff; cursor: pointer;
  font-family: var(--font-main); transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(239,68,68,0.3);
}
.tm-btn-del-confirm:hover { background: #dc2626; }

/* ── Toast ── */
.tm-toast {
  position: fixed; bottom: 28px; right: 28px; z-index: 10000;
  padding: 12px 22px; background: #fff;
  border: 1px solid var(--c-accent); border-radius: 50px;
  color: var(--c-text); font-size: 13px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: var(--shadow-md);
  animation: tmSlideUp 0.25s ease;
}
.tm-toast.error { border-color: #ef4444; }

/* ── Loading skeleton ── */
.tm-skeleton {
  background: linear-gradient(90deg, rgba(var(--c-accent-rgb),0.04) 25%, rgba(var(--c-accent-rgb),0.08) 50%, rgba(var(--c-accent-rgb),0.04) 75%);
  background-size: 200% 100%;
  animation: tmShimmer 1.5s infinite;
  border-radius: 8px;
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
    <div className="tm-root">
      <style>{CSS}</style>
      <div className="tm-container">

        {/* ── Header ── */}
        <div className="tm-header">
          <div className="tm-header-left">
            <div className="tm-header-icon"><Quote size={22} strokeWidth={1.5} /></div>
            <div>
              <h1 className="tm-header-title">Manage <em>Testimonials</em></h1>
              <div className="tm-header-sub">Add, edit, and manage customer reviews</div>
            </div>
          </div>
          <button className="tm-add-btn" onClick={openAdd}>
            <Plus size={14} strokeWidth={2} /> Add Testimonial
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="tm-stats">
          <div className="tm-stat">
            <div className="tm-stat-icon"><Quote size={16} /></div>
            <div>
              <div className="tm-stat-num">{stats.total}</div>
              <div className="tm-stat-label">Total</div>
            </div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-icon"><Eye size={16} /></div>
            <div>
              <div className="tm-stat-num">{stats.visible}</div>
              <div className="tm-stat-label">Visible</div>
            </div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-icon"><Star size={16} /></div>
            <div>
              <div className="tm-stat-num">{stats.featured}</div>
              <div className="tm-stat-label">Featured</div>
            </div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-icon"><Sparkles size={16} /></div>
            <div>
              <div className="tm-stat-num">{stats.avgRating}</div>
              <div className="tm-stat-label">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="tm-toolbar">
          <div className="tm-search-wrap">
            <Search size={14} className="tm-search-icon" />
            <input
              className="tm-search"
              placeholder="Search testimonials..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {(['all', 'visible', 'hidden'] as const).map(f => (
            <button
              key={f}
              className={`tm-filter-btn${filterVisible === f ? ' active' : ''}`}
              onClick={() => setFilterVisible(f)}
            >
              {f === 'all' && <Filter size={12} />}
              {f === 'visible' && <Eye size={12} />}
              {f === 'hidden' && <EyeOff size={12} />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="tm-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="tm-skeleton" style={{ height: 280 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="tm-empty">
            <div className="tm-empty-icon"><Quote size={28} /></div>
            <div className="tm-empty-title">No testimonials {search ? 'found' : 'yet'}</div>
            <div className="tm-empty-sub">
              {search ? 'Try a different search term' : 'Add your first customer review to get started'}
            </div>
            {!search && (
              <button className="tm-add-btn" onClick={openAdd}>
                <Plus size={14} /> Add Testimonial
              </button>
            )}
          </div>
        ) : (
          <div className="tm-grid">
            {filtered.map(item => (
              <div key={item.id} className={`tm-card${!item.is_visible ? ' hidden-card' : ''}`} style={{ position: 'relative' }}>
                {/* Delete confirmation overlay */}
                {deletingId === item.id && (
                  <div className="tm-delete-confirm">
                    <Trash2 size={24} color="#ef4444" />
                    <div className="tm-delete-text">Delete "{item.name}"'s testimonial?</div>
                    <div className="tm-delete-btns">
                      <button className="tm-btn-del-cancel" onClick={() => setDeletingId(null)}>Cancel</button>
                      <button className="tm-btn-del-confirm" onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </div>
                )}

                {/* Product image area */}
                <div className="tm-card-product">
                  {item.product_image_url ? (
                    <img src={item.product_image_url} alt={item.product_name || 'Product'} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(var(--c-accent-rgb),0.08), rgba(var(--c-accent-rgb),0.02))' }} />
                  )}
                  <div className="tm-card-product-overlay" />

                  {/* Badges */}
                  <div className="tm-card-badges">
                    {item.is_featured && <span className="tm-card-badge featured">★ Featured</span>}
                    {item.is_verified && <span className="tm-card-badge verified">✓ Verified</span>}
                    {!item.is_visible && <span className="tm-card-badge hidden">Hidden</span>}
                    {item.source !== 'manual' && <span className="tm-card-badge source">{item.source}</span>}
                  </div>

                  {/* Actions */}
                  <div className="tm-card-actions">
                    <button className="tm-card-act-btn" title="Toggle visibility" onClick={() => toggleVisibility(item)}>
                      {item.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button className="tm-card-act-btn" title="Edit" onClick={() => openEdit(item)}>
                      <Pencil size={13} />
                    </button>
                    <button className="tm-card-act-btn danger" title="Delete" onClick={() => setDeletingId(item.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="tm-card-body">
                  <div className="tm-card-user">
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt={item.name} className="tm-card-avatar" />
                    ) : (
                      <div className="tm-card-avatar-placeholder">{item.name[0]?.toUpperCase()}</div>
                    )}
                    <div>
                      <div className="tm-card-name">{item.name}</div>
                      {item.location && (
                        <div className="tm-card-loc"><MapPin size={8} /> {item.location}</div>
                      )}
                    </div>
                  </div>

                  <div className="tm-card-stars">
                    {[1, 2, 3, 4, 5].map(s => (
                      <svg key={s} width="13" height="13" viewBox="0 0 12 12" fill={s <= item.rating ? '#F59E0B' : '#e5e5e5'}>
                        <polygon points="6,1 7.5,4.5 11.5,4.5 8.5,7 9.7,11 6,8.8 2.3,11 3.5,7 0.5,4.5 4.5,4.5" />
                      </svg>
                    ))}
                  </div>

                  <div className="tm-card-review">"{item.review}"</div>

                  <div className="tm-card-meta">
                    {item.tag ? <span className="tm-card-tag">{item.tag}</span> : <span />}
                    <span>{item.product_name || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          MODAL — Add / Edit
          ═══════════════════════════════════════════ */}
      {modalOpen && (
        <div className="tm-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="tm-modal" onClick={e => e.stopPropagation()}>

            <div className="tm-modal-header">
              <h2 className="tm-modal-title">
                {editingId ? <>Edit <em>Testimonial</em></> : <>Add <em>Testimonial</em></>}
              </h2>
              <button className="tm-modal-close" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="tm-modal-body">
              {/* Customer info */}
              <div className="tm-form-row">
                <div className="tm-field">
                  <label className="tm-label"><span className="tm-label-dot" /> Name <span className="tm-label-req">*</span></label>
                  <input className="tm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Customer name" />
                </div>
                <div className="tm-field">
                  <label className="tm-label"><span className="tm-label-dot" /> Location</label>
                  <input className="tm-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Surat, Gujarat" />
                </div>
              </div>

              <div className="tm-form-row">
                <div className="tm-field">
                  <label className="tm-label"><span className="tm-label-dot" /> Email</label>
                  <input className="tm-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="customer@email.com" type="email" />
                </div>
                <div className="tm-field">
                  <label className="tm-label"><span className="tm-label-dot" /> Product Name</label>
                  <input className="tm-input" value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="e.g. Diamond Solitaire Ring" />
                </div>
              </div>

              {/* Avatar upload */}
              <div className="tm-field">
                <label className="tm-label"><span className="tm-label-dot" /> Customer Photo</label>
                <div className="tm-upload">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Avatar" className="tm-upload-avatar-preview" />
                  ) : (
                    <div className="tm-upload-avatar-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(var(--c-accent-rgb),0.3)', fontSize: 18 }}>?</div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input className="tm-input" value={form.avatar_url} onChange={e => set('avatar_url', e.target.value)} placeholder="Image URL or upload" style={{ fontSize: 11 }} />
                    <input type="file" ref={avatarRef} hidden accept="image/*" onChange={e => e.target.files?.[0] && handleUpload('avatar_url', e.target.files[0])} />
                    <button className="tm-upload-btn" onClick={() => avatarRef.current?.click()}><Upload size={12} /> Upload Photo</button>
                  </div>
                </div>
              </div>

              {/* Product image upload */}
              <div className="tm-field">
                <label className="tm-label"><span className="tm-label-dot" /> Product Image</label>
                <div className="tm-upload">
                  {form.product_image_url ? (
                    <img src={form.product_image_url} alt="Product" className="tm-upload-preview" />
                  ) : (
                    <div className="tm-upload-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(var(--c-accent-rgb),0.3)', fontSize: 16 }}>📷</div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input className="tm-input" value={form.product_image_url} onChange={e => set('product_image_url', e.target.value)} placeholder="Image URL or upload" style={{ fontSize: 11 }} />
                    <input type="file" ref={productImgRef} hidden accept="image/*" onChange={e => e.target.files?.[0] && handleUpload('product_image_url', e.target.files[0])} />
                    <button className="tm-upload-btn" onClick={() => productImgRef.current?.click()}><Upload size={12} /> Upload Image</button>
                  </div>
                </div>
              </div>

              {/* Additional Product Images */}
              <div className="tm-field">
                <label className="tm-label"><span className="tm-label-dot" /> Additional Product Images</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '10px' }}>
                  {form.product_images?.map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={img} alt={`Product ${i + 1}`} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--c-border)' }} />
                      <button onClick={() => set('product_images', form.product_images.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <input className="tm-input" id="new-product-img" placeholder="Image URL to add" style={{ fontSize: '11px', flex: '1' }} />
                  <button className="tm-upload-btn" onClick={() => {
                    const input = document.getElementById('new-product-img') as HTMLInputElement
                    if (input.value.trim()) {
                      set('product_images', [...(form.product_images || []), input.value.trim()])
                      input.value = ''
                    }
                  }}><Plus size={12} /> Add URL</button>
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
                  <button className="tm-upload-btn" onClick={() => multipleProductImgRef.current?.click()}><Upload size={12} /> Upload Images</button>
                </div>
              </div>

              {/* Rating */}
              <div className="tm-field">
                <label className="tm-label"><span className="tm-label-dot" /> Rating</label>
                <div className="tm-rating-pick">
                  {[1, 2, 3, 4, 5].map(s => (
                    <svg
                      key={s}
                      className="tm-rating-star"
                      width="24" height="24" viewBox="0 0 12 12"
                      fill={s <= form.rating ? '#F59E0B' : '#e5e5e5'}
                      onClick={() => set('rating', s)}
                      style={{ cursor: 'pointer' }}
                    >
                      <polygon points="6,1 7.5,4.5 11.5,4.5 8.5,7 9.7,11 6,8.8 2.3,11 3.5,7 0.5,4.5 4.5,4.5" />
                    </svg>
                  ))}
                  <span style={{ fontSize: 12, color: 'var(--c-text-muted)', marginLeft: 8 }}>{form.rating}/5</span>
                </div>
              </div>

              {/* Review text */}
              <div className="tm-field">
                <label className="tm-label"><span className="tm-label-dot" /> Review <span className="tm-label-req">*</span></label>
                <textarea className="tm-textarea" value={form.review} onChange={e => set('review', e.target.value)} placeholder="Customer review text..." rows={4} />
              </div>

              {/* Tag, Source, Date */}
              <div className="tm-form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="tm-field">
                  <label className="tm-label"><span className="tm-label-dot" /> Tag</label>
                  <input className="tm-input" value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="e.g. Verified Buyer" />
                </div>
                <div className="tm-field">
                  <label className="tm-label"><span className="tm-label-dot" /> Source</label>
                  <select className="tm-select" value={form.source} onChange={e => set('source', e.target.value)}>
                    <option value="manual">Manual</option>
                    <option value="google">Google</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div className="tm-field">
                  <label className="tm-label"><span className="tm-label-dot" /> Review Date</label>
                  <input className="tm-input" type="date" value={form.review_date} onChange={e => set('review_date', e.target.value)} />
                </div>
              </div>

              {/* Source URL + Sort order */}
              <div className="tm-form-row">
                <div className="tm-field">
                  <label className="tm-label"><span className="tm-label-dot" /> Source URL</label>
                  <input className="tm-input" value={form.source_url} onChange={e => set('source_url', e.target.value)} placeholder="Link to original review" />
                </div>
                <div className="tm-field">
                  <label className="tm-label"><span className="tm-label-dot" /> Sort Order</label>
                  <input className="tm-input" type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} placeholder="0" />
                </div>
              </div>

              {/* Toggles */}
              <div className="tm-toggles">
                {[
                  { key: 'is_visible', label: 'Visible' },
                  { key: 'is_featured', label: 'Featured' },
                  { key: 'is_verified', label: 'Verified' },
                ].map(t => (
                  <div key={t.key} className="tm-toggle-item" onClick={() => set(t.key, !form[t.key as keyof typeof form])}>
                    <div className={`tm-toggle-box${form[t.key as keyof typeof form] ? ' on' : ''}`}>
                      <div className="tm-toggle-dot" />
                    </div>
                    <span className="tm-toggle-label">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="tm-modal-footer">
              <button className="tm-btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="tm-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
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
