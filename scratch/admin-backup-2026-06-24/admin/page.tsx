'use client'

import {
  TrendingUp, Package, ShoppingCart, Calendar,
  DollarSign, Users, ArrowUpRight, Plus, ChevronRight,
  Activity, BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const CSS = `

/* ══ ROOT ════════════════════════════════════════════════════════ */
.ad-root {
  min-height: 100vh;
  background: var(--c-bg);
  font-family: var(--font-main);
  padding: 40px 40px 72px;
  color: var(--c-text);
}
@media (max-width: 1023px) { .ad-root { padding: 28px 20px 56px; } }
@media (max-width: 767px)  { .ad-root { padding: 20px 14px 40px; } }

/* ══ PAGE HEADER ═════════════════════════════════════════════════ */
.ad-hdr {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 32px; gap: 20px; flex-wrap: wrap;
}
.ad-hdr-left {}
.ad-hdr-eyebrow {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.ad-hdr-eline { width: 20px; height: .5px; background: var(--c-border); }
.ad-hdr-etag {
  font-size: 8px; font-weight: 400; letter-spacing: .44em; text-transform: uppercase;
  color: var(--c-text-muted);
}
.ad-hdr-title {
  font-family: var(--font-main);
  font-size: 38px; font-weight: 300; letter-spacing: .02em;
  color: var(--c-text); line-height: 1.05;
}
.ad-hdr-title em { font-style: italic; color: var(--c-accent); }
.ad-hdr-sub {
  font-size: 11px; font-weight: 300; letter-spacing: .09em;
  color: var(--c-text-muted); margin-top: 5px;
}
.ad-hdr-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 22px;
  background: var(--c-accent); border: none; cursor: pointer;
  font-family: var(--font-main); font-size: 9px; font-weight: 500;
  letter-spacing: .28em; text-transform: uppercase; color: #fff;
  text-decoration: none; flex-shrink: 0;
  transition: background .22s, box-shadow .22s;
  border-radius: var(--radius);
}
.ad-hdr-btn:hover { background: var(--c-text); box-shadow: var(--shadow-md); }

/* ══ STATS ROW ═══════════════════════════════════════════════════ */
.ad-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin-bottom: 28px;
}
@media (max-width: 1200px) { .ad-stats { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { .ad-stats { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px)  { .ad-stats { grid-template-columns: 1fr; } }

.ad-stat {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  padding: 20px 22px 18px;
  position: relative; overflow: hidden;
  transition: border-color .25s, background .25s;
}
.ad-stat:hover { border-color: rgba(var(--c-accent-rgb), 0.3); background: rgba(var(--c-accent-rgb), 0.05); }
.ad-stat-top {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 14px;
}
.ad-stat-icon-box {
  width: 34px; height: 34px;
  border: 1px solid var(--c-border);
  background: rgba(var(--c-accent-rgb), 0.06);
  display: flex; align-items: center; justify-content: center;
}
.ad-stat-icon { color: var(--c-accent); }
.ad-stat-trend {
  font-size: 9px; font-weight: 300; letter-spacing: .08em;
  color: rgba(74,222,128,.6);
  display: flex; align-items: center; gap: 3px;
}
.ad-stat-label {
  font-size: 9px; font-weight: 400; letter-spacing: .26em; text-transform: uppercase;
  color: var(--c-text-muted); margin-bottom: 6px;
}
.ad-stat-val {
  font-family: var(--font-main);
  font-size: 32px; font-weight: 400; letter-spacing: .04em;
  color: var(--c-text); line-height: 1;
}
.ad-stat-val.skeleton {
  color: var(--c-text-muted);
  animation: adSkel 1.4s ease-in-out infinite;
}
@keyframes adSkel { 0%,100%{opacity:.3} 50%{opacity:.9} }
.ad-stat-sub {
  font-size: 9.5px; font-weight: 300; letter-spacing: .07em;
  color: var(--c-text-muted); margin-top: 4px;
}
/* bottom accent */
.ad-stat::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--c-accent-rgb), 0.0), transparent);
  transition: background .3s;
}
.ad-stat:hover::after {
  background: linear-gradient(90deg, transparent, rgba(var(--c-accent-rgb), 0.3), transparent);
}

/* ══ CONTENT GRID ════════════════════════════════════════════════ */
.ad-content {
  display: grid; grid-template-columns: 1fr 320px;
  gap: 20px;
}
@media (max-width: 1100px) { .ad-content { grid-template-columns: 1fr 280px; } }
@media (max-width: 900px)  { .ad-content { grid-template-columns: 1fr; } }

/* ══ CARD ════════════════════════════════════════════════════════ */
.ad-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  overflow: hidden;
}
.ad-card-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px 14px;
  border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.1);
}
.ad-card-title {
  font-family: var(--font-main);
  font-size: 19px; font-weight: 300; letter-spacing: .04em; color: var(--c-text);
}
.ad-card-title em { font-style: italic; color: var(--c-accent); }
.ad-see-all {
  display: flex; align-items: center; gap: 4px;
  font-size: 8.5px; font-weight: 400; letter-spacing: .2em; text-transform: uppercase;
  color: var(--c-text-muted); text-decoration: none;
  transition: color .2s;
}
.ad-see-all:hover { color: var(--c-accent); }

/* ── Orders table ── */
.ad-orders-list { padding: 4px 0; }
.ad-empty {
  padding: 28px; text-align: center;
  font-size: 10px; font-weight: 300; letter-spacing: .2em; text-transform: uppercase;
  color: var(--c-text-muted);
}

/* table header */
.ad-tbl-hdr {
  display: grid; grid-template-columns: 1fr 90px 80px 70px;
  padding: 8px 22px 6px;
  border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.1);
}
.ad-tbl-hdr span {
  font-size: 7.5px; font-weight: 400; letter-spacing: .32em; text-transform: uppercase;
  color: var(--c-text-muted);
}

.ad-order-row {
  display: grid; grid-template-columns: 1fr 90px 80px 70px;
  align-items: center; gap: 8px;
  padding: 12px 22px;
  border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.08);
  transition: background .2s;
}
.ad-order-row:last-child { border-bottom: none; }
.ad-order-row:hover { background: rgba(var(--c-accent-rgb), 0.04); }

.ad-o-name {
  font-size: 12px; font-weight: 400; letter-spacing: .04em;
  color: var(--c-text);
}
.ad-o-id {
  font-size: 9px; font-weight: 300; letter-spacing: .06em;
  color: var(--c-text-muted); font-family: monospace; margin-top: 2px;
}
.ad-o-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 8px; font-weight: 400; letter-spacing: .15em; text-transform: uppercase;
  padding: 4px 8px; border: 1px solid;
}
.ad-o-completed { color: rgba(74,222,128,.8);  border-color: rgba(74,222,128,.2);  background: rgba(74,222,128,.05); }
.ad-o-processing{ color: rgba(96,165,250,.8);  border-color: rgba(96,165,250,.2);  background: rgba(96,165,250,.05); }
.ad-o-pending   { color: rgba(251,191,36,.8);  border-color: rgba(251,191,36,.2);  background: rgba(251,191,36,.05); }
.ad-o-default   { color: var(--c-text-muted); border-color: var(--c-border); background: transparent; }

.ad-o-amt {
  font-family: var(--font-main);
  font-size: 15px; font-weight: 400; letter-spacing: .04em;
  color: var(--c-text); text-align: right;
}
.ad-o-date {
  font-size: 9px; font-weight: 300; letter-spacing: .06em;
  color: var(--c-text-muted); text-align: right;
}

/* ══ RIGHT COLUMN ════════════════════════════════════════════════ */
.ad-right { display: flex; flex-direction: column; gap: 16px; }

/* actions */
.ad-actions-body { padding: 6px 0 10px; }
.ad-primary-action {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin: 12px 16px 4px;
  padding: 12px;
  background: var(--c-accent); border: none; cursor: pointer;
  font-family: var(--font-main); font-size: 8.5px; font-weight: 500;
  letter-spacing: .26em; text-transform: uppercase; color: #fff;
  text-decoration: none;
  transition: background .22s, box-shadow .22s;
  border-radius: var(--radius);
}
.ad-primary-action:hover { background: var(--c-text); box-shadow: var(--shadow-md); }

.ad-action {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 18px;
  font-size: 10.5px; font-weight: 400; letter-spacing: .12em; text-transform: uppercase;
  color: var(--c-text-muted); text-decoration: none;
  border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.1);
  transition: color .2s, background .2s, padding-left .2s cubic-bezier(.23,1,.32,1);
  position: relative;
}
.ad-action::before {
  content: '';
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 0; height: .5px; background: var(--c-accent);
  transition: width .22s cubic-bezier(.23,1,.32,1);
}
.ad-action:hover { color: var(--c-text); background: rgba(var(--c-accent-rgb), 0.04); padding-left: 24px; }
.ad-action:hover::before { width: 8px; }
.ad-action:last-child { border-bottom: none; }

.ad-action-ico {
  width: 28px; height: 28px; flex-shrink: 0;
  border: 1px solid rgba(var(--c-accent-rgb), 0.15);
  background: rgba(var(--c-accent-rgb), 0.04);
  display: flex; align-items: center; justify-content: center;
  transition: border-color .2s;
}
.ad-action:hover .ad-action-ico { border-color: rgba(var(--c-accent-rgb), 0.3); }
.ad-action-ico svg { color: var(--c-accent); opacity: 0.6; transition: color .2s, opacity .2s; }
.ad-action:hover .ad-action-ico svg { color: var(--c-accent); opacity: 1; }
.ad-action-lbl { flex: 1; }
.ad-action-arr { color: var(--c-text-muted); opacity: 0.3; transition: color .2s, transform .2s, opacity .2s; }
.ad-action:hover .ad-action-arr { color: var(--c-accent); transform: translateX(3px); opacity: 0.6; }

/* system status */
.ad-sys-body { padding: 6px 18px 16px; }
.ad-sys-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.08);
}
.ad-sys-row:last-child { border-bottom: none; }
.ad-sys-lbl {
  font-size: 11px; font-weight: 300; letter-spacing: .07em;
  color: var(--c-text-muted);
}
.ad-sys-val {
  display: flex; align-items: center; gap: 6px;
  font-size: 9px; font-weight: 400; letter-spacing: .16em; text-transform: uppercase;
}
.ad-dot {
  width: 6px; height: 6px; border-radius: 50%;
  animation: adDotPulse 2.5s ease-in-out infinite;
}
.ad-dot-green { background: #4ade80; box-shadow: 0 0 6px rgba(74,222,128,.5); }
.ad-dot-yellow{ background: #fbbf24; box-shadow: 0 0 6px rgba(251,191,36,.5); }
.ad-dot-red   { background: #f87171; box-shadow: 0 0 6px rgba(248,113,113,.5); }
@keyframes adDotPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.ad-ok   { color: rgba(74,222,128,.75); }
.ad-warn { color: rgba(251,191,36,.75); }
.ad-err  { color: rgba(248,113,113,.75); }
`

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
        const oList = Array.isArray(o) ? o : []
        const pList = Array.isArray(p?.products) ? p.products : (Array.isArray(p) ? p : [])
        const pTotal = typeof p?.total === 'number' ? p.total : pList.length
        const aCount = typeof a?.count === 'number' ? a.count : (Array.isArray(a) ? a.length : 0)
        const uList = Array.isArray(u) ? u : []
        const sList = Array.isArray(s) ? s : []

        setRecentOrders(oList.slice(0, 5))

        // Calculate Online Revenue Split
        let revUsd = 0
        let revInr = 0

        oList.forEach((x: any) => {
          const isUsd = String(x.currency).toUpperCase() === 'USD'
          let total = x.total || x.total_price || 0

          if (isUsd) {
            revUsd += total
          } else {
            // HEURISTIC: Fix old INR orders that were stored in USD values (e.g. 12.96 instead of 1000+)
            if (total < 500) {
              total = total * 93.1 // Use standard fallback conversion (matching authStore.ts)
            }
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

  const statusCls = (s: string) => {
    const k = (s || '').toLowerCase()
    if (k === 'completed') return 'ad-o-status ad-o-completed'
    if (k === 'processing') return 'ad-o-status ad-o-processing'
    if (k === 'pending') return 'ad-o-status ad-o-pending'
    return 'ad-o-status ad-o-default'
  }

  const ACTIONS = [
    { href: '/admin/appointments', icon: Calendar, label: 'View Appointments' },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Process Orders' },
    { href: '/admin/site-analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/messaging', icon: Activity, label: 'Messaging' },
  ]

  const SYS = [
    { label: 'Database', dot: 'ad-dot-green', cls: 'ad-ok', txt: 'Connected' },
    { label: 'Stripe', dot: 'ad-dot-green', cls: 'ad-ok', txt: 'Active' },
    { label: 'Email Service', dot: 'ad-dot-green', cls: 'ad-ok', txt: 'Running' },
  ]

  return (
    <div className="ad-root">
      <style>{CSS}</style>

      {/* Header */}
      <div className="ad-hdr">
        <div className="ad-hdr-left">
          <div className="ad-hdr-eyebrow">
            <div className="ad-hdr-eline" />
            <span className="ad-hdr-etag">Admin Panel</span>
          </div>
          <h1 className="ad-hdr-title">Overview <em>Dashboard</em></h1>
          <p className="ad-hdr-sub">Your store at a glance — today.</p>
        </div>
        <Link href="/admin/products/new" className="ad-hdr-btn">
          <Plus size={12} strokeWidth={2.5} /> New Product
        </Link>
      </div>

      {/* Stats */}
      <div className="ad-stats">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="ad-stat">
              <div className="ad-stat-top">
                <div className="ad-stat-icon-box">
                  <Icon size={14} strokeWidth={1.5} className="ad-stat-icon" />
                </div>
              </div>
              <div className="ad-stat-label">{s.label}</div>
              <div className={`ad-stat-val${!loaded ? ' skeleton' : ''}`}>{s.value}</div>
              <div className="ad-stat-sub">{s.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="ad-content">

        {/* Orders */}
        <div className="ad-card">
          <div className="ad-card-hdr">
            <h2 className="ad-card-title">Recent <em>Orders</em></h2>
            <Link href="/admin/orders" className="ad-see-all">
              View all <ArrowUpRight size={11} strokeWidth={1.5} />
            </Link>
          </div>
          <div className="ad-tbl-hdr">
            <span>Customer</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
            <span style={{ textAlign: 'right' }}>Date</span>
          </div>
          <div className="ad-orders-list">
            {!loaded && <div className="ad-empty">Loading…</div>}
            {loaded && recentOrders.length === 0 && <div className="ad-empty">No orders yet</div>}
            {recentOrders.map(order => (
              <div key={order.id} className="ad-order-row">
                <div>
                  <div className="ad-o-name">{order.customerName}</div>
                  <div className="ad-o-id">{String(order.id).slice(0, 12)}…</div>
                </div>
                <span className={statusCls(order.status)}>
                  {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : '—'}
                </span>
                <div className="ad-o-amt">
                  {(() => {
                    const isUsd = order.currency === 'USD'
                    const symbol = isUsd ? '$' : '₹'
                    let total = Number(order.total || order.total_price || 0)

                    // HEURISTIC: Fix old INR orders that were stored in USD values (e.g. 12.96 instead of 1000+)
                    // If currency is INR and total is < 500, it's almost certainly an old order in USD.
                    if (!isUsd && total < 500) {
                      total = total * 93.1 // Use standard fallback conversion (matching authStore.ts)
                    }

                    return `${symbol}${total.toLocaleString(isUsd ? 'en-US' : 'en-IN', {
                      minimumFractionDigits: isUsd ? 2 : 0,
                      maximumFractionDigits: isUsd ? 2 : 0
                    })}`
                  })()}
                </div>
                <div className="ad-o-date">{order.createdAt || order.created_at ? String(order.createdAt || order.created_at).slice(0, 10) : '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="ad-right">

          {/* Quick actions */}
          <div className="ad-card">
            <div className="ad-card-hdr">
              <h3 className="ad-card-title">Quick <em>Actions</em></h3>
            </div>
            <div className="ad-actions-body">
              <Link href="/admin/products/new" className="ad-primary-action">
                <Plus size={11} strokeWidth={2.5} /> Add New Product
              </Link>
              {ACTIONS.map(a => {
                const Icon = a.icon
                return (
                  <Link key={a.href} href={a.href} className="ad-action">
                    <div className="ad-action-ico">
                      <Icon size={12} strokeWidth={1.5} />
                    </div>
                    <span className="ad-action-lbl">{a.label}</span>
                    <ChevronRight size={11} strokeWidth={1.5} className="ad-action-arr" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* System status */}
          <div className="ad-card">
            <div className="ad-card-hdr">
              <h3 className="ad-card-title">System <em>Status</em></h3>
            </div>
            <div className="ad-sys-body">
              {SYS.map(s => (
                <div key={s.label} className="ad-sys-row">
                  <span className="ad-sys-lbl">{s.label}</span>
                  <span className={`ad-sys-val ${s.cls}`}>
                    <span className={`ad-dot ${s.dot}`} />
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