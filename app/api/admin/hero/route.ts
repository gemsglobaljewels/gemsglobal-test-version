import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'
import { refreshStorefront } from '@/lib/revalidate'

// GET is public: the homepage hero slider consumes it.
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('hero_sections')
      .select('slides')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Hero API] GET Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || { slides: [] })
  } catch (err: any) {
    console.error('[Hero API] GET Catch Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const { slides } = await request.json()

    // We only ever have one active hero section for now
    // Try to update the first record, or insert if none exists
    const { data: existing } = await supabaseServer
      .from('hero_sections')
      .select('id')
      .limit(1)
      .single()

    let result;
    if (existing?.id) {
      result = await supabaseServer
        .from('hero_sections')
        .update({
          slides,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabaseServer
        .from('hero_sections')
        .insert([{
          slides,
          is_active: true,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
    }

    if (result.error) {
      console.error('[Hero API] POST Error:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // New slider must show on the homepage with a single refresh.
    refreshStorefront(['/'])

    return NextResponse.json(result.data)
  } catch (err: any) {
    console.error('[Hero API] POST Catch Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
