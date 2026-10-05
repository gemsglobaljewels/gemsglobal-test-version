'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Mail, Phone, User, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Order = { id: string; status: string; total: number; createdAt: string }
type Profile = {
  id: string
  email?: string
  name?: string
  phone?: string
  createdAt?: string
  wishlistCount?: number
  cartItems?: number
  orders: Order[]
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const id = (params?.id as string) || ''
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        setLoading(true)
        const res = await fetch(`/api/users/${id}`)
        const data = await res.json()
        if (res.ok) setProfile(data)
        else setError(data?.error || 'Failed to load user')
      } catch { setError('Failed to load user') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="a-page">
        <div className="a-loader-row">
          <span className="a-loader" />
          <span className="a-loader-label">Loading user data</span>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="a-page">
        <Link href="/admin/users" className="a-back">
          <ArrowLeft size={15} />
          <span>Back to Users</span>
        </Link>

        <div className="a-card" style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="a-card-body">
            <div className="a-empty">
              <div className="a-empty-ico">
                <AlertCircle size={26} strokeWidth={1.25} />
              </div>
              <div className="a-empty-title">User <em>Not Found</em></div>
              <p className="a-empty-text">{error || 'The requested user profile could not be found.'}</p>
              <Link href="/admin/users" className="a-btn a-btn--primary" style={{ marginTop: 4 }}>
                Return to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="a-page">

      {/* Navigation */}
      <Link href="/admin/users" className="a-back">
        <ArrowLeft size={15} />
        <span>All Users</span>
      </Link>

      {/* Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">User Profile</div>
          <h1 className="a-title">
            {profile.name || profile.email?.split('@')[0] || 'Anonymous'} <em>Details</em>
          </h1>
          <p className="a-subtitle a-mono">{profile.id}</p>
        </div>
      </div>

      <div className="a-grid-2">

        {/* Main column */}
        <div className="a-stack">

          {/* Profile / contact card */}
          <div className="a-card">
            <div className="a-card-head">
              <div className="a-section-title">Contact Information</div>
            </div>
            <div className="a-card-body">
              <div className="a-form-grid">
                <div className="a-field">
                  <div className="a-label">
                    <span className="a-row" style={{ gap: 8 }}>
                      <Mail size={13} strokeWidth={1.75} /> Email Address
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text)' }}>
                    {profile.email || '—'}
                  </div>
                </div>

                <div className="a-field">
                  <div className="a-label">
                    <span className="a-row" style={{ gap: 8 }}>
                      <Phone size={13} strokeWidth={1.75} /> Phone Number
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text)' }}>
                    {profile.phone || '—'}
                  </div>
                </div>

                <div className="a-field">
                  <div className="a-label">
                    <span className="a-row" style={{ gap: 8 }}>
                      <User size={13} strokeWidth={1.75} /> Member Since
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text)' }}>
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                  </div>
                </div>

                <div className="a-field">
                  <div className="a-label">Display Name</div>
                  <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text)' }}>
                    {profile.name || profile.email?.split('@')[0] || 'Anonymous'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order history card */}
          <div className="a-card">
            <div className="a-card-head">
              <div className="a-section-title">Order History</div>
              <span className="a-badge a-badge--neutral">{profile.orders?.length || 0} Orders</span>
            </div>
            <div className="a-card-body a-card-body--flush">
              <div className="a-table-wrap">
                <div className="a-table-scroll">
                  <table className="a-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th className="a-td-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(profile.orders || []).length ? (
                        profile.orders.map((o) => (
                          <tr key={o.id}>
                            <td>
                              <Link href={`/admin/orders/${o.id}`} className="a-mono" style={{ color: 'var(--c-accent)' }}>
                                #{o.id.slice(0, 8).toUpperCase()}
                              </Link>
                            </td>
                            <td>
                              <span className="a-badge a-badge--info">{o.status}</span>
                            </td>
                            <td>₹{o.total.toLocaleString()}</td>
                            <td className="a-td-right a-muted">
                              {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4}>
                            <div className="a-empty">
                              <div className="a-empty-ico">
                                <AlertCircle size={22} strokeWidth={1} />
                              </div>
                              <div className="a-empty-title">No orders found</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Side column — activity stats */}
        <div className="a-stack">
          <div className="a-card">
            <div className="a-card-head">
              <div className="a-section-title">User Activity</div>
            </div>
            <div className="a-card-body">
              <div className="a-stats" style={{ gridTemplateColumns: '1fr' }}>
                <div className="a-stat">
                  <div className="a-stat-top">
                    <span className="a-stat-label">Total Orders</span>
                  </div>
                  <div className="a-stat-val">{profile.orders?.length || 0}</div>
                </div>
                <div className="a-stat">
                  <div className="a-stat-top">
                    <span className="a-stat-label">Wishlist Items</span>
                  </div>
                  <div className="a-stat-val">{profile.wishlistCount ?? 0}</div>
                </div>
                <div className="a-stat">
                  <div className="a-stat-top">
                    <span className="a-stat-label">Cart Items</span>
                  </div>
                  <div className="a-stat-val">{profile.cartItems ?? 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="a-card">
            <div className="a-card-head">
              <div className="a-section-title">Account Avatar</div>
            </div>
            <div className="a-card-body">
              <div className="a-row" style={{ justifyContent: 'center', padding: '12px 0' }}>
                <div
                  className="a-row"
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '999px',
                    background: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-text-faint)',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <User size={48} strokeWidth={0.75} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
