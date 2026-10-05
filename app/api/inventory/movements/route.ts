import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const params = request.nextUrl.searchParams
    const productId = params.get('productId')
    let query = supabaseServer
      .from('inventory_movements')
      .select('product_id, product_name, change, quantity_after, reason, created_at')
      .order('created_at', { ascending: false })
    if (productId) {
      query = query.eq('product_id', productId)
    }
    const { data, error } = await query
    if (error) {
      return NextResponse.json([], { status: 200 })
    }
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
