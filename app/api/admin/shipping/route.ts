import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'
import { DEFAULT_SHIPPING, normalizeShipping } from '@/lib/shipping'

export const dynamic = 'force-dynamic'

// GET is public: the /shipping page consumes it.
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('shipping')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Shipping API] GET Error:', error)
      return NextResponse.json({ config: DEFAULT_SHIPPING })
    }

    return NextResponse.json({ config: normalizeShipping(data?.config) })
  } catch (err: any) {
    console.error('[Shipping API] GET Catch Error:', err)
    return NextResponse.json({ config: DEFAULT_SHIPPING })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const config = normalizeShipping(body?.config)

    // Single active row: update the first record, or insert if none exists.
    const { data: existing } = await supabaseServer
      .from('shipping')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing?.id) {
      result = await supabaseServer
        .from('shipping')
        .update({ config, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabaseServer
        .from('shipping')
        .insert([{ config, is_active: true, updated_at: new Date().toISOString() }])
        .select()
        .single()
    }

    if (result.error) {
      console.error('[Shipping API] POST Error:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ config: normalizeShipping(result.data?.config) })
  } catch (err: any) {
    console.error('[Shipping API] POST Catch Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
