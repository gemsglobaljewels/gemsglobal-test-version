import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

// GET is public: the storefront reads site config (logo, title, contacts) on
// every page. Only whitelisted, non-sensitive keys live in site_settings.
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('site_settings')
      .select('key, value')

    if (error) throw error

    // Convert array to object
    const settings = data.reduce((acc: any, item: any) => {
      acc[item.key] = item.value
      return acc
    }, {})

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('[Settings API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const updates = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString()
    }))

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No settings to update' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('site_settings')
      .upsert(updates, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Settings API] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
