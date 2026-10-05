import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    // Use count queries instead of fetching all rows — much faster
    const { count: viewsCount } = await supabaseServer
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view')
      .not('path', 'like', '/admin%')

    const { count: clicksCount } = await supabaseServer
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'click')
      .not('path', 'like', '/admin%')

    const totalViews = viewsCount || 0
    const totalClicks = clicksCount || 0

    return NextResponse.json({
      totalViews,
      totalClicks,
    })
  } catch {
    return NextResponse.json({
      totalViews: 0,
      totalClicks: 0,
    })
  }
}
