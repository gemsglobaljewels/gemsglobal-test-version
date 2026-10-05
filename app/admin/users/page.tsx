'use client'

import { useState, useEffect } from 'react'
import { Search, User, Mail, Phone, Calendar, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface UserItem {
  id: string
  email: string
  name: string
  phone: string
  createdAt: string
  kind: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (Array.isArray(data)) {
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== id))
        alert('User deleted successfully')
      } else {
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      alert('Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredUsers = users.filter(user => {
    const s = searchTerm.toLowerCase()
    return (
      String(user.email || '').toLowerCase().includes(s) ||
      String(user.name || '').toLowerCase().includes(s) ||
      String(user.phone || '').toLowerCase().includes(s)
    )
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <div className="a-page">
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Customers</div>
          <h1 className="a-title">Registered <em>Users</em></h1>
          <p className="a-subtitle">Manage your jewelry store customers</p>
        </div>
      </div>

      <div className="a-toolbar">
        <div className="a-toolbar-group">
          <div className="a-search">
            <Search className="a-search-ico" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="a-search-input"
            />
          </div>
        </div>
      </div>

      <div className="a-table-wrap">
        <div className="a-table-scroll">
          <table className="a-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Joined</th>
                <th className="a-td-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>
                    <div className="a-loader-row">
                      <Loader2 size={20} className="a-loader animate-spin" />
                      <span className="a-loader-label">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="a-empty">
                      <div className="a-empty-ico"><User size={22} /></div>
                      <div className="a-empty-title">No users found</div>
                      <div className="a-empty-text">No customers match your search criteria.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="a-cell-lead">
                        <div className="a-media" style={{ borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div className="a-cell-name">{user.name || 'Anonymous'}</div>
                          <div className="a-cell-meta a-mono">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="a-stack" style={{ gap: '4px' }}>
                        <div className="a-row" style={{ gap: '8px' }}>
                          <Mail size={14} style={{ color: 'var(--c-text-faint)', flexShrink: 0 }} />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="a-row" style={{ gap: '8px' }}>
                            <Phone size={14} style={{ color: 'var(--c-text-faint)', flexShrink: 0 }} />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="a-row" style={{ gap: '8px', color: 'var(--c-text-muted)' }}>
                        <Calendar size={14} style={{ flexShrink: 0 }} />
                        <span>{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td>
                      <div className="a-cell-actions">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="a-btn a-btn--ghost a-btn--sm"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          disabled={deletingId === user.id}
                          className="a-icon-btn a-icon-btn--danger a-icon-btn--sm"
                          title="Delete User"
                        >
                          {deletingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="a-pager">
            <div className="a-muted">
              Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> users
            </div>
            <div className="a-row" style={{ gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="a-pager-btn"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`a-pager-btn ${currentPage === page ? 'is-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="a-pager-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
