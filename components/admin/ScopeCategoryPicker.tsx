'use client'

import { Check, X } from 'lucide-react'
import { appliesLabel, type CategoryRef } from '@/lib/categoryScope'

/* Inline "applies to which categories" editor used by Admin → Styles and
   Admin → Diamond Shapes. Same idea as the size-options editor: an empty
   selection means the row is universal (shows for every category).

   This is a controlled editor — the parent owns the row and persists with
   its own Save button, so changes here are local until saved. */
export default function ScopeCategoryPicker({
  value,
  categories,
  onChange,
  onClose,
  rowLabel,
  noun = 'this style',
}: {
  value: string[]
  categories: CategoryRef[]
  onChange: (ids: string[]) => void
  onClose: () => void
  rowLabel: string
  noun?: string
}) {
  const set = new Set((value || []).map(String))
  const toggle = (id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(String(id))
    else next.add(String(id))
    onChange([...next])
  }

  return (
    <div
      style={{
        margin: '6px 0 12px',
        padding: 12,
        border: '1px dashed var(--c-border)',
        borderRadius: 'var(--radius)',
        background: 'var(--c-surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-dmsans)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--c-text-muted)',
          }}
        >
          Show “{rowLabel}” for — nothing ticked means all categories
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-dmsans)',
            fontSize: 11,
            color: 'var(--c-text-muted)',
          }}
        >
          Currently: <strong style={{ color: 'var(--c-text)' }}>{appliesLabel({ category_ids: value }, categories)}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {categories.map((c) => {
          const on = set.has(String(c.id))
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(String(c.id))}
              className={`a-btn a-btn--sm ${on ? 'a-btn--primary' : 'a-btn--subtle'}`}
              style={on ? undefined : { borderStyle: 'dashed' }}
              title={c.name}
            >
              {on ? <Check size={12} /> : null}&nbsp;{c.name}
            </button>
          )
        })}
        {categories.length === 0 && (
          <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
            No categories found.
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => onChange([])}>
          All categories
        </button>
        <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={onClose}>
          <X size={12} />&nbsp;Done — applies to {noun}
        </button>
      </div>
    </div>
  )
}
