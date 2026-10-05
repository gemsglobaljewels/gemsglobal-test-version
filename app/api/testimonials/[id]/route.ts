import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data, error } = await supabaseServer
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[Testimonials API] GET by ID error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabaseServer
      .from('testimonials')
      .update({
        name: body.name,
        location: body.location,
        email: body.email,
        avatar_url: body.avatar_url,
        rating: body.rating,
        review: body.review,
        product_name: body.product_name,
        product_image_url: body.product_image_url,
        product_images: body.product_images || null,
        tag: body.tag,
        source: body.source,
        source_url: body.source_url,
        is_visible: body.is_visible,
        is_featured: body.is_featured,
        is_verified: body.is_verified,
        sort_order: body.sort_order,
        review_date: body.review_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[Testimonials API] PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await supabaseServer
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Testimonials API] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
