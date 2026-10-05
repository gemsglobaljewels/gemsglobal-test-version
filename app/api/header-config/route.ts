import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('header_config')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('GET header config error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // No config row yet → create a sensible default so the admin form and the
    // storefront header always have something to work with.
    if (!data) {
      const { data: created, error: createErr } = await supabaseServer
        .from('header_config')
        .insert({ logo_text: 'Gems Global Jewels' })
        .select()
        .single()

      if (createErr) {
        console.error('Create default header config error:', createErr)
        return NextResponse.json({ config: null })
      }
      return NextResponse.json({ config: created })
    }

    return NextResponse.json({ config: data })
  } catch (e: any) {
    console.error('Header config GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch header config' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body

    if (!config) {
      return NextResponse.json({ error: 'config is required' }, { status: 400 })
    }

    // Only persist real columns.
    const payload = {
      logo_url: config.logo_url ?? null,
      logo_text: config.logo_text ?? 'Gems Global Jewels',
      show_search: !!config.show_search,
      show_cart: !!config.show_cart,
      show_account: !!config.show_account,
      phone_number: config.phone_number ?? null,
      email: config.email ?? null,
      updated_at: new Date().toISOString()
    }

    // Update when we have an id, otherwise create the first row (upsert).
    if (config.id) {
      const { data, error } = await supabaseServer
        .from('header_config')
        .update(payload)
        .eq('id', config.id)
        .select()
        .single()

      if (error) {
        console.error('PUT header config error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ config: data })
    }

    const { data, error } = await supabaseServer
      .from('header_config')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('INSERT header config error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ config: data })
  } catch (e: any) {
    console.error('Header config PUT error:', e)
    return NextResponse.json({ error: 'Failed to update header config' }, { status: 500 })
  }
}
