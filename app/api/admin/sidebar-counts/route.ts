import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const [ordersRes, appointmentsRes, offlineSalesRes, customOrdersRes] = await Promise.all([
      supabaseServer
        .from('orders')
        .select('id', { count: 'exact', head: true })
        // Only real, placed orders — never unpaid/abandoned checkouts
        // (pending, payment_failed, failed).
        .in('status', ['confirmed', 'completed', 'processing', 'shipped', 'delivered']),
      supabaseServer
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabaseServer
        .from('offline_sales')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabaseServer
        .from('custom_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
    ])

    return NextResponse.json({
      orders: ordersRes.count ?? 0,
      appointments: appointmentsRes.count ?? 0,
      offlineSales: offlineSalesRes.count ?? 0,
      customOrders: customOrdersRes.count ?? 0,
    })
  } catch {
    return NextResponse.json({
      orders: 0,
      appointments: 0,
      offlineSales: 0,
      customOrders: 0,
    })
  }
}
