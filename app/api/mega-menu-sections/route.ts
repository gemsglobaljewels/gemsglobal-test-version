import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    let query = supabaseServer.from('mega_menu_sections').select('*').order('section_order', { ascending: true })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('GET mega menu sections error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Make sure to map sections to have correct data/custom_links
    const sections = (data || []).map(section => ({
      ...section,
      data: section.section_type === 'links' ? (section.custom_links || section.data || []) : (section.data || [])
    }))

    return NextResponse.json({ sections })
  } catch (e: any) {
    console.error('Mega menu sections GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch mega menu sections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { section } = body

    if (!section?.category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
    }

    // Sanitize section_type to valid values to avoid check constraint errors
    const validSectionTypes = ['categories', 'links', 'image'] as const
    const sanitizedSectionType = validSectionTypes.includes(section.section_type as any)
      ? section.section_type
      : 'categories'

    // For 'links' sections the editable array lives in `data`; persist it to
    // BOTH columns so reads work regardless of which column the client checks.
    const linksPayload = sanitizedSectionType === 'links'
      ? (section.data || section.custom_links || [])
      : (section.custom_links || [])

    // Only write real, explicit columns — never spread the raw client object
    // (it can carry id/created_at/stray fields that corrupt the row).
    const sectionToSave = {
      category_id: section.category_id,
      title: section.title || 'New Section',
      section_order: section.section_order ?? 0,
      section_type: sanitizedSectionType,
      custom_links: linksPayload,
      data: sanitizedSectionType === 'links' ? linksPayload : (section.data || []),
      image_url: section.image_url ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseServer
      .from('mega_menu_sections')
      .insert(sectionToSave)
      .select()
      .single()

    if (error) {
      console.error('POST mega menu section error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map the returned section to have correct data
    const returnedSection = {
      ...data,
      data: data.section_type === 'links' ? (data.custom_links || data.data || []) : (data.data || [])
    }

    return NextResponse.json({ section: returnedSection })
  } catch (e: any) {
    console.error('Mega menu section POST error:', e)
    return NextResponse.json({ error: 'Failed to create mega menu section' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sections } = body

    if (Array.isArray(sections)) {
      // Bulk update for reordering
      for (const section of sections) {
        // Sanitize section_type for bulk updates too
        const validSectionTypes = ['categories', 'links', 'image'] as const
        const sanitizedSectionType = validSectionTypes.includes(section.section_type as any)
          ? section.section_type
          : 'categories'

        await supabaseServer
          .from('mega_menu_sections')
          .update({
            section_order: section.section_order,
            section_type: sanitizedSectionType
          })
          .eq('id', section.id)
      }
      return NextResponse.json({ success: true })
    } else {
      // Single update
      const { section } = body

      if (!section?.id) {
        return NextResponse.json({ error: 'section.id is required for update' }, { status: 400 })
      }

      // Sanitize section_type to valid values to avoid check constraint errors
      const validSectionTypes = ['categories', 'links', 'image'] as const
      const sanitizedSectionType = validSectionTypes.includes(section.section_type as any)
        ? section.section_type
        : 'categories'

      const linksPayload = sanitizedSectionType === 'links'
        ? (section.data || section.custom_links || [])
        : (section.custom_links || [])

      // Explicit columns only — do NOT spread the client object (it carries
      // id/created_at and can include fields that are not real columns).
      const sectionToSave = {
        title: section.title || 'New Section',
        section_order: section.section_order ?? 0,
        section_type: sanitizedSectionType,
        custom_links: linksPayload,
        data: sanitizedSectionType === 'links' ? linksPayload : (section.data || []),
        image_url: section.image_url ?? null,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseServer
        .from('mega_menu_sections')
        .update(sectionToSave)
        .eq('id', section.id)
        .select()
        .single()

      if (error) {
        console.error('PUT mega menu section error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Map the returned section to have correct data
      const returnedSection = {
        ...data,
        data: data.section_type === 'links' ? (data.custom_links || data.data || []) : (data.data || [])
      }

      return NextResponse.json({ section: returnedSection })
    }
  } catch (e: any) {
    console.error('Mega menu section PUT error:', e)
    return NextResponse.json({ error: 'Failed to update mega menu section' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('mega_menu_sections')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('DELETE mega menu section error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Mega menu section DELETE error:', e)
    return NextResponse.json({ error: 'Failed to delete mega menu section' }, { status: 500 })
  }
}
