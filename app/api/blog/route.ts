import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    // List views never render the (large) `content` HTML — only title/excerpt/
    // image/meta. Excluding `content` here avoids shipping every article body on
    // every blog-list / related-posts request. The single-post route
    // (/api/blog/[id]) still returns the full row incl. content.
    let query = supabaseServer
      .from('blogs')
      .select('id, title, slug, excerpt, image_url, author, is_visible, published_at')
      .order('published_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('is_visible', true)
    }

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('[Blogs API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const slug = body.slug || body.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data, error } = await supabaseServer
      .from('blogs')
      .insert([{
        title: body.title,
        slug,
        content: body.content,
        excerpt: body.excerpt || '',
        image_url: body.image_url || '',
        author: body.author || 'Admin',
        is_visible: body.is_visible !== undefined ? body.is_visible : true,
        published_at: body.published_at || new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('[Blogs API] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
