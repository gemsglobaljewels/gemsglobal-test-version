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

    const notifColor: Record<string, string> = {
        success: '#4ade80',
        error: '#f87171',
        info: 'var(--c-accent)'
    }

    return (
        <div className="min-h-screen bg-background" style={{ fontFamily: 'var(--font-main, system-ui, sans-serif)', color: 'var(--c-text)' }}>

            {/* ─── Toast Notifications ─── */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map(n => (
                    <div key={n.id} style={{
                        padding: '12px 18px', borderRadius: '8px',
                        background: 'var(--c-surface)', border: `1px solid ${notifColor[n.type]}33`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontSize: '13px', color: 'var(--c-text)',
                        animation: 'slideIn 0.2s ease'
                    }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: notifColor[n.type], flexShrink: 0 }} />
                        {n.message}
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                .reel-row:hover { background: rgba(var(--c-accent-rgb, 201 169 110), 0.03) !important; }
                .reel-row.drag-over { border: 1px dashed var(--c-accent) !important; background: rgba(var(--c-accent-rgb, 201 169 110), 0.06) !important; }
                .reel-row.dragging { opacity: 0.4; }
                .btn-primary { background: var(--c-accent) !important; color: #070605 !important; border: none !important; }
                .btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
                .btn-ghost { background: transparent !important; color: var(--c-accent) !important; border: 1px solid var(--c-border) !important; }
                .btn-ghost:hover:not(:disabled) { border-color: var(--c-accent) !important; }
                .input-field { background: var(--c-bg) !important; border: 1px solid var(--c-border) !important; color: var(--c-text) !important; outline: none !important; transition: border-color 0.2s; }
                .input-field:focus { border-color: var(--c-accent) !important; }
                .section-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 14px; overflow: hidden; }
                .section-header { padding: 18px 24px; border-bottom: 1px solid var(--c-border); display: flex; align-items: center; justify-content: space-between; }
                .label-pill { font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--c-accent); font-weight: 600; }
            `}</style>

            <div style={{ padding: '40px 28px 120px', maxWidth: '1300px', margin: '0 auto' }}>

                {/* ─── Page Header ─── */}
                <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', margin: '0 0 8px', fontWeight: '300', color: 'var(--c-text)', lineHeight: 1.1 }}>
                            Shop the <em style={{ fontStyle: 'italic', color: 'var(--c-accent)' }}>Feed</em>
                        </h1>
                        <p style={{ margin: 0, color: 'var(--c-text-muted)', fontSize: '14px' }}>
                            Manage reels, linked products, and brand settings. Drag rows to reorder.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {isDirty && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', background: 'rgba(var(--c-accent-rgb, 201 169 110), 0.08)',
                                border: '1px solid var(--c-border)', borderRadius: '20px',
                                fontSize: '11px', color: 'var(--c-accent)', letterSpacing: '0.05em'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c-accent)' }} />
                                Unsaved changes
                            </span>
                        )}
                        <button
                            onClick={load}
                            disabled={saving || loading}
                            className="btn-ghost"
                            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase' }}
                        >
                            <Loader2 size={13} className={loading ? 'animate-spin' : ''} /> Reload
                        </button>
                        <button
                            onClick={save}
                            disabled={saving || !isDirty}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 22px', borderRadius: '7px', cursor: saving || !isDirty ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: isDirty ? 1 : 0.5 }}
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* ─── Layout: Reels + Sidebar ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

                    {/* ─── LEFT: Reels Section ─── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Reels Card */}
                        <div className="section-card">
                            <div className="section-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Video size={16} style={{ color: 'var(--c-accent)' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-text)' }}>Reels</span>
                                    <span style={{
                                        padding: '2px 10px', borderRadius: '20px',
                                        background: 'rgba(var(--c-accent-rgb, 201 169 110), 0.12)',
                                        color: 'var(--c-accent)', fontSize: '11px', fontWeight: 600
                                    }}>{reels.length}</span>
                                </div>
                                <button
                                    onClick={addReel}
                                    disabled={saving}
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase' }}
                                >
                                    <Plus size={14} strokeWidth={2.5} /> Add Reel
                                </button>
                            </div>

                            {loading ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--c-text-muted)' }}>
                                    <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto 10px', display: 'block' }} />
                                    Loading reels…
                                </div>
                            ) : reels.length === 0 ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--c-text-muted)' }}>
                                    <Video size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} />
                                    <p style={{ margin: 0, fontSize: '14px' }}>No reels yet.</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.6 }}>Click "Add Reel" to get started.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Column headers */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: '44px 90px 1fr 110px 100px 80px',
                                        gap: '12px', padding: '10px 20px',
                                        background: 'rgba(var(--c-accent-rgb, 201 169 110), 0.04)',
                                        borderBottom: '1px solid var(--c-border)'
                                    }}>
                                        <span className="label-pill">#</span>
                                        <span className="label-pill">Preview</span>
                                        <span className="label-pill">Video URL & Thumbnail</span>
                                        <span className="label-pill">Products</span>
                                        <span className="label-pill">Visibility</span>
                                        <span className="label-pill" style={{ textAlign: 'right' }}>Actions</span>
                                    </div>

                                    {reels.map((reel, index) => (
                                        <div key={reel.id}>
                                            <div
                                                className={`reel-row${dragIndex === index ? ' dragging' : ''}${dragOverIndex === index && dragIndex !== index ? ' drag-over' : ''}`}
                                                draggable
                                                onDragStart={e => handleDragStart(e, index)}
                                                onDragOver={e => handleDragOver(e, index)}
                                                onDrop={e => handleDrop(e, index)}
                                                onDragEnd={handleDragEnd}
                                                style={{
                                                    display: 'grid', gridTemplateColumns: '44px 90px 1fr 110px 100px 80px',
                                                    gap: '12px', padding: '14px 20px', alignItems: 'center',
                                                    borderBottom: '1px solid rgba(var(--c-accent-rgb, 201 169 110), 0.06)',
                                                    transition: 'background 0.15s',
                                                    cursor: 'grab'
                                                }}
                                            >
                                                {/* Position + drag handle */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <div style={{ display: 'flex', gap: '1px' }}>
                                                        <button
                                                            onClick={() => moveReel(index, index - 1)}
                                                            disabled={index === 0}
                                                            style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', padding: '2px', color: index === 0 ? 'var(--c-border)' : 'var(--c-text-muted)' }}
                                                            title="Move up"
                                                        >
                                                            <ChevronUp size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => moveReel(index, index + 1)}
                                                            disabled={index === reels.length - 1}
                                                            style={{ background: 'none', border: 'none', cursor: index === reels.length - 1 ? 'not-allowed' : 'pointer', padding: '2px', color: index === reels.length - 1 ? 'var(--c-border)' : 'var(--c-text-muted)' }}
                                                            title="Move down"
                                                        >
                                                            <ChevronDown size={13} />
                                                        </button>
                                                    </div>
                                                    <GripVertical size={14} style={{ color: 'var(--c-border)', cursor: 'grab' }} />
                                                    <span style={{ fontSize: '10px', color: 'var(--c-text-muted)', fontWeight: 600 }}>{index + 1}</span>
                                                </div>

                                                {/* Thumbnail / video preview */}
                                                <div
                                                    onClick={() => fileRefs.current[index]?.click()}
                                                    title="Click to upload video"
                                                    style={{
                                                        width: '80px', height: '142px', borderRadius: '10px', overflow: 'hidden',
                                                        border: '1px solid var(--c-border)', background: 'var(--c-bg)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', position: 'relative', flexShrink: 0
                                                    }}
                                                >
                                                    {uploadingIndex === index ? (
                                                        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--c-accent)' }} />
                                                    ) : reel.videoUrl ? (
                                                        <video src={reel.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ color: 'var(--c-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '10px', padding: '8px', textAlign: 'center' }}>
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
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                                                    <div>
                                                        <div className="label-pill" style={{ marginBottom: '4px', display: 'block' }}>Video URL</div>
                                                        <input
                                                            value={reel.videoUrl}
                                                            placeholder="https://..."
                                                            onChange={e => updateReel(index, { videoUrl: e.target.value })}
                                                            className="input-field"
                                                            style={{ width: '100%', height: '36px', padding: '0 12px', borderRadius: '6px', fontSize: '12px' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="label-pill" style={{ marginBottom: '4px', display: 'block' }}>Thumbnail URL</div>
                                                        <input
                                                            value={reel.thumbnail || ''}
                                                            placeholder="optional"
                                                            onChange={e => updateReel(index, { thumbnail: e.target.value || null })}
                                                            className="input-field"
                                                            style={{ width: '100%', height: '36px', padding: '0 12px', borderRadius: '6px', fontSize: '12px' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Products */}
                                                <div>
                                                    <button
                                                        onClick={() => {
                                                            setShowProductSelector(showProductSelector === index ? null : index)
                                                            setExpandedReel(showProductSelector === index ? null : index)
                                                        }}
                                                        className="btn-ghost"
                                                        style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            gap: '4px', padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
                                                            fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase',
                                                            width: '100%', minHeight: '52px'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--c-accent)', lineHeight: 1 }}>{reel.productIds.length}</span>
                                                        <span style={{ fontSize: '9px', opacity: 0.7 }}>Products</span>
                                                    </button>
                                                </div>

                                                {/* Visibility */}
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => updateReel(index, { isEnabled: !reel.isEnabled })}
                                                        title={reel.isEnabled ? 'Hide reel' : 'Show reel'}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                                            color: reel.isEnabled ? '#4ade80' : 'var(--c-text-muted)',
                                                            transition: 'all 0.2s', borderRadius: '6px'
                                                        }}
                                                    >
                                                        {reel.isEnabled ? <Eye size={17} /> : <EyeOff size={17} />}
                                                        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                                                            {reel.isEnabled ? 'Live' : 'Hidden'}
                                                        </span>
                                                    </button>
                                                </div>

                                                {/* Delete */}
                                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => deleteReel(reel.id)}
                                                        title="Delete reel"
                                                        style={{
                                                            width: '36px', height: '36px', borderRadius: '7px',
                                                            border: '1px solid rgba(248,113,113,0.2)',
                                                            background: 'rgba(248,113,113,0.06)', color: 'rgba(248,113,113,0.6)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer', transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <Trash2 size={14} strokeWidth={1.5} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Inline Product Selector */}
                                            {showProductSelector === index && (
                                                <div style={{
                                                    borderTop: '1px solid rgba(var(--c-accent-rgb, 201 169 110), 0.15)',
                                                    background: 'rgba(var(--c-accent-rgb, 201 169 110), 0.02)',
                                                    padding: '20px 24px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                                        <div>
                                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text)' }}>
                                                                Link Products — Reel {index + 1}
                                                            </span>
                                                            <span style={{ marginLeft: '10px', fontSize: '11px', color: 'var(--c-text-muted)' }}>
                                                                {reel.productIds.length} selected
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => setShowProductSelector(null)}
                                                            className="btn-ghost"
                                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' }}
                                                        >
                                                            <X size={12} /> Done
                                                        </button>
                                                    </div>

                                                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                                                        <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-muted)' }} />
                                                        <input
                                                            value={productSearch}
                                                            onChange={e => setProductSearch(e.target.value)}
                                                            placeholder="Search products…"
                                                            className="input-field"
                                                            style={{ width: '100%', height: '38px', padding: '0 12px 0 36px', borderRadius: '6px', fontSize: '13px' }}
                                                        />
                                                    </div>

                                                    <div style={{
                                                        maxHeight: '240px', overflowY: 'auto',
                                                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px'
                                                    }}>
                                                        {filteredProducts.map(product => {
                                                            const isSelected = reel.productIds.includes(product.id)
                                                            return (
                                                                <div
                                                                    key={product.id}
                                                                    onClick={() => toggleProduct(index, product.id)}
                                                                    style={{
                                                                        display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                                                                        border: `1px solid ${isSelected ? 'var(--c-accent)' : 'var(--c-border)'}`,
                                                                        cursor: 'pointer', transition: 'all 0.15s', alignItems: 'center',
                                                                        background: isSelected ? 'rgba(var(--c-accent-rgb, 201 169 110), 0.1)' : 'var(--c-bg)'
                                                                    }}
                                                                >
                                                                    {product.image
                                                                        ? <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.background = 'var(--c-border)' }} />
                                                                        : <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'var(--c-border)', flexShrink: 0 }} />
                                                                    }
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <p style={{ fontSize: '12px', color: 'var(--c-text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                                                                        <p style={{ fontSize: '11px', color: 'var(--c-accent)', margin: '2px 0 0' }}>{product.price || ''}</p>
                                                                    </div>
                                                                    {isSelected && <Check size={13} style={{ color: 'var(--c-accent)', flexShrink: 0 }} />}
                                                                </div>
                                                            )
                                                        })}
                                                        {filteredProducts.length === 0 && (
                                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--c-text-muted)', fontSize: '13px' }}>
                                                                No products found
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* ─── Brand Profile Settings ─── */}
                        <div className="section-card">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                style={{
                                    width: '100%', padding: '18px 24px', background: 'transparent', color: 'var(--c-text)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                                    border: 'none', fontSize: '14px', fontWeight: 600
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Settings size={16} style={{ color: 'var(--c-accent)' }} />
                                    Brand Profile Settings
                                </span>
                                <span style={{ color: 'var(--c-text-muted)', fontSize: '18px', lineHeight: 1, transition: 'transform 0.2s', transform: showSettings ? 'rotate(45deg)' : 'none' }}>+</span>
                            </button>

                            {showSettings && settings && (
                                <div style={{ padding: '24px', borderTop: '1px solid var(--c-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label className="label-pill">Instagram Username</label>
                                        <input
                                            value={settings.username}
                                            placeholder="@handle"
                                            onChange={e => { setSettings(prev => prev ? { ...prev, username: e.target.value } : prev); setIsDirty(true) }}
                                            className="input-field"
                                            style={{ height: '40px', padding: '0 13px', borderRadius: '7px', fontSize: '13px', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label className="label-pill">Instagram Link</label>
                                        <input
                                            value={settings.instagramLink || ''}
                                            placeholder="https://instagram.com/…"
                                            onChange={e => { setSettings(prev => prev ? { ...prev, instagramLink: e.target.value } : prev); setIsDirty(true) }}
                                            className="input-field"
                                            style={{ height: '40px', padding: '0 13px', borderRadius: '7px', fontSize: '13px', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label className="label-pill">Brand Logo</label>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '56px', height: '56px', borderRadius: '8px', flexShrink: 0,
                                                border: '1px solid var(--c-border)', overflow: 'hidden',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'var(--c-bg)'
                                            }}>
                                                {settings.logoUrl
                                                    ? <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <span style={{ fontSize: '9px', color: 'var(--c-text-muted)', textAlign: 'center', padding: '4px' }}>No logo</span>
                                                }
                                            </div>
                                            <input
                                                value={settings.logoUrl}
                                                placeholder="https://…"
                                                onChange={e => { setSettings(prev => prev ? { ...prev, logoUrl: e.target.value } : prev); setIsDirty(true) }}
                                                className="input-field"
                                                style={{ flex: 1, height: '40px', padding: '0 13px', borderRadius: '7px', fontSize: '13px' }}
                                            />
                                            <button
                                                onClick={() => logoFileRef.current?.click()}
                                                disabled={uploadingLogo}
                                                className="btn-ghost"
                                                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
                                            >
                                                {uploadingLogo ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                                Upload
                                            </button>
                                            <input type="file" accept="image/*" style={{ display: 'none' }} ref={logoFileRef} onChange={e => uploadLogo(e.target.files?.[0] || null)} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── RIGHT SIDEBAR: All Products ─── */}
                    <div style={{ position: 'sticky', top: '24px' }}>
                        <div className="section-card">
                            <div className="section-header" style={{ borderBottom: '1px solid var(--c-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-text)' }}>All Products</span>
                                    <span style={{
                                        padding: '2px 10px', borderRadius: '20px',
                                        background: 'rgba(var(--c-accent-rgb, 201 169 110), 0.12)',
                                        color: 'var(--c-accent)', fontSize: '11px', fontWeight: 600
                                    }}>{products.length}</span>
                                </div>
                            </div>

                            <div style={{ padding: '16px 16px 8px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-muted)' }} />
                                    <input
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                        placeholder="Search products…"
                                        className="input-field"
                                        style={{ width: '100%', height: '38px', padding: '0 12px 0 36px', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                </div>
                                {productSearch && (
                                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--c-text-muted)' }}>
                                        {filteredProducts.length} of {products.length} products
                                    </p>
                                )}
                            </div>

                            <div style={{ maxHeight: '560px', overflowY: 'auto', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {filteredProducts.map(product => (
                                    <div key={product.id} style={{
                                        display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                                        border: '1px solid var(--c-border)', background: 'var(--c-bg)', alignItems: 'center'
                                    }}>
                                        {product.image
                                            ? <img src={product.image} alt={product.name} style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.background = 'var(--c-border)' }} />
                                            : <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: 'var(--c-border)', flexShrink: 0 }} />
                                        }
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontSize: '12px', color: 'var(--c-text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{product.name}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--c-accent)', margin: '2px 0 0' }}>{product.price || ''}</p>
                                        </div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--c-text-muted)', fontSize: '13px' }}>
                                        No products found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Sticky Save Bar ─── */}
            {isDirty && !saving && (
                <div style={{
                    position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px',
                    padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '20px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.4)', zIndex: 100, whiteSpace: 'nowrap'
                }}>
                    <span style={{ color: 'var(--c-text-muted)', fontSize: '13px' }}>You have unsaved changes</span>
                    <button
                        onClick={save}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase' }}
                    >
                        <Save size={14} /> Save Changes
                    </button>
                </div>
            )}
        </div>
    )
}