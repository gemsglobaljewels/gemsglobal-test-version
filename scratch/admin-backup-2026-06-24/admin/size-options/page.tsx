'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type SizeItem = { key: string; name: string; price_modifier?: number; is_enabled?: boolean; position?: number }

export default function AdminSizeOptionsPage() {
  const [items, setItems] = useState<SizeItem[]>([])
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
      const r = await fetch('/api/size-options', { cache: 'no-store' })
      const j = await r.json()
      setItems(Array.isArray(j) ? j : [])
    } catch {
      setItems([])
    }
  }

  useEffect(() => { load() }, [])

  function addRow() {
    setItems((prev) => [...prev, { key: '', name: '', price_modifier: 0, is_enabled: true, position: prev.length }])
  }
  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateRow(idx: number, patch: Partial<SizeItem>) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function deleteRow(key: string) {
    try {
      const res = await fetch(`/api/size-options?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Delete failed')
      }
      setItems((prev) => prev.filter((it) => it.key !== key))
      setMessage('Deleted')
      setTimeout(() => setMessage(null), 1200)
    } catch (err: any) {
      setError(err?.message || 'Delete failed')
    }
  }

  async function save() {
    setSaving(true); setError(null); setMessage(null)
    try {
      const clean = items
        .map((it, idx) => {
          const key = it.key ? slugify(it.key) : slugify(it.name || '')
          return { ...it, key, position: idx }
        })
        .filter((it) => it.key && it.name)
      const r = await fetch('/api/size-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: clean }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(j?.error || 'Failed to save size options')
      } else {
        setMessage('Saved')
        setItems(Array.isArray(j) ? j : clean)
      }
    } catch {
      setError('Failed to save size options')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-background dm-text">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Size Options</h1>
        <p className="text-sm text-foreground/60 mb-6">Control which size options are available globally for products and their default price modifiers.</p>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        {message && <div className="mb-4 text-green-600 text-sm">{message}</div>}
        <div className="border rounded-md divide-y bg-card">
          <div className="grid grid-cols-12 gap-3 p-3 text-xs text-foreground/60 sticky top-0 bg-card/80 backdrop-blur">
            <div className="col-span-3">Name (e.g., 6.5)</div>
            <div className="col-span-3">Key (slug)</div>
            <div className="col-span-2">Price Modifier ($)</div>
            <div className="col-span-2">Position</div>
            <div className="col-span-1 text-center">Visible</div>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 p-3 items-center hover:bg-secondary/20 transition-colors">
              <input className="col-span-3 border rounded px-2 py-1 text-sm" value={it.name || ''} placeholder="6.5" onChange={(e) => updateRow(idx, { name: e.target.value })} />
              <input className="col-span-3 border rounded px-2 py-1 text-sm" value={it.key || ''} placeholder="6-5" onChange={(e) => updateRow(idx, { key: e.target.value })} />
              <input type="number" step="0.01" className="col-span-2 border rounded px-2 py-1 text-sm" value={it.price_modifier || 0} placeholder="0" onChange={(e) => updateRow(idx, { price_modifier: Number(e.target.value) || 0 })} />
              <input type="number" className="col-span-2 border rounded px-2 py-1 text-sm" value={it.position ?? idx} placeholder={String(idx)} onChange={(e) => updateRow(idx, { position: Number(e.target.value) || idx })} />
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
          <Button variant="outline" onClick={addRow} disabled={saving}>Add Size Option</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          <Button variant="outline" onClick={load} disabled={saving}>Reload</Button>
        </div>
      </main>
    </div>
  )
}
