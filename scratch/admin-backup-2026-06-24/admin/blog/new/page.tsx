'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Loader2, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'

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
    setSaving(true)
    setError('')

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

  const CSS = `
    .bf-root { min-height: 100vh; background: #0a0806; color: #EBE5D8; padding: 40px; font-family: var(--font-main); }
    .bf-container { max-width: 800px; margin: 0 auto; }
    .bf-header { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }
    .bf-back { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.1); color: #D4AF37; border-radius: 50%; text-decoration: none; transition: all 0.2s; }
    .bf-back:hover { background: rgba(212,175,55,0.1); transform: translateX(-4px); }
    .bf-title { font-family: var(--font-heading); font-size: 32px; font-weight: 300; }
    .bf-title em { font-style: italic; color: #D4AF37; }
    .bf-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(212,175,55,0.08); padding: 32px; border-radius: 4px; }
    .bf-group { margin-bottom: 24px; }
    .bf-label { display: block; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(235,229,216,0.4); margin-bottom: 8px; }
    .bf-input, .bf-textarea { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.1); padding: 12px; color: #EBE5D8; font-family: inherit; font-size: 14px; border-radius: 4px; }
    .bf-input:focus, .bf-textarea:focus { outline: none; border-color: rgba(212,175,55,0.3); background: rgba(255,255,255,0.05); }
    .bf-textarea { height: 120px; resize: vertical; }
    .bf-content-area { height: 400px; }
    .bf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .bf-upload-box { width: 100%; height: 200px; border: 2px dashed rgba(212,175,55,0.1); border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden; transition: border-color 0.2s; }
    .bf-upload-box:hover { border-color: rgba(212,175,55,0.3); }
    .bf-preview { width: 100%; height: 100%; object-fit: cover; }
    .bf-remove-img { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); color: #fff; border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .bf-footer { display: flex; justify-content: flex-end; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(212,175,55,0.08); }
    .bf-save-btn { background: #D4AF37; color: #0a0806; padding: 14px 40px; border: none; font-size: 12px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: opacity 0.2s; }
    .bf-save-btn:hover { opacity: 0.9; }
    .bf-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .bf-error { background: rgba(239,68,68,0.1); color: #ef4444; padding: 12px; border-radius: 4px; font-size: 13px; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
    .bf-toggle-wrap { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .bf-checkbox { width: 18px; height: 18px; accent-color: #D4AF37; }
    @media (max-width: 600px) { .bf-grid { grid-template-columns: 1fr; } }
  `

  if (loading) return <div className="bf-root"><div style={{ display:'flex', justifyContent:'center', padding:'100px' }}><Loader2 size={32} className="animate-spin" /></div></div>

  return (
    <div className="bf-root">
      <style>{CSS}</style>
      <div className="bf-container">
        <div className="bf-header">
          <Link href="/admin/blog" className="bf-back"><ArrowLeft size={18} /></Link>
          <h1 className="bf-title">{isEdit ? 'Edit' : 'New'} <em>Article</em></h1>
        </div>

        {error && <div className="bf-error"><AlertCircle size={16} /> {error}</div>}

        <form onSubmit={handleSubmit} className="bf-card">
          <div className="bf-group">
            <label className="bf-label">Title</label>
            <input type="text" name="title" className="bf-input" value={formData.title} onChange={handleChange} required placeholder="Article headline..." />
          </div>

          <div className="bf-grid">
            <div className="bf-group">
              <label className="bf-label">Slug</label>
              <input type="text" name="slug" className="bf-input" value={formData.slug} onChange={handleChange} required placeholder="url-friendly-slug" />
            </div>
            <div className="bf-group">
              <label className="bf-label">Author</label>
              <input type="text" name="author" className="bf-input" value={formData.author} onChange={handleChange} required />
            </div>
          </div>

          <div className="bf-group">
            <label className="bf-label">Featured Image</label>
            <div className="bf-upload-box" onClick={() => document.getElementById('img-input')?.click()}>
              {uploading ? <Loader2 size={24} className="animate-spin" /> : 
               formData.image_url ? (
                 <>
                  <img src={formData.image_url} alt="Preview" className="bf-preview" />
                  <button type="button" className="bf-remove-img" onClick={(e) => { e.stopPropagation(); setFormData(p=>({...p, image_url:''})) }}><X size={14} /></button>
                 </>
               ) : (
                 <>
                  <Upload size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <span style={{ fontSize: 12, opacity: 0.5 }}>Click to upload image</span>
                 </>
               )
              }
              <input type="file" id="img-input" hidden accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          <div className="bf-group">
            <label className="bf-label">Excerpt (Brief summary)</label>
            <textarea name="excerpt" className="bf-textarea" value={formData.excerpt} onChange={handleChange} placeholder="A short intro for the blog list..." />
          </div>

          <div className="bf-group">
            <label className="bf-label">Content (Markdown/HTML supported)</label>
            <textarea name="content" className="bf-textarea bf-content-area" value={formData.content} onChange={handleChange} required placeholder="Write your story here..." />
          </div>

          <div className="bf-grid">
            <div className="bf-group">
              <label className="bf-label">Publish Date</label>
              <input type="date" name="published_at" className="bf-input" value={formData.published_at} onChange={handleChange} />
            </div>
            <div className="bf-group" style={{ display:'flex', alignItems:'flex-end' }}>
              <label className="bf-toggle-wrap">
                <input type="checkbox" name="is_visible" className="bf-checkbox" checked={formData.is_visible} onChange={handleChange} />
                <span className="bf-label" style={{ margin:0 }}>Visible to public</span>
              </label>
            </div>
          </div>

          <div className="bf-footer">
            <button type="submit" className="bf-save-btn" disabled={saving || uploading}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isEdit ? 'Update Article' : 'Publish Article'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
