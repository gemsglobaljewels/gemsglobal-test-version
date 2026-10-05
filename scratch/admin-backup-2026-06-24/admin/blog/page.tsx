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

  const CSS = `
    .ab-root { min-height: 100vh; background: var(--c-bg); color: var(--c-text); padding: 40px; font-family: var(--font-main); }
    .ab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; }
    .ab-title { font-family: var(--font-main); font-size: 32px; font-weight: 300; }
    .ab-title em { font-style: italic; color: var(--c-accent); }
    .ab-add-btn { background: var(--c-accent); color: #fff; padding: 12px 24px; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; border-radius: var(--radius); transition: all 0.2s; }
    .ab-add-btn:hover { background: var(--c-text); transform: translateY(-1px); }
    .ab-controls { display: flex; gap: 16px; margin-bottom: 24px; }
    .ab-search-wrap { position: relative; flex: 1; max-width: 400px; }
    .ab-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--c-accent); }
    .ab-search-input { width: 100%; background: #fff; border: 1px solid var(--c-border); padding: 10px 12px 10px 40px; color: var(--c-text); font-family: var(--font-main); font-size: 14px; border-radius: var(--radius); outline: none; transition: border-color 0.2s; }
    .ab-search-input:focus { border-color: var(--c-accent); }
    .ab-table-wrap { background: #fff; border: 1px solid var(--c-border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-md); }
    .ab-table { width: 100%; border-collapse: collapse; text-align: left; }
    .ab-table th { padding: 20px 24px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--c-accent); border-bottom: 1px solid var(--c-border); background: var(--c-surface); }
    .ab-table td { padding: 16px 24px; font-size: 14px; border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.06); vertical-align: middle; }
    .ab-table tr:hover { background: var(--c-surface); }
    .ab-blog-title { font-weight: 500; color: var(--c-text); display: block; margin-bottom: 4px; }
    .ab-blog-meta { font-size: 12px; color: var(--c-text-muted); }
    .ab-status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 100px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
    .ab-status.visible { background: #ECFDF5; color: #059669; }
    .ab-status.hidden { background: #FEF2F2; color: #DC2626; }
    .ab-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .ab-action-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid var(--c-border); color: var(--c-text); cursor: pointer; transition: all 0.2s; border-radius: var(--radius); }
    .ab-action-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }
    .ab-action-btn.delete:hover { border-color: #EF4444; color: #EF4444; }
    .ab-empty { padding: 80px; text-align: center; color: var(--c-text-muted); }
  `

  return (
    <div className="ab-root">
      <style>{CSS}</style>

      <div className="ab-header">
        <h1 className="ab-title">Manage <em>Blogs</em></h1>
        <Link href="/admin/blog/new" className="ab-add-btn">
          <Plus size={16} /> New Article
        </Link>
      </div>

      <div className="ab-controls">
        <div className="ab-search-wrap">
          <Search size={16} className="ab-search-icon" />
          <input
            type="text"
            className="ab-search-input"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ab-table-wrap">
        {loading ? (
          <div className="ab-empty"><Loader2 size={24} className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="ab-empty">No blogs found. Create your first one!</div>
        ) : (
          <table className="ab-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Author</th>
                <th>Status</th>
                <th>Published</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(blog => (
                <tr key={blog.id}>
                  <td>
                    <span className="ab-blog-title">{blog.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="ab-blog-meta">/{blog.slug}</span>
                      <Link href={`/blog/${blog.slug}`} target="_blank" className="ab-blog-meta" style={{ color: 'var(--c-accent)', textDecoration: 'underline' }}>View Live</Link>
                    </div>
                  </td>
                  <td>{blog.author}</td>
                  <td>
                    <span className={`ab-status ${blog.is_visible ? 'visible' : 'hidden'}`}>
                      {blog.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td>{new Date(blog.published_at).toLocaleDateString()}</td>
                  <td>
                    <div className="ab-actions">
                      <button
                        className="ab-action-btn"
                        title={blog.is_visible ? 'Hide' : 'Show'}
                        onClick={() => toggleVisibility(blog.id, blog.is_visible)}
                      >
                        {blog.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <Link href={`/admin/blog/${blog.id}/edit`} className="ab-action-btn" title="Edit">
                        <Edit2 size={14} />
                      </Link>
                      <button
                        className="ab-action-btn delete"
                        title="Delete"
                        onClick={() => deleteBlog(blog.id)}
                      >
                        <Trash2 size={14} />
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
  )
}
