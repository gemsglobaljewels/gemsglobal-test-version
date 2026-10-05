import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// Generate slug from name
function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// GET: Get all categories (with optional product counts)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const homeOnly = searchParams.get('home') === 'true'
    const recipientOnly = searchParams.get('recipient') === 'true'

    let query = supabaseServer
      .from('categories')
      .select('*, parent: parent_category_id(id, name)')
      .order('name', { ascending: true })

    if (homeOnly) {
      query = query.eq('show_on_home', true)
    }

    if (recipientOnly) {
      query = query.eq('show_on_recipient', true)
    }

    const { data: categories, error: catError } = await query

    if (catError) throw catError

    // Get product counts
    const { data: products, error: prodError } = await supabaseServer
      .from('products')
      .select('id, category_id')

    const countByCategory: Record<string, number> = {}
    if (!prodError && products) {
      products.forEach(p => {
        if (p.category_id) {
          countByCategory[p.category_id] = (countByCategory[p.category_id] || 0) + 1
        }
      })
    }

    const enrichedCategories = categories?.map(cat => ({
      ...cat,
      show_on_home: cat.show_on_home ?? false,
      show_on_recipient: cat.show_on_recipient ?? false,
      show_in_header: cat.show_in_header ?? false,
      header_order: cat.header_order ?? 0,
      header_image_url: cat.header_image_url ?? null,
      header_description: cat.header_description ?? null,
      product_count: countByCategory[cat.id] || 0
    })) || []

    return NextResponse.json(enrichedCategories)
  } catch (error: any) {
    console.error('GET /api/categories error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, image_url, parent_category_id, show_on_home, show_on_recipient, show_in_header, header_order, header_image_url, header_description } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const newCategory = {
      name: name.trim(),
      slug: generateSlug(name.trim()),
      image_url: image_url || null,
      parent_category_id: parent_category_id || null,
      show_on_home: !!show_on_home,
      show_on_recipient: !!show_on_recipient,
      show_in_header: !!show_in_header,
      header_order: header_order || 0,
      header_image_url: header_image_url || null,
      header_description: header_description || null,
      updated_at: new Date().toISOString()
    }

    console.log('Creating category:', newCategory)

    const { data, error } = await supabaseServer
      .from('categories')
      .insert([newCategory])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/categories error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
