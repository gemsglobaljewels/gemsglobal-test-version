'use client'

import { useState, useEffect } from 'react'
import {
  AlertCircle, Save, Video, Image as ImageIcon, Sparkles,
  Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Film, Type, Link, ImagePlay
} from 'lucide-react'

const CSS = `
.hero-media-row {
  display: flex;
  align-items: center;
  gap: 18px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-surface);
  padding: 16px;
}
.hero-media-thumb {
  width: 76px;
  height: 76px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  flex-shrink: 0;
  background: #fff;
}
.hero-media-thumb--video {
  width: 130px;
  height: 76px;
}
.hero-media-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text-faint);
}
.hero-media-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hero-grip {
  color: var(--c-text-faint);
  flex-shrink: 0;
  cursor: grab;
}
@media (max-width: 640px) {
  .hero-media-row { flex-direction: column; align-items: stretch; }
  .hero-media-thumb, .hero-media-thumb--video { width: 100%; }
}
`

interface Slide {
  type: 'image' | 'video'
  src: string
  poster?: string
  tag?: string
  kicker?: string
  line1?: string
  line2?: string
  accent?: string
  cta_text?: string
  cta_link?: string
  meta?: string
}

interface HeroData {
  slides: Slide[]
}

const EMPTY_SLIDE: Slide = {
  type: 'image',
  src: '',
  poster: '',
}

export default function AdminHeroPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)
  const [data, setData] = useState<HeroData>({ slides: [] })

  useEffect(() => {
    fetch('/api/admin/hero')
      .then(r => r.json())
      .then(d => {
        if (!d.error) setData({ slides: d.slides || [] })
      })
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        showToast('Hero section updated')
        fetch('/api/admin/hero').then(r => r.json()).then(d => { if (!d.error) setData({ slides: d.slides || [] }) })
      } else throw new Error('Failed to update')
    } catch (e: any) {
      showToast(e.message, true)
    } finally { setSaving(false) }
  }

  const updateSlide = (idx: number, key: keyof Slide, value: string) => {
    setData(p => {
      const slides = [...p.slides]
      slides[idx] = { ...slides[idx], [key]: value }
      return { ...p, slides }
    })
  }

  const addSlide = () => {
    setData(p => ({ ...p, slides: [...p.slides, { ...EMPTY_SLIDE }] }))
  }

  const removeSlide = (idx: number) => {
    setData(p => ({ ...p, slides: p.slides.filter((_, i) => i !== idx) }))
  }

  const moveSlide = (idx: number, dir: -1 | 1) => {
    setData(p => {
      const slides = [...p.slides]
      const target = idx + dir
      if (target < 0 || target >= slides.length) return p
        ;[slides[idx], slides[target]] = [slides[target], slides[idx]]
      return { ...p, slides }
    })
  }

  const handleUpload = async (idx: number, key: 'src' | 'poster', file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    showToast('Uploading asset...')
    try {
      const res = await fetch('/api/storage/upload-hero', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) {
        updateSlide(idx, key, d.url)
        showToast('Asset uploaded successfully')
      } else throw new Error(d.error || 'Upload failed')
    } catch (e: any) {
      showToast(e.message || 'Upload failed', true)
    }
  }

  if (loading) return null

  return (
    <div className="a-page">
      <style>{CSS}</style>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Homepage</div>
          <h1 className="a-title">Hero <em>Slides</em></h1>
          <p className="a-subtitle">{data.slides.length} slide{data.slides.length !== 1 ? 's' : ''} in rotation</p>
        </div>
        <div className="a-head-actions">
          <button className="a-btn a-btn--ghost" onClick={addSlide}>
            <Plus size={14} /> Add Slide
          </button>
          <button className="a-btn a-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Updating...' : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`a-badge ${toast.err ? 'a-badge--danger' : 'a-badge--accent'}`} style={{ marginBottom: 20 }}>
          {toast.err ? <AlertCircle size={14} /> : <Sparkles size={14} />}
          {toast.msg}
        </div>
      )}

      {data.slides.length === 0 ? (
        <div className="a-empty">
          <div className="a-empty-ico"><Sparkles size={22} /></div>
          <div className="a-empty-title">No slides yet</div>
          <p className="a-empty-text">Add your first slide to populate the hero.</p>
          <button className="a-btn a-btn--primary" onClick={addSlide} style={{ marginTop: 16 }}>
            <Plus size={14} /> Add Slide
          </button>
        </div>
      ) : (
        <div className="a-stack">
          {data.slides.map((slide, idx) => (
            <div className="a-card" key={idx}>
              <div className="a-card-head">
                <div className="a-row" style={{ gap: 12, alignItems: 'center', minWidth: 0 }}>
                  <GripVertical size={16} className="hero-grip" />
                  <span className="a-stat-ico">
                    {slide.type === 'video' ? <Video size={16} strokeWidth={1.5} /> : <ImageIcon size={16} strokeWidth={1.5} />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="a-card-title">
                      Slide {idx + 1}{slide.line2 ? <>: <em>{slide.line2}</em></> : null}
                    </div>
                    <div className="a-card-sub">{slide.kicker || 'Untitled'} {slide.tag ? `· ${slide.tag}` : ''}</div>
                  </div>
                </div>
                <div className="a-cell-actions">
                  <button className="a-icon-btn" onClick={() => moveSlide(idx, -1)} disabled={idx === 0} aria-label="Move up">
                    <ChevronUp size={14} />
                  </button>
                  <button className="a-icon-btn" onClick={() => moveSlide(idx, 1)} disabled={idx === data.slides.length - 1} aria-label="Move down">
                    <ChevronDown size={14} />
                  </button>
                  <button className="a-icon-btn a-icon-btn--danger" onClick={() => removeSlide(idx)} aria-label="Delete slide">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="a-card-body">

                {/* Media Section */}
                <div className="a-section-title"><ImagePlay size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} /> Media</div>

                <div className="a-segmented" style={{ marginBottom: 20 }}>
                  <button
                    className={slide.type === 'image' ? 'is-active' : ''}
                    onClick={() => updateSlide(idx, 'type', 'image')}
                  >
                    <ImageIcon size={13} /> Image
                  </button>
                  <button
                    className={slide.type === 'video' ? 'is-active' : ''}
                    onClick={() => updateSlide(idx, 'type', 'video')}
                  >
                    <Film size={13} /> Video
                  </button>
                </div>

                <div className="a-field">
                  <label className="a-label">{slide.type === 'video' ? 'Background Video' : 'Background Image'}</label>
                  <div className="hero-media-row">
                    {slide.src ? (
                      slide.type === 'video' ? (
                        <video src={slide.src} className="hero-media-thumb hero-media-thumb--video" muted loop autoPlay />
                      ) : (
                        <img src={slide.src} className="hero-media-thumb" alt="" />
                      )
                    ) : (
                      <div className={slide.type === 'video' ? 'hero-media-thumb hero-media-thumb--video hero-media-thumb--empty' : 'hero-media-thumb hero-media-thumb--empty'}>
                        {slide.type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />}
                      </div>
                    )}
                    <div className="hero-media-body">
                      <input
                        className="a-input"
                        value={slide.src}
                        onChange={e => updateSlide(idx, 'src', e.target.value)}
                        placeholder={slide.type === 'video' ? 'MP4 URL' : 'Image URL'}
                      />
                      <input
                        type="file"
                        id={`src_up_${idx}`}
                        hidden
                        accept={slide.type === 'video' ? 'video/mp4' : 'image/*'}
                        onChange={e => e.target.files?.[0] && handleUpload(idx, 'src', e.target.files[0])}
                      />
                      <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById(`src_up_${idx}`)?.click()}>
                        Upload {slide.type === 'video' ? 'Video' : 'Image'}
                      </button>
                    </div>
                  </div>
                </div>

                {slide.type === 'video' && (
                  <div className="a-field">
                    <label className="a-label">Poster Image (fallback frame)</label>
                    <div className="hero-media-row">
                      {slide.poster ? (
                        <img src={slide.poster} className="hero-media-thumb" alt="" />
                      ) : (
                        <div className="hero-media-thumb hero-media-thumb--empty"><ImageIcon size={20} /></div>
                      )}
                      <div className="hero-media-body">
                        <input
                          className="a-input"
                          value={slide.poster || ''}
                          onChange={e => updateSlide(idx, 'poster', e.target.value)}
                          placeholder="Poster image URL"
                        />
                        <input
                          type="file"
                          id={`poster_up_${idx}`}
                          hidden
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleUpload(idx, 'poster', e.target.files[0])}
                        />
                        <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById(`poster_up_${idx}`)?.click()}>
                          Upload Poster
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <hr className="a-divider" />

                {/* Text Content Section */}
                <div className="a-section-title"><Type size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} /> Text Content</div>

                <div className="a-form-grid">
                  <div className="a-field">
                    <label className="a-label">Kicker</label>
                    <input className="a-input" value={slide.kicker} onChange={e => updateSlide(idx, 'kicker', e.target.value)} placeholder="The Atelier" />
                  </div>
                  <div className="a-field">
                    <label className="a-label">Tag</label>
                    <input className="a-input" value={slide.tag} onChange={e => updateSlide(idx, 'tag', e.target.value)} placeholder="New Arrivals" />
                  </div>

                  <div className="a-field a-col-span-2">
                    <label className="a-label">Headline Line 1 (small)</label>
                    <input className="a-input" value={slide.line1} onChange={e => updateSlide(idx, 'line1', e.target.value)} placeholder="Crafted In" />
                  </div>

                  <div className="a-field a-col-span-2">
                    <label className="a-label">Headline Line 2 (large)</label>
                    <input className="a-input" value={slide.line2} onChange={e => updateSlide(idx, 'line2', e.target.value)} placeholder="Light" />
                  </div>

                  <div className="a-field a-col-span-2">
                    <label className="a-label">Accent Word (italic gold)</label>
                    <input className="a-input" value={slide.accent} onChange={e => updateSlide(idx, 'accent', e.target.value)} placeholder="Eternity" />
                  </div>

                  <div className="a-field a-col-span-2">
                    <label className="a-label">Meta Line</label>
                    <input className="a-input" value={slide.meta} onChange={e => updateSlide(idx, 'meta', e.target.value)} placeholder="GIA Certified · Bespoke Craftsmanship" />
                  </div>
                </div>

                <hr className="a-divider" />

                {/* CTA Section */}
                <div className="a-section-title"><Link size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} /> Call to Action</div>

                <div className="a-form-grid">
                  <div className="a-field">
                    <label className="a-label">Button Text</label>
                    <input className="a-input" value={slide.cta_text} onChange={e => updateSlide(idx, 'cta_text', e.target.value)} placeholder="Explore Collection" />
                  </div>
                  <div className="a-field">
                    <label className="a-label">Button Link</label>
                    <input className="a-input" value={slide.cta_link} onChange={e => updateSlide(idx, 'cta_link', e.target.value)} placeholder="/collections" />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
