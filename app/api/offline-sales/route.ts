import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendOfflineSaleThankYouEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const params = request.nextUrl.searchParams
    const search = (params.get('search') || '').toLowerCase()
    const limitParam = params.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    let query = supabaseServer
      .from('offline_sales')
      .select('id, customer_name, customer_email, customer_phone, subtotal, discount_total, total_price, created_at')
      .order('created_at', { ascending: false })

    if (limit && Number.isFinite(limit) && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let list = (data || []).map((s: any) => ({
      id: s.id,
      customerName: s.customer_name,
      customerEmail: s.customer_email,
      customerPhone: s.customer_phone,
      subtotal: Number(s.subtotal),
      discount: Number(s.discount_total),
      total: Number(s.total_price),
      createdAt: s.created_at,
    }))

    if (search) {
      list = list.filter((s: any) => {
        const n = String(s.customerName || '').toLowerCase()
        const e = String(s.customerEmail || '').toLowerCase()
        const p = String(s.customerPhone || '').toLowerCase()
        return n.includes(search) || e.includes(search) || p.includes(search)
      })
    }

    return NextResponse.json(list)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

type NewItem = {
  productId?: string | null
  productName?: string | null
  productImage?: string | null
  quantity: number
  unitPrice: number
  discount?: number
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const body = await request.json().catch(() => ({}))
    const customer_name = (body?.customerName as string | undefined) || ''
    const customer_email = (body?.customerEmail as string | undefined) || ''
    const customer_phone = (body?.customerPhone as string | undefined) || ''
    const customer_address = body?.customerAddress || null
    const notes = (body?.notes as string | undefined) || ''
    const items: NewItem[] = Array.isArray(body?.items) ? body.items : []
    const recorded_by = (body?.recordedBy as string | undefined) || null

    if (!items.length) {
      return NextResponse.json({ error: 'Items required' }, { status: 400 })
    }

    const shapedItems = items.map((it) => ({
      productId: it.productId || null,
      productName: it.productName || null,
      productImage: it.productImage || null,
      quantity: Number(it.quantity || 0),
      unitPrice: Number(it.unitPrice || 0),
      discount: Number(it.discount || 0),
    }))

    const subtotal = shapedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
    const discount_total = shapedItems.reduce((sum, it) => sum + Number(it.discount || 0), 0)
    const total_price = Math.max(0, subtotal - discount_total)

    const { data: sale, error: saleErr } = await supabaseServer
      .from('offline_sales')
      .insert([
        {
          recorded_by,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          subtotal,
          discount_total,
          total_price,
          notes,
        },
      ])
      .select('id')
      .maybeSingle()

    if (saleErr || !sale?.id) {
      return NextResponse.json({ error: saleErr?.message || 'Failed to create sale' }, { status: 500 })
    }

    const saleId = sale.id as string

    const offlineItems = shapedItems.map((it) => ({
      sale_id: saleId,
      product_id: it.productId,
      product_name: it.productName,
      product_image: it.productImage,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      discount: it.discount,
      line_total: Math.max(0, it.quantity * it.unitPrice - it.discount),
    }))

    const { error: itemsErr } = await supabaseServer.from('offline_sale_items').insert(offlineItems)
    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    }

    const useDbTriggers = process.env.OFFLINE_SALES_USE_DB_TRIGGERS !== 'false'
    if (!useDbTriggers) {
      for (const it of shapedItems) {
        if (!Number.isFinite(it.quantity) || it.quantity <= 0) continue
        try {
          let productId = it.productId || null
          if (!productId && it.productName) {
            try {
              const { data: foundByName } = await supabaseServer
                .from('products')
                .select('id, name')
                .ilike('name', it.productName)
                .limit(1)
                .maybeSingle()
              if (foundByName?.id) productId = foundByName.id
            } catch { }
          }
          if (!productId) continue
          const qtyDelta = -Math.abs(it.quantity)
          const { data: product } = await supabaseServer
            .from('products')
            .select('*')
            .eq('id', productId)
            .maybeSingle()
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
              .eq('id', productId)
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
            product_id: productId,
            product_name: updated?.name || product?.name || it.productName || '',
            change: Number.isFinite(Number(qtyDelta)) ? Math.round(Number(qtyDelta)) : 0,
            quantity_after: safeQtyAfter,
            reason: 'offline_sale',
            created_at: new Date().toISOString(),
          }
          try {
            await supabaseServer.from('inventory_movements').insert([invMovement])
          } catch (e) {
            console.error('Inventory movement insert failed (offline sale)', { invMovement, error: e })
          }
        } catch { }
      }
    }

    // ── Send thank-you email (fire-and-forget) ──────────────────────────
    if (customer_email) {
      ; (async () => {
        try {
          // Fetch product images for items that have a productId
          const productIds = shapedItems
            .map(it => it.productId)
            .filter((id): id is string => !!id)

          let productMap: Record<string, { image: string | null }> = {}
          if (productIds.length > 0) {
            const uniqueIds = [...new Set(productIds)]
            const { data: products } = await supabaseServer
              .from('products')
              .select('id, image, images')
              .in('id', uniqueIds)
            if (products) {
              for (const p of products) {
                const imgs = Array.isArray(p.images) ? p.images : []
                const img = p.image ?? imgs[0] ?? null
                productMap[p.id] = { image: img }
              }
            }
          }

          const emailItems = shapedItems.map(it => ({
            productName: it.productName || 'Product',
            productImage: it.productId ? (productMap[it.productId]?.image || null) : null,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discount: it.discount,
            lineTotal: Math.max(0, it.quantity * it.unitPrice - it.discount),
          }))

          await sendOfflineSaleThankYouEmail({
            customerName: customer_name,
            customerEmail: customer_email,
            customerPhone: customer_phone,
            saleId,
            items: emailItems,
            subtotal,
            discountTotal: discount_total,
            totalPrice: total_price,
            saleDate: new Date().toISOString(),
          })
        } catch (emailErr) {
          console.error('[OfflineSales] Failed to send thank-you email:', emailErr)
        }
      })()
    }

    return NextResponse.json({ id: saleId, total: total_price }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to create offline sale' }, { status: 500 })
  }
}
