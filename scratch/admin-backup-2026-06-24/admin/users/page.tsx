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

  const CSS = `
    .au-root { min-height: 100vh; background: var(--c-bg); color: var(--c-text); padding: 40px; font-family: var(--font-main); }
    .au-container { max-width: 1200px; margin: 0 auto; }
    .au-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 20px; }
    .au-header-text h1 { font-family: var(--font-main); font-size: 32px; font-weight: 300; margin-bottom: 8px; }
    .au-header-text h1 em { font-style: italic; color: var(--c-accent); }
    .au-header-text p { color: var(--c-text-muted); font-size: 14px; }
    .au-search-wrap { position: relative; width: 360px; }
    .au-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--c-accent); }
    .au-search-input { width: 100%; background: #fff; border: 1px solid var(--c-border); padding: 12px 16px 12px 48px; color: var(--c-text); font-size: 14px; border-radius: var(--radius); outline: none; transition: border-color 0.2s; }
    .au-search-input:focus { border-color: var(--c-accent); }
    .au-table-wrap { background: #fff; border: 1px solid var(--c-border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-md); }
    .au-table { width: 100%; border-collapse: collapse; }
    .au-table thead { background: var(--c-surface); }
    .au-table th { padding: 16px 24px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--c-accent); border-bottom: 1px solid var(--c-border); }
    .au-table td { padding: 16px 24px; font-size: 14px; border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.06); vertical-align: middle; }
    .au-table tr:hover { background: var(--c-surface); }
    .au-user-cell { display: flex; align-items: center; gap: 12px; }
    .au-user-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(var(--c-accent-rgb), 0.1); display: flex; align-items: center; justify-content: center; color: var(--c-accent); }
    .au-user-name { font-weight: 500; }
    .au-user-id { font-size: 12px; color: var(--c-text-muted); margin-top: 2px; }
    .au-contact-item { display: flex; align-items: center; gap: 8px; color: var(--c-text); font-size: 14px; }
    .au-contact-icon { color: var(--c-text-muted); }
    .au-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
    .au-view-btn { padding: 8px 16px; border: 1px solid var(--c-border); color: var(--c-accent); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; border-radius: var(--radius); text-decoration: none; transition: all 0.2s; }
    .au-view-btn:hover { background: var(--c-surface); border-color: var(--c-accent); }
    .au-delete-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--c-border); background: #fff; color: var(--c-text); cursor: pointer; border-radius: var(--radius); transition: all 0.2s; }
    .au-delete-btn:hover { border-color: #EF4444; color: #EF4444; }
    .au-pagination { padding: 20px 24px; border-top: 1px solid var(--c-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .au-pagination-text { color: var(--c-text-muted); font-size: 14px; }
    .au-pagination-buttons { display: flex; gap: 8px; }
    .au-page-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--c-border); background: #fff; color: var(--c-text); cursor: pointer; border-radius: var(--radius); transition: all 0.2s; }
    .au-page-btn:hover:not(:disabled) { border-color: var(--c-accent); color: var(--c-accent); }
    .au-page-btn.active { background: var(--c-text); color: #fff; border-color: var(--c-text); }
    .au-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .au-empty { padding: 80px; text-align: center; color: var(--c-text-muted); }
  `

  return (
    <div className="au-root">
      <style>{CSS}</style>
      <div className="au-container">
        <div className="au-header">
          <div className="au-header-text">
            <h1>Registered <em>Users</em></h1>
            <p>Manage your jewelry store customers</p>
          </div>
          <div className="au-search-wrap">
            <Search className="au-search-icon" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="au-search-input"
            />
          </div>
        </div>

        <div className="au-table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="au-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '80px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--c-accent)' }} />
                        <span style={{ color: 'var(--c-text-muted)' }}>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '80px 20px' }}>
                      <span className="au-empty">No users found</span>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[var(--c-surface)] transition-colors">
                      <td>
                        <div className="au-user-cell">
                          <div className="au-user-avatar">
                            <User size={18} />
                          </div>
                          <div>
                            <div className="au-user-name">{user.name || 'Anonymous'}</div>
                            <div className="au-user-id">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div className="au-contact-item">
                            <Mail className="au-contact-icon" size={14} />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="au-contact-item">
                              <Phone className="au-contact-icon" size={14} />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-text-muted)' }}>
                          <Calendar size={14} />
                          {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div className="au-actions">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="au-view-btn"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => handleDelete(user.id, user.email)}
                            disabled={deletingId === user.id}
                            className="au-delete-btn"
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
            <div className="au-pagination">
              <div className="au-pagination-text">
                Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> users
              </div>
              <div className="au-pagination-buttons">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="au-page-btn"
                >
                  <ChevronLeft size={16} />
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`au-page-btn ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="au-page-btn"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
