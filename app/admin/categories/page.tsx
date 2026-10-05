"use client";

import React, { useEffect, useState, useRef } from 'react'
import {
  Plus, Pencil, Trash2, AlertCircle, Search, Check, Upload, ImageIcon, Loader2,
  Sparkles, Eye, EyeOff, ChevronRight, Layers, FolderTree, CornerDownRight, Package,
  X, FolderPlus, Home,
} from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

type Category = {
  id: string
  name: string
  image_url?: string | null
  product_count?: number
  show_on_home?: boolean | null
  show_on_recipient?: boolean | null
  parent_category_id?: string | null
  slug?: string
}

type CatForm = {
  name: string
  image_url: string
  parent_category_id: string | null
  show_on_home: boolean
  show_on_recipient: boolean
}

const EMPTY_FORM: CatForm = {
  name: '',
  image_url: '',
  parent_category_id: null,
  show_on_home: false,
  show_on_recipient: false,
}

/* Thumbnail with a graceful placeholder so every row stays aligned. */
function CatThumb({ cat, size }: { cat: Category; size: number }) {
  if (cat.image_url) {
    return (
      <img
        src={cat.image_url}
        alt={cat.name}
        className="cat-thumb"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div className="cat-thumb cat-thumb--empty" style={{ width: size, height: size }}>
      <ImageIcon size={Math.round(size * 0.42)} />
    </div>
  )
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  // Unified add/edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CatForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const modalFileRef = useRef<HTMLInputElement>(null)
  const reduce = useReducedMotion()
  const dur = (n: number) => (reduce ? 0 : n)

  /* ── Load ── */
  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    try {
      setError(null)
      setLoading(true)
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      setCategories(await res.json())
    } catch (err) {
      setError('Failed to load categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /* ── Lock background scroll while modal is open ── */
  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [modalOpen])

  /* ── Derived tree ── */
  const parentCategories = categories.filter(c => !c.parent_category_id)
  const rootIdSet = new Set(parentCategories.map(c => c.id))
  const isChildCat = (c: Category) => !!c.parent_category_id && rootIdSet.has(c.parent_category_id)
  const childrenOf = (id: string) => categories.filter(c => c.parent_category_id === id)
  const displayRoots = categories.filter(c => !isChildCat(c))

  const q = query.trim().toLowerCase()
  const matchesQuery = (c: Category) => c.name.toLowerCase().includes(q)
  const visibleRoots = displayRoots.filter(p => !q || matchesQuery(p) || childrenOf(p.id).some(matchesQuery))
  const visibleChildren = (p: Category) => {
    const kids = childrenOf(p.id)
    if (!q || matchesQuery(p)) return kids
    return kids.filter(matchesQuery)
  }

  const toggleExpand = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  /* ── Stats ── */
  const total = categories.length
  const parents = displayRoots.length
  const children = categories.filter(isChildCat).length
  const products = categories.reduce((s, c) => s + (c.product_count || 0), 0)

  /* ── Modal open helpers ── */
  const openAdd = (parentId: string | null = null) => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, parent_category_id: parentId })
    setModalOpen(true)
  }
  const openEdit = (cat: Category) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      image_url: cat.image_url || '',
      parent_category_id: cat.parent_category_id || null,
      show_on_home: cat.show_on_home ?? false,
      show_on_recipient: cat.show_on_recipient ?? false,
    })
    setModalOpen(true)
  }
  const setField = <K extends keyof CatForm>(k: K, v: CatForm[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  /* ── Upload ── */
  const handleImageUpload = async (file: File) => {
    if (uploading) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/storage/upload-category-image', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      setField('image_url', url)
    } catch (err) {
      console.error(err)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  /* ── Save (create or update) ── */
  const saveCategory = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          image_url: form.image_url || null,
          parent_category_id: form.parent_category_id,
          show_on_home: form.show_on_home,
          show_on_recipient: form.show_on_recipient,
        }),
      })
      if (!res.ok) throw new Error('Failed to save category')
      await loadCategories()
      setModalOpen(false)
    } catch (err: any) {
      console.error(err)
      alert(`Failed to save category: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  /* ── Quick toggles ── */
  const patchCategory = async (cat: Category, patch: Partial<Category>) => {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to update')
      await loadCategories()
    } catch (err) {
      console.error(err)
      alert('Failed to update')
    }
  }

  const deleteCategory = async (cat: Category) => {
    const kids = childrenOf(cat.id).length
    const warn = kids > 0
      ? `Delete "${cat.name}" and unlink its ${kids} subcategor${kids === 1 ? 'y' : 'ies'}?`
      : `Delete "${cat.name}"?`
    if (!confirm(warn)) return
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await loadCategories()
    } catch (err) {
      console.error(err)
      alert('Failed to delete category')
    }
  }

  /* ── Row action buttons (shared by parent + child) ── */
  const RowActions = ({ cat, isParent }: { cat: Category; isParent: boolean }) => (
    <div className="cat-actions" onClick={e => e.stopPropagation()}>
      {isParent && (
        <button className="a-icon-btn a-icon-btn--sm" title="Add subcategory" onClick={() => openAdd(cat.id)}>
          <FolderPlus size={15} />
        </button>
      )}
      <button
        className={`a-icon-btn a-icon-btn--sm${cat.show_on_home ? ' is-on' : ''}`}
        title={cat.show_on_home ? 'Shown on home' : 'Show on home'}
        onClick={() => patchCategory(cat, { show_on_home: !(cat.show_on_home ?? false) })}
      >
        {cat.show_on_home ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <button
        className={`a-icon-btn a-icon-btn--sm${cat.show_on_recipient ? ' is-on' : ''}`}
        title={cat.show_on_recipient ? 'Shown on recipient' : 'Show on recipient'}
        onClick={() => patchCategory(cat, { show_on_recipient: !(cat.show_on_recipient ?? false) })}
      >
        <Sparkles size={15} />
      </button>
      <button className="a-icon-btn a-icon-btn--sm" title="Edit" onClick={() => openEdit(cat)}>
        <Pencil size={15} />
      </button>
      <button className="a-icon-btn a-icon-btn--sm a-icon-btn--danger" title="Delete" onClick={() => deleteCategory(cat)}>
        <Trash2 size={15} />
      </button>
    </div>
  )

  const Badges = ({ cat, subs }: { cat: Category; subs?: number }) => (
    <div className="cat-badges">
      <span className="cat-count">{cat.product_count || 0} products</span>
      {!!subs && <span className="a-badge a-badge--neutral">{subs} sub{subs !== 1 ? 's' : ''}</span>}
      {cat.show_on_home && <span className="a-badge a-badge--info">Home</span>}
      {cat.show_on_recipient && <span className="a-badge a-badge--accent">Recipient</span>}
    </div>
  )

  return (
    <div className="a-page">
      {/* ── Header ── */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Catalog</div>
          <h1 className="a-title">Product <em>Categories</em></h1>
          <p className="a-subtitle">Organize your catalog with parent &amp; subcategory hierarchies.</p>
        </div>
        <div className="a-head-actions">
          <button className="a-btn a-btn--primary" onClick={() => openAdd(null)}>
            <Plus size={16} strokeWidth={2} /> Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="cat-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="a-btn a-btn--ghost a-btn--sm" onClick={loadCategories} style={{ marginLeft: 'auto' }}>
            Try again
          </button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="a-stats">
        {[
          { label: 'Total', val: total, ico: <Layers size={16} /> },
          { label: 'Parents', val: parents, ico: <FolderTree size={16} /> },
          { label: 'Subcategories', val: children, ico: <CornerDownRight size={16} /> },
          { label: 'Products', val: products, ico: <Package size={16} /> },
        ].map(s => (
          <div className="a-stat" key={s.label}>
            <div className="a-stat-top">
              <span className="a-stat-ico">{s.ico}</span>
            </div>
            <div className="a-stat-label">{s.label}</div>
            <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{loading ? '—' : s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="a-toolbar">
        <div className="a-search">
          <Search size={16} className="a-search-ico" />
          <input
            className="a-search-input"
            placeholder="Search categories…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="a-toolbar-group">
          <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => setCollapsedIds(new Set())}>
            Expand all
          </button>
          <button
            className="a-btn a-btn--subtle a-btn--sm"
            onClick={() => setCollapsedIds(new Set(displayRoots.filter(p => childrenOf(p.id).length > 0).map(p => p.id)))}
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* ── Tree ── */}
      <div className="a-card">
        {loading ? (
          <div className="a-loader-row">
            <span className="a-loader" />
            <span className="a-loader-label">Loading categories…</span>
          </div>
        ) : visibleRoots.length === 0 ? (
          <div className="a-empty">
            <div className="a-empty-ico"><FolderTree size={30} /></div>
            <div className="a-empty-title">No categories {query ? 'found' : 'yet'}</div>
            <div className="a-empty-text">
              {query ? 'Try a different search term.' : 'Create your first category to organize the catalog.'}
            </div>
            {!query && (
              <button className="a-btn a-btn--primary" onClick={() => openAdd(null)} style={{ marginTop: 18 }}>
                <Plus size={16} /> Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="cat-tree">
            {visibleRoots.map((parent, index) => {
              const kids = visibleChildren(parent)
              const totalKids = childrenOf(parent.id).length
              const hasKids = totalKids > 0
              const expanded = !!q || !collapsedIds.has(parent.id)
              return (
                <motion.div
                  key={parent.id}
                  className="cat-parent"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: dur(0.28), ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.03, 0.2) }}
                >
                  <div
                    className="cat-parent-row"
                    onClick={hasKids ? () => toggleExpand(parent.id) : undefined}
                    style={{ cursor: hasKids ? 'pointer' : 'default' }}
                  >
                    <span className={`cat-chevron${hasKids ? '' : ' is-hidden'}`} style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}>
                      <ChevronRight size={17} />
                    </span>
                    <CatThumb cat={parent} size={48} />
                    <div className="cat-info">
                      <div className="cat-name">{parent.name}</div>
                      <Badges cat={parent} subs={totalKids} />
                    </div>
                    <RowActions cat={parent} isParent />
                  </div>

                  <AnimatePresence initial={false}>
                    {expanded && kids.length > 0 && (
                      <motion.div
                        className="cat-children"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                        transition={{ duration: dur(0.3), ease: [0.22, 1, 0.36, 1] }}
                      >
                        {kids.map(child => (
                          <div key={child.id} className="cat-child-row">
                            <CatThumb cat={child} size={36} />
                            <div className="cat-info">
                              <div className="cat-name cat-name--sm">{child.name}</div>
                              <Badges cat={child} />
                            </div>
                            <RowActions cat={child} isParent={false} />
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit modal ── */}
      {modalOpen && (
        <div className="a-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="a-modal-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <h2 className="a-modal-title">
                {editingId ? <>Edit <em>Category</em></> : <>Add <em>Category</em></>}
              </h2>
              <button className="a-icon-btn a-icon-btn--sm" onClick={() => setModalOpen(false)}><X size={15} /></button>
            </div>

            <div className="a-modal-body">
              {/* Image */}
              <div className="a-field">
                <label className="a-label">Image</label>
                <div className="cat-dropzone" onClick={() => modalFileRef.current?.click()}>
                  {uploading ? (
                    <div className="cat-dz-placeholder"><Loader2 size={22} className="animate-spin" /><span>Uploading…</span></div>
                  ) : form.image_url ? (
                    <>
                      <img src={form.image_url} alt="Preview" className="cat-dz-img" />
                      <div className="cat-dz-overlay"><Upload size={18} /><span>Change image</span></div>
                    </>
                  ) : (
                    <div className="cat-dz-placeholder"><Upload size={22} /><span>Click to upload</span></div>
                  )}
                </div>
                <input
                  ref={modalFileRef} type="file" accept="image/*" hidden
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }}
                />
              </div>

              {/* Name */}
              <div className="a-field" style={{ marginTop: 16 }}>
                <label className="a-label">Category Name <span className="a-req">*</span></label>
                <input
                  className="a-input"
                  placeholder="e.g. Diamond Rings"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveCategory()}
                  autoFocus
                />
              </div>

              {/* Parent */}
              <div className="a-field" style={{ marginTop: 16 }}>
                <label className="a-label">Parent Category</label>
                <select
                  className="a-select"
                  value={form.parent_category_id || ''}
                  onChange={e => setField('parent_category_id', e.target.value || null)}
                >
                  <option value="">None (top-level category)</option>
                  {parentCategories
                    .filter(c => c.id !== editingId)
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span className="a-hint">Choose a parent to make this a subcategory.</span>
              </div>

              {/* Visibility toggles */}
              <div className="a-divider" />
              <div className="cat-toggles">
                <label className="cat-toggle">
                  <span className="cat-toggle-txt"><Home size={15} /> Show on Home</span>
                  <span className="a-switch">
                    <input type="checkbox" checked={form.show_on_home} onChange={e => setField('show_on_home', e.target.checked)} />
                    <span className="a-switch-slider" />
                  </span>
                </label>
                <label className="cat-toggle">
                  <span className="cat-toggle-txt"><Sparkles size={15} /> Show on Recipient</span>
                  <span className="a-switch">
                    <input type="checkbox" checked={form.show_on_recipient} onChange={e => setField('show_on_recipient', e.target.checked)} />
                    <span className="a-switch-slider" />
                  </span>
                </label>
              </div>
            </div>

            <div className="a-modal-foot">
              <button className="a-btn a-btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="a-btn a-btn--primary" onClick={saveCategory} disabled={saving || uploading || !form.name.trim()}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cat-error {
          display: flex; align-items: center; gap: 10px;
          background: var(--c-danger-bg); border: 1px solid color-mix(in srgb, var(--c-danger) 26%, transparent);
          color: var(--c-danger); border-radius: var(--radius); padding: 12px 16px;
          font-size: 13px; margin-bottom: 20px;
        }

        /* ── Tree ── */
        .cat-tree { display: flex; flex-direction: column; }
        .cat-parent { border-bottom: 1px solid var(--c-border); }
        .cat-parent:last-child { border-bottom: 0; }

        .cat-parent-row {
          display: flex; align-items: center; gap: 14px;
          padding: 15px 20px; transition: background .16s ease;
        }
        .cat-parent-row:hover { background: var(--c-surface); }

        .cat-chevron {
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; flex-shrink: 0; color: var(--c-text-muted);
          transition: transform .22s cubic-bezier(.22,1,.36,1);
        }
        .cat-chevron.is-hidden { visibility: hidden; }

        .cat-thumb {
          object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0;
          border: 1px solid var(--c-border); background: var(--c-surface);
        }
        .cat-thumb--empty {
          display: flex; align-items: center; justify-content: center;
          color: var(--c-text-faint); background: var(--c-accent-soft);
          border-style: solid;
        }

        .cat-info { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
        .cat-name {
          font-family: var(--a-sans); font-size: 15px; font-weight: 600; color: var(--c-text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cat-name--sm { font-size: 13.5px; font-weight: 500; }

        .cat-badges { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .cat-count { font-size: 12px; color: var(--c-text-muted); white-space: nowrap; }

        .cat-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .cat-actions .a-icon-btn.is-on {
          border-color: var(--c-accent); color: var(--c-accent); background: var(--c-accent-soft);
        }

        /* ── Children (branch connectors) ── */
        .cat-children { background: var(--c-surface); border-top: 1px solid var(--c-border); }
        .cat-child-row {
          position: relative;
          display: flex; align-items: center; gap: 12px;
          padding: 12px 20px 12px 58px;
          border-bottom: 1px solid rgba(44,35,30,.05);
        }
        .cat-child-row:last-child { border-bottom: 0; }
        /* vertical guide line */
        .cat-child-row::before {
          content: ''; position: absolute; left: 30px; top: 0; bottom: 0;
          width: 1.5px; background: var(--c-border-strong);
        }
        .cat-child-row:last-child::before { bottom: 50%; }
        /* horizontal tick into the row */
        .cat-child-row::after {
          content: ''; position: absolute; left: 30px; top: 50%;
          width: 16px; height: 1.5px; background: var(--c-border-strong);
        }

        /* ── Modal dropzone ── */
        .cat-dropzone {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          height: 132px; border: 1.5px dashed var(--c-border-strong);
          border-radius: var(--radius-lg); background: var(--c-surface);
          cursor: pointer; transition: border-color .2s ease, background .2s ease;
        }
        .cat-dropzone:hover { border-color: var(--c-accent); background: var(--c-accent-soft); }
        .cat-dz-placeholder {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          color: var(--c-text-muted); font-size: 12px;
        }
        .cat-dz-img { width: 100%; height: 100%; object-fit: cover; }
        .cat-dz-overlay {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 6px;
          background: rgba(44,35,30,.55); color: #fff; font-size: 12px;
          opacity: 0; transition: opacity .2s ease;
        }
        .cat-dropzone:hover .cat-dz-overlay { opacity: 1; }

        /* ── Modal toggles ── */
        .cat-toggles { display: flex; flex-direction: column; gap: 4px; }
        .cat-toggle {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border: 1px solid var(--c-border); border-radius: var(--radius);
          background: #fff; cursor: pointer; transition: border-color .16s ease, background .16s ease;
        }
        .cat-toggle:hover { border-color: var(--c-border-strong); background: var(--c-surface); }
        .cat-toggle-txt {
          display: inline-flex; align-items: center; gap: 9px;
          font-family: var(--a-sans); font-size: 13.5px; color: var(--c-text);
        }
        .cat-toggle-txt svg { color: var(--c-text-muted); }

        @media (max-width: 640px) {
          .cat-parent-row { flex-wrap: wrap; }
          .cat-actions { width: 100%; justify-content: flex-end; }
          .cat-child-row { flex-wrap: wrap; padding-left: 46px; }
          .cat-child-row .cat-actions { width: 100%; justify-content: flex-end; }
        }
      `}</style>
    </div>
  )
}
