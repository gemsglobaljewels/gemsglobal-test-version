'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Loader2, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'

export default function BlogFormPage({ params }: { params?: { id: string } }) {
  const router = useRouter()
  const isEdit = !!params?.id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    image_url: '',
    author: 'Admin',
    is_visible: true,
    published_at: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/blog/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error)
          setFormData({
            title: data.title || '',
            slug: data.slug || '',
            content: data.content || '',
            excerpt: data.excerpt || '',
            image_url: data.image_url || '',
            author: data.author || 'Admin',
            is_visible: data.is_visible ?? true,
            published_at: data.published_at ? new Date(data.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          })
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [isEdit, params?.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any
    const val = type === 'checkbox' ? (e.target as any).checked : value

    setFormData(prev => {
      const newData = { ...prev, [name]: val }
      if (name === 'title' && !isEdit) {
        newData.slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }
      return newData
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/storage/upload-blog-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setFormData(prev => ({ ...prev, image_url: data.url }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.content || !formData.content.trim()) {
      setError('Please add some content to the article.')
      return
    }

    setSaving(true)

    try {
      const url = isEdit ? `/api/blog/${params.id}` : '/api/blog'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push('/admin/blog')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="a-page">
      <div className="a-loader-row">
        <span className="a-loader" />
        <span className="a-loader-label">Loading article…</span>
      </div>
    </div>
  )

  return (
    <div className="a-page">
      <style>{`
        .bf-upload-box { width: 240px; max-width: 100%; aspect-ratio: 1 / 1; border: 1px dashed var(--c-border-strong); background: var(--c-surface); border-radius: var(--radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden; transition: border-color .2s, background .2s; color: var(--c-text-muted); gap: 8px; }
        .bf-upload-box:hover { border-color: var(--c-accent); background: var(--c-surface-2); }
        .bf-preview { width: 100%; height: 100%; object-fit: cover; }
        .bf-remove-img { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,.55); color: #fff; border: none; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .2s; }
        .bf-remove-img:hover { background: var(--c-text); }
        .bf-upload-hint { font-size: 12px; color: var(--c-text-faint); font-family: var(--font-dmsans); }
        .bf-content-area { min-height: 360px; resize: vertical; }
      `}</style>

      <Link href="/admin/blog" className="a-back"><ArrowLeft size={16} /> Back to articles</Link>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">{isEdit ? 'Edit article' : 'New article'}</div>
          <h1 className="a-title">{isEdit ? 'Edit' : 'New'} <em>Article</em></h1>
          <p className="a-subtitle">Compose, format and publish a journal entry for the storefront.</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/blog" className="a-btn a-btn--ghost">Cancel</Link>
          <button type="submit" form="blog-form" className="a-btn a-btn--primary" disabled={saving || uploading}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isEdit ? 'Update Article' : 'Publish Article'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="a-badge a-badge--danger" style={{ marginBottom: 20, gap: 8, padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <form id="blog-form" onSubmit={handleSubmit} className="a-card">
        <div className="a-card-head">
          <h2 className="a-card-title">Article <em>Details</em></h2>
          <p className="a-card-sub">All fields marked with an asterisk are required.</p>
        </div>

        <div className="a-card-body">
          <div className="a-form-grid">
            <div className="a-field a-col-span-2">
              <label className="a-label">Title <span className="a-req">*</span></label>
              <input type="text" name="title" className="a-input" value={formData.title} onChange={handleChange} required placeholder="Article headline..." />
            </div>

            <div className="a-field">
              <label className="a-label">Slug <span className="a-req">*</span></label>
              <input type="text" name="slug" className="a-input" value={formData.slug} onChange={handleChange} required placeholder="url-friendly-slug" />
            </div>

            <div className="a-field">
              <label className="a-label">Author <span className="a-req">*</span></label>
              <input type="text" name="author" className="a-input" value={formData.author} onChange={handleChange} required />
            </div>

            <div className="a-field a-col-span-2">
              <label className="a-label">Featured Image</label>
              <div className="bf-upload-box" onClick={() => document.getElementById('img-input')?.click()}>
                {uploading ? <Loader2 size={24} className="animate-spin" /> :
                 formData.image_url ? (
                   <>
                    <img src={formData.image_url} alt="Preview" className="bf-preview" />
                    <button type="button" className="bf-remove-img" onClick={(e) => { e.stopPropagation(); setFormData(p=>({...p, image_url:''})) }}><X size={14} /></button>
                   </>
                 ) : (
                   <>
                    <Upload size={24} style={{ opacity: 0.5 }} />
                    <span className="bf-upload-hint">Click to upload image</span>
                   </>
                 )
                }
                <input type="file" id="img-input" hidden accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>

            <div className="a-field a-col-span-2">
              <label className="a-label">Excerpt</label>
              <textarea name="excerpt" className="a-textarea" value={formData.excerpt} onChange={handleChange} placeholder="A short intro for the blog list..." />
              <span className="a-hint">A brief summary shown on the journal list.</span>
            </div>

            <div className="a-field a-col-span-2">
              <label className="a-label">Content <span className="a-req">*</span></label>
              <RichTextEditor
                value={formData.content}
                onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
                placeholder="Write your story here — use the toolbar to add headings, bold, lists, quotes and links…"
              />
              <span className="a-hint">Format the article exactly how it should appear on the blog — headings, bold, lists, quotes and links are all supported.</span>
            </div>

            <div className="a-field">
              <label className="a-label">Publish Date</label>
              <input type="date" name="published_at" className="a-input" value={formData.published_at} onChange={handleChange} />
            </div>

            <div className="a-field">
              <label className="a-label">Visibility</label>
              <label className="a-row" style={{ gap: 12, cursor: 'pointer' }}>
                <span className="a-switch">
                  <input type="checkbox" name="is_visible" checked={formData.is_visible} onChange={handleChange} />
                  <span className="a-switch-slider" />
                </span>
                <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text)' }}>Visible to public</span>
              </label>
            </div>
          </div>
        </div>

        <div className="a-card-foot" style={{ justifyContent: 'flex-end' }}>
          <Link href="/admin/blog" className="a-btn a-btn--ghost">Cancel</Link>
          <button type="submit" className="a-btn a-btn--primary" disabled={saving || uploading}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isEdit ? 'Update Article' : 'Publish Article'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
