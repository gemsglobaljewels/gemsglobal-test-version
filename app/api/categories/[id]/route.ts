import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// GET: Get single category
export async function GET(request: NextRequest, context: { params: Promise<{ id: string; }> }) {
  try {
    const { id } = await context.params;
    const { data, error } = await supabaseServer
      .from('categories')
      .select('*, parent: parent_category_id(id, name)')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({
      ...data,
      show_on_home: data.show_on_home ?? false,
      show_on_recipient: data.show_on_recipient ?? false
    })
  } catch (error: any) {
    console.error('GET /api/categories/:id error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT: Update category
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string; }> }) {
  console.log('PUT /api/categories/:id - Starting update')
  try {
    const { id } = await context.params;
    const body = await request.json()
    console.log('Request body:', body)
    const { name, image_url, parent_category_id, show_on_home, show_on_recipient, show_in_header, header_order, header_image_url, header_description } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      updateData.name = name.trim()
      updateData.slug = generateSlug(name.trim())
    }
    if (image_url !== undefined) updateData.image_url = image_url
    if (parent_category_id !== undefined) updateData.parent_category_id = parent_category_id
    if (show_on_home !== undefined) updateData.show_on_home = !!show_on_home
    if (show_on_recipient !== undefined) updateData.show_on_recipient = !!show_on_recipient
    if (show_in_header !== undefined) updateData.show_in_header = !!show_in_header
    if (header_order !== undefined) updateData.header_order = header_order
    if (header_image_url !== undefined) updateData.header_image_url = header_image_url
    if (header_description !== undefined) updateData.header_description = header_description

    console.log('Update data:', updateData)

    const { data, error } = await supabaseServer
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      throw error
    }

    console.log('Successfully updated category:', data)
    return NextResponse.json({
      ...data,
      show_on_home: data.show_on_home ?? false,
      show_on_recipient: data.show_on_recipient ?? false,
      show_in_header: data.show_in_header ?? false,
      header_order: data.header_order ?? 0,
      header_image_url: data.header_image_url ?? null,
      header_description: data.header_description ?? null
    })
  } catch (error: any) {
    console.error('Full error object:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Delete category
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; }> }) {
  console.log('DELETE /api/categories/:id - Starting delete')
  try {
    const { id } = await context.params;
    const { error } = await supabaseServer
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      throw error
    }

    console.log('Successfully deleted category with id:', id)
    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error: any) {
    console.error('Full delete error object:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
