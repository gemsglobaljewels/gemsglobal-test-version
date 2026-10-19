/* ── Category scoping for lookup lists (styles, diamond shapes, …) ──────────
   Same model as size options (migration 118/119): a lookup row may carry
   `category_ids` (TEXT[] of category UUIDs). NULL / [] = every category.

   Two concerns live here:
     1. filtering  — does this row apply to product X's category?
     2. grouping   — which homepage section should this row appear under?
        Category rows are collapsed into stable jewellery "families"
        (Rings / Necklaces / Bracelets / …) so a shopper never sees four
        near-identical headings (Engagement Rings, Solitaire, Wedding Bands…).
*/

export type CategoryRef = { id: string; name: string; slug?: string }

/** True when a lookup row applies to the given product category id. */
export function optionAppliesToCategory(
  row: { category_ids?: string[] | null } | null | undefined,
  productCategoryId?: string | null
): boolean {
  const cats = row?.category_ids
  if (!Array.isArray(cats) || cats.length === 0) return true
  if (!productCategoryId) return true
  return cats.map(String).includes(String(productCategoryId))
}

/** Jewellery family a category belongs to — the homepage section heading. */
export function categoryFamily(nameOrSlug?: string | null): string {
  const s = String(nameOrSlug || '').toLowerCase().trim()
  if (!s) return ''
  if (s.includes('earring')) return 'Earrings'
  if (s.includes('ring')) return 'Rings'
  if (s.includes('necklace') || s.includes('pendant')) return 'Necklaces'
  if (s.includes('bracelet') || s.includes('bangle') || s.includes('anklet') || s.includes('cuff') || s.includes('charm')) return 'Bracelets'
  if (s.includes('chain')) return 'Chains'
  if (s.includes('diamond')) return 'Diamonds'
  return String(nameOrSlug).trim()
}

const FAMILY_ORDER = [
  'Featured', 'Rings', 'Necklaces', 'Bracelets', 'Earrings',
  'Chains', 'Diamonds',
]

function orderRank(title: string): number {
  const i = FAMILY_ORDER.indexOf(title)
  return i === -1 ? FAMILY_ORDER.length : i
}

/**
 * Group lookup rows into homepage sections.
 *
 * - rows with no `category_ids` land in a single "Featured" section,
 * - rows scoped to categories land in the family of each of those categories
 *   (a row can legitimately appear in two families if admin scoped it there),
 * - sections keep a stable, jewellery-sensible order; unknown families sort
 *   alphabetically after the known ones.
 *
 * Returns [] when there is nothing to show.
 */
export function groupByFamily<T extends { category_ids?: string[] | null }>(
  rows: T[],
  categories: CategoryRef[] = []
): Array<{ title: string; rows: T[] }> {
  const nameOf = new Map(categories.map((c) => [String(c.id), String(c.name || '')]))
  const buckets = new Map<string, T[]>()

  for (const row of rows || []) {
    const ids = Array.isArray(row?.category_ids) ? row.category_ids : []
    if (ids.length === 0) {
      const list = buckets.get('Featured') || []
      list.push(row)
      buckets.set('Featured', list)
      continue
    }
    const families = new Set<string>()
    for (const id of ids) {
      const fam = categoryFamily(nameOf.get(String(id)) || '')
      if (fam) families.add(fam)
    }
    if (families.size === 0) {
      const list = buckets.get('Featured') || []
      list.push(row)
      buckets.set('Featured', list)
      continue
    }
    for (const fam of families) {
      const list = buckets.get(fam) || []
      list.push(row)
      buckets.set(fam, list)
    }
  }

  return [...buckets.entries()]
    .map(([title, list]) => ({ title, rows: list }))
    .sort((a, b) => {
      const r = orderRank(a.title) - orderRank(b.title)
      return r !== 0 ? r : a.title.localeCompare(b.title)
    })
}

/** "Applies to: Necklaces, Bracelets" — human label for admin rows. */
export function appliesLabel(
  row: { category_ids?: string[] | null },
  categories: CategoryRef[] = []
): string {
  const ids = Array.isArray(row?.category_ids) ? row.category_ids : []
  if (ids.length === 0) return 'All categories'
  const nameOf = new Map(categories.map((c) => [String(c.id), String(c.name || '')]))
  const names = ids.map((id) => nameOf.get(String(id)) || '').filter(Boolean)
  if (names.length === 0) return `${ids.length} categor${ids.length === 1 ? 'y' : 'ies'}`
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

/**
 * True when a row is hidden from ONE homepage box (jewellery family) while
 * still showing in its other boxes. A row can be scoped to several families,
 * and a single global is_enabled flag would hide it from ALL of them —
 * `hidden_families` (family names, e.g. 'Necklaces') keeps the hide
 * box-specific. Combined with is_enabled: visible in a box =
 * is_enabled !== false AND family not in hidden_families.
 */
export function isHiddenInFamily(
  row: { hidden_families?: string[] | null } | null | undefined,
  family: string
): boolean {
  const list = row?.hidden_families
  if (!Array.isArray(list) || list.length === 0) return false
  const f = String(family).trim().toLowerCase()
  if (!f) return false
  return list.some((h) => String(h).trim().toLowerCase() === f)
}

/** Category ids a product form should stamp on a newly added lookup row. */
export function defaultScopeFor(productCategoryId?: string | null, picked?: string[] | null): string[] {
  if (Array.isArray(picked)) return picked.map(String)
  return productCategoryId ? [String(productCategoryId)] : []
}
