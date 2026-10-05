'use client'

import { useEffect, useRef, useState } from 'react'
import {
    Plus, Trash2, Check, Upload, Video, Settings, Save,
    Loader2, X, Eye, EyeOff, GripVertical, Search, ChevronUp, ChevronDown
} from 'lucide-react'

type Product = {
    id: string
    name: string
    description?: string
    price?: string
    image?: string
}

type Reel = {
    id: string
    videoUrl: string
    thumbnail: string | null
    productIds: string[]
    isEnabled: boolean
    position: number
}

type Settings = {
    username: string
    instagramLink: string
    logoUrl: string
}

export default function AdminInstagramFeedPage() {
    const [reels, setReels] = useState<Reel[]>([])
    const [settings, setSettings] = useState<Settings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [notifications, setNotifications] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([])
    const [isDirty, setIsDirty] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showProductSelector, setShowProductSelector] = useState<number | null>(null)
    const [productSearch, setProductSearch] = useState('')
    const [products, setProducts] = useState<Product[]>([])
    const [expandedReel, setExpandedReel] = useState<number | null>(null)

    // Drag state
    const [dragIndex, setDragIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    const fileRefs = useRef<(HTMLInputElement | null)[]>([])
    const logoFileRef = useRef<HTMLInputElement>(null)

    function notify(message: string, type: 'success' | 'error' | 'info' = 'success') {
        const id = Date.now()
        setNotifications(prev => [...prev, { id, message, type }])
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4500)
    }

    async function load() {
        setLoading(true)
        try {
            const [feedRes, productsRes] = await Promise.all([
                fetch('/api/instagram-feed', { cache: 'no-store' }),
                fetch('/api/products?limit=100', { cache: 'no-store' })
            ])
            const feedJ = await feedRes.json()
            const productsJ = await productsRes.json()

            setReels(Array.isArray(feedJ.reels) ? feedJ.reels : [])

            if (feedJ.settings) {
                setSettings({
                    username: feedJ.settings.username || 'gemsglobaljewels',
                    instagramLink: feedJ.settings.instagramLink || 'https://instagram.com/gemsglobaljewels',
                    logoUrl: feedJ.settings.logoUrl || ''
                })
            } else {
                setSettings({
                    username: 'gemsglobaljewels',
                    instagramLink: 'https://instagram.com/gemsglobaljewels',
                    logoUrl: ''
                })
            }

            const productsList = Array.isArray(productsJ)
                ? productsJ
                : Array.isArray(productsJ.products)
                    ? productsJ.products
                    : []
            setProducts(productsList)
            setIsDirty(false)
        } catch (e) {
            console.error(e)
            notify('Failed to load Instagram feed', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    function addReel() {
        const newId = `reel-${Date.now()}`
        setReels(prev => [...prev, {
            id: newId,
            videoUrl: '',
            thumbnail: null,
            productIds: [],
            isEnabled: true,
            position: prev.length
        }])
        setIsDirty(true)
        notify('New reel added', 'info')
    }

    function updateReel(index: number, patch: Partial<Reel>) {
        setReels(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it))
        setIsDirty(true)
    }

    function moveReel(from: number, to: number) {
        if (to < 0 || to >= reels.length) return
        setReels(prev => {
            const next = [...prev]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            return next.map((r, i) => ({ ...r, position: i }))
        })
        setIsDirty(true)
    }

    // Drag handlers
    function handleDragStart(e: React.DragEvent, index: number) {
        setDragIndex(index)
        e.dataTransfer.effectAllowed = 'move'
    }

    function handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverIndex(index)
    }

    function handleDrop(e: React.DragEvent, index: number) {
        e.preventDefault()
        if (dragIndex !== null && dragIndex !== index) {
            moveReel(dragIndex, index)
            notify(`Reel moved to position ${index + 1}`, 'info')
        }
        setDragIndex(null)
        setDragOverIndex(null)
    }

    function handleDragEnd() {
        setDragIndex(null)
        setDragOverIndex(null)
    }

    async function uploadMedia(index: number, file: File | null, type: 'video' | 'thumbnail') {
        if (!file) return
        setUploadingIndex(index)
        notify(`Uploading ${type}...`, 'info')
        try {
            const fd = new FormData()
            fd.append('file', file)
            const r = await fetch('/api/instagram-feed/upload', { method: 'POST', body: fd })
            const j = await r.json()
            if (r.ok && j?.url) {
                updateReel(index, type === 'video' ? { videoUrl: j.url } : { thumbnail: j.url })
                notify(`${type} uploaded`, 'success')
            } else {
                notify(j?.error || 'Upload failed', 'error')
            }
        } catch {
            notify('Upload failed', 'error')
        } finally {
            setUploadingIndex(null)
        }
    }

    async function uploadLogo(file: File | null) {
        if (!file) return
        setUploadingLogo(true)
        notify('Uploading logo...', 'info')
        try {
            const fd = new FormData()
            fd.append('file', file)
            const r = await fetch('/api/instagram-feed/upload', { method: 'POST', body: fd })
            const j = await r.json()
            if (r.ok && j?.url) {
                setSettings(prev => prev ? { ...prev, logoUrl: j.url } : prev)
                setIsDirty(true)
                notify('Logo uploaded', 'success')
            } else {
                notify(j?.error || 'Upload failed', 'error')
            }
        } catch {
            notify('Upload failed', 'error')
        } finally {
            setUploadingLogo(false)
        }
    }

    async function save() {
        setSaving(true)
        try {
            const r = await fetch('/api/instagram-feed', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings, reels })
            })
            const j = await r.json()
            if (!r.ok) {
                notify(j?.error || 'Failed to save', 'error')
            } else {
                setReels(Array.isArray(j.reels) ? j.reels : [])
                setSettings(j.settings)
                setIsDirty(false)
                notify('Saved successfully!', 'success')
                await load()
            }
        } catch {
            notify('Failed to save', 'error')
        } finally {
            setSaving(false)
        }
    }

    async function deleteReel(id: string) {
        if (!confirm('Delete this reel? This cannot be undone.')) return
        try {
            await fetch(`/api/instagram-feed?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
            setReels(prev => prev.filter(r => r.id !== id))
            notify('Reel deleted', 'success')
            await load()
        } catch {
            notify('Delete failed', 'error')
        }
    }

    function toggleProduct(reelIndex: number, productId: string) {
        const reel = reels[reelIndex]
        if (!reel) return
        const newProductIds = reel.productIds.includes(productId)
            ? reel.productIds.filter(id => id !== productId)
            : [...reel.productIds, productId]
        updateReel(reelIndex, { productIds: newProductIds })
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    )

    return (
        <div className="a-page">

            {/* Page-local styles: drag-reorder affordances + toast slide-in only */}
            <style>{`
                @keyframes igSlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                .ig-toast-stack { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
                .ig-toast { padding: 11px 16px; border-radius: var(--radius-sm); background: var(--c-bg); border: 1px solid var(--c-border); box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--c-text); font-family: var(--font-dmsans); animation: igSlideIn 0.2s ease; }
                .ig-reel-card { transition: opacity 0.15s, box-shadow 0.15s, border-color 0.15s; }
                .ig-reel-card.is-dragging { opacity: 0.4; }
                .ig-reel-card.is-drag-over { border-color: var(--c-accent) !important; border-style: dashed; box-shadow: 0 0 0 1px var(--c-accent); background: var(--c-accent-soft); }
                .ig-grip { cursor: grab; color: var(--c-text-faint); }
                .ig-grip:active { cursor: grabbing; }
                .ig-thumb { width: 78px; height: 138px; border-radius: var(--radius); overflow: hidden; border: 1px solid var(--c-border); background: var(--c-surface); display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; flex-shrink: 0; }
                .ig-picker-grid { max-height: 260px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
                .ig-pick-card { display: flex; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--c-border); cursor: pointer; transition: all 0.15s; align-items: center; background: var(--c-bg); }
                .ig-pick-card.is-selected { border-color: var(--c-accent); background: var(--c-accent-soft); }
                .ig-pick-card:hover { background: var(--c-surface); }
            `}</style>

            {/* ─── Toast Notifications ─── */}
            <div className="ig-toast-stack">
                {notifications.map(n => (
                    <div key={n.id} className="ig-toast">
                        <span className={`a-dot ${n.type === 'success' ? 'a-dot--success' : n.type === 'error' ? 'a-dot--danger' : 'a-dot--info'}`} />
                        {n.message}
                    </div>
                ))}
            </div>

            {/* ─── Header ─── */}
            <div className="a-head">
                <div>
                    <div className="a-eyebrow">Storefront · Instagram</div>
                    <h1 className="a-title">Shop the <em>Feed</em></h1>
                    <p className="a-subtitle">Manage reels, linked products, and brand settings. Drag cards to reorder.</p>
                </div>

                <div className="a-head-actions">
                    {isDirty && (
                        <span className="a-badge a-badge--accent">
                            <span className="a-dot a-dot--accent a-dot--pulse" /> Unsaved changes
                        </span>
                    )}
                    <button
                        onClick={load}
                        disabled={saving || loading}
                        className="a-btn a-btn--ghost"
                    >
                        <Loader2 size={14} className={loading ? 'animate-spin' : ''} /> Reload
                    </button>
                    <button
                        onClick={save}
                        disabled={saving || !isDirty}
                        className="a-btn a-btn--primary"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* ─── Layout: Reels + Sidebar ─── */}
            <div className="a-grid-2">

                {/* ─── LEFT: Reels + Settings ─── */}
                <div className="a-stack">

                    {/* Reels Card */}
                    <div className="a-card">
                        <div className="a-card-head a-row a-row--between">
                            <div className="a-row" style={{ gap: '10px' }}>
                                <Video size={16} style={{ color: 'var(--c-accent)' }} />
                                <span className="a-card-title">Reels</span>
                                <span className="a-badge a-badge--accent">{reels.length}</span>
                            </div>
                            <button
                                onClick={addReel}
                                disabled={saving}
                                className="a-btn a-btn--primary a-btn--sm"
                            >
                                <Plus size={14} strokeWidth={2.5} /> Add Reel
                            </button>
                        </div>

                        <div className="a-card-body a-card-body--flush">
                            {loading ? (
                                <div className="a-loader-row">
                                    <span className="a-loader" />
                                    <span className="a-loader-label">Loading reels…</span>
                                </div>
                            ) : reels.length === 0 ? (
                                <div className="a-empty">
                                    <Video size={32} className="a-empty-ico" />
                                    <div className="a-empty-title">No reels yet</div>
                                    <div className="a-empty-text">Click “Add Reel” to get started.</div>
                                </div>
                            ) : (
                                <div className="a-stack" style={{ padding: '16px', gap: '14px' }}>
                                    {reels.map((reel, index) => (
                                        <div
                                            key={reel.id}
                                            className={`a-card ig-reel-card${dragIndex === index ? ' is-dragging' : ''}${dragOverIndex === index && dragIndex !== index ? ' is-drag-over' : ''}`}
                                            draggable
                                            onDragStart={e => handleDragStart(e, index)}
                                            onDragOver={e => handleDragOver(e, index)}
                                            onDrop={e => handleDrop(e, index)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div className="a-card-body" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                                                {/* Position + drag handle */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                    <span className="a-badge a-badge--neutral a-mono">{index + 1}</span>
                                                    <GripVertical size={16} className="ig-grip" />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <button
                                                            onClick={() => moveReel(index, index - 1)}
                                                            disabled={index === 0}
                                                            className="a-icon-btn a-icon-btn--sm"
                                                            title="Move up"
                                                        >
                                                            <ChevronUp size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => moveReel(index, index + 1)}
                                                            disabled={index === reels.length - 1}
                                                            className="a-icon-btn a-icon-btn--sm"
                                                            title="Move down"
                                                        >
                                                            <ChevronDown size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Thumbnail / video preview */}
                                                <div
                                                    className="ig-thumb"
                                                    onClick={() => fileRefs.current[index]?.click()}
                                                    title="Click to upload video"
                                                >
                                                    {uploadingIndex === index ? (
                                                        <span className="a-loader" />
                                                    ) : reel.videoUrl ? (
                                                        <video src={reel.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ color: 'var(--c-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '10px', padding: '8px', textAlign: 'center', fontFamily: 'var(--font-dmsans)' }}>
                                                            <Upload size={18} style={{ opacity: 0.5 }} />
                                                            Upload video
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file" accept="video/*,image/*" style={{ display: 'none' }}
                                                        ref={el => { fileRefs.current[index] = el }}
                                                        onChange={e => uploadMedia(index, e.target.files?.[0] || null, 'video')}
                                                    />
                                                </div>

                                                {/* URLs */}
                                                <div className="a-form-grid a-form-grid--1" style={{ flex: 1, minWidth: 0, gap: '12px' }}>
                                                    <div className="a-field">
                                                        <label className="a-label">Video URL</label>
                                                        <input
                                                            value={reel.videoUrl}
                                                            placeholder="https://..."
                                                            onChange={e => updateReel(index, { videoUrl: e.target.value })}
                                                            className="a-input"
                                                        />
                                                    </div>
                                                    <div className="a-field">
                                                        <label className="a-label">Thumbnail URL</label>
                                                        <input
                                                            value={reel.thumbnail || ''}
                                                            placeholder="optional"
                                                            onChange={e => updateReel(index, { thumbnail: e.target.value || null })}
                                                            className="a-input"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Right controls: products / visibility / delete */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch', minWidth: '120px' }}>
                                                    <button
                                                        onClick={() => {
                                                            setShowProductSelector(showProductSelector === index ? null : index)
                                                            setExpandedReel(showProductSelector === index ? null : index)
                                                        }}
                                                        className={`a-btn ${showProductSelector === index ? 'a-btn--subtle' : 'a-btn--ghost'} a-btn--sm a-btn--block`}
                                                    >
                                                        <Plus size={13} /> Products
                                                        <span className="a-badge a-badge--accent" style={{ marginLeft: 'auto' }}>{reel.productIds.length}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => updateReel(index, { isEnabled: !reel.isEnabled })}
                                                        title={reel.isEnabled ? 'Hide reel' : 'Show reel'}
                                                        className={`a-btn a-btn--ghost a-btn--sm a-btn--block`}
                                                    >
                                                        {reel.isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                                        <span className={`a-badge ${reel.isEnabled ? 'a-badge--success' : 'a-badge--neutral'}`} style={{ marginLeft: 'auto' }}>
                                                            {reel.isEnabled ? 'Live' : 'Hidden'}
                                                        </span>
                                                    </button>

                                                    <button
                                                        onClick={() => deleteReel(reel.id)}
                                                        title="Delete reel"
                                                        className="a-btn a-btn--danger a-btn--sm a-btn--block"
                                                    >
                                                        <Trash2 size={14} strokeWidth={1.75} /> Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Inline Product Selector */}
                                            {showProductSelector === index && (
                                                <div className="a-card-foot" style={{ display: 'block', background: 'var(--c-surface)' }}>
                                                    <div className="a-row a-row--between" style={{ marginBottom: '14px' }}>
                                                        <div className="a-row" style={{ gap: '10px' }}>
                                                            <span className="a-section-title" style={{ margin: 0 }}>Link Products — Reel {index + 1}</span>
                                                            <span className="a-muted">{reel.productIds.length} selected</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setShowProductSelector(null)}
                                                            className="a-btn a-btn--ghost a-btn--sm"
                                                        >
                                                            <X size={13} /> Done
                                                        </button>
                                                    </div>

                                                    <div className="a-search" style={{ marginBottom: '12px' }}>
                                                        <Search size={14} className="a-search-ico" />
                                                        <input
                                                            value={productSearch}
                                                            onChange={e => setProductSearch(e.target.value)}
                                                            placeholder="Search products…"
                                                            className="a-search-input"
                                                        />
                                                    </div>

                                                    <div className="ig-picker-grid">
                                                        {filteredProducts.map(product => {
                                                            const isSelected = reel.productIds.includes(product.id)
                                                            return (
                                                                <div
                                                                    key={product.id}
                                                                    onClick={() => toggleProduct(index, product.id)}
                                                                    className={`ig-pick-card${isSelected ? ' is-selected' : ''}`}
                                                                >
                                                                    {product.image
                                                                        ? <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.background = 'var(--c-border)' }} />
                                                                        : <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--c-surface-2)', flexShrink: 0 }} />
                                                                    }
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <p className="a-cell-name" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                                                                        <p style={{ fontSize: '11px', color: 'var(--c-accent)', margin: '2px 0 0', fontFamily: 'var(--font-dmsans)' }}>{product.price || ''}</p>
                                                                    </div>
                                                                    {isSelected && <Check size={14} style={{ color: 'var(--c-accent)', flexShrink: 0 }} />}
                                                                </div>
                                                            )
                                                        })}
                                                        {filteredProducts.length === 0 && (
                                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--c-text-muted)', fontSize: '13px', fontFamily: 'var(--font-dmsans)' }}>
                                                                No products found
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── Brand Profile Settings ─── */}
                    <div className="a-card">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="a-card-head a-row a-row--between"
                            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                            <span className="a-row" style={{ gap: '10px' }}>
                                <Settings size={16} style={{ color: 'var(--c-accent)' }} />
                                <span className="a-card-title">Brand Profile <em>Settings</em></span>
                            </span>
                            <span style={{ color: 'var(--c-text-muted)', fontSize: '20px', lineHeight: 1, transition: 'transform 0.2s', transform: showSettings ? 'rotate(45deg)' : 'none' }}>+</span>
                        </button>

                        {showSettings && settings && (
                            <div className="a-card-body">
                                <div className="a-form-grid">
                                    <div className="a-field">
                                        <label className="a-label">Instagram Username</label>
                                        <input
                                            value={settings.username}
                                            placeholder="@handle"
                                            onChange={e => { setSettings(prev => prev ? { ...prev, username: e.target.value } : prev); setIsDirty(true) }}
                                            className="a-input"
                                        />
                                    </div>

                                    <div className="a-field">
                                        <label className="a-label">Instagram Link</label>
                                        <input
                                            value={settings.instagramLink || ''}
                                            placeholder="https://instagram.com/…"
                                            onChange={e => { setSettings(prev => prev ? { ...prev, instagramLink: e.target.value } : prev); setIsDirty(true) }}
                                            className="a-input"
                                        />
                                    </div>

                                    <div className="a-field a-col-span-2">
                                        <label className="a-label">Brand Logo</label>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div className="a-media" style={{ width: '56px', height: '56px' }}>
                                                {settings.logoUrl
                                                    ? <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <span style={{ fontSize: '9px', color: 'var(--c-text-muted)', textAlign: 'center', padding: '4px', fontFamily: 'var(--font-dmsans)' }}>No logo</span>
                                                }
                                            </div>
                                            <input
                                                value={settings.logoUrl}
                                                placeholder="https://…"
                                                onChange={e => { setSettings(prev => prev ? { ...prev, logoUrl: e.target.value } : prev); setIsDirty(true) }}
                                                className="a-input"
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                onClick={() => logoFileRef.current?.click()}
                                                disabled={uploadingLogo}
                                                className="a-btn a-btn--ghost a-btn--sm"
                                                style={{ whiteSpace: 'nowrap' }}
                                            >
                                                {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                                Upload
                                            </button>
                                            <input type="file" accept="image/*" style={{ display: 'none' }} ref={logoFileRef} onChange={e => uploadLogo(e.target.files?.[0] || null)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── RIGHT SIDEBAR: All Products ─── */}
                <div style={{ position: 'sticky', top: '24px' }}>
                    <div className="a-card">
                        <div className="a-card-head a-row a-row--between">
                            <div className="a-row" style={{ gap: '10px' }}>
                                <span className="a-card-title">All Products</span>
                                <span className="a-badge a-badge--accent">{products.length}</span>
                            </div>
                        </div>

                        <div className="a-card-body">
                            <div className="a-search">
                                <Search size={14} className="a-search-ico" />
                                <input
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                    placeholder="Search products…"
                                    className="a-search-input"
                                />
                            </div>
                            {productSearch && (
                                <p className="a-muted" style={{ margin: '8px 0 0' }}>
                                    {filteredProducts.length} of {products.length} products
                                </p>
                            )}
                        </div>

                        <div className="a-card-body a-card-body--flush" style={{ maxHeight: '560px', overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredProducts.map(product => (
                                <div key={product.id} className="a-cell-lead" style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--c-border)', background: 'var(--c-bg)' }}>
                                    {product.image
                                        ? <img src={product.image} alt={product.name} className="a-media" onError={e => { (e.target as HTMLImageElement).style.background = 'var(--c-border)' }} />
                                        : <div className="a-media" />
                                    }
                                    <div style={{ minWidth: 0 }}>
                                        <p className="a-cell-name" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--c-accent)', margin: '2px 0 0', fontFamily: 'var(--font-dmsans)' }}>{product.price || ''}</p>
                                    </div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--c-text-muted)', fontSize: '13px', fontFamily: 'var(--font-dmsans)' }}>
                                    No products found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Sticky Save Bar ─── */}
            {isDirty && !saving && (
                <div style={{
                    position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--radius)',
                    padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '18px',
                    boxShadow: 'var(--shadow-lg)', zIndex: 100, whiteSpace: 'nowrap'
                }}>
                    <span className="a-muted">You have unsaved changes</span>
                    <button
                        onClick={save}
                        className="a-btn a-btn--primary a-btn--sm"
                    >
                        <Save size={14} /> Save Changes
                    </button>
                </div>
            )}
        </div>
    )
}
