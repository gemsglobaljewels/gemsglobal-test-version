/* ── Category-aware size option resolution (server-side) ────────────────────
   Two sources feed a product's size picker:
     · `product_size_options` — per-product rows admin ticked,
     · `size_options`         — the global lists (ring / necklace / bracelet…),
                                each optionally scoped via `category_ids`.
   Rules:
     1. saved rows win, but each row inherits its global `category_ids`,
     2. if admin never ticked anything, the globals that apply to this
        product's category become the list (so a necklace offers 14–24 inch
        without per-product setup),
     3. NULL / empty `category_ids` = universal (legacy "One Size" rows).

   Used by both the PDP server render (app/products/[slug]/page.tsx) and the
   product API (app/api/products/[id]/route.ts) so SSR and the client refetch
   always agree. */

import { supabaseServer } from '@/lib/supabaseServer'

export type SizeRow = {
  key: string
  name: string
  price_modifier: number
  is_default?: boolean
  category_ids: string[]
}

/** Global size options with normalized fields. Fail soft (empty list). */
export async function loadGlobalSizes(): Promise<SizeRow[]> {
  try {
    const LEAN = 'key, name, price_modifier, is_enabled, position'
    let data: any = null
    let error: any = null
    ;({ data, error } = await supabaseServer
      .from('size_options')
      .select(`${LEAN}, category_ids`)
      .order('position', { ascending: true }))
    if (error) {
      // Pre-migration DB (no category_ids column) — sizes still work, every
      // row simply counts as universal until migration 118 is run.
      const retry = await supabaseServer
        .from('size_options')
        .select(LEAN)
        .order('position', { ascending: true })
      data = retry.data
      error = retry.error
    }
    if (error) return []
    return ((data || []) as any[]).map((g) => ({
      key: String(g.key),
      name: String(g.name ?? g.key),
      price_modifier: Number(g.price_modifier) || 0,
      is_default: false,
      category_ids: Array.isArray(g.category_ids) ? g.category_ids.map(String) : [],
      is_enabled: g.is_enabled !== false,
      position: Number(g.position) || 0,
    } as SizeRow & { is_enabled: boolean; position: number }))
      .filter((g: any) => g.is_enabled !== false)
  } catch {
    return []
  }
}

/** True when a global size applies to this product's category. */
export function globalSizeApplies(g: SizeRow, productCategoryId?: string | null): boolean {
  if (!g.category_ids || g.category_ids.length === 0) return true
  if (!productCategoryId) return true
  return g.category_ids.includes(String(productCategoryId))
}

/**
 * Final size list for a product: saved rows first (category-annotated),
 * otherwise the applicable global sizes.
 */
export function buildProductSizes(
  saved: any[],
  productCategoryId: string | null | undefined,
  global: SizeRow[]
): SizeRow[] {
  const rows = (saved || []).map((so: any) => ({
    key: String(so.key ?? so.size_name ?? ''),
    name: String(so.size_name ?? so.name ?? so.key ?? ''),
    price_modifier: Number(so.price_modifier) || 0,
    is_default: Boolean(so.is_default),
    category_ids: global.find((g) => g.key === String(so.key))?.category_ids || [],
  })).filter((r) => r.name)

  if (rows.length > 0) return rows

  return global
    .filter((g) => globalSizeApplies(g, productCategoryId))
    .map((g) => ({ ...g, is_default: false }))
}
