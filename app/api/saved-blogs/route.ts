import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// GET /api/saved-blogs?userId=<uuid>
// Returns the user's saved blogs joined with blog data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('saved_blogs')
      .select(`
        id,
        created_at,
        blog_id,
        blogs (
          id,
          title,
          slug,
          excerpt,
          image_url,
          author,
          published_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Flatten: return array of blog objects with saved_at
    const result = (data || []).map((row: any) => ({
      saved_id: row.id,
      saved_at: row.created_at,
      ...row.blogs,
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Saved Blogs] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/saved-blogs  { userId, blogId }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, blogId } = body

    if (!userId || !blogId) {
      return NextResponse.json({ error: 'userId and blogId are required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('saved_blogs')
      .upsert({ user_id: userId, blog_id: blogId }, { onConflict: 'user_id,blog_id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('[Saved Blogs] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/saved-blogs  { userId, blogId }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, blogId } = body

    if (!userId || !blogId) {
      return NextResponse.json({ error: 'userId and blogId are required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('saved_blogs')
      .delete()
      .eq('user_id', userId)
      .eq('blog_id', blogId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Saved Blogs] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
