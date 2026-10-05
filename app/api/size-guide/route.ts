import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'
import { DEFAULT_SIZE_GUIDE, normalizeSizeGuide } from '@/lib/sizeGuide'

export const dynamic = 'force-dynamic'

// Public GET — always returns a renderable document. Falls back to
// DEFAULT_SIZE_GUIDE when the table/row is absent (e.g. migration not yet run)
// so the storefront page never renders blank.
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('size_guide')
      .select('hero, sections')
      .eq('id', 1)
      .maybeSingle()

    if (error || !data) return NextResponse.json(DEFAULT_SIZE_GUIDE)

    return NextResponse.json(
      normalizeSizeGuide({ hero: data.hero, sections: data.sections })
    )
  } catch {
    return NextResponse.json(DEFAULT_SIZE_GUIDE)
  }
}

// Admin PUT — persists the whole document. The body is normalized server-side
// (icon whitelist, video_type clamp, field coercion) so nothing arbitrary is
// stored, then upserted into the singleton row.
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => ({}))
    const doc = normalizeSizeGuide(body)

    const { data, error } = await supabaseServer
      .from('size_guide')
      .upsert(
        {
          id: 1,
          hero: doc.hero,
          sections: doc.sections,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('hero, sections')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      data ? normalizeSizeGuide({ hero: data.hero, sections: data.sections }) : doc,
      { status: 200 }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to update size guide' }, { status: 500 })
  }
}
