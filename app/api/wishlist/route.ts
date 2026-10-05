 import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const userId = params.get('userId')
  const email = params.get('email')
  const limitParam = params.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let query = supabaseServer
    .from('wishlist')
    .select('id, product_id, created_at')
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  } else if (email) {
    const { data: u } = await supabaseServer.from('users').select('id').eq('email', email).maybeSingle()
    if (!u) return NextResponse.json([])
    query = query.eq('user_id', u.id)
  } else {
    return NextResponse.json([])
  }

  if (limit && Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const productIds = (data || []).map((w: any) => w.product_id)
  if (productIds.length === 0) return NextResponse.json([])

  const { data: products } = await supabaseServer
    .from('products')
    .select('id, name, slug, price, image')
    .in('id', productIds)

  const items = (data || []).map((w: any) => {
    const p = (products || []).find((x: any) => x.id === w.product_id)
    return {
      id: w.id,
      product: p,
      createdAt: w.created_at,
    }
  }).filter((x: any) => x.product)

  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, productSlug } = body || {}
    if (!productSlug) {
      return NextResponse.json({ error: 'Missing productSlug' }, { status: 400 })
    }

    const { data: product, error: pErr } = await supabaseServer
      .from('products')
      .select('id')
      .eq('slug', productSlug)
      .maybeSingle()
    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }
    if (!product?.id) {
      return NextResponse.json({ error: 'Product is out of stock' }, { status: 404 })
    }

    let effectiveUserId: string | null = userId || null
    if (!effectiveUserId && email) {
      const { data: existing } = await supabaseServer
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      effectiveUserId = existing?.id || null
      if (!effectiveUserId) {
        const { data: inserted } = await supabaseServer
          .from('users')
          .insert([{ email }])
          .select('id')
          .single()
        effectiveUserId = inserted?.id || null
      }
    }

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'User not identified' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('wishlist')
      .insert([{ user_id: effectiveUserId, product_id: product.id }])
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, productSlug } = body || {}
    if (!productSlug) {
      return NextResponse.json({ error: 'Missing productSlug' }, { status: 400 })
    }

    const { data: product } = await supabaseServer
      .from('products')
      .select('id')
      .eq('slug', productSlug)
      .maybeSingle()

    if (!product?.id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    let effectiveUserId: string | null = userId || null
    if (!effectiveUserId && email) {
      const { data: existing } = await supabaseServer
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      effectiveUserId = existing?.id || null
    }

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'User not identified' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('wishlist')
      .delete()
      .eq('user_id', effectiveUserId)
      .eq('product_id', product.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}
