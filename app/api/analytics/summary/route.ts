import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    // Users count (registered)
    let usersCount = 0
    try {
      const { count } = await supabaseServer
        .from('users')
        .select('id', { count: 'exact', head: true })
      usersCount = count ?? 0
    } catch {}

    // Visitors approximation:
    // Count distinct session_id from carts (guests) + distinct user_id from carts and orders
    let visitors = new Set<string>()
    try {
      const { data: carts } = await supabaseServer.from('carts').select('session_id, user_id')
      if (Array.isArray(carts)) {
        for (const c of carts) {
          if (c.session_id) visitors.add(`s:${String(c.session_id)}`)
          if (c.user_id) visitors.add(`u:${String(c.user_id)}`)
        }
      }
    } catch {}
    try {
      const { data: orders } = await supabaseServer.from('orders').select('user_id, email')
      if (Array.isArray(orders)) {
        for (const o of orders) {
          if (o?.user_id) visitors.add(`u:${String(o.user_id)}`)
          else if (o?.email) visitors.add(`e:${String(o.email).toLowerCase()}`)
        }
      }
    } catch {}

    const visitorsCount = visitors.size

    return NextResponse.json({ usersCount, visitorsCount })
  } catch {
    return NextResponse.json({ usersCount: 0, visitorsCount: 0 })
  }
}
