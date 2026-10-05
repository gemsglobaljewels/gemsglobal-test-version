import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const { id: saleId } = await params
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!saleId || saleId === 'undefined' || !uuidRe.test(saleId)) {
      return NextResponse.json({ error: 'Invalid sale id' }, { status: 400 })
    }
    const { data: sale, error: saleErr } = await supabaseServer
      .from('offline_sales')
      .select('id, recorded_by, customer_name, customer_email, customer_phone, customer_address, subtotal, discount_total, total_price, notes, created_at')
      .eq('id', saleId)
      .single()
    if (saleErr) {
      return NextResponse.json({ error: saleErr.message }, { status: 500 })
    }
    const { data: items, error: itemsErr } = await supabaseServer
      .from('offline_sale_items')
      .select('id, sale_id, product_id, product_name, product_image, quantity, unit_price, discount, line_total, created_at, products(image)')
      .eq('sale_id', saleId)
    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    }
    return NextResponse.json({
      id: sale.id,
      recordedBy: sale.recorded_by,
      customerName: sale.customer_name,
      customerEmail: sale.customer_email,
      customerPhone: sale.customer_phone,
      customerAddress: sale.customer_address,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount_total),
      total: Number(sale.total_price),
      notes: sale.notes,
      createdAt: sale.created_at,
      items: (items || []).map((it: any) => ({
        id: it.id,
        productId: it.product_id,
        productName: it.product_name,
        productImage: it.product_image || (it.products as any)?.image || null,
        quantity: it.quantity,
        unitPrice: Number(it.unit_price),
        discount: Number(it.discount),
        lineTotal: Number(it.line_total),
        createdAt: it.created_at,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch offline sale' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const { id: saleId } = await params
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!saleId || saleId === 'undefined' || !uuidRe.test(saleId)) {
      return NextResponse.json({ error: 'Invalid sale id' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    const customer_name = (body?.customerName as string | undefined) || ''
    const customer_email = (body?.customerEmail as string | undefined) || ''
    const customer_phone = (body?.customerPhone as string | undefined) || ''
    const customer_address = body?.customerAddress || null
    const notes = (body?.notes as string | undefined) || ''
    const items: Array<{
      productId?: string | null
      productName?: string | null
      quantity: number
      unitPrice: number
      discount?: number
    }> = Array.isArray(body?.items) ? body.items : []

    // If items provided, recalc totals
    let subtotal: number | undefined
    let discount_total: number | undefined
    let total_price: number | undefined
    if (Array.isArray(items) && items.length) {
      const shaped = items.map((it) => ({
        quantity: Number(it.quantity || 0),
        unitPrice: Number(it.unitPrice || 0),
        discount: Number(it.discount || 0),
      }))
      subtotal = shaped.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
      discount_total = shaped.reduce((sum, it) => sum + Number(it.discount || 0), 0)
      total_price = Math.max(0, subtotal - discount_total)
    }

    const patch: any = {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      notes,
    }
    if (typeof subtotal === 'number') patch.subtotal = subtotal
    if (typeof discount_total === 'number') patch.discount_total = discount_total
    if (typeof total_price === 'number') patch.total_price = total_price

    const { error: updErr } = await supabaseServer.from('offline_sales').update(patch).eq('id', saleId)
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    if (Array.isArray(items) && items.length) {
      const useDbTriggers = process.env.OFFLINE_SALES_USE_DB_TRIGGERS !== 'false'
      let prevItems: Array<{ product_id: string | null; product_name: string | null; quantity: number }> = []
      if (!useDbTriggers) {
        const { data: old } = await supabaseServer
          .from('offline_sale_items')
          .select('product_id, product_name, quantity')
          .eq('sale_id', saleId)
        prevItems = Array.isArray(old) ? old : []
      }
      const { error: delErr } = await supabaseServer.from('offline_sale_items').delete().eq('sale_id', saleId)
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 })
      }
      const offlineItems = items.map((it) => ({
        sale_id: saleId,
        product_id: it.productId || null,
        product_name: it.productName || null,
        quantity: Number(it.quantity || 0),
        unit_price: Number(it.unitPrice || 0),
        discount: Number(it.discount || 0),
        line_total: Math.max(0, Number(it.quantity || 0) * Number(it.unitPrice || 0) - Number(it.discount || 0)),
      }))
      const { error: insErr } = await supabaseServer.from('offline_sale_items').insert(offlineItems)
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
      if (!useDbTriggers) {
        const oldMap = new Map<string, number>()
        for (const it of prevItems) {
          if (it.product_id) oldMap.set(it.product_id, (oldMap.get(it.product_id) || 0) + Number(it.quantity || 0))
        }
        const newMap = new Map<string, { qty: number; name: string | null }>()
        for (const it of items) {
          let pid: string | null = it.productId || null
          if (!pid && it.productName) {
            try {
              const { data: found } = await supabaseServer
                .from('products')
                .select('id, name')
                .ilike('name', it.productName)
                .limit(1)
                .maybeSingle()
              if (found?.id) pid = found.id
            } catch { }
          }
          if (pid) {
            const prev = newMap.get(pid)?.qty || 0
            newMap.set(pid, { qty: prev + Number(it.quantity || 0), name: it.productName || null })
          }
        }
        const productIds = new Set<string>([...oldMap.keys(), ...newMap.keys()])
        for (const pid of productIds) {
          const oldQty = oldMap.get(pid) || 0
          const newQty = newMap.get(pid)?.qty || 0
          const delta = newQty - oldQty
          if (delta === 0) continue
          try {
            const { data: product } = await supabaseServer
              .from('products')
              .select('*')
              .eq('id', pid)
              .maybeSingle()
            const { data: last } = await supabaseServer
              .from('inventory_movements')
              .select('quantity_after, created_at')
              .eq('product_id', pid)
              .order('created_at', { ascending: false })
              .limit(1)
            let latest = 0
            if (Array.isArray(last) && last.length > 0 && typeof last[0]?.quantity_after === 'number') {
              latest = Number(last[0].quantity_after)
            }
            const current =
              latest ||
              (typeof product?.stock_quantity === 'number'
                ? product.stock_quantity
                : typeof (product as any)?.stock === 'number'
                  ? (product as any).stock
                  : typeof (product as any)?.quantity === 'number'
                    ? (product as any).quantity
                    : 0)
            const nextQtyRaw = Number(current) - Number(delta)
            const nextQty = Number.isFinite(nextQtyRaw) ? Math.max(0, Math.round(nextQtyRaw)) : 0
            const tryUpdate = async (field: string) => {
              const res = await supabaseServer
                .from('products')
                .update({ [field]: nextQty })
                .eq('id', pid)
                .select('*')
                .maybeSingle()
              return res
            }
            let res = await tryUpdate('stock_quantity')
            let updated = res.data
            let updErr = res.error
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
            const qtyAfter =
              typeof updated?.stock_quantity === 'number'
                ? updated.stock_quantity
                : typeof updated?.stock === 'number'
                  ? (updated as any).stock
                  : typeof updated?.quantity === 'number'
                    ? (updated as any).quantity
                    : nextQty
            const safeQtyAfter = Number.isFinite(Number(qtyAfter)) ? Math.round(Number(qtyAfter)) : nextQty
            const invMovement = {
              product_id: pid,
              product_name: updated?.name || product?.name || newMap.get(pid)?.name || '',
              change: Number.isFinite(Number(-delta)) ? Math.round(Number(-delta)) : 0,
              quantity_after: safeQtyAfter,
              reason: 'offline_sale_edit',
              created_at: new Date().toISOString(),
            }
            try {
              await supabaseServer.from('inventory_movements').insert([invMovement])
            } catch (e) {
              console.error('Inventory movement insert failed (offline sale edit)', { invMovement, error: e })
            }
          } catch { }
        }
      }
    }

    return NextResponse.json({ id: saleId }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to update offline sale' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const { id: saleId } = await params
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!saleId || saleId === 'undefined' || !uuidRe.test(saleId)) {
      return NextResponse.json({ error: 'Invalid sale id' }, { status: 400 })
    }
    const useDbTriggers = process.env.OFFLINE_SALES_USE_DB_TRIGGERS !== 'false'
    let prevItems: Array<{ product_id: string | null; product_name: string | null; quantity: number }> = []
    if (!useDbTriggers) {
      const { data: old } = await supabaseServer
        .from('offline_sale_items')
        .select('product_id, product_name, quantity')
        .eq('sale_id', saleId)
      prevItems = Array.isArray(old) ? old : []
    }
    const { error: delErr } = await supabaseServer.from('offline_sales').delete().eq('id', saleId)
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }
    if (!useDbTriggers) {
      for (const it of prevItems) {
        if (!it.product_id || !Number.isFinite(it.quantity) || it.quantity <= 0) continue
        try {
          const pid = it.product_id
          const qtyDelta = Math.abs(it.quantity)
          const { data: product } = await supabaseServer
            .from('products')
            .select('*')
            .eq('id', pid)
            .maybeSingle()
          const { data: last } = await supabaseServer
            .from('inventory_movements')
            .select('quantity_after, created_at')
            .eq('product_id', pid)
            .order('created_at', { ascending: false })
            .limit(1)
          let latest = 0
          if (Array.isArray(last) && last.length > 0 && typeof last[0]?.quantity_after === 'number') {
            latest = Number(last[0].quantity_after)
          }
          const current =
            latest ||
            (typeof product?.stock_quantity === 'number'
              ? product.stock_quantity
              : typeof (product as any)?.stock === 'number'
                ? (product as any).stock
                : typeof (product as any)?.quantity === 'number'
                  ? (product as any).quantity
                  : 0)
          const nextQtyRaw = Number(current) + Number(qtyDelta)
          const nextQty = Number.isFinite(nextQtyRaw) ? Math.max(0, Math.round(nextQtyRaw)) : 0
          const tryUpdate = async (field: string) => {
            const res = await supabaseServer
              .from('products')
              .update({ [field]: nextQty })
              .eq('id', pid)
              .select('*')
              .maybeSingle()
            return res
          }
          let res = await tryUpdate('stock_quantity')
          let updated = res.data
          let updErr = res.error
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
          const qtyAfter =
            typeof updated?.stock_quantity === 'number'
              ? updated.stock_quantity
              : typeof updated?.stock === 'number'
                ? (updated as any).stock
                : typeof updated?.quantity === 'number'
                  ? (updated as any).quantity
                  : nextQty
          const safeQtyAfter = Number.isFinite(Number(qtyAfter)) ? Math.round(Number(qtyAfter)) : nextQty
          const invMovement = {
            product_id: pid,
            product_name: updated?.name || product?.name || it.product_name || '',
            change: Number.isFinite(Number(qtyDelta)) ? Math.round(Number(qtyDelta)) : 0,
            quantity_after: safeQtyAfter,
            reason: 'offline_sale_delete',
            created_at: new Date().toISOString(),
          }
          try {
            await supabaseServer.from('inventory_movements').insert([invMovement])
          } catch (e) {
            console.error('Inventory movement insert failed (offline sale delete)', { invMovement, error: e })
          }
        } catch { }
      }
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to delete offline sale' }, { status: 500 })
  }
}
