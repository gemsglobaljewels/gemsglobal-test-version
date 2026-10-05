'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
      <div className="min-h-full bg-[var(--admin-bg)] flex flex-col items-center justify-center py-40 gap-6">
        <div className="w-12 h-12 border border-[var(--admin-gold)]/20 border-t-[var(--admin-gold)] rounded-full animate-spin" />
        <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--admin-gold)]/40 animate-pulse font-['Jost',sans-serif]">Loading User Data</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-full bg-[var(--admin-bg)] p-4 md:p-10 font-['Jost',sans-serif]">
        <div className="mb-10">
          <Link href="/admin/users">
            <button className="flex items-center gap-3 text-[var(--admin-gold)]/60 hover:text-[var(--admin-gold)] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Back to Users</span>
            </button>
          </Link>
        </div>
        <div className="max-w-2xl mx-auto p-8 bg-red-500/5 border border-red-500/20 rounded-sm flex flex-col items-center text-center gap-6">
          <AlertCircle size={32} className="text-red-500/40" strokeWidth={1} />
          <div>
            <h2 className="text-lg font-['Cormorant_Garamond',serif] text-red-200 tracking-wide mb-2">User Not Found</h2>
            <p className="text-red-200/40 text-xs font-light tracking-widest uppercase leading-relaxed">{error || 'The requested user profile could not be found.'}</p>
          </div>
          <Link href="/admin/users">
            <button className="px-8 py-3 bg-white/5 border border-white/10 text-white/40 text-[9px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
              Return to List
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[var(--admin-bg)] text-[var(--admin-text)] font-['Jost',sans-serif]">
      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        
        {/* Navigation */}
        <div className="mb-12 flex items-center justify-between">
          <Link href="/admin/users">
            <button className="flex items-center gap-3 text-[var(--admin-gold)]/60 hover:text-[var(--admin-gold)] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-medium">All Users</span>
            </button>
          </Link>
          <div className="flex items-center gap-4 text-right">
             <div className="hidden md:block">
               <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--admin-gold)]/40 mb-1">User ID</div>
               <div className="text-[10px] font-mono text-[var(--admin-text-dim)] uppercase tracking-widest">{profile.id}</div>
             </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-10 mb-16 items-start">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[var(--admin-card)] border border-[var(--admin-gold)]/20 flex items-center justify-center text-[var(--admin-gold)]/20 group-hover:border-[var(--admin-gold)]/40 transition-all duration-500">
              <User size={64} strokeWidth={0.5} />
            </div>
            <div className="absolute inset-0 rounded-full bg-[var(--admin-gold)]/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="flex-1 pt-4">
            <div className="flex items-center gap-3 mb-4 opacity-60">
              <div className="w-6 h-[1px] bg-[var(--admin-gold)]" />
              <span className="text-[8px] uppercase tracking-[0.4em] font-medium text-[var(--admin-gold)]">User Profile</span>
            </div>
            <h1 className="font-['Cormorant_Garamond',serif] text-5xl md:text-6xl font-light tracking-tight text-[#EDE7D8] mb-6">
              {profile.name || profile.email?.split('@')[0] || 'Anonymous'} <em className="italic text-[var(--admin-gold)]">Details</em>
            </h1>
            
            <div className="flex flex-wrap gap-x-10 gap-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--admin-gold)]/40">
                  <Mail size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-[0.3em] text-[var(--admin-gold)]/40 mb-1">Email Address</div>
                  <div className="text-sm font-light tracking-wide">{profile.email || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--admin-gold)]/40">
                  <Phone size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-[0.3em] text-[var(--admin-gold)]/40 mb-1">Phone Number</div>
                  <div className="text-sm font-light tracking-wide">{profile.phone || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--admin-gold)]/40">
                  <User size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-[0.3em] text-[var(--admin-gold)]/40 mb-1">Member Since</div>
                  <div className="text-sm font-light tracking-wide">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Stats Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-sm p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[var(--admin-gold)]/20 to-transparent" />
              <div className="text-[9px] uppercase tracking-[0.4em] text-[var(--admin-gold)]/40 mb-8 font-semibold">User Activity</div>
              <div className="grid grid-cols-1 gap-10">
                <div className="group">
                  <div className="text-4xl font-['Cormorant_Garamond',serif] text-[#EDE7D8] mb-2 group-hover:text-[var(--admin-gold)] transition-colors">{profile.orders?.length || 0}</div>
                  <div className="text-[9px] uppercase tracking-[0.3em] text-[var(--admin-text-dim)] font-light">Total Orders</div>
                </div>
                <div className="group">
                  <div className="text-4xl font-['Cormorant_Garamond',serif] text-[#EDE7D8] mb-2 group-hover:text-[var(--admin-gold)] transition-colors">{profile.wishlistCount ?? 0}</div>
                  <div className="text-[9px] uppercase tracking-[0.3em] text-[var(--admin-text-dim)] font-light">Wishlist Items</div>
                </div>
                <div className="group">
                  <div className="text-4xl font-['Cormorant_Garamond',serif] text-[#EDE7D8] mb-2 group-hover:text-[var(--admin-gold)] transition-colors">{profile.cartItems ?? 0}</div>
                  <div className="text-[9px] uppercase tracking-[0.3em] text-[var(--admin-text-dim)] font-light">Cart Items</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Column */}
          <div className="lg:col-span-3">
            <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-sm overflow-hidden shadow-2xl">
              <div className="px-8 py-6 bg-white/[0.02] border-b border-[var(--admin-border)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--admin-gold)] animate-pulse" />
                  <h2 className="text-[10px] uppercase tracking-[0.4em] font-semibold text-[var(--admin-gold)]/80">Order History</h2>
                </div>
                <span className="text-[9px] text-[var(--admin-text-dim)] font-light uppercase tracking-widest">{profile.orders?.length || 0} Orders</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--admin-border)]">
                      <th className="text-left px-8 py-5 text-[8px] font-semibold uppercase tracking-[0.3em] text-[var(--admin-text-dim)]">Order ID</th>
                      <th className="text-left px-8 py-5 text-[8px] font-semibold uppercase tracking-[0.3em] text-[var(--admin-text-dim)]">Status</th>
                      <th className="text-left px-8 py-5 text-[8px] font-semibold uppercase tracking-[0.3em] text-[var(--admin-text-dim)]">Amount</th>
                      <th className="text-right px-8 py-5 text-[8px] font-semibold uppercase tracking-[0.3em] text-[var(--admin-text-dim)]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border)]">
                    {(profile.orders || []).length ? (
                      profile.orders.map((o) => (
                        <tr key={o.id} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="px-8 py-6">
                            <Link href={`/admin/orders/${o.id}`} className="text-xs font-mono text-[var(--admin-gold)]/60 hover:text-[var(--admin-gold)] transition-colors">
                              #{o.id.slice(0,8).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[var(--admin-text-dim)]">
                              {o.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-medium text-[#EDE7D8]">
                            ₹{o.total.toLocaleString()}
                          </td>
                          <td className="px-8 py-6 text-right text-[10px] text-[var(--admin-text-dim)] font-light">
                            {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-20">
                            <AlertCircle size={24} strokeWidth={1} />
                            <p className="text-[10px] uppercase tracking-[0.3em] font-light">No orders found</p>
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
    </div>
  )
}
