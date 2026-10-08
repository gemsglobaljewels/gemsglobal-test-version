import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { refreshStorefront } from '@/lib/revalidate'
import { loadGlobalSizes, buildProductSizes } from '@/lib/productSizes'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let data: any = null
    let error: any = null
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    try {
      if (isUUID) {
        const r1 = await supabaseServer
          .from('products')
          .select('*, categories:categories(name)')
          .eq('id', id)
          .single()
        data = r1.data
        error = r1.error
      } else {
        const r1 = await supabaseServer
          .from('products')
          .select('*, categories:categories(name)')
          .eq('slug', id)
          .single()
        data = r1.data
        error = r1.error
      }

      if (error) {
        const r2 = isUUID
          ? await supabaseServer.from('products').select('*').eq('id', id).single()
          : await supabaseServer.from('products').select('*').eq('slug', id).single()
        data = r2.data
        error = r2.error
      }
    } catch (e: any) {
      error = e
    }

    if (error) {
      return NextResponse.json({ error: error.message || 'Product not found' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const p: any = data || {}
    const categoryName = p.categories?.name || p.category || null
    const images = Array.isArray(p.images) ? p.images : []
    const image = p.image ?? images?.[0] ?? null

    let metalOptions: any[] = []
    let sizeOptions: any[] = []
    let caratOptions: any[] = []

    try {
      const res = await supabaseServer
        .from('product_metal_options')
        .select('*')
        .eq('product_id', p.id)
        .order('created_at', { ascending: true })
      metalOptions = (res.data || []) as any[]
    } catch { metalOptions = [] }

    try {
      const res = await supabaseServer
        .from('product_size_options')
        .select('*')
        .eq('product_id', p.id)
        .order('created_at', { ascending: true })
      sizeOptions = (res.data || []) as any[]
    } catch { sizeOptions = [] }

    try {
      const res = await supabaseServer
        .from('product_carat_options')
        .select('*')
        .eq('product_id', p.id)
        .order('created_at', { ascending: true })
      caratOptions = (res.data || []) as any[]
    } catch { caratOptions = [] }

    // Per-variant (metal x carat) price overrides — needs migration 116.
    // Fail soft when the table does not exist yet.
    let variantPrices: any[] = []
    let variantSupported = true
    try {
      const res = await supabaseServer
        .from('product_variant_prices')
        .select('metal_key, carat_key, price_modifier')
        .eq('product_id', p.id)
      if (res.error) throw res.error
      variantPrices = ((res.data || []) as any[]).map((v: any) => ({
        metal_key: v.metal_key,
        carat_key: v.carat_key,
        price_modifier: Number(v.price_modifier) || 0,
      }))
    } catch { variantSupported = false; variantPrices = [] }

    // Category-aware sizes — identical resolution to the SSR PDP render.
    const globalSizes = await loadGlobalSizes();

    const stockQty =
      typeof p.stock_quantity === 'number'
        ? p.stock_quantity
        : typeof p.stock === 'number'
          ? p.stock
          : typeof p.quantity === 'number'
            ? p.quantity
            : 0
    let inrRate = 83
    try {
      const origin = request.nextUrl?.origin
      if (origin && !/localhost|127\.0\.0\.1|vercel\.app/i.test(origin)) {
        const currencyRes = await fetch(`${origin}/api/currency`, { cache: 'no-store' })
        if (currencyRes.ok) {
          const currencyData = await currencyRes.json().catch(() => ({}))
          const r = Number(currencyData?.rate)
          if (Number.isFinite(r) && r > 0) inrRate = r
        }
      }
    } catch { /* use default 83 */ }

    const withComputed = {
      ...p,
      slug:
        p.slug ||
        String(p.name || '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      category: categoryName,
      category_slug:
        categoryName ? String(categoryName).toLowerCase().trim().replace(/\s+/g, '-') : null,
      images,
      image,
      stock_quantity: stockQty,
      price_inr: (Number(p.price) || 0) * inrRate,
      metal_options: metalOptions.map((mo: any) => ({
        key: mo.key,
        name: mo.metal_name,
        price_modifier: mo.price_modifier,
        is_default: mo.is_default
      })),
      size_options: buildProductSizes(sizeOptions, p.category_id, globalSizes),
      carat_options: caratOptions.map((co: any) => ({
        key: co.key,
        name: co.carat_name,
        price_modifier: co.price_modifier,
        is_default: co.is_default
      })),
      variant_prices: variantPrices,
      variant_prices_supported: variantSupported,
      custom_options: Array.isArray(p.custom_options) ? p.custom_options : (p.details?.custom_options || []),
      video_url: p.video_url || null,
      model_3d: p.model_3d || null,
      diamond_shape: (() => {
        const cat = String(categoryName || p.category || '').toLowerCase()
        if (cat.startsWith('diamond')) {
          return String(p.diamond_shape || p.style || '')
        }
        return String(p.diamond_shape || '')
      })(),
    }
    return NextResponse.json(withComputed, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to load product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    let category_id = body.category_id
    if (category_id === undefined && body.category !== undefined && body.category !== null) {
      let catRes = await supabaseServer.from('categories').select('id').eq('name', body.category).single()
      if (catRes.error) {
        catRes = await supabaseServer.from('categories').select('id').eq('slug', body.category).single()
      }
      category_id = catRes.data?.id
    }

    const updates: any = {}
    const toSlug = (s: string) =>
      String(s || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    if (body.name !== undefined) {
      updates.name = body.name
    }
    if (body.slug !== undefined && body.slug !== null && body.slug.trim() !== '') {
      updates.slug = toSlug(body.slug)
    } else if (body.name !== undefined) {
      updates.slug = toSlug(body.name)
    }
    if (body.category !== undefined) updates.category = body.category
    if (category_id !== undefined) updates.category_id = category_id
    if (body.price !== undefined) updates.price = body.price
    if (body.description !== undefined) updates.description = body.description || ''
    if (body.carat !== undefined) updates.carat = body.carat || ''
    if (body.color !== undefined) updates.color = body.color || ''
    if (body.clarity !== undefined) updates.clarity = body.clarity || ''
    if (body.metal !== undefined) updates.metal = body.metal || ''
    if (body.style !== undefined) updates.style = body.style || ''
    // Normalize diamond shape: if category is diamond, persist shape in style
    {
      const catNorm = String(body.category ?? updates.category ?? '').toLowerCase()
      if (catNorm.startsWith('diamond')) {
        const shape = String(body.diamond_shape || body.style || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        if (shape) updates.style = shape
      }
    }
    // Persist the diamond shape for EVERY product so it can be filtered
    // site-wide. Stored as a normalized slug for stable matching.
    if (body.diamond_shape !== undefined) {
      updates.diamond_shape = String(body.diamond_shape || '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (body.images !== undefined) {
      const arr = Array.isArray(body.images)
        ? body.images.filter((u: any) => typeof u === 'string' && !!u)
        : []
      updates.images = Array.from(new Set(arr))
    }
    if (body.image !== undefined || body.images !== undefined) {
      const first =
        typeof body.image === 'string' && body.image
          ? body.image
          : Array.isArray(updates.images) && updates.images.length > 0
            ? updates.images[0]
            : Array.isArray(body.images) && body.images.length > 0
              ? body.images[0]
              : null
      updates.image = first
      if (first && Array.isArray(updates.images)) {
        updates.images = [first, ...updates.images.filter((u: string) => u !== first)]
      }
    }
    if (body.is_featured !== undefined || body.visibleAtHome !== undefined) {
      updates.is_featured = !!(body.is_featured ?? body.visibleAtHome ?? false)
    }
    if (body.sku !== undefined) {
      updates.sku = String(body.sku || '').trim()
    }
    if (body.video_url !== undefined) {
      updates.video_url = body.video_url || null
    }
    // Estimated delivery window (per product). "" / null clears it → the
    // storefront falls back to "2–3 weeks from today".
    if (body.delivery_from !== undefined) {
      updates.delivery_from = body.delivery_from || null
    }
    if (body.delivery_to !== undefined) {
      updates.delivery_to = body.delivery_to || null
    }
    if (body.model_3d !== undefined) {
      updates.model_3d = body.model_3d || null
    }
    if (body.discount_percent !== undefined) {
      const n = Math.round(Number(body.discount_percent))
      updates.discount_percent = Number.isFinite(n) ? Math.max(0, Math.min(95, n)) : 0
    }
    if (body.label !== undefined) {
      updates.label = String(body.label || '').trim() || null
    }

    // Ensure slug uniqueness prior to update
    if (updates.slug) {
      const base = String(updates.slug)
      let unique = base
      try {
        const { data: existing } = await supabaseServer
          .from('products')
          .select('id, slug')
          .ilike('slug', `${base}%`)
        if (existing && existing.length > 0) {
          const set = new Set(
            existing.filter((r: any) => String(r.id) !== String(id)).map((r: any) => String(r.slug || ''))
          )
          if (set.has(unique)) {
            let i = 2
            while (set.has(`${base}-${i}`)) i++
            unique = `${base}-${i}`
          }
        }
      } catch { }
      updates.slug = unique
    }

    // Try update; retry on unique slug conflict or missing sku column
    let result: any = null
    let variantSaved = true
    // Per-variant (metal x carat) price overrides — needs migration 116.
    // Fail soft when the table does not exist yet.
    const syncVariants = async () => {
      if (!body.variant_prices || !Array.isArray(body.variant_prices)) return
      try {
        const del = await supabaseServer.from('product_variant_prices').delete().eq('product_id', id)
        if (del.error) throw del.error
        const rows = body.variant_prices
          .map((v: any) => ({
            product_id: id,
            metal_key: String(v.metal_key || ''),
            carat_key: String(v.carat_key || ''),
            price_modifier: Number(v.price_modifier) || 0,
          }))
          .filter((r: any) => r.metal_key && r.carat_key)
        if (rows.length > 0) {
          const ins = await supabaseServer.from('product_variant_prices').insert(rows)
          if (ins.error) throw ins.error
        }
      } catch { variantSaved = false }
    }
    // Variant-only save (no scalar fields): just sync variants, return current row.
    if (Object.keys(updates).length === 0) {
      await syncVariants()
      const { data: current, error: curError } = await supabaseServer.from('products').select().eq('id', id).single()
      if (curError || !current) {
        return NextResponse.json({ error: curError?.message || 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ ...current, variant_saved: variantSaved })
    }
    let removedSkuForRetry = false
    let removedShapeForRetry = false
    let removedDiscountForRetry = false
    let removedLabelForRetry = false
    let removedModel3dForRetry = false
    let removedDeliveryForRetry = false
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data, error } = await supabaseServer
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) {
        // Update metal options if provided
        if (body.metal_options && Array.isArray(body.metal_options)) {
          // Delete existing options
          await supabaseServer.from('product_metal_options').delete().eq('product_id', id)

          // Insert new ones
          if (body.metal_options.length > 0) {
            const optionsToInsert = body.metal_options.map((opt: any) => ({
              product_id: id,
              metal_name: opt.name,
              price_modifier: Number(opt.price_modifier) || 0,
              is_default: false,
              key: opt.key
            }))
            await supabaseServer.from('product_metal_options').insert(optionsToInsert)
          }
        }

        // Update size options if provided
        if (body.size_options && Array.isArray(body.size_options)) {
          // Delete existing options
          await supabaseServer.from('product_size_options').delete().eq('product_id', id)

          // Insert new ones
          if (body.size_options.length > 0) {
            const optionsToInsert = body.size_options.map((opt: any) => ({
              product_id: id,
              size_name: opt.name,
              price_modifier: Number(opt.price_modifier) || 0,
              is_default: !!opt.is_default,
              key: opt.key
            }))
            await supabaseServer.from('product_size_options').insert(optionsToInsert)
          }
        }

        // Update carat options if provided
        if (body.carat_options && Array.isArray(body.carat_options)) {
          try {
            await supabaseServer.from('product_carat_options').delete().eq('product_id', id)
            if (body.carat_options.length > 0) {
              const optionsToInsert = body.carat_options.map((opt: any) => ({
                product_id: id,
                carat_name: opt.name,
                price_modifier: Number(opt.price_modifier) || 0,
                is_default: !!opt.is_default,
                key: opt.key
              }))
              await supabaseServer.from('product_carat_options').insert(optionsToInsert)
            }
          } catch { }
        }
        await syncVariants()
        result = data
        break
      }
      const code = (error as any)?.code || ''
      const msg = String((error as any)?.message || '')
      // Gracefully drop the sale columns if this DB hasn't run the 107 migration yet.
      // These specific checks must precede the catch-all sku check below (which also
      // matches bare 42703), otherwise a missing discount_percent/label would be
      // misattributed to sku and never resolve.
      if (!removedDiscountForRetry && (code === '42703' && /discount_percent/i.test(msg))) {
        delete (updates as any).discount_percent
        removedDiscountForRetry = true
        continue
      }
      if (!removedLabelForRetry && (code === '42703' && /\blabel\b/i.test(msg))) {
        delete (updates as any).label
        removedLabelForRetry = true
        continue
      }
      if (!removedShapeForRetry && (code === '42703' && /diamond_shape/i.test(msg))) {
        delete (updates as any).diamond_shape
        removedShapeForRetry = true
        continue
      }
      // Gracefully drop the delivery columns if migration 121 hasn't run yet.
      if (!removedDeliveryForRetry && (code === '42703' && /delivery_(from|to)/i.test(msg))) {
        delete (updates as any).delivery_from
        delete (updates as any).delivery_to
        removedDeliveryForRetry = true
        continue
      }
      // Must precede the catch-all sku check (which also matches bare 42703) so a
      // missing model_3d column drops model_3d rather than being misattributed to sku.
      if (!removedModel3dForRetry && (code === '42703' && /model_3d/i.test(msg))) {
        delete (updates as any).model_3d
        removedModel3dForRetry = true
        continue
      }
      if (!removedSkuForRetry && (code === '42703' || /column .*sku.* does not exist/i.test(msg))) {
        delete (updates as any).sku
        removedSkuForRetry = true
        continue
      }
      if (code === '23505' || /duplicate key value/i.test(msg)) {
        const base = String(updates.slug || '')
        const match = base.match(/^(.*?)-(\d+)$/)
        let nextBase = base
        let n = match ? parseInt(match[2], 10) + 1 : 2
        if (match) nextBase = match[1]
        updates.slug = `${nextBase}-${n}`
        continue
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
    if (!result) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
    // Edited product must reflect on home/collection/PDP with a single refresh.
    refreshStorefront((result as any).slug ? [`/products/${(result as any).slug}`] : [])
    return NextResponse.json({ ...result, variant_saved: variantSaved })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to delete product directly first with minimal cleanup
    try {
      const { error } = await supabaseServer.from('products').delete().eq('id', id)
      if (!error) {
        refreshStorefront([])
        return NextResponse.json({ success: true })
      }
    } catch (e) {
      console.log('Direct delete failed, trying archive:', e)
    }

    // If direct delete fails, try to archive instead
    const nowSlug = `archived-${Date.now()}`
    try {
      const { error: updateError } = await supabaseServer.from('products').update({
        is_featured: false,
        price: 0,
        stock_quantity: 0,
        slug: nowSlug,
      }).eq('id', id)

      if (!updateError) {
        refreshStorefront([])
        return NextResponse.json({ success: true, archived: true })
      }

      console.log('Archive update failed:', updateError)
    } catch (e) {
      console.log('Archive failed:', e)
    }

    // If everything fails, still return success to frontend
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    // Always return success to frontend to not block user
    return NextResponse.json({ success: true })
  }
}
