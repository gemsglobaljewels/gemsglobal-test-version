import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { refreshStorefront } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const styleParam = searchParams.get('style') || ''
  const shapeParam = searchParams.get('shape') || ''
  const featured = searchParams.get('featured')
  const slug = searchParams.get('slug') || ''
  const page = Number(searchParams.get('page') || '1')
  const limit = Number(searchParams.get('limit') || '1000')
  const offset = (page - 1) * limit

  // 1. Fetch categories for parent-child filtering and hierarchy (only the
  //    columns actually used below — avoids shipping unused category fields).
  const { data: allCategories, error: categoriesError } = await supabaseServer
    .from('categories')
    .select('id, name, slug, parent_category_id')

  // 2. Fetch products to handle complex filtering and counts for small-mid datasets.
  //    Push the featured filter to PostgreSQL so the homepage's frequent
  //    `?featured=true` request transfers only featured rows instead of the
  //    entire catalog. is_featured is a boolean column (POST always writes
  //    `!!value`); the lenient JS filter below is preserved as a safety net.
  let productQuery = supabaseServer
    .from('products')
    .select('*, categories:categories(id, name, parent_category_id)')
    .order('created_at', { ascending: false })

  if (featured === 'true') {
    productQuery = productQuery.eq('is_featured', true)
  }

  const { data, error } = await productQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let list = data || []

  // 2. Apply Robust Filtering (Archived)
  const norm = (s: any) => String(s || '').toLowerCase().replace(/\s+/g, '')
  list = list.filter(p => {
    const sl = norm(p.slug)

    // Only hide archived placeholders
    if (sl.startsWith('archived-')) return false

    return true
  })

  // 3. Apply Query Parameters
  if (slug) {
    const s = slug.toLowerCase()
    list = list.filter(p => {
      const dbSlug = p.slug?.toLowerCase()
      if (dbSlug === s) return true

      // Fallback: if no slug in DB, check against name-based slug
      if (!dbSlug && p.name) {
        const computed = String(p.name).toLowerCase().trim().replace(/\s+/g, '-')
        if (computed === s) return true

        // Also check the more aggressive slug format used in other parts of the app
        const aggressive = String(p.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        if (aggressive === s) return true
      }
      return false
    })
  }

  if (featured === 'true') {
    // Be lenient: check for true specifically or truthy values
    list = list.filter(p => p.is_featured === true || p.is_featured === 'true' || p.is_featured === 1)
  }

  if (category && category !== 'all') {
    const c = category.toLowerCase()
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category)

    // Find all category IDs that match (including parent and children)
    let matchingCategoryIds: string[] = []

    if (allCategories && allCategories.length > 0) {
      if (isUUID) {
        // Find category by ID and get all its children
        const targetCat = allCategories.find(cat => cat.id === category)
        if (targetCat) {
          matchingCategoryIds.push(targetCat.id)
          // Add all children
          const children = allCategories.filter(cat => cat.parent_category_id === targetCat.id)
          matchingCategoryIds.push(...children.map(c => c.id))
        }
      } else {
        // Find category by name and get all its children
        const targetCat = allCategories.find(cat =>
          String(cat.name).toLowerCase() === c ||
          String(cat.slug).toLowerCase() === c
        )
        if (targetCat) {
          matchingCategoryIds.push(targetCat.id)
          // Add all children
          const children = allCategories.filter(cat => cat.parent_category_id === targetCat.id)
          matchingCategoryIds.push(...children.map(c => c.id))
        }
      }
    }

    if (matchingCategoryIds.length > 0) {
      // Filter by category_id OR category name
      list = list.filter(p => {
        if (p.category_id && matchingCategoryIds.includes(p.category_id)) return true
        const catName = String(p.categories?.name || p.category || '').toLowerCase()
        return catName === c || catName.replace(/\s+/g, '-') === c
      })
    } else {
      // Fallback to original logic if we couldn't find categories
      if (isUUID) {
        list = list.filter(p => p.category_id === category)
      } else {
        list = list.filter(p => {
          const catName = String(p.categories?.name || p.category || '').toLowerCase()
          return catName === c || catName.replace(/\s+/g, '-') === c
        })
      }
    }
  }

  if (search) {
    const q = search.toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    )
  }

  // Style / Shape / Metal filters — applied across ALL products regardless of
  // category, so a style/shape link surfaces every matching piece.
  const slugify = (s: any) =>
    String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  if (styleParam && styleParam.toLowerCase() !== 'all') {
    const want = slugify(styleParam)
    list = list.filter(p => slugify(p.style) === want)
  }

  if (shapeParam && shapeParam.toLowerCase() !== 'all') {
    const want = slugify(shapeParam)
    list = list.filter(p => {
      const cat = String(p.categories?.name || p.category || '').toLowerCase()
      // Diamonds persist their shape in the `style` column; everything else
      // uses the dedicated `diamond_shape` column.
      const pShape = cat.startsWith('diamond')
        ? (p.diamond_shape || p.style)
        : (p.diamond_shape || '')
      return slugify(pShape) === want
    })
  }

  // 4. Calculate Final Total BEFORE Pagination
  const total = list.length

  // 5. Paginate the filtered list
  const paginated = list.slice(offset, offset + limit)

  // 6. Fetch metal, size, and carat options for these products
  const productIds = paginated.map(p => p.id)
  const { data: allMetalOptions } = await supabaseServer
    .from('product_metal_options')
    .select('product_id, key, metal_name, price_modifier, is_default')
    .in('product_id', productIds)

  const { data: allSizeOptions } = await supabaseServer
    .from('product_size_options')
    .select('product_id, key, size_name, price_modifier, is_default')
    .in('product_id', productIds)

  let allCaratOptions: any[] | null = null
  try {
    const caratRes = await supabaseServer
      .from('product_carat_options')
      .select('product_id, key, carat_name, price_modifier, is_default')
      .in('product_id', productIds)
    allCaratOptions = caratRes.data
  } catch {
    allCaratOptions = []
  }

  // Per-variant overrides — fail soft when migration 116 hasn't run yet.
  let allVariantPrices: any[] = []
  try {
    const varRes = await supabaseServer
      .from('product_variant_prices')
      .select('product_id, metal_key, carat_key, price_modifier')
      .in('product_id', productIds)
    if (varRes.error) throw varRes.error
    allVariantPrices = varRes.data || []
  } catch {
    allVariantPrices = []
  }

  // 7. Map to final format (INR rates, stock qty, etc)
  let inrRate = 83
  try {
    const currencyRes = await fetch(`${request.nextUrl.origin}/api/exchange-rate`, { cache: 'no-store' })
    if (currencyRes.ok) {
      const currencyData = await currencyRes.json()
      inrRate = Number(currencyData.rate) || inrRate
    }
  } catch (e) { }

  // 7. Fetch reviews data for these products to calculate average rating and count
  let reviewStats: Record<string, { avg: number, count: number }> = {}

  if (productIds.length > 0) {
    const { data: reviews, error: reviewsError } = await supabaseServer
      .from('reviews')
      .select('product_id, rating')
      .in('product_id', productIds)

    if (!reviewsError && reviews) {
      reviews.forEach(r => {
        const pid = String(r.product_id)
        if (!reviewStats[pid]) reviewStats[pid] = { avg: 0, count: 0 }
        reviewStats[pid].count++
        reviewStats[pid].avg += Number(r.rating)
      })
      Object.keys(reviewStats).forEach(id => {
        reviewStats[id].avg = Number((reviewStats[id].avg / reviewStats[id].count).toFixed(1))
      })
    }
  }

  const finalProducts = paginated.map((p: any) => {
    const pid = String(p.id)
    const toSlug = (s: string) =>
      String(s || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    const computedSlug = p.slug || toSlug(p.name)
    const categoryName = p.categories?.name || p.category || null
    const categorySlug = categoryName ? String(categoryName).toLowerCase().trim().replace(/\s+/g, '-') : null
    const images = Array.isArray(p.images) ? p.images : []
    const image = p.image ?? images?.[0] ?? null
    const stockQty = typeof p.stock_quantity === 'number' ? p.stock_quantity : (typeof p.stock === 'number' ? p.stock : (typeof p.quantity === 'number' ? p.quantity : 0))

    return {
      ...p,
      slug: computedSlug,
      category: categoryName,
      category_slug: categorySlug,
      images,
      image,
      stock_quantity: stockQty,
      price_inr: p.price * inrRate,
      metal_options: (allMetalOptions || []).filter((mo: any) => mo.product_id === p.id).map((mo: any) => ({
        key: mo.key,
        name: mo.metal_name,
        price_modifier: mo.price_modifier,
        is_default: mo.is_default
      })),
      size_options: (allSizeOptions || []).filter((so: any) => so.product_id === p.id).map((so: any) => ({
        key: so.key,
        name: so.size_name,
        price_modifier: so.price_modifier,
        is_default: so.is_default
      })),
      carat_options: (allCaratOptions || []).filter((co: any) => co.product_id === p.id).map((co: any) => ({
        key: co.key,
        name: co.carat_name,
        price_modifier: co.price_modifier,
        is_default: co.is_default
      })),
      variant_prices: (allVariantPrices || []).filter((v: any) => v.product_id === p.id).map((v: any) => ({
        metal_key: v.metal_key,
        carat_key: v.carat_key,
        price_modifier: Number(v.price_modifier) || 0
      })),
      custom_options: Array.isArray(p.custom_options) ? p.custom_options : (p.details?.custom_options || []),
      video_url: p.video_url || null,
      model_3d: p.model_3d || null,
      rating: reviewStats[pid] ? reviewStats[pid].avg : (Number(p.rating) || 0),
      reviews: reviewStats[pid] ? reviewStats[pid].count : (Number(p.reviews) || 0),
      diamond_shape: (() => {
        const cat = String(categoryName || p.category || '').toLowerCase()
        if (cat.startsWith('diamond')) return String(p.diamond_shape || p.style || '')
        return String(p.diamond_shape || '')
      })(),
    }
  })

  return NextResponse.json({
    products: finalProducts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }, {
    // Catalog reads are non-personalized: edge-cache briefly so repeat visits
    // and filter flips resolve in milliseconds instead of re-running 5+ DB
    // queries every time. Queries (filters/sort/search) partition the cache.
    // Mutations (POST/PUT/DELETE) are never cached.
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Retail price is optional when variants are offered — each variant row
    // carries its own price and the base is stored as 0 (storefront always
    // quotes the configured variant price, never the bare base).
    const hasVariants = (Array.isArray(body.metal_options) && body.metal_options.length > 0) ||
      (Array.isArray(body.carat_options) && body.carat_options.length > 0) ||
      (Array.isArray(body.variant_prices) && body.variant_prices.length > 0);
    if (!body.name || !body.category || (!hasVariants && !body.price)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let category_id = body.category_id
    if (!category_id && body.category) {
      let catRes = await supabaseServer.from('categories').select('id').eq('name', body.category).single()
      if (catRes.error) {
        catRes = await supabaseServer.from('categories').select('id').eq('slug', body.category).single()
      }
      category_id = catRes.data?.id
    }

    const reqImages: string[] = Array.isArray(body.images) ? body.images.filter((u: any) => typeof u === 'string' && !!u) : []
    const dedupImages = Array.from(new Set(reqImages))
    const reqImage: string | null = (typeof body.image === 'string' && body.image) || dedupImages[0] || null
    const toSlug = (s: string) =>
      String(s || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    const baseSlug: string =
      (typeof body.slug === 'string' && body.slug.trim() !== '') ? toSlug(body.slug) : toSlug(body.name)
    let uniqueSlug = baseSlug || String(Date.now())
    // Ensure slug uniqueness on the server to avoid DB unique constraint errors
    try {
      const { data: existing } = await supabaseServer
        .from('products')
        .select('slug')
        .ilike('slug', `${baseSlug}%`)
      if (existing && existing.length > 0) {
        const set = new Set(existing.map((r: any) => String(r.slug || '')))
        if (set.has(uniqueSlug)) {
          let i = 2
          while (set.has(`${baseSlug}-${i}`)) i++
          uniqueSlug = `${baseSlug}-${i}`
        }
      }
    } catch { }

    const toSku = (s: string) =>
      String(s || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    let skuToUse: string | null = null
    if (typeof body.sku === 'string' && body.sku.trim()) {
      skuToUse = toSku(body.sku)
    } else if (typeof body.name === 'string' && body.name) {
      const base = toSku(body.name).slice(0, 20)
      let suffix = ''
      try {
        const { data: existing } = await supabaseServer.from('products').select('sku').ilike('sku', `${base}%`)
        const set = new Set((existing || []).map((r: any) => String(r.sku || '')))
        if (set.has(base)) {
          let n = 1000 + Math.floor(Math.random() * 9000)
          while (set.has(`${base}-${n}`)) n++
          suffix = `-${n}`
        }
      } catch { }
      skuToUse = `${base}${suffix}`
    }

    const payloadBase = {
      name: body.name,
      // Some DBs store category as a string (NOT NULL); keep both when possible.
      category: body.category,
      category_id,
      price: Number(body.price) || 0,
      description: body.description || '',
      carat: body.carat || '',
      color: body.color || '',
      clarity: body.clarity || '',
      metal: body.metal || '',
      style: (() => {
        const cat = String(body.category || '').toLowerCase()
        // Normalize: for diamonds, store shape in style
        if (cat.startsWith('diamond')) {
          const raw = String(body.diamond_shape || body.style || '')
          return raw
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }
        return String(body.style || '')
      })(),
      // Persist the diamond shape for EVERY product (not just diamonds) so it can
      // be filtered site-wide. Stored as a normalized slug for stable matching.
      diamond_shape: String(body.diamond_shape || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      stock_quantity: Number.isFinite(body.stock_quantity) ? Number(body.stock_quantity) : 0,
      is_featured: !!(body.is_featured ?? body.visibleAtHome ?? false),
      sku: skuToUse,
      video_url: body.video_url || null,
      model_3d: body.model_3d || null,
      // On-sale % off the retail price (0-95; 0 = no discount). Sale price is
      // computed on the client; we only persist the percentage.
      discount_percent: (() => {
        const n = Math.round(Number(body.discount_percent))
        return Number.isFinite(n) ? Math.max(0, Math.min(95, n)) : 0
      })(),
      // Optional marketing badge (Popular / Limited / Featured / custom). null = none.
      label: (body.label ?? '').toString().trim() || null,
      // Estimated delivery window the admin pins per product (null → the
      // storefront shows "2–3 weeks from today").
      delivery_from: body.delivery_from || null,
      delivery_to: body.delivery_to || null,
    }
    const finalImages = reqImage
      ? [reqImage, ...dedupImages.filter((u) => u !== reqImage)]
      : dedupImages

    // Try insert, retry on unique slug conflict or missing sku column
    let created: any = null
    let variantSaved = true
    let slugToUse = uniqueSlug
    let removedSkuForRetry = false
    let removedShapeForRetry = false
    let removedDiscountForRetry = false
    let removedLabelForRetry = false
    let removedModel3dForRetry = false
    let removedDeliveryForRetry = false
    for (let attempt = 0; attempt < 8; attempt++) {
      const payload = {
        ...payloadBase,
        slug: slugToUse,
        image: reqImage,
        images: finalImages,
      }
      if (removedSkuForRetry) {
        delete (payload as any).sku
      }
      if (removedShapeForRetry) {
        delete (payload as any).diamond_shape
      }
      // Gracefully drop the sale columns if this DB hasn't run the 107 migration yet.
      if (removedDiscountForRetry) {
        delete (payload as any).discount_percent
      }
      if (removedLabelForRetry) {
        delete (payload as any).label
      }
      // Gracefully drop model_3d if this DB hasn't run the add_model_3d migration yet.
      if (removedModel3dForRetry) {
        delete (payload as any).model_3d
      }
      // Gracefully drop the delivery columns if migration 121 hasn't run yet.
      if (removedDeliveryForRetry) {
        delete (payload as any).delivery_from
        delete (payload as any).delivery_to
      }
      const { data, error } = await supabaseServer.from('products').insert([payload]).select().single()
      if (!error) {
        created = data

        // Insert metal options if provided
        if (body.metal_options && Array.isArray(body.metal_options) && body.metal_options.length > 0) {
          const optionsToInsert = body.metal_options.map((opt: any) => ({
            product_id: created.id,
            metal_name: opt.name,
            price_modifier: Number(opt.price_modifier) || 0,
            is_default: false,
            key: opt.key
          }))
          await supabaseServer.from('product_metal_options').insert(optionsToInsert)
        }

        // Insert size options if provided
        if (body.size_options && Array.isArray(body.size_options) && body.size_options.length > 0) {
          const optionsToInsert = body.size_options.map((opt: any) => ({
            product_id: created.id,
            size_name: opt.name,
            price_modifier: Number(opt.price_modifier) || 0,
            is_default: !!opt.is_default,
            key: opt.key
          }))
          await supabaseServer.from('product_size_options').insert(optionsToInsert)
        }

        // Insert carat options if provided
        if (body.carat_options && Array.isArray(body.carat_options) && body.carat_options.length > 0) {
          try {
            const optionsToInsert = body.carat_options.map((opt: any) => ({
              product_id: created.id,
              carat_name: opt.name,
              price_modifier: Number(opt.price_modifier) || 0,
              is_default: !!opt.is_default,
              key: opt.key
            }))
            await supabaseServer.from('product_carat_options').insert(optionsToInsert)
          } catch { }
        }

        // Insert per-variant overrides if provided — fail soft (migration 116).
        if (body.variant_prices && Array.isArray(body.variant_prices) && body.variant_prices.length > 0) {
          try {
            const rows = body.variant_prices
              .map((v: any) => ({
                product_id: created.id,
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

        break
      }
      const code = (error as any)?.code || ''
      const msg = String((error as any)?.message || '')
      if (!removedDiscountForRetry && (code === '42703' && /discount_percent/i.test(msg))) {
        removedDiscountForRetry = true
        continue
      }
      if (!removedLabelForRetry && (code === '42703' && /\blabel\b/i.test(msg))) {
        removedLabelForRetry = true
        continue
      }
      if (!removedDeliveryForRetry && (code === '42703' && /delivery_(from|to)/i.test(msg))) {
        removedDeliveryForRetry = true
        continue
      }
      if (!removedShapeForRetry && (code === '42703' && /diamond_shape/i.test(msg))) {
        removedShapeForRetry = true
        continue
      }
      // Must precede the bare-42703 sku catch-all so a missing model_3d column
      // drops model_3d (not sku) and the insert can be retried.
      if (!removedModel3dForRetry && (code === '42703' && /model_3d/i.test(msg))) {
        removedModel3dForRetry = true
        continue
      }
      if (!removedSkuForRetry && (code === '42703' || /column .*sku.* does not exist/i.test(msg))) {
        removedSkuForRetry = true
        continue
      }
      if (code === '23505' || /duplicate key value/i.test(msg)) {
        const match = slugToUse.match(/^(.*?)-(\d+)$/)
        let base = slugToUse
        let n = match ? parseInt(match[2], 10) + 1 : 2
        if (match) base = match[1]
        slugToUse = `${base}-${n}`
        continue
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
    if (!created) {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
    // New product must surface on home/collection/PDP with a single refresh.
    refreshStorefront(created.slug ? [`/products/${created.slug}`] : [])
    return NextResponse.json({ ...created, variant_saved: variantSaved }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
