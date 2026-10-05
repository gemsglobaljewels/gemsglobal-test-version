import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'
import { DEFAULT_REPAIRS, normalizeRepairs } from '@/lib/repairs'

export const dynamic = 'force-dynamic'

// GET is public: the /repairs marketing page consumes it.
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('repairs')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Repairs API] GET Error:', error)
      // Fall back to defaults so the page still renders (e.g. table not created yet)
      return NextResponse.json({ config: DEFAULT_REPAIRS })
    }

    return NextResponse.json({ config: normalizeRepairs(data?.config) })
  } catch (err: any) {
    console.error('[Repairs API] GET Catch Error:', err)
    return NextResponse.json({ config: DEFAULT_REPAIRS })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const config = normalizeRepairs(body?.config)

    // Single active row: update the first record, or insert if none exists.
    const { data: existing } = await supabaseServer
      .from('repairs')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing?.id) {
      result = await supabaseServer
        .from('repairs')
        .update({ config, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabaseServer
        .from('repairs')
        .insert([{ config, is_active: true, updated_at: new Date().toISOString() }])
        .select()
        .single()
    }

    if (result.error) {
      console.error('[Repairs API] POST Error:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ config: normalizeRepairs(result.data?.config) })
  } catch (err: any) {
    console.error('[Repairs API] POST Catch Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
