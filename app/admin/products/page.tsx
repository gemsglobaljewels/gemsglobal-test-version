'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus, Edit, Trash2, Search, AlertCircle, X,
  Diamond, Package, Gem, Zap, ChevronDown
} from 'lucide-react'
import { resolveAdminFxRate } from '@/lib/adminRate'
import { startingRetailPrice } from '@/lib/variantPricing'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [fxRate, setFxRate] = useState(83)
  const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0, revenue: 0 })
  const [categories, setCategories] = useState<any[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const [selectedRootCategoryId, setSelectedRootCategoryId] = useState<string>("")
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("")

  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parent_category_id)
  }, [categories])

  const childCategories = useMemo(() => {
    if (!selectedRootCategoryId) return []
    return categories.filter(c => c.parent_category_id === selectedRootCategoryId)
  }, [categories, selectedRootCategoryId])

  useEffect(() => {
    const activeFilter = selectedSubCategoryId || selectedRootCategoryId || 'all'
    setCatFilter(activeFilter)
    setPage(1)
  }, [selectedRootCategoryId, selectedSubCategoryId])

  // Categories rarely change — fetch once on mount, not on every page/filter change.
  useEffect(() => {
    fetchCategories()
    // Server is the single source of truth (fixed admin rate, else live).
    resolveAdminFxRate().then((r) => setFxRate(r))
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [page, catFilter])

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Admin] Fetch categories error:', err)
    }
  }

  async function fetchProducts() {
    try {
      setLoading(true)
      const url = `/api/products?page=${page}&limit=12&category=${catFilter}`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()

      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products)
        setTotal(data.total || 0)

        // Simple stats calculation
        const active = data.products.filter((p: any) => p.is_featured).length
        const low = data.products.filter((p: any) => p.stock_quantity < 5).length
        setStats({
          total: data.total || 0,
          active: active, // This is just for current page, in real app would be from API
          lowStock: low,
          revenue: data.products.reduce((acc: number, p: any) => acc + (startingRetailPrice(p) || 0), 0)
        })
      }
    } catch (err) {
      console.error('[Admin] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleVisibility(productId: string, currentStatus: boolean) {
    try {
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_featured: !currentStatus } : p));

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentStatus })
      });

      if (!res.ok) {
        // Rollback on error
        const errData = await res.json();
        console.error('Toggle error:', errData.error);
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_featured: currentStatus } : p));
      } else {
        // Update local stats for the current view
        setStats(prev => ({
          ...prev,
          active: currentStatus ? prev.active - 1 : prev.active + 1
        }));
      }
    } catch (err) {
      console.error('Toggle catch error:', err);
      // Rollback on network error
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_featured: currentStatus } : p));
    }
  }

  const toggleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProductIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedProductIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filtered.length) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(filtered.map(p => p.id)))
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeleteError('')
    setDeletingIds(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || (data && data.error)) {
        setDeleteError(data?.error || `Delete failed (HTTP ${res.status}). Please try again.`)
      } else {
        // Optimistic removal so the row disappears instantly
        setProducts(prev => prev.filter(p => p.id !== id))
        setSelectedProductIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        setTotal(t => Math.max(0, t - 1))
      }
    } catch (err) {
      console.error('Delete error:', err)
      setDeleteError('Network error while deleting. Please check your connection and try again.')
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      // Re-sync with the server so counts/pages stay truthful
      fetchProducts()
    }
  }

  const deleteSelected = async () => {
    if (selectedProductIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.size} selected product(s)?`)) return
    setDeleting(true)
    setDeleteError('')
    const ids = Array.from(selectedProductIds)
    try {
      const results = await Promise.all(ids.map(async (id) => {
        try {
          const r = await fetch(`/api/products/${id}`, { method: 'DELETE' })
          const d = await r.json().catch(() => ({}))
          return { id, ok: r.ok && !(d && d.error), error: d?.error }
        } catch (e: any) {
          return { id, ok: false, error: e?.message || 'network error' }
        }
      }))
      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        setDeleteError(
          `Deleted ${ids.length - failed.length} of ${ids.length}. ` +
          `Failed (${failed.length}): ${failed.map(f => f.error || f.id.slice(0, 8)).join('; ')}`
        )
      }
    } catch (err) {
      console.error('Bulk delete error:', err)
      setDeleteError('Bulk delete hit a network error. Some items may not have been deleted — the list has been refreshed.')
    } finally {
      setSelectedProductIds(new Set())
      setDeleting(false)
      fetchProducts()
    }
  }

  const deleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL products? This action is irreversible!')) return
    setDeleting(true)
    setDeleteError('')
    try {
      // First fetch all products to delete
      let allProducts: any[] = []
      let currentPage = 1
      let hasMore = true
      while (hasMore) {
        const res = await fetch(`/api/products?page=${currentPage}&limit=1000`, { cache: 'no-store' })
        const data = await res.json()
        const productsToAdd = Array.isArray(data) ? data : (data.products || [])
        allProducts = [...allProducts, ...productsToAdd]
        if (productsToAdd.length < 1000) {
          hasMore = false
        } else {
          currentPage++
        }
      }
      // Now delete each product
      const results = await Promise.all(allProducts.map(async (p) => {
        try {
          const r = await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
          const d = await r.json().catch(() => ({}))
          return { id: p.id, ok: r.ok && !(d && d.error) }
        } catch {
          return { id: p.id, ok: false }
        }
      }))
      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        setDeleteError(`Deleted ${results.length - failed.length} of ${results.length}. ${failed.length} item(s) could not be deleted — the list has been refreshed.`)
      }
    } catch (err) {
      console.error('Delete all error:', err)
      setDeleteError('Delete-all hit a network error. The list has been refreshed — please verify what remains.')
    } finally {
      setSelectedProductIds(new Set())
      setDeleting(false)
      fetchProducts()
    }
  }

  const filtered = useMemo(() => {
    if (!products) return []
    if (!searchQuery) return products
    const q = searchQuery.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    )
  }, [products, searchQuery])

  const fmtUSD = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0)
  const fmtINR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v * fxRate)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

  return (
    <div className="a-page">
      <header className="a-head">
        <div>
          <span className="a-eyebrow">Atelier Inventory</span>
          <h1 className="a-title">Curated <em>Collection</em></h1>
          <p className="a-subtitle">Manage every piece, its visibility, and pricing across your collections.</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/products/new" className="a-btn a-btn--primary">
            <Plus size={16} /> Add New Piece
          </Link>
        </div>
      </header>

      {deleteError && (
        <div className="a-card" style={{ marginBottom: 16, borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)' }}>
          <div className="a-card-body" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--c-danger)' }}>
            <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <p style={{ flex: 1, margin: 0, fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{deleteError}</p>
            <button className="a-icon-btn a-icon-btn--sm" type="button" onClick={() => setDeleteError('')} aria-label="Dismiss">
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="a-stats"
      >
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico" style={{ background: 'var(--c-info-bg)', color: 'var(--c-info)' }}>
              <Package size={20} />
            </span>
            <span className="a-stat-label">Total Inventory</span>
          </div>
          <div className="a-stat-val">{total}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}>
              <Zap size={20} />
            </span>
            <span className="a-stat-label">Featured Pieces</span>
          </div>
          <div className="a-stat-val">{stats.active}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico" style={{ background: 'var(--c-warning-bg)', color: 'var(--c-warning)' }}>
              <AlertCircle size={20} />
            </span>
            <span className="a-stat-label">Low Stock</span>
          </div>
          <div className="a-stat-val">{stats.lowStock}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}>
              <Diamond size={20} />
            </span>
            <span className="a-stat-label">Page Value</span>
          </div>
          <div className="a-stat-val">{fmtUSD(stats.revenue)}</div>
        </div>
      </motion.div>

      <div className="a-toolbar">
        <div className="a-search">
          <Search className="a-search-ico" size={18} />
          <input
            className="a-search-input"
            placeholder="Search creation by name or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="a-toolbar-group">
          <select
            className="a-select"
            value={selectedRootCategoryId}
            onChange={(e) => {
              setSelectedRootCategoryId(e.target.value);
              setSelectedSubCategoryId("");
            }}
          >
            <option value="">All Collections</option>
            {parentCategories.map(parent => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>

          {childCategories.length > 0 && (
            <select
              className="a-select"
              value={selectedSubCategoryId}
              onChange={(e) => setSelectedSubCategoryId(e.target.value)}
            >
              <option value="">All Sub Collections</option>
              {childCategories.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="a-toolbar-group">
          {selectedProductIds.size > 0 && (
            <button
              className="a-btn a-btn--danger"
              onClick={deleteSelected}
              disabled={deleting}
            >
              <Trash2 size={16} /> Delete Selected ({selectedProductIds.size})
            </button>
          )}

          {total > 0 && (
            <button
              className="a-btn a-btn--danger"
              onClick={deleteAll}
              disabled={deleting}
            >
              <Trash2 size={16} /> Delete All
            </button>
          )}
        </div>
      </div>

      <div className="a-table-wrap">
        <div className="a-table-scroll">
          <table className="a-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>
                  <input
                    type="checkbox"
                    className="a-check"
                    checked={filtered.length > 0 && selectedProductIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Product Details</th>
                <th>Created At</th>
                <th>Category</th>
                <th>Available</th>
                <th>Status</th>
                <th>Price</th>
                <th className="a-td-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Polishing the Jewels…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="a-empty">
                      <Package className="a-empty-ico" size={48} strokeWidth={1} />
                      <div className="a-empty-title">No creations found</div>
                      <div className="a-empty-text">No creations found in this collection.</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((p, idx) => (
                <tr key={p.id || idx}>
                  <td>
                    <input
                      type="checkbox"
                      className="a-check"
                      checked={selectedProductIds.has(p.id)}
                      onChange={() => toggleSelectProduct(p.id)}
                    />
                  </td>
                  <td>
                    <div className="a-cell-lead">
                      {p.image ? (
                        <img src={p.image} alt="" className="a-media" />
                      ) : (
                        <div className="a-media" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Gem size={20} strokeWidth={1} opacity={0.3} />
                        </div>
                      )}
                      <div>
                        <div className="a-cell-name">{p.name}</div>
                        <div className="a-cell-meta a-mono">{p.sku || 'NO SKU'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="a-muted">{fmtDate(p.created_at)}</span></td>
                  <td><span className="a-badge a-badge--accent">{p.category}</span></td>
                  <td>
                    <span className="a-row">
                      <span style={{ fontWeight: 600 }}>{p.stock_quantity || 0}</span>
                      <span className={`a-dot ${(p.stock_quantity || 0) > 0 ? 'a-dot--success' : 'a-dot--danger'}`} />
                    </span>
                  </td>
                  <td>
                    <div className="a-row">
                      <label className="a-switch">
                        <input
                          type="checkbox"
                          checked={!!p.is_featured}
                          onChange={() => toggleVisibility(p.id, !!p.is_featured)}
                        />
                        <span className="a-switch-slider" />
                      </label>
                      <span className={`a-badge ${p.is_featured ? 'a-badge--success' : 'a-badge--neutral'}`}>
                        {p.is_featured ? 'Home Visible' : 'Hidden'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-main)', fontSize: 16, color: 'var(--c-text)' }}>{fmtUSD(startingRetailPrice(p))}</div>
                    <div className="a-cell-meta">{fmtINR(startingRetailPrice(p))}</div>
                    {!(startingRetailPrice(p) > 0) && (
                      <div style={{ marginTop: 6 }}>
                        <span className="a-badge a-badge--danger" title="No base price and no priced variant — this piece is hidden on the storefront until a price is set.">No Price · Hidden</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="a-cell-actions">
                      <Link href={`/admin/products/${p.id}/edit`} className="a-icon-btn" title="Edit Creation">
                        <Edit size={14} />
                      </Link>
                      <button
                        className="a-icon-btn a-icon-btn--danger"
                        title="Remove Piece"
                        onClick={() => deleteProduct(p.id)}
                        disabled={deleting || deletingIds.has(p.id)}
                        style={deletingIds.has(p.id) ? { opacity: 0.4 } : undefined}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > 12 && (
        <div className="a-pager">
          <button
            className="a-pager-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
          </button>
          {Array.from({ length: Math.ceil(total / 12) }).map((_, i) => (
            <button
              key={i}
              className={`a-pager-btn ${page === i + 1 ? 'is-active' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="a-pager-btn"
            disabled={page === Math.ceil(total / 12)}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      )}
    </div>
  )
}
