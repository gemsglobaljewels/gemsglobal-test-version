import { isDisplayableImageUrl } from './video'

/* ─── Variant-aware pricing — single source of truth ───────────────────────
   Products can carry Material (metal) and Total Diamond Weight (carat)
   options, each with a price_modifier, plus optional per-combination
   overrides (variant_prices keyed by metal_key + carat_key).

   The bare `product.price` is the unconfigured base — showing it as THE
   price for a variant product confuses shoppers. These helpers resolve
   the FIRST-variant retail: the price of the default configuration (the
   same row the PDP opens with). Cards, quick view and the PDP all use the
   same math so the price a shopper sees stays consistent from listing →
   PDP → bag.
   Option objects come in two shapes depending on the API
   ({name} from the list API, {metal_name}/{carat_name} from /api/products/[id]).

   Kept dependency-free (no JSX) so admin pages can import it without
   pulling the entire ProductCard component graph.
─────────────────────────────────────────────────────────────────────────── */

/* Clamp a raw discount to a sane whole-percent (0-95). */
export function normalizeDiscount(raw: any): number {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(95, n);
}

/* Retail price after a discount%. discount<=0 returns the price unchanged, so
   callers can use this unconditionally. Rounded to 2 decimals (USD base). */
export function salePrice(price: number, discountPercent: number): number {
  const d = normalizeDiscount(discountPercent);
  if (d <= 0) return price;
  return Math.round(price * (1 - d / 100) * 100) / 100;
}

const optName = (o: any, kind: 'metal' | 'carat'): string =>
  String(o?.name ?? (kind === 'metal' ? o?.metal_name : o?.carat_name) ?? '');

/* Display name for a metal/carat option regardless of API shape. */
export const optionDisplayName = optName;

export function hasVariantOptions(p: any): boolean {
  if (!p) return false;
  return (Array.isArray(p.metal_options) && p.metal_options.length > 0) ||
    (Array.isArray(p.carat_options) && p.carat_options.length > 0) ||
    (Array.isArray(p.variant_prices) && p.variant_prices.length > 0);
}

export function startingRetailPrice(p: any): number {
  const base = Number(p?.price) || 0;
  if (!hasVariantOptions(p)) return base;
  const saved: any[] = Array.isArray(p?.variant_prices) ? p.variant_prices : [];
  if (saved.length > 0) {
    const firstRow = saved[0];
    const up = Number(firstRow?.price_modifier);
    if (Number.isFinite(up)) return base + up;
  }
  const d = defaultVariantSelection(p);
  return configuredRetailPrice(p, d.metal || undefined, d.carat || undefined);
}

/* Storefront visibility — variant-aware. A base price of 0 is fine when the
   product carries priced variants (the shopper never sees the bare base);
   such pieces must NOT be treated as archived/unsellable. Mirrors the
   archive convention (archived- slug + zeroed price/stock) for real junk. */
export function isSellableProduct(p: any): boolean {
  if (!p) return false;
  if (String(p.slug || '').toLowerCase().startsWith('archived-')) return false;
  if (!String(p.name || '').trim()) return false;
  const imgs: string[] = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const primary = p.image || imgs[0] || '';
  if (!primary || !isDisplayableImageUrl(primary)) return false;
  return startingRetailPrice(p) > 0;
}

/* Fully-configured retail for an explicit selection — the same math the
   PDP uses (base + per-combination override when present, else the
   metal + carat modifiers, plus any size modifier). Cards / quick view
   have no custom-option sections, so those are PDP-only. */
export function configuredRetailPrice(p: any, metalName?: string, caratName?: string, sizeName?: string): number {
  const base = Number(p?.price) || 0;
  const metals: any[] = Array.isArray(p?.metal_options) ? p.metal_options : [];
  const carats: any[] = Array.isArray(p?.carat_options) ? p.carat_options : [];
  const sizes: any[] = Array.isArray(p?.size_options) ? p.size_options : [];
  const saved: any[] = Array.isArray(p?.variant_prices) ? p.variant_prices : [];
  let up = 0;
  const m = metals.find(o => optName(o, 'metal') === String(metalName || ''));
  const c = carats.find(o => optName(o, 'carat') === String(caratName || ''));
  if (m && c && m.key && c.key) {
    const row = saved.find(v => v && v.metal_key === m.key && v.carat_key === c.key);
    up = row ? (Number(row.price_modifier) || 0)
      : (Number(m.price_modifier) || 0) + (Number(c.price_modifier) || 0);
  } else {
    if (metalName && m) up += Number(m.price_modifier) || 0;
    if (caratName && c) up += Number(c.price_modifier) || 0;
  }
  if (sizeName) {
    const s = sizes.find(o => String(o?.name ?? o?.size_name ?? '') === String(sizeName));
    if (s) up += Number(s.price_modifier) || 0;
  }
  return base + up;
}

/* First-variant default selection (names) — the configuration whose price
   is shown with "Starting at" until the shopper picks their own. Prefers
   admin-flagged defaults, otherwise the first listed option / variant row. */
export function defaultVariantSelection(p: any): { metal: string; carat: string } {
  const metals: any[] = Array.isArray(p?.metal_options) ? p.metal_options : [];
  const carats: any[] = Array.isArray(p?.carat_options) ? p.carat_options : [];
  const saved: any[] = Array.isArray(p?.variant_prices) ? p.variant_prices : [];
  let metal = metals.find(m => m?.is_default)?.name ?? metals.find(m => m?.is_default)?.metal_name ?? '';
  let carat = carats.find(c => c?.is_default)?.name ?? carats.find(c => c?.is_default)?.carat_name ?? '';
  if (metals.length > 0 && carats.length > 0) {
    if (saved.length > 0) {
      const metalByKey: Record<string, any> = {};
      metals.forEach(m => { if (m?.key) metalByKey[m.key] = m; });
      const caratByKey: Record<string, any> = {};
      carats.forEach(c => { if (c?.key) caratByKey[c.key] = c; });
      const valid = saved.filter(v => v && metalByKey[v.metal_key] && caratByKey[v.carat_key]);
      const first = valid[0];
      if (first) {
        const comboOffered = (mm: string, cc: string) =>
          valid.some(v => optName(metalByKey[v.metal_key], 'metal') === mm && optName(caratByKey[v.carat_key], 'carat') === cc);
        // Admin defaults win only when that exact combination is offered;
        // otherwise fall back to the first offered row so the default always
        // matches a real selectable row (price + highlight stay in sync).
        if (!metal || !carat || !comboOffered(String(metal), String(carat))) {
          metal = optName(metalByKey[first.metal_key], 'metal');
          carat = optName(caratByKey[first.carat_key], 'carat');
        }
        return { metal: String(metal || ''), carat: String(carat || '') };
      }
    }
    if (!metal) metal = optName(metals[0], 'metal');
    if (!carat) carat = optName(carats[0], 'carat');
    return { metal: String(metal || ''), carat: String(carat || '') };
  }
  if (metals.length > 0 && !metal) metal = optName(metals[0], 'metal');
  if (carats.length > 0 && !carat) carat = optName(carats[0], 'carat');
  return { metal: String(metal || ''), carat: String(carat || '') };
}

/* ── Per-category sizes ───────────────────────────────────────────────────
   Size options carry optional `category_ids` (TEXT[] of category UUIDs).
   NULL / missing / empty array = universal (legacy behaviour). */

/** True when a size option applies to the given product category id. */
export function sizeAppliesToCategory(option: any, productCategoryId?: string | null): boolean {
  const cats = (option as any)?.category_ids;
  if (!Array.isArray(cats) || cats.length === 0) return true;
  if (!productCategoryId) return true;
  return cats.map(String).includes(String(productCategoryId));
}

const RING_SLUGS = new Set([
  'engagement-rings', 'solitaire', 'three-stone-ring', 'wedding-bands', 'eternity-bands',
]);

function categoryWords(category?: string | null, hierarchy?: string[] | null): string[] {
  const out: string[] = [];
  if (category) out.push(String(category).toLowerCase());
  if (Array.isArray(hierarchy)) {
    for (const h of hierarchy) out.push(String(h || '').toLowerCase());
  }
  return out;
}

/** Section heading for the size picker, adapted to the product's category. */
export function sizeLabelForCategory(category?: string | null, hierarchy?: string[] | null): string {
  const words = categoryWords(category, hierarchy);
  const hasEarring = words.some((w) => w.includes('earring'));
  const hasRing = !hasEarring && words.some((w) => w.includes('ring'));
  if (words.some((w) => w.includes('necklace'))) return 'Select Length (inch)';
  if (words.some((w) => w.includes('bracelet'))) return 'Select Size (inch)';
  if (hasRing) return 'Select Size (US)';
  return 'Select Size';
}

/** True for ring-type categories (US sizing applies). */
export function isRingCategory(category?: string | null, hierarchy?: string[] | null): boolean {
  const words = categoryWords(category, hierarchy);
  const slugOf = (s: string) =>
    String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (words.some((w) => RING_SLUGS.has(slugOf(w)))) return true;
  return words.some((w) => w.includes('ring')) && !words.some((w) => w.includes('earring'));
}
