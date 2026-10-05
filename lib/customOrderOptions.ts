// Helpers for admin-managed Custom Order dropdown options — the Jewellery Types
// and Metal Preferences shown on the /custom-order form. Kept separate from the
// product-side metal_options / categories tables; this is custom-order only.

export const OPTION_TYPES = ['category', 'metal'] as const
export type OptionType = (typeof OPTION_TYPES)[number]

export function isOptionType(v: any): v is OptionType {
  return typeof v === 'string' && (OPTION_TYPES as readonly string[]).includes(v)
}

// Fallback defaults used when the custom_order_options table is missing/empty
// (e.g. before migration 104 runs) so the form and admin never come up blank.
export const DEFAULT_CATEGORIES = [
  'Ring', 'Necklace', 'Pendant', 'Earrings', 'Bracelet',
  'Bangle', 'Chain', 'Nose Pin', 'Anklet', 'Other',
]
export const DEFAULT_METALS = [
  'Yellow Gold', 'White Gold', 'Rose Gold', 'Platinum', 'Silver', 'Not sure',
]

export type OptionRow = {
  id: string
  type: OptionType
  label: string
  position: number
  isEnabled: boolean
}

// Row (snake_case DB) → API shape (camelCase).
export function shapeOption(r: any): OptionRow {
  return {
    id: r.id,
    type: r.type,
    label: r.label,
    position: typeof r.position === 'number' ? r.position : Number(r.position) || 0,
    isEnabled: r.is_enabled !== false,
  }
}

// Synthetic fallback rows (stable pseudo-ids) built from the defaults above.
export function fallbackOptions(): OptionRow[] {
  const rows: OptionRow[] = []
  DEFAULT_CATEGORIES.forEach((label, i) =>
    rows.push({ id: `default-category-${i}`, type: 'category', label, position: i, isEnabled: true })
  )
  DEFAULT_METALS.forEach((label, i) =>
    rows.push({ id: `default-metal-${i}`, type: 'metal', label, position: i, isEnabled: true })
  )
  return rows
}

// True when an id refers to a synthetic fallback row (not a real DB row).
export function isFallbackId(id?: string | null): boolean {
  return typeof id === 'string' && id.startsWith('default-')
}
