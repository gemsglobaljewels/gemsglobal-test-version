'use client'

import { useState, useEffect } from 'react'
import {
  AlertCircle, Save, Video, Image as ImageIcon, Sparkles,
  Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Film, Type, Link, ImagePlay
} from 'lucide-react'

const CSS = `

.as-root {
  height: auto;
  width: 100%;
  background: var(--c-bg);
  font-family: var(--font-main);
  color: var(--c-text);
  padding-bottom: 60px;
  position: relative;
}

.as-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 32px 0;
}

.as-page-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 20px;
  flex-wrap: wrap;
}

.as-page-title { 
  font-family: var(--font-main); 
  font-size: 24px; 
  color: var(--c-text); 
}
.as-page-title em { 
  font-style: italic; 
  color: var(--c-accent); 
}
.as-page-sub { 
  font-size: 12px; 
  color: var(--c-text-muted); 
  margin-top: 4px; 
  font-weight: 300; 
}

.as-btn-add {
  padding: 12px 22px;
  background: rgba(var(--c-accent-rgb),0.08);
  border: 1px solid rgba(var(--c-accent-rgb),0.3);
  color: var(--c-accent);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.as-btn-add:hover { 
  background: rgba(var(--c-accent-rgb),0.14); 
  border-color: var(--c-accent); 
}

.as-slides { 
  display: flex; 
  flex-direction: column; 
  gap: 24px; 
}

.as-slide {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  overflow: visible;
}

.as-slide-hdr {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(var(--c-accent-rgb),0.08);
  background: linear-gradient(110deg, rgba(var(--c-accent-rgb),0.05) 0%, transparent 70%);
}

.as-slide-grip { 
  color: var(--c-text-muted); 
  flex-shrink: 0; 
}

.as-slide-icon {
  width: 34px;
  height: 34px;
  background: rgba(var(--c-accent-rgb),0.06);
  border: 1px solid rgba(var(--c-accent-rgb),0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-accent);
  flex-shrink: 0;
}

.as-slide-title { 
  font-family: var(--font-main); 
  font-size: 16px; 
  color: var(--c-text); 
  flex: 1; 
  min-width: 0; 
}
.as-slide-title em { 
  font-style: italic; 
  color: var(--c-accent); 
}
.as-slide-title-sub { 
  font-size: 11px; 
  color: var(--c-text-muted); 
  font-weight: 300; 
  margin-top: 2px; 
}

.as-slide-actions { 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  flex-shrink: 0; 
}

.as-icon-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(var(--c-accent-rgb),0.15);
  border-radius: 6px;
  color: var(--c-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}
.as-icon-btn:hover { 
  border-color: rgba(var(--c-accent-rgb),0.4); 
  color: var(--c-accent); 
  background: rgba(var(--c-accent-rgb),0.05); 
}
.as-icon-btn:disabled { 
  opacity: 0.25; 
  cursor: not-allowed; 
}
.as-icon-btn.danger:hover { 
  border-color: rgba(239,68,68,0.4); 
  color: #ef4444; 
  background: rgba(239,68,68,0.05); 
}

.as-slide-body { 
  padding: 24px; 
}

/* Section Styling */
.as-section {
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.08);
}

.as-section:last-of-type {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.as-section-hdr {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.as-section-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--c-accent-rgb), 0.06);
  border-radius: 6px;
  color: var(--c-accent);
}

.as-section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-accent);
}

/* Type Toggle */
.as-type-toggle { 
  display: flex; 
  gap: 8px; 
  margin-bottom: 20px; 
}
.as-type-btn {
  flex: 1;
  padding: 10px 14px;
  background: rgba(var(--c-accent-rgb),0.02);
  border: 1px solid rgba(var(--c-accent-rgb),0.1);
  border-radius: 6px;
  color: var(--c-text-muted);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.as-type-btn.active {
  background: rgba(var(--c-accent-rgb),0.08);
  border-color: var(--c-accent);
  color: var(--c-accent);
}

/* Fields */
.as-field { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  margin-bottom: 20px; 
}
.as-field:last-child {
  margin-bottom: 0;
}
.as-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-accent);
  display: flex;
  align-items: center;
  gap: 6px;
}
.as-label-dot { 
  width: 3px; 
  height: 3px; 
  background: var(--c-accent); 
  border-radius: 50%; 
}

.as-input {
  background: rgba(var(--c-accent-rgb),0.02);
  border: 1px solid rgba(var(--c-accent-rgb),0.1);
  border-radius: 6px;
  padding: 12px 14px;
  font-family: var(--font-main);
  font-size: 14px;
  color: var(--c-text);
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
}
.as-input:focus { 
  border-color: rgba(var(--c-accent-rgb),0.4); 
  background: rgba(var(--c-accent-rgb),0.03); 
}
.as-input::placeholder { 
  color: var(--c-text-muted); 
}

.as-row-2 { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 20px; 
}
@media(max-width: 640px) { 
  .as-row-2 { 
    grid-template-columns: 1fr; 
  } 
}

/* Upload Box */
.as-upload-box {
  border: 1px dashed rgba(var(--c-accent-rgb),0.2);
  border-radius: 8px;
  padding: 16px;
  background: rgba(var(--c-accent-rgb),0.02);
  display: flex;
  align-items: center;
  gap: 18px;
}

.as-preview-img { 
  width: 76px; 
  height: 76px; 
  object-fit: cover; 
  border-radius: 6px; 
  border: 1px solid rgba(var(--c-accent-rgb),0.1); 
  flex-shrink: 0; 
  background: rgba(var(--c-accent-rgb),0.03); 
}
.as-preview-video { 
  width: 130px; 
  height: 76px; 
  object-fit: cover; 
  border-radius: 6px; 
  flex-shrink: 0; 
  background: rgba(var(--c-accent-rgb),0.03); 
}
.as-preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--c-accent-rgb),0.3);
  flex-shrink: 0;
}

.as-btn-upload {
  padding: 9px 16px;
  background: transparent;
  border: 1px solid rgba(var(--c-accent-rgb),0.3);
  color: var(--c-accent);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.as-btn-upload:hover { 
  background: rgba(var(--c-accent-rgb),0.05); 
  border-color: var(--c-accent); 
}

/* Empty State */
.as-empty-state {
  text-align: center;
  padding: 60px 24px;
  color: var(--c-text-muted);
  border: 1px dashed rgba(var(--c-accent-rgb),0.15);
  border-radius: 12px;
}
.as-empty-state p { 
  font-size: 13px; 
  margin-top: 10px; 
}

/* Save Bar */
.as-save-bar {
  z-index: 10;
  padding: 32px 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 28px;
  border-top: 1px solid rgba(var(--c-accent-rgb),0.1);
  position: relative;
}

.as-fab {
  background: var(--c-accent);
  border: none;
  padding: 14px 32px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  box-shadow: 0 10px 30px rgba(var(--c-accent-rgb),0.3);
  cursor: pointer;
  transition: all 0.3s;
}
.as-fab:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 15px 40px rgba(var(--c-accent-rgb),0.4); 
}
.as-fab:disabled { 
  opacity: 0.6; 
  cursor: not-allowed; 
  transform: none; 
}

/* Toast */
.as-toast {
  margin-right: auto;
  padding: 10px 20px;
  background: var(--c-surface);
  border: 1px solid var(--c-accent);
  border-radius: 50px;
  color: var(--c-text);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fadeInUp 0.2s ease;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
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
    <div className="as-root">
      <style>{CSS}</style>
      <div className="as-page">

        <div className="as-page-hdr">
          <div>
            <h1 className="as-page-title">Hero <em>Slides</em></h1>
            <p className="as-page-sub">{data.slides.length} slide{data.slides.length !== 1 ? 's' : ''} in rotation</p>
          </div>
          <button className="as-btn-add" onClick={addSlide}>
            <Plus size={14} /> Add Slide
          </button>
        </div>

        {data.slides.length === 0 ? (
          <div className="as-empty-state">
            <Sparkles size={22} style={{ margin: '0 auto', display: 'block', opacity: 0.5 }} />
            <p>No slides yet. Add your first slide to populate the hero.</p>
          </div>
        ) : (
          <div className="as-slides">
            {data.slides.map((slide, idx) => (
              <div className="as-slide" key={idx}>
                <div className="as-slide-hdr">
                  <GripVertical size={16} className="as-slide-grip" />
                  <div className="as-slide-icon">
                    {slide.type === 'video' ? <Video size={16} strokeWidth={1.5} /> : <ImageIcon size={16} strokeWidth={1.5} />}
                  </div>
                  <div className="as-slide-title">
                    Slide {idx + 1}{slide.line2 ? <>: <em>{slide.line2}</em></> : null}
                    <div className="as-slide-title-sub">{slide.kicker || 'Untitled'} {slide.tag ? `· ${slide.tag}` : ''}</div>
                  </div>
                  <div className="as-slide-actions">
                    <button className="as-icon-btn" onClick={() => moveSlide(idx, -1)} disabled={idx === 0} aria-label="Move up">
                      <ChevronUp size={14} />
                    </button>
                    <button className="as-icon-btn" onClick={() => moveSlide(idx, 1)} disabled={idx === data.slides.length - 1} aria-label="Move down">
                      <ChevronDown size={14} />
                    </button>
                    <button className="as-icon-btn danger" onClick={() => removeSlide(idx)} aria-label="Delete slide">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="as-slide-body">

                  {/* Media Section */}
                  <div className="as-section">
                    <div className="as-section-hdr">
                      <div className="as-section-icon">
                        <ImagePlay size={14} />
                      </div>
                      <span className="as-section-title">Media</span>
                    </div>

                    <div className="as-type-toggle">
                      <button
                        className={`as-type-btn${slide.type === 'image' ? ' active' : ''}`}
                        onClick={() => updateSlide(idx, 'type', 'image')}
                      >
                        <ImageIcon size={13} /> Image
                      </button>
                      <button
                        className={`as-type-btn${slide.type === 'video' ? ' active' : ''}`}
                        onClick={() => updateSlide(idx, 'type', 'video')}
                      >
                        <Film size={13} /> Video
                      </button>
                    </div>

                    <div className="as-field">
                      <label className="as-label"><span className="as-label-dot" /> {slide.type === 'video' ? 'Background Video' : 'Background Image'}</label>
                      <div className="as-upload-box">
                        {slide.src ? (
                          slide.type === 'video' ? (
                            <video src={slide.src} className="as-preview-video" muted loop autoPlay />
                          ) : (
                            <img src={slide.src} className="as-preview-img" alt="" />
                          )
                        ) : (
                          <div className={slide.type === 'video' ? 'as-preview-video as-preview-empty' : 'as-preview-img as-preview-empty'}>
                            {slide.type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <input
                            className="as-input"
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
                          <button className="as-btn-upload" style={{ marginTop: 10 }} onClick={() => document.getElementById(`src_up_${idx}`)?.click()}>
                            Upload {slide.type === 'video' ? 'Video' : 'Image'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {slide.type === 'video' && (
                      <div className="as-field">
                        <label className="as-label"><span className="as-label-dot" /> Poster Image (fallback frame)</label>
                        <div className="as-upload-box">
                          {slide.poster ? (
                            <img src={slide.poster} className="as-preview-img" alt="" />
                          ) : (
                            <div className="as-preview-img as-preview-empty"><ImageIcon size={20} /></div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <input
                              className="as-input"
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
                            <button className="as-btn-upload" style={{ marginTop: 10 }} onClick={() => document.getElementById(`poster_up_${idx}`)?.click()}>
                              Upload Poster
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Content Section */}
                  <div className="as-section">
                    <div className="as-section-hdr">
                      <div className="as-section-icon">
                        <Type size={14} />
                      </div>
                      <span className="as-section-title">Text Content</span>
                    </div>

                    <div className="as-row-2">
                      <div className="as-field">
                        <label className="as-label"><span className="as-label-dot" /> Kicker</label>
                        <input className="as-input" value={slide.kicker} onChange={e => updateSlide(idx, 'kicker', e.target.value)} placeholder="The Atelier" />
                      </div>
                      <div className="as-field">
                        <label className="as-label"><span className="as-label-dot" /> Tag</label>
                        <input className="as-input" value={slide.tag} onChange={e => updateSlide(idx, 'tag', e.target.value)} placeholder="New Arrivals" />
                      </div>
                    </div>

                    <div className="as-field">
                      <label className="as-label"><span className="as-label-dot" /> Headline Line 1 (small)</label>
                      <input className="as-input" value={slide.line1} onChange={e => updateSlide(idx, 'line1', e.target.value)} placeholder="Crafted In" />
                    </div>

                    <div className="as-field">
                      <label className="as-label"><span className="as-label-dot" /> Headline Line 2 (large)</label>
                      <input className="as-input" value={slide.line2} onChange={e => updateSlide(idx, 'line2', e.target.value)} placeholder="Light" />
                    </div>

                    <div className="as-field">
                      <label className="as-label"><span className="as-label-dot" /> Accent Word (italic gold)</label>
                      <input className="as-input" value={slide.accent} onChange={e => updateSlide(idx, 'accent', e.target.value)} placeholder="Eternity" />
                    </div>

                    <div className="as-field">
                      <label className="as-label"><span className="as-label-dot" /> Meta Line</label>
                      <input className="as-input" value={slide.meta} onChange={e => updateSlide(idx, 'meta', e.target.value)} placeholder="GIA Certified · Bespoke Craftsmanship" />
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="as-section">
                    <div className="as-section-hdr">
                      <div className="as-section-icon">
                        <Link size={14} />
                      </div>
                      <span className="as-section-title">Call to Action</span>
                    </div>

                    <div className="as-row-2">
                      <div className="as-field">
                        <label className="as-label"><span className="as-label-dot" /> Button Text</label>
                        <input className="as-input" value={slide.cta_text} onChange={e => updateSlide(idx, 'cta_text', e.target.value)} placeholder="Explore Collection" />
                      </div>
                      <div className="as-field">
                        <label className="as-label"><span className="as-label-dot" /> Button Link</label>
                        <input className="as-input" value={slide.cta_link} onChange={e => updateSlide(idx, 'cta_link', e.target.value)} placeholder="/collections" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        <div className="as-save-bar">
          {toast && (
            <div className="as-toast">
              {toast.err ? <AlertCircle size={16} color="#ef4444" /> : <Sparkles size={16} color="var(--c-accent)" />}
              {toast.msg}
            </div>
          )}
          <button className="as-fab" onClick={handleSave} disabled={saving}>
            {saving ? 'Updating...' : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
