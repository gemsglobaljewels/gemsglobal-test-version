'use client'

import { Check, X } from 'lucide-react'
import { appliesLabel, categoryFamily, type CategoryRef } from '@/lib/categoryScope'

/* Inline "applies to which categories" editor used by Admin → Styles and
   Admin → Diamond Shapes. Same idea as the size-options editor: an empty
   selection means the row is universal (shows for every category).

   SIMPLE MODE: instead of one flat wall of 12+ chips, categories are grouped
   into jewellery families (Rings / Earrings / Bracelets …). Each family has
   ONE "tick all / untick all" button on its header, and the individual
   categories sit under it for fine-tuning when needed.

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

  // Group the category rows into stable jewellery families.
  const famMap = new Map<string, CategoryRef[]>()
  for (const c of categories) {
    const fam = categoryFamily(c.name) || 'Other'
    const list = famMap.get(fam) || []
    list.push(c)
    famMap.set(fam, list)
  }
  const fams = [...famMap.entries()]

  const familyAllOn = (list: CategoryRef[]) => list.every((c) => set.has(String(c.id)))
  const toggleFamily = (list: CategoryRef[]) => {
    const next = new Set(set)
    if (list.every((c) => next.has(String(c.id)))) {
      // Whole family already ticked → untick it in one go
      list.forEach((c) => next.delete(String(c.id)))
    } else {
      list.forEach((c) => next.add(String(c.id)))
    }
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
          marginBottom: 12,
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

      {/* One tidy block per jewellery family */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fams.map(([fam, list]) => {
          const allOn = familyAllOn(list)
          return (
            <div key={fam}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-dmsans)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--c-text)',
                  }}
                >
                  {fam}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--c-text-faint)' }}>
                  {list.filter((c) => set.has(String(c.id))).length}/{list.length} ticked
                </span>
                <button
                  type="button"
                  className={`a-btn a-btn--sm ${allOn ? 'a-btn--subtle' : 'a-btn--subtle'}`}
                  style={{ borderStyle: allOn ? 'solid' : 'dashed', marginLeft: 'auto' }}
                  onClick={() => toggleFamily(list)}
                  title={allOn ? `Untick every ${fam} category` : `Tick every ${fam} category`}
                >
                  {allOn ? <X size={12} /> : <Check size={12} />}
                  &nbsp;{allOn ? `Untick all ${fam}` : `Tick all ${fam}`}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 2 }}>
                {list.map((c) => {
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
              </div>
            </div>
          )
        })}
        {categories.length === 0 && (
          <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
            No categories found.
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => onChange([])}>
          All categories (clear)
        </button>
        <button type="button" className="a-btn a-btn--primary a-btn--sm" onClick={onClose}>
          <X size={12} />&nbsp;Done — applies to {noun}
        </button>
      </div>
    </div>
  )
}
