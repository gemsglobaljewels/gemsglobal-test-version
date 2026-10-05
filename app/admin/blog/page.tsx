'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, AlertCircle, Eye, EyeOff, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Blog {
  id: string
  title: string
  slug: string
  author: string
  is_visible: boolean
  published_at: string
  created_at: string
}

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/blog?admin=true')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBlogs(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !current })
      })
      if (res.ok) fetchBlogs()
    } catch (err) {
      console.error('Failed to toggle visibility', err)
    }
  }

  const deleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return
    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' })
      if (res.ok) fetchBlogs()
    } catch (err) {
      console.error('Failed to delete blog', err)
    }
  }

  const filtered = blogs.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="a-page">
      <header className="a-head">
        <div>
          <div className="a-eyebrow">Editorial</div>
          <h1 className="a-title">Manage <em>Blogs</em></h1>
          <p className="a-subtitle">Curate, publish and refine your stories.</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/blog/new" className="a-btn a-btn--primary">
            <Plus size={16} /> New Article
          </Link>
        </div>
      </header>

      {error && (
        <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-danger)' }}>
          <div className="a-card-body a-row" style={{ gap: 10, color: 'var(--c-danger)' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="a-toolbar">
        <div className="a-toolbar-group">
          <div className="a-search">
            <Search size={16} className="a-search-ico" />
            <input
              type="text"
              className="a-search-input"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="a-table-wrap">
        <div className="a-table-scroll">
          {loading ? (
            <div className="a-loader-row">
              <Loader2 size={20} className="a-loader animate-spin" />
              <span className="a-loader-label">Loading articles…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="a-empty">
              <div className="a-empty-ico"><Search size={26} /></div>
              <div className="a-empty-title">No blogs found</div>
              <div className="a-empty-text">Create your first article to get started.</div>
            </div>
          ) : (
            <table className="a-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th className="a-td-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(blog => (
                  <tr key={blog.id}>
                    <td>
                      <div className="a-cell-name">{blog.title}</div>
                      <div className="a-row" style={{ gap: 8, marginTop: 4 }}>
                        <span className="a-cell-meta a-mono">/{blog.slug}</span>
                        <Link
                          href={`/blog/${blog.slug}`}
                          target="_blank"
                          className="a-cell-meta"
                          style={{ color: 'var(--c-accent)', textDecoration: 'underline' }}
                        >
                          View Live
                        </Link>
                      </div>
                    </td>
                    <td>{blog.author}</td>
                    <td>
                      <span className={`a-badge ${blog.is_visible ? 'a-badge--success' : 'a-badge--danger'}`}>
                        {blog.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td>{new Date(blog.published_at).toLocaleDateString()}</td>
                    <td>
                      <div className="a-cell-actions">
                        <button
                          className="a-icon-btn"
                          title={blog.is_visible ? 'Hide' : 'Show'}
                          onClick={() => toggleVisibility(blog.id, blog.is_visible)}
                        >
                          {blog.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <Link href={`/admin/blog/${blog.id}/edit`} className="a-icon-btn" title="Edit">
                          <Edit2 size={15} />
                        </Link>
                        <button
                          className="a-icon-btn a-icon-btn--danger"
                          title="Delete"
                          onClick={() => deleteBlog(blog.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
