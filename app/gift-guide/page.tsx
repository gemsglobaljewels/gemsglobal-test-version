import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { DEFAULT_GIFT_GUIDE, normalizeGiftGuide, GiftGuideConfig } from '@/lib/giftGuide'
import GiftGuideContent from '@/components/GiftGuide/GiftGuideContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Jewelry Gift Guide — Thoughtful Gifts for Everyone | Gems Global Jewels',
  description:
    'Find the perfect jewelry gift for her, for him, and for every budget. A hand-selected edit of necklaces, earrings, bracelets and more — beautifully gift-boxed.',
  alternates: { canonical: '/gift-guide' },
  openGraph: {
    title: 'Jewelry Gift Guide — Gifts for Everyone You Love',
    description:
      'A hand-selected edit of pieces that make the perfect gift, for every recipient and every budget.',
    type: 'website',
  },
}

async function getGiftGuide(): Promise<GiftGuideConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('gift_guide')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[GiftGuide Page] GET Error:', error)
      return DEFAULT_GIFT_GUIDE
    }
    return normalizeGiftGuide(data?.config)
  } catch (e) {
    console.error('[GiftGuide Page] GET Catch Error:', e)
    return DEFAULT_GIFT_GUIDE
  }
}

const slugify = (name: string) =>
  String(name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

// "Shop by Recipient" — same source as the homepage recipient rail
// (categories flagged show_on_recipient). Falls back to the config-defined
// recipients in the component if this returns empty.
async function getRecipientCategories(): Promise<any[]> {
  try {
    const { data, error } = await supabaseServer
      .from('categories')
      .select('id, name, slug, image_url')
      .eq('show_on_recipient', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('[GiftGuide Page] recipient categories error:', error)
      return []
    }
    return (data || [])
      .filter((c: any) => c?.name)
      .map((c: any) => ({
        id: String(c.id),
        label: String(c.name),
        image: c.image_url || '',
        link: `/collection/${c.slug || slugify(c.name)}`,
      }))
  } catch (e) {
    console.error('[GiftGuide Page] recipient categories catch:', e)
    return []
  }
}

// Full category tree — powers two things:
//   1. the price section, which resolves "all products of a recipient" by
//      matching the recipient category plus its descendant categories, and
//   2. the "Shop by Category" section, which renders whichever categories the
//      admin opted in via config.category_visibility.
// `select('*')` (not a column list) stays resilient to deployments missing an
// optional column — naming one that doesn't exist makes Supabase reject the
// whole query, mirroring the products fetch below.
async function getAllCategories(): Promise<any[]> {
  try {
    const { data, error } = await supabaseServer
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[GiftGuide Page] all categories error:', error)
      return []
    }
    return (data || []).map((c: any) => ({
      id: String(c.id),
      name: String(c.name || ''),
      slug: c.slug || slugify(c.name),
      parent_category_id: c.parent_category_id ? String(c.parent_category_id) : null,
      image: String(c.image_url || c.header_image_url || ''),
      description: c.header_description ? String(c.header_description) : '',
    }))
  } catch (e) {
    console.error('[GiftGuide Page] all categories catch:', e)
    return []
  }
}

// Catalog fetch with variant option tables resolved — cards need metal/carat
// modifiers + per-combination overrides to show the first-variant price instead
// of the bare base (which is stored as ₹0 for variant-only products). Mirrors
// the collection-page resolver and /api/products for consistency.
async function getGiftProducts(): Promise<any[]> {
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*, categories:categories(id, name, parent_category_id)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GiftGuide Page] products error:', error)
      return []
    }
    const list = (data || []).filter(
      (p: any) => !String(p.slug || '').toLowerCase().startsWith('archived-')
    )
    if (list.length === 0) return []

    const productIds = list.map((p: any) => p.id)

    // Variant options — same fail-soft strategy as /api/products and the
    // collection page (table missing = empty, cards fall back cleanly).
    let allMetalOptions: any[] = []
    let allSizeOptions: any[] = []
    let allCaratOptions: any[] = []
    let allVariantPrices: any[] = []
    try {
      const [m, s, c] = await Promise.all([
        supabaseServer.from('product_metal_options').select('product_id, key, metal_name, price_modifier, is_default').in('product_id', productIds),
        supabaseServer.from('product_size_options').select('product_id, key, size_name, price_modifier, is_default').in('product_id', productIds),
        supabaseServer.from('product_carat_options').select('product_id, key, carat_name, price_modifier, is_default').in('product_id', productIds),
      ])
      if (!m.error) allMetalOptions = m.data || []
      if (!s.error) allSizeOptions = s.data || []
      if (!c.error) allCaratOptions = c.data || []
    } catch { /* options stay empty */ }
    try {
      const v = await supabaseServer.from('product_variant_prices').select('product_id, metal_key, carat_key, price_modifier').in('product_id', productIds)
      if (!v.error) allVariantPrices = v.data || []
    } catch { /* per-row overrides stay empty */ }

    return list.map((p: any) => {
      const pid = String(p.id)
      return {
        ...p,
        metal_options: allMetalOptions.filter((mo: any) => String(mo.product_id) === pid).map((mo: any) => ({
          key: mo.key,
          name: mo.metal_name,
          price_modifier: mo.price_modifier,
          is_default: mo.is_default,
        })),
        size_options: allSizeOptions.filter((so: any) => String(so.product_id) === pid).map((so: any) => ({
          key: so.key,
          name: so.size_name,
          price_modifier: so.price_modifier,
          is_default: so.is_default,
        })),
        carat_options: allCaratOptions.filter((co: any) => String(co.product_id) === pid).map((co: any) => ({
          key: co.key,
          name: co.carat_name,
          price_modifier: co.price_modifier,
          is_default: co.is_default,
        })),
        variant_prices: allVariantPrices.filter((v: any) => String(v.product_id) === pid).map((v: any) => ({
          metal_key: v.metal_key,
          carat_key: v.carat_key,
          price_modifier: Number(v.price_modifier) || 0,
        })),
      }
    })
  } catch (e) {
    console.error('[GiftGuide Page] products catch:', e)
    return []
  }
}

export default async function GiftGuidePage() {
  const [config, products, recipientCards, allCategories] = await Promise.all([
    getGiftGuide(),
    getGiftProducts(),
    getRecipientCategories(),
    getAllCategories(),
  ])

  return (
    <GiftGuideContent
      config={config}
      products={products}
      recipientCards={recipientCards}
      allCategories={allCategories}
    />
  )
}
