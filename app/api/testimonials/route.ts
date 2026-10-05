import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    let query = supabaseServer
      .from('testimonials')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('review_date', { ascending: false })

    // For now, get all reviews regardless of is_visible for debugging
    // In production, you'd want:
    // if (!isAdmin) {
    //   query = query.eq('is_visible', true)
    // }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('[Testimonials API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.review) {
      return NextResponse.json({ error: 'Name and review are required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('testimonials')
      .insert([{
        name: body.name,
        location: body.location || '',
        email: body.email || '',
        avatar_url: body.avatar_url || '',
        rating: body.rating || 5,
        review: body.review,
        product_name: body.product_name || '',
        product_image_url: body.product_image_url || '',
        product_images: body.product_images || null,
        tag: body.tag || '',
        source: body.source || 'manual',
        source_url: body.source_url || '',
        is_visible: body.is_visible !== undefined ? body.is_visible : true,
        is_featured: body.is_featured || false,
        is_verified: body.is_verified !== undefined ? body.is_verified : true,
        sort_order: body.sort_order || 0,
        review_date: body.review_date || new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('[Testimonials API] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
