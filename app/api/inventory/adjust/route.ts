import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const body = await request.json()
    const { productId, delta, reason } = body || {}
    if (!productId || !Number.isFinite(delta)) {
      return NextResponse.json({ error: 'productId and delta required' }, { status: 400 })
    }

    const { data: product, error: getErr } = await supabaseServer
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle()

    if (getErr) {
      return NextResponse.json({ error: getErr.message }, { status: 500 })
    }
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    let latestQtyFromMovements = 0
    try {
      const { data: last } = await supabaseServer
        .from('inventory_movements')
        .select('quantity_after, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1)
      if (Array.isArray(last) && last.length > 0 && typeof last[0]?.quantity_after === 'number') {
        latestQtyFromMovements = Number(last[0].quantity_after)
      }
    } catch { }

    const current =
      latestQtyFromMovements ||
      (typeof product.stock_quantity === 'number'
        ? product.stock_quantity
        : typeof product.stock === 'number'
          ? product.stock
          : typeof product.quantity === 'number'
            ? product.quantity
            : 0)
    const nextQtyRaw = Number(current) + Number(delta)
    const nextQty = Number.isFinite(nextQtyRaw) ? Math.max(0, Math.round(nextQtyRaw)) : 0

    let updated: any = null
    let updErr: any = null

    // Try stock_quantity, then stock, then quantity
    const tryUpdate = async (field: string) => {
      const res = await supabaseServer
        .from('products')
        .update({ [field]: nextQty })
        .eq('id', productId)
        .select('*')
        .maybeSingle()
      return res
    }

    let res = await tryUpdate('stock_quantity')
    updated = res.data
    updErr = res.error
    if (updErr) {
      res = await tryUpdate('stock')
      updated = res.data
      updErr = res.error
    }
    if (updErr) {
      res = await tryUpdate('quantity')
      updated = res.data
      updErr = res.error
    }
    // Even if product update fails, we still record movement so the UI is consistent
    const qtyAfter =
      typeof updated?.stock_quantity === 'number'
        ? updated.stock_quantity
        : typeof updated?.stock === 'number'
          ? updated.stock
          : typeof updated?.quantity === 'number'
            ? updated.quantity
            : nextQty
    const safeQtyAfter = Number.isFinite(Number(qtyAfter)) ? Math.round(Number(qtyAfter)) : nextQty
    const invMovement = {
      product_id: productId,
      product_name: updated?.name || product.name,
      change: Number.isFinite(Number(delta)) ? Math.round(Number(delta)) : 0,
      quantity_after: safeQtyAfter,
      reason: reason || '',
      created_at: new Date().toISOString(),
    }
    try {
      await supabaseServer.from('inventory_movements').insert([invMovement])
    } catch (e) {
      console.error('Inventory movement insert failed', { invMovement, error: e })
      // Last resort: try with minimal safe payload
      try {
        await supabaseServer.from('inventory_movements').insert([{
          product_id: productId,
          product_name: invMovement.product_name || '',
          change: invMovement.change ?? 0,
          quantity_after: Number.isFinite(Number(invMovement.quantity_after)) ? invMovement.quantity_after : 0,
          reason: String(invMovement.reason || ''),
          created_at: invMovement.created_at,
        }])
      } catch (e2) {
        console.error('Inventory movement retry failed', e2)
      }
    }
    return NextResponse.json(invMovement, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to adjust inventory' }, { status: 500 })
  }
}
