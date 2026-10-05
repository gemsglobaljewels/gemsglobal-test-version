'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus, Save, RefreshCw, Trash2, Ruler, Scissors, Printer, Circle,
  Hand, PencilRuler, Info, Sparkles,
} from 'lucide-react'

// Icon whitelist — keep in sync with the public page and the API's ALLOWED_ICONS.
const ICONS: Record<string, any> = { Ruler, Scissors, Printer, Circle, Hand, PencilRuler, Info, Sparkles }
const ICON_NAMES = Object.keys(ICONS)

type Step = { id: string; icon: string; title: string; text: string }
type Column = { id: string; label: string }
type Row = { id: string; cells: Record<string, string> }

export default function AdminRingSizeGuidePage() {
  const [welcome, setWelcome] = useState('')
  const [importance, setImportance] = useState('')
  const [measureTitle, setMeasureTitle] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [rows, setRows] = useState<Row[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Local monotonically-increasing counter for new element ids.
  const counter = useRef(0)
  const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${counter.current++}`

  async function load() {
    setError(null)
    try {
      const r = await fetch('/api/ring-size-guide', { cache: 'no-store' })
      const j = await r.json()
      setWelcome(j?.welcome || '')
      setImportance(j?.importance || '')
      setMeasureTitle(j?.measure_title || '')
      setSteps(Array.isArray(j?.measure_steps) ? j.measure_steps : [])
      setColumns(Array.isArray(j?.chart_columns) ? j.chart_columns : [])
      setRows(Array.isArray(j?.chart_rows) ? j.chart_rows : [])
    } catch {
      setError('Failed to load ring size guide')
    }
  }

  useEffect(() => { load() }, [])

  // ---- Steps ---------------------------------------------------------------
  function addStep() {
    setSteps((p) => [...p, { id: newId('s'), icon: ICON_NAMES[0], title: '', text: '' }])
  }
  function updateStep(idx: number, patch: Partial<Step>) {
    setSteps((p) => p.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }
  function removeStep(idx: number) {
    setSteps((p) => p.filter((_, i) => i !== idx))
  }

  // ---- Columns -------------------------------------------------------------
  function addColumn() {
    setColumns((p) => [...p, { id: newId('c'), label: '' }])
  }
  function updateColumn(idx: number, label: string) {
    setColumns((p) => p.map((c, i) => (i === idx ? { ...c, label } : c)))
  }
  function removeColumn(id: string) {
    setColumns((p) => p.filter((c) => c.id !== id))
    // Drop the deleted column's cells from every row.
    setRows((p) => p.map((r) => {
      const { [id]: _, ...rest } = r.cells
      return { ...r, cells: rest }
    }))
  }

  // ---- Rows ----------------------------------------------------------------
  function addRow() {
    setRows((p) => [...p, { id: newId('r'), cells: {} }])
  }
  function updateCell(rowId: string, colId: string, value: string) {
    setRows((p) => p.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r)))
  }
  function removeRow(id: string) {
    setRows((p) => p.filter((r) => r.id !== id))
  }

  async function save() {
    setSaving(true); setError(null); setMessage(null)
    try {
      const payload = {
        welcome,
        importance,
        measure_title: measureTitle,
        measure_steps: steps,
        chart_columns: columns.filter((c) => c.id),
        chart_rows: rows.filter((r) => r.id),
      }
      const r = await fetch('/api/ring-size-guide', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(j?.error || 'Failed to save ring size guide')
      } else {
        setMessage('Saved')
        if (j) {
          setSteps(Array.isArray(j.measure_steps) ? j.measure_steps : steps)
          setColumns(Array.isArray(j.chart_columns) ? j.chart_columns : columns)
          setRows(Array.isArray(j.chart_rows) ? j.chart_rows : rows)
        }
      }
    } catch {
      setError('Failed to save ring size guide')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 1500)
    }
  }

  return (
    <div className="a-page">
      <header className="a-head">
        <div>
          <div className="a-eyebrow">Content</div>
          <h1 className="a-title">Ring Size <em>Guide</em></h1>
          <p className="a-subtitle">Manage the public ring size guide — welcome text, how-to-measure steps, and the size conversion chart.</p>
        </div>
        <div className="a-head-actions">
          <button className="a-btn a-btn--ghost" onClick={load} disabled={saving}>
            <RefreshCw size={15} /> Reload
          </button>
          <a className="a-btn a-btn--subtle" href="/ring-size-guide" target="_blank" rel="noreferrer">
            View page
          </a>
          <button className="a-btn a-btn--primary" onClick={save} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </header>

      {error && (
        <div className="a-card" style={{ borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)', marginBottom: 18 }}>
          <div className="a-card-body" style={{ color: 'var(--c-danger)', fontSize: 13 }}>{error}</div>
        </div>
      )}
      {message && (
        <div className="a-card" style={{ borderColor: 'var(--c-success)', background: 'var(--c-success-bg)', marginBottom: 18 }}>
          <div className="a-card-body" style={{ color: 'var(--c-success)', fontSize: 13 }}>{message}</div>
        </div>
      )}

      {/* ---- Content ------------------------------------------------------ */}
      <div className="a-card" style={{ marginBottom: 18 }}>
        <div className="a-card-head">
          <div className="a-card-title">Page <em>Content</em></div>
          <div className="a-card-sub">Welcome message and importance text</div>
        </div>
        <div className="a-card-body" style={{ display: 'grid', gap: 16 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Welcome message</span>
            <textarea className="a-input" rows={3} value={welcome} onChange={(e) => setWelcome(e.target.value)} placeholder="Welcome to our ring size guide…" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Importance of finding the right size</span>
            <textarea className="a-input" rows={4} value={importance} onChange={(e) => setImportance(e.target.value)} placeholder="Why the right size matters…" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>How-to-measure section heading</span>
            <input className="a-input" value={measureTitle} onChange={(e) => setMeasureTitle(e.target.value)} placeholder="How to measure your ring size" />
          </label>
        </div>
      </div>

      {/* ---- How to measure steps ---------------------------------------- */}
      <div className="a-card" style={{ marginBottom: 18 }}>
        <div className="a-card-head">
          <div className="a-card-title">How to <em>Measure</em> — Steps</div>
          <div className="a-card-sub">{steps.length} step{steps.length === 1 ? '' : 's'}</div>
        </div>
        <div className="a-card-body a-card-body--flush">
          <div className="a-table-wrap">
            <div className="a-table-scroll">
              <table className="a-table">
                <thead>
                  <tr>
                    <th style={{ width: 160 }}>Icon</th>
                    <th style={{ width: 240 }}>Title</th>
                    <th>Description</th>
                    <th className="a-td-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="a-empty">
                          <div className="a-empty-ico"><Ruler size={22} /></div>
                          <div className="a-empty-title">No steps yet</div>
                          <div className="a-empty-text">Add the steps a customer follows to measure their ring size.</div>
                          <button className="a-btn a-btn--primary a-btn--sm" onClick={addStep}><Plus size={15} /> Add Step</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    steps.map((s, idx) => {
                      const Icon = ICONS[s.icon] || Ruler
                      return (
                        <tr key={s.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Icon size={18} />
                              <select className="a-input" value={s.icon} onChange={(e) => updateStep(idx, { icon: e.target.value })}>
                                {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </div>
                          </td>
                          <td>
                            <input className="a-input" value={s.title} placeholder="Cut a strip of paper" onChange={(e) => updateStep(idx, { title: e.target.value })} />
                          </td>
                          <td>
                            <textarea className="a-input" rows={2} value={s.text} placeholder="Describe this step…" onChange={(e) => updateStep(idx, { text: e.target.value })} />
                          </td>
                          <td className="a-td-right">
                            <div className="a-cell-actions">
                              <button className="a-icon-btn a-icon-btn--danger" title="Delete" onClick={() => removeStep(idx)}><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="a-card-foot">
          <button className="a-btn a-btn--subtle" onClick={addStep}><Plus size={15} /> Add Step</button>
        </div>
      </div>

      {/* ---- Size chart -------------------------------------------------- */}
      <div className="a-card">
        <div className="a-card-head">
          <div className="a-card-title">Size <em>Chart</em></div>
          <div className="a-card-sub">{columns.length} column{columns.length === 1 ? '' : 's'} · {rows.length} row{rows.length === 1 ? '' : 's'}</div>
        </div>
        <div className="a-card-body a-card-body--flush">
          <div className="a-table-wrap">
            <div className="a-table-scroll">
              <table className="a-table">
                <thead>
                  <tr>
                    {columns.map((c, idx) => (
                      <th key={c.id} style={{ minWidth: 150 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input className="a-input" value={c.label} placeholder="Column name" onChange={(e) => updateColumn(idx, e.target.value)} />
                          <button className="a-icon-btn a-icon-btn--danger" title="Delete column" onClick={() => removeColumn(c.id)}><Trash2 size={14} /></button>
                        </div>
                      </th>
                    ))}
                    <th style={{ width: 120 }}>
                      <button className="a-btn a-btn--subtle a-btn--sm" onClick={addColumn}><Plus size={14} /> Column</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(1, columns.length + 1)}>
                        <div className="a-empty">
                          <div className="a-empty-ico"><Ruler size={22} /></div>
                          <div className="a-empty-title">No rows yet</div>
                          <div className="a-empty-text">Add columns (regions/measures) and rows of size values.</div>
                          <button className="a-btn a-btn--primary a-btn--sm" onClick={addRow}><Plus size={15} /> Add Row</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id}>
                        {columns.map((c) => (
                          <td key={c.id}>
                            <input className="a-input" value={r.cells[c.id] ?? ''} placeholder="—" onChange={(e) => updateCell(r.id, c.id, e.target.value)} />
                          </td>
                        ))}
                        <td className="a-td-right">
                          <div className="a-cell-actions">
                            <button className="a-icon-btn a-icon-btn--danger" title="Delete row" onClick={() => removeRow(r.id)}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="a-card-foot">
          <button className="a-btn a-btn--subtle" onClick={addColumn}><Plus size={15} /> Add Column</button>
          <button className="a-btn a-btn--subtle" onClick={addRow}><Plus size={15} /> Add Row</button>
          <button className="a-btn a-btn--primary" onClick={save} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
