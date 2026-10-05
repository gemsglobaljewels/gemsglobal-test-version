'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit, Trash2, Search, AlertCircle,
  Eye, EyeOff, Diamond, Filter, X, ChevronDown,
  Box, Package, Gem, Tag, Zap, ArrowRight, MoreVertical
} from 'lucide-react'

const CSS = `
.ap-v6 {
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--font-main);
  padding: 120px 40px 100px;
  position: relative;
}

.ap-grain {
  position: fixed; inset: 0; z-index: 50; pointer-events: none; opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Stats Row */
.ap-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 60px;
}
.ap-stat-card {
  background: #fff;
  padding: 24px;
  border: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow-md);
}
.ap-stat-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ap-stat-info { display: flex; flex-direction: column; }
.ap-stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--c-text-muted); }
.ap-stat-value { font-family: var(--font-main); font-size: 24px; font-weight: 300; }

/* Action Bar */
.ap-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 20px;
}
@media (max-width: 768px) { .ap-action-bar { flex-direction: column; align-items: stretch; } }

.ap-search-wrap {
  flex: 1;
  position: relative;
  max-width: 400px;
}
.ap-search-input {
  width: 100%;
  height: 48px;
  background: #fff;
  border: 1px solid var(--c-border);
  padding: 0 16px 0 48px;
  font-size: 14px;
  outline: none;
  transition: 0.3s;
  border-radius: var(--radius);
}
.ap-search-input:focus { border-color: var(--c-accent); box-shadow: var(--shadow-md); }
.ap-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--c-accent); }

.ap-btn-group { display: flex; gap: 12px; }
.ap-btn {
  height: 48px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: 0.3s;
  border: 1px solid transparent;
}
.ap-btn-primary { background: var(--c-text); color: #fff; border-radius: var(--radius); }
.ap-btn-primary:hover { background: var(--c-accent); transform: translateY(-2px); }
.ap-btn-secondary { background: #fff; border-color: var(--c-border); color: var(--c-text); border-radius: var(--radius); }
.ap-btn-secondary:hover { border-color: var(--c-accent); color: var(--c-accent); }

/* Table View */
.ap-table-container {
  background: #fff;
  border: 1px solid var(--c-border);
  overflow-x: auto;
  box-shadow: var(--shadow-md);
}
.ap-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}
.ap-table th {
  text-align: left;
  padding: 20px 24px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--c-accent);
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
}
.ap-table td {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.06);
  font-size: 13px;
  vertical-align: middle;
}
.ap-table tr:hover { background: var(--c-surface); }

.ap-prod-cell { display: flex; align-items: center; gap: 16px; }
.ap-prod-img { width: 44px; height: 44px; background: var(--c-surface); object-fit: cover; }
.ap-prod-info { display: flex; flex-direction: column; gap: 2px; }
.ap-prod-name { font-family: var(--font-main); font-size: 15px; font-weight: 500; }
.ap-prod-sku { font-size: 10px; color: var(--c-text-muted); font-weight: 600; letter-spacing: 0.05em; }

.ap-status-tag {
  padding: 4px 10px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 100px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ap-status-active { background: #ECFDF5; color: #059669; }
.ap-status-inactive { background: #FEF2F2; color: #DC2626; }

.ap-price-usd { font-family: var(--font-main); font-size: 16px; color: var(--c-accent); }
.ap-price-inr { font-size: 11px; color: var(--c-text-muted); margin-top: 2px; }

.ap-actions { display: flex; gap: 8px; }
.ap-action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--c-border);
  background: transparent;
  color: var(--c-text);
  cursor: pointer;
  transition: 0.2s;
  border-radius: var(--radius);
}
.ap-action-btn:hover { border-color: var(--c-accent); color: var(--c-accent); background: #fff; }
.ap-action-btn.del:hover { border-color: #EF4444; color: #EF4444; }

.ap-pagination {
  margin-top: 40px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.ap-page-btn {
  height: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid var(--c-border);
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s;
  border-radius: var(--radius);
}
.ap-page-btn:hover:not(:disabled) { border-color: var(--c-accent); color: var(--c-accent); }
.ap-page-btn.active { background: var(--c-text); color: #fff; border-color: var(--c-text); }
.ap-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Toggle Switch */
.ap-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}
.ap-switch input { opacity: 0; width: 0; height: 0; }
.ap-slider {
  position: absolute; cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #e5e7eb; transition: .4s;
  border-radius: 34px;
}
.ap-slider:before {
  position: absolute; content: "";
  height: 16px; width: 16px; left: 3px; bottom: 3px;
  background-color: white; transition: .4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
input:checked + .ap-slider { background-color: #4ADE80; }
input:focus + .ap-slider { box-shadow: 0 0 1px #4ADE80; }
input:checked + .ap-slider:before { transform: translateX(22px); }
input:disabled + .ap-slider { opacity: 0.5; cursor: not-allowed; }
`

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

  const [selectedRootCategoryId, setSelectedRootCategoryId] = useState<string>("")
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("")

  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parent_category_id)
  }, [categories])

  const childCategories = useMemo(() => {
    if (!selectedRootCategoryId) return []
    return categories.filter(c => c.parent_category_id === selectedRootCategoryId)
  }, [categories, selectedRootCategoryId])

  // Temporary console logs for verification
  console.log('Selected root category id:', selectedRootCategoryId)
  console.log('Root categories result:', parentCategories)
  console.log('Child categories result:', childCategories)

  useEffect(() => {
    const activeFilter = selectedSubCategoryId || selectedRootCategoryId || 'all'
    setCatFilter(activeFilter)
    setPage(1)
  }, [selectedRootCategoryId, selectedSubCategoryId])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    const savedRate = localStorage.getItem('admin_fx_rate')
    if (savedRate) setFxRate(Number(savedRate))
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
          revenue: data.products.reduce((acc: number, p: any) => acc + (p.price || 0), 0)
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
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      // Always refresh products, even if delete fails
      fetchProducts()
    } catch (err) {
      console.error('Delete error:', err)
      // Still refresh products
      fetchProducts()
    }
  }

  const deleteSelected = async () => {
    if (selectedProductIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.size} selected product(s)?`)) return
    setDeleting(true)
    try {
      const deletePromises = Array.from(selectedProductIds).map(id =>
        fetch(`/api/products/${id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
    } catch (err) {
      console.error('Bulk delete error:', err)
    } finally {
      setSelectedProductIds(new Set())
      setDeleting(false)
      fetchProducts()
    }
  }

  const deleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL products? This action is irreversible!')) return
    setDeleting(true)
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
      const deletePromises = allProducts.map(p =>
        fetch(`/api/products/${p.id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
    } catch (err) {
      console.error('Delete all error:', err)
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
    <div className="ap-v6">
      <style>{CSS}</style>
      <div className="ap-grain" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ap-stats-grid"
      >
        <div className="ap-stat-card">
          <div className="ap-stat-icon-box" style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#059669' }}>
            <Package size={24} />
          </div>
          <div className="ap-stat-info">
            <span className="ap-stat-label">Total Inventory</span>
            <span className="ap-stat-value">{total}</span>
          </div>
        </div>
        <div className="ap-stat-card">
          <div className="ap-stat-icon-box" style={{ background: 'rgba(143, 122, 112, 0.1)', color: '#8F7A70' }}>
            <Zap size={24} />
          </div>
          <div className="ap-stat-info">
            <span className="ap-stat-label">Featured Pieces</span>
            <span className="ap-stat-value">{stats.active}</span>
          </div>
        </div>
        <div className="ap-stat-card">
          <div className="ap-stat-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' }}>
            <AlertCircle size={24} />
          </div>
          <div className="ap-stat-info">
            <span className="ap-stat-label">Low Stock</span>
            <span className="ap-stat-value">{stats.lowStock}</span>
          </div>
        </div>
        <div className="ap-stat-card">
          <div className="ap-stat-icon-box" style={{ background: 'rgba(143, 122, 112, 0.1)', color: '#8F7A70' }}>
            <Diamond size={24} />
          </div>
          <div className="ap-stat-info">
            <span className="ap-stat-label">Page Value</span>
            <span className="ap-stat-value">{fmtUSD(stats.revenue)}</span>
          </div>
        </div>
      </motion.div>

      <div className="ap-action-bar">
        <div className="ap-search-wrap">
          <Search className="ap-search-icon" size={20} />
          <input
            className="ap-search-input"
            placeholder="Search creation by name or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="ap-btn-group">
          {selectedProductIds.size > 0 && (
            <button
              className="ap-btn ap-btn-secondary"
              onClick={deleteSelected}
              disabled={deleting}
              style={{ color: '#EF4444', borderColor: '#EF4444' }}
            >
              <Trash2 size={16} /> Delete Selected ({selectedProductIds.size})
            </button>
          )}

          {total > 0 && (
            <button
              className="ap-btn ap-btn-secondary"
              onClick={deleteAll}
              disabled={deleting}
              style={{ color: '#EF4444', borderColor: '#EF4444' }}
            >
              <Trash2 size={16} /> Delete All
            </button>
          )}

          <select
            className="ap-btn ap-btn-secondary"
            style={{ appearance: 'none', paddingRight: '40px' }}
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
              className="ap-btn ap-btn-secondary"
              style={{ appearance: 'none', paddingRight: '40px' }}
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

          <Link href="/admin/products/new">
            <button className="ap-btn ap-btn-primary">
              <Plus size={16} /> Add New Piece
            </button>
          </Link>
        </div>
      </div>

      <div className="ap-table-container">
        <table className="ap-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>
                <input
                  type="checkbox"
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
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <div className="ap-loader" style={{ margin: '0 auto 20px' }} />
                  <span className="ap-eyebrow">Polishing the Jewels…</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <Package size={48} strokeWidth={1} opacity={0.2} style={{ marginBottom: 20 }} />
                  <p style={{ fontStyle: 'italic', color: 'var(--c-text-muted)' }}>No creations found in this collection.</p>
                </td>
              </tr>
            ) : filtered.map((p, idx) => (
              <tr key={p.id || idx}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProductIds.has(p.id)}
                    onChange={() => toggleSelectProduct(p.id)}
                  />
                </td>
                <td>
                  <div className="ap-prod-cell">
                    {p.image ? (
                      <img src={p.image} alt="" className="ap-prod-img" />
                    ) : (
                      <div className="ap-prod-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Gem size={20} strokeWidth={1} opacity={0.2} />
                      </div>
                    )}
                    <div className="ap-prod-info">
                      <span className="ap-prod-name">{p.name}</span>
                      <span className="ap-prod-sku">{p.sku || 'NO SKU'}</span>
                    </div>
                  </div>
                </td>
                <td><span style={{ color: 'var(--c-text-muted)' }}>{fmtDate(p.created_at)}</span></td>
                <td><span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--c-accent)' }}>{p.category}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{p.stock_quantity || 0}</span>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: (p.stock_quantity || 0) > 0 ? '#4ADE80' : '#F87171' }} />
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="ap-switch">
                      <input
                        type="checkbox"
                        checked={!!p.is_featured}
                        onChange={() => toggleVisibility(p.id, !!p.is_featured)}
                      />
                      <span className="ap-slider" />
                    </label>
                    <span className={`ap-status-tag ${p.is_featured ? 'ap-status-active' : 'ap-status-inactive'}`}>
                      {p.is_featured ? 'Home Visible' : 'Hidden'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="ap-price-usd">{fmtUSD(p.price)}</div>
                  <div className="ap-price-inr">{fmtINR(p.price)}</div>
                </td>
                <td>
                  <div className="ap-actions" style={{ justifyContent: 'flex-end' }}>
                    <Link href={`/admin/products/${p.id}/edit`}>
                      <button className="ap-action-btn" title="Edit Creation"><Edit size={14} /></button>
                    </Link>
                    <button
                      className="ap-action-btn del"
                      title="Remove Piece"
                      onClick={() => deleteProduct(p.id)}
                      disabled={deleting}
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

      {total > 12 && (
        <div className="ap-pagination">
          <button
            className="ap-page-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
          </button>
          {Array.from({ length: Math.ceil(total / 12) }).map((_, i) => (
            <button
              key={i}
              className={`ap-page-btn ${page === i + 1 ? 'active' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="ap-page-btn"
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
