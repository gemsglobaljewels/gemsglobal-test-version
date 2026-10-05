import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'
import { DEFAULT_ABOUT, normalizeAbout } from '@/lib/aboutPage'

export const dynamic = 'force-dynamic'

// GET is public: the /about marketing page consumes it.
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('about_page')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[About API] GET Error:', error)
      // Fall back to defaults so the page still renders (e.g. table not created yet)
      return NextResponse.json({ config: DEFAULT_ABOUT })
    }

    return NextResponse.json({ config: normalizeAbout(data?.config) })
  } catch (err: any) {
    console.error('[About API] GET Catch Error:', err)
    return NextResponse.json({ config: DEFAULT_ABOUT })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const config = normalizeAbout(body?.config)

    // Single active row: update the first record, or insert if none exists.
    const { data: existing } = await supabaseServer
      .from('about_page')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing?.id) {
      result = await supabaseServer
        .from('about_page')
        .update({ config, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabaseServer
        .from('about_page')
        .insert([{ config, is_active: true, updated_at: new Date().toISOString() }])
        .select()
        .single()
    }

    if (result.error) {
      console.error('[About API] POST Error:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ config: normalizeAbout(result.data?.config) })
  } catch (err: any) {
    console.error('[About API] POST Catch Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
