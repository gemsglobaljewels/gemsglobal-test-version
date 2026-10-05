'use client'

import {
  TrendingUp, Package, ShoppingCart, Calendar,
  DollarSign, Users, ArrowUpRight, Plus, ChevronRight,
  Activity, BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatOrderDate } from '@/lib/formatOrderDate'
import { countsAsRevenue } from '@/lib/orderStatus'

type Stat = { label: string; value: string; sub: string; icon: any }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Total Revenue', value: '—', sub: 'All time', icon: DollarSign },
    { label: 'Orders', value: '—', sub: 'Total orders', icon: ShoppingCart },
    { label: 'Products', value: '—', sub: 'In catalogue', icon: Package },
    { label: 'Appointments', value: '—', sub: 'Scheduled', icon: Calendar },
    { label: 'Customers', value: '—', sub: 'Unique buyers', icon: Users },
    { label: 'Total Users', value: '—', sub: 'Registered', icon: Users },
    { label: 'Offline Sales', value: '—', sub: 'In-store', icon: DollarSign },
    { label: 'Conversion', value: '—', sub: 'Overall rate', icon: TrendingUp },
  ])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    const loadData = async () => {
      if (!alive || document.hidden) return
      try {
        const [oRes, pRes, aRes, nRes, uRes, sRes] = await Promise.all([
          fetch('/api/orders?limit=1000'),
          fetch('/api/products?count=true'),
          fetch('/api/appointments?count=true'),
          fetch('/api/analytics/detailed?limit=1'),
          fetch('/api/users'),
          fetch('/api/offline-sales'),
        ])
        const [o, p, a, n, u, s] = await Promise.all([
          oRes.json().catch(() => []),
          pRes.json().catch(() => ({ products: [] })),
          aRes.json().catch(() => ({ count: 0 })),
          nRes.json().catch(() => ({ totalSessions: 0 })),
          uRes.json().catch(() => []),
          sRes.json().catch(() => []),
        ])
        if (!alive) return
        // /api/orders already excludes unpaid/abandoned checkouts (pending,
        // payment_failed, failed) by default, so oList is only real placed
        // orders — an abandoned cart never inflates these figures.
        const oList = Array.isArray(o) ? o : []
        const pList = Array.isArray(p?.products) ? p.products : (Array.isArray(p) ? p : [])
        const pTotal = typeof p?.total === 'number' ? p.total : pList.length
        const aCount = typeof a?.count === 'number' ? a.count : (Array.isArray(a) ? a.length : 0)
        const uList = Array.isArray(u) ? u : []
        const sList = Array.isArray(s) ? s : []

        setRecentOrders(oList.slice(0, 5))

        // Calculate Online Revenue Split — only orders whose money was actually
        // collected and not reversed count (excludes cancelled/refunded/returned).
        let revUsd = 0
        let revInr = 0

        oList.forEach((x: any) => {
          if (!countsAsRevenue(x.status)) return
          const isUsd = String(x.currency).toUpperCase() === 'USD'
          const total = x.total || x.total_price || 0

          if (isUsd) {
            revUsd += total
          } else {
            // total_price is already stored in INR for INR orders — add as-is.
            revInr += total
          }
        })

        // Offline sales are calculated separately
        const offRevInr = sList.reduce((sum: number, x: any) => sum + (x.total || 0), 0)

        const uniq = new Set(oList.map((x: any) => x.customerName)).size

        // Calculate conversion rate: (Orders / Total Sessions) * 100
        const totalSessions = n?.totalSessions || 0
        const convRate = totalSessions > 0 ? ((oList.length / totalSessions) * 100).toFixed(1) : '0'

        const usdStr = revUsd > 0 ? `$${revUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : ''
        const inrStr = revInr > 0 ? `₹${revInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : ''
        const combinedRev = [usdStr, inrStr].filter(Boolean).join(' + ') || '—'

        setStats([
          { label: 'Total Revenue', value: combinedRev, sub: 'Online orders', icon: DollarSign },
          { label: 'Revenue USD', value: usdStr || '$0', sub: 'Online', icon: DollarSign },
          { label: 'Revenue INR', value: inrStr || '₹0', sub: 'Online', icon: DollarSign },
          { label: 'Orders', value: String(oList.length), sub: 'Online orders', icon: ShoppingCart },
          { label: 'Products', value: String(pTotal), sub: 'In catalogue', icon: Package },
          { label: 'Appointments', value: String(aCount), sub: 'Scheduled', icon: Calendar },
          { label: 'Customers', value: String(uniq), sub: 'Unique buyers', icon: Users },
          { label: 'Total Users', value: String(uList.length), sub: 'Registered', icon: Users },
          { label: 'Offline Sales', value: `₹${offRevInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: `${sList.length} transactions`, icon: DollarSign },
          { label: 'Conversion', value: `${convRate}%`, sub: 'Overall rate', icon: TrendingUp },
        ])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      }
      finally { if (alive) setLoaded(true) }
    }
    loadData()
    return () => { alive = false }
  }, [])

  const statusTone = (s: string) => {
    const k = (s || '').toLowerCase()
    if (k === 'completed') return 'success'
    if (k === 'processing') return 'info'
    if (k === 'pending') return 'warning'
    return 'neutral'
  }

  const ACTIONS = [
    { href: '/admin/appointments', icon: Calendar, label: 'View Appointments' },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Process Orders' },
    { href: '/admin/site-analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/messaging', icon: Activity, label: 'Messaging' },
  ]

  const SYS = [
    { label: 'Database', dot: 'success', txt: 'Connected' },
    { label: 'Stripe', dot: 'success', txt: 'Active' },
    { label: 'Email Service', dot: 'success', txt: 'Running' },
  ]

  return (
    <div className="a-page">
      <style>{`
        .ad-actions-list { display: flex; flex-direction: column; }
        .ad-action {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 4px;
          color: var(--c-text); text-decoration: none;
          border-bottom: 1px solid var(--c-border);
          transition: color .18s ease;
        }
        .ad-action:last-child { border-bottom: none; }
        .ad-action:hover { color: var(--c-accent); }
        .ad-action-ico {
          width: 34px; height: 34px; flex-shrink: 0;
          border: 1px solid var(--c-border);
          border-radius: var(--radius-sm);
          background: var(--c-surface);
          display: flex; align-items: center; justify-content: center;
          color: var(--c-accent);
          transition: border-color .18s ease;
        }
        .ad-action:hover .ad-action-ico { border-color: var(--c-accent); }
        .ad-action-lbl {
          flex: 1;
          font-family: var(--font-dmsans);
          font-size: 13px; letter-spacing: .01em;
        }
        .ad-action-arr { color: var(--c-text-faint); transition: transform .18s ease, color .18s ease; }
        .ad-action:hover .ad-action-arr { color: var(--c-accent); transform: translateX(3px); }
        .ad-sys-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--c-border);
        }
        .ad-sys-row:last-child { border-bottom: none; }
        .ad-sys-lbl {
          font-family: var(--font-dmsans);
          font-size: 13px; color: var(--c-text-muted);
        }
        .ad-sys-val {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-dmsans);
          font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
          color: var(--c-success);
        }
      `}</style>

      {/* Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Admin Panel</div>
          <h1 className="a-title">Overview <em>Dashboard</em></h1>
          <p className="a-subtitle">Your store at a glance — today.</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/products/new" className="a-btn a-btn--primary">
            <Plus size={14} strokeWidth={2.5} /> New Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="a-stats">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="a-stat">
              <div className="a-stat-top">
                <div className="a-stat-ico">
                  <Icon size={16} strokeWidth={1.5} />
                </div>
              </div>
              <div className="a-stat-label">{s.label}</div>
              <div className={`a-stat-val${!loaded ? ' is-loading' : ''}`}>{s.value}</div>
              <div className="a-stat-sub">{s.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="a-grid-2">

        {/* Orders */}
        <div className="a-card">
          <div className="a-card-head">
            <h2 className="a-card-title">Recent <em>Orders</em></h2>
            <Link href="/admin/orders" className="a-btn a-btn--ghost a-btn--sm">
              View all <ArrowUpRight size={13} strokeWidth={1.5} />
            </Link>
          </div>
          <div className="a-card-body a-card-body--flush">
            {!loaded && (
              <div className="a-loader-row">
                <span className="a-loader" />
                <span className="a-loader-label">Loading…</span>
              </div>
            )}
            {loaded && recentOrders.length === 0 && (
              <div className="a-empty">
                <div className="a-empty-ico"><ShoppingCart size={22} strokeWidth={1.5} /></div>
                <div className="a-empty-title">No orders yet</div>
                <div className="a-empty-text">Recent orders will appear here once they come in.</div>
              </div>
            )}
            {loaded && recentOrders.length > 0 && (
              <div className="a-table-wrap">
                <div className="a-table-scroll">
                  <table className="a-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Status</th>
                        <th className="a-td-right">Amount</th>
                        <th className="a-td-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => (
                        <tr key={order.id}>
                          <td>
                            <div className="a-cell-name">{order.customerName}</div>
                            <div className="a-cell-meta a-mono">{String(order.id).slice(0, 12)}…</div>
                          </td>
                          <td>
                            <span className={`a-badge a-badge--${statusTone(order.status)}`}>
                              {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : '—'}
                            </span>
                          </td>
                          <td className="a-td-right a-mono">
                            {(() => {
                              const isUsd = order.currency === 'USD'
                              const symbol = isUsd ? '$' : '₹'
                              const total = Number(order.total || order.total_price || 0)

                              return `${symbol}${total.toLocaleString(isUsd ? 'en-US' : 'en-IN', {
                                minimumFractionDigits: isUsd ? 2 : 0,
                                maximumFractionDigits: isUsd ? 2 : 0
                              })}`
                            })()}
                          </td>
                          <td className="a-td-right a-cell-meta">
                            {formatOrderDate(order.createdAt || order.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="a-stack">

          {/* Quick actions */}
          <div className="a-card">
            <div className="a-card-head">
              <h3 className="a-card-title">Quick <em>Actions</em></h3>
            </div>
            <div className="a-card-body">
              <Link href="/admin/products/new" className="a-btn a-btn--primary a-btn--block">
                <Plus size={14} strokeWidth={2.5} /> Add New Product
              </Link>
              <div className="ad-actions-list" style={{ marginTop: 12 }}>
                {ACTIONS.map(a => {
                  const Icon = a.icon
                  return (
                    <Link key={a.href} href={a.href} className="ad-action">
                      <div className="ad-action-ico">
                        <Icon size={15} strokeWidth={1.5} />
                      </div>
                      <span className="ad-action-lbl">{a.label}</span>
                      <ChevronRight size={15} strokeWidth={1.5} className="ad-action-arr" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* System status */}
          <div className="a-card">
            <div className="a-card-head">
              <h3 className="a-card-title">System <em>Status</em></h3>
            </div>
            <div className="a-card-body">
              {SYS.map(s => (
                <div key={s.label} className="ad-sys-row">
                  <span className="ad-sys-lbl">{s.label}</span>
                  <span className="ad-sys-val">
                    <span className={`a-dot a-dot--${s.dot} a-dot--pulse`} />
                    {s.txt}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
