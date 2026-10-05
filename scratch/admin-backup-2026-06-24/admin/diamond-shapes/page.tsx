'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type ShapeItem = { key: string; name: string; sub?: string; image?: string; is_enabled?: boolean }

export default function AdminDiamondShapesPage() {
  const [items, setItems] = useState<ShapeItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function slugify(s: string) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function load() {
    setError(null)
    try {
      const r = await fetch('/api/diamond-shapes', { cache: 'no-store' })
      const j = await r.json()
      setItems(Array.isArray(j) ? j : [])
    } catch {
      setItems([])
    }
  }

  useEffect(() => { load() }, [])

  function addRow() {
    setItems((prev) => [...prev, { key: '', name: '', sub: '', image: '', is_enabled: true }])
  }
  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateRow(idx: number, patch: Partial<ShapeItem>) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function uploadImage(idx: number, file: File | null) {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/diamond-shapes/upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (r.ok && j?.url) {
        updateRow(idx, { image: j.url })
      } else {
        setError(j?.error || 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    }
  }

  async function deleteRow(key: string) {
    try {
      await fetch(`/api/diamond-shapes?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((it) => it.key !== key))
      setMessage('Deleted')
      setTimeout(() => setMessage(null), 1200)
    } catch {
      setError('Delete failed')
    }
  }

  async function save() {
    setSaving(true); setError(null); setMessage(null)
    try {
      const clean = items
        .map((it) => {
          const key = it.key ? slugify(it.key) : slugify(it.name || '')
          return { ...it, key }
        })
        .filter((it) => it.key && it.name)
      const r = await fetch('/api/diamond-shapes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: clean }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(j?.error || 'Failed to save diamond shapes')
      } else {
        setMessage('Saved')
        setItems(Array.isArray(j) ? j : clean)
        // Reload data from server to ensure we have the latest
        await load()
      }
    } catch {
      setError('Failed to save diamond shapes')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 1500)
    }
  }

  function toggle(key: string) {
    setItems((prev) => prev.map((it) => it.key === key ? { ...it, is_enabled: !(it.is_enabled !== false) ? false : true } : it))
  }

  return (
    <div className="min-h-screen bg-background dm-text">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Diamond Shapes</h1>
        <p className="text-sm text-foreground/60 mb-6">Control which diamond shapes show on the homepage Explore Shapes section and collection filters.</p>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        {message && <div className="mb-4 text-green-600 text-sm">{message}</div>}
        <div className="border rounded-md divide-y bg-card">
          <div className="grid grid-cols-12 gap-3 p-3 text-xs text-foreground/60 sticky top-0 bg-card/80 backdrop-blur">
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Key (slug)</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-4">Image</div>
            <div className="col-span-1 text-center">Visible</div>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 p-3 items-center hover:bg-secondary/20 transition-colors">
              <input className="col-span-2 border rounded px-2 py-1 text-sm" value={it.name || ''} placeholder="Round" onChange={(e) => updateRow(idx, { name: e.target.value })} />
              <input className="col-span-2 border rounded px-2 py-1 text-sm" value={it.key || ''} placeholder="round" onChange={(e) => updateRow(idx, { key: e.target.value })} />
              <input className="col-span-3 border rounded px-2 py-1 text-sm" value={it.sub || ''} placeholder="A classic cut..." onChange={(e) => updateRow(idx, { sub: e.target.value })} />
              <div className="col-span-4 flex items-center gap-2">
                <div className="w-10 h-10 rounded bg-secondary overflow-hidden border border-border flex items-center justify-center flex-shrink-0">
                  {it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-foreground/50">No img</span>}
                </div>
                <input className="flex-1 border rounded px-2 py-1 text-sm min-w-0" value={it.image || ''} placeholder="image URL" onChange={(e) => updateRow(idx, { image: e.target.value })} />
                <label className="px-2 py-1 rounded bg-secondary text-xs cursor-pointer border border-border flex-shrink-0">
                  Upload
                  <input type="file" accept="image/*" onChange={(e) => uploadImage(idx, e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <input type="checkbox" checked={!(it.is_enabled === false)} onChange={() => updateRow(idx, { is_enabled: it.is_enabled === false })} />
              </div>
              <div className="col-span-12 flex justify-end gap-3">
                <button className="text-xs text-red-600 hover:underline" onClick={() => it.key ? deleteRow(it.key) : removeRow(idx)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={addRow} disabled={saving}>Add Shape</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          <Button variant="outline" onClick={load} disabled={saving}>Reload</Button>
        </div>
      </main>
    </div>
  )
}
