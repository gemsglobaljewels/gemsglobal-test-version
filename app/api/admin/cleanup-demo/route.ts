import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

const isDemoName = (s: any) => {
  const v = String(s || '').toLowerCase().replace(/\s+/g, '')
  return v === 'demo1234' || v === 'demo12345'
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth

    const { data, error } = await supabaseServer
      .from('products')
      .select('id, name, slug, sku, stock_quantity, stock, quantity')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const all = Array.isArray(data) ? data : []
    const demo = all.filter(
      (p: any) => isDemoName(p?.name) || isDemoName(p?.slug) || isDemoName(p?.sku)
    )
    let deleted = 0
    let archived = 0
    for (const p of demo) {
      const id = p.id as string
      try {
        await supabaseServer.from('inventory_movements').delete().eq('product_id', id)
      } catch {}
      try {
        const upd = async (field: string) =>
          await supabaseServer.from('products').update({ [field]: 0 }).eq('id', id)
        let r = await upd('stock_quantity'); if (r.error) r = await upd('stock'); if (r.error) await upd('quantity')
      } catch {}
      const del = await supabaseServer.from('products').delete().eq('id', id)
      if (!del.error) { deleted++; continue }
      const msg = String(del.error?.message || '')
      if (/quantity_after/i.test(msg) || /not-null/i.test(msg)) {
        try {
          await supabaseServer.from('products').update({
            is_featured: false,
            price: 0,
            stock_quantity: 0,
            slug: `archived-${Date.now()}-${id.slice(0,8)}`,
          }).eq('id', id)
          archived++
          continue
        } catch {}
      }
    }
    return NextResponse.json({ ok: true, count: demo.length, deleted, archived })
  } catch (e: any) {
    return NextResponse.json({ error: 'cleanup failed' }, { status: 500 })
  }
}
