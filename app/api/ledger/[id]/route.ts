import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

function toNum(v: any, def = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

function compute(body: any) {
  const netWeight = toNum(body.net_weight)
  const purity = toNum(body.touch_purity)
  const wastage = toNum(body.wastage)
  const labour = toNum(body.labour)
  const labourRate = toNum(body.labour_rate)
  const metalRate = toNum(body.metal_rate)
  const diamondPrice = toNum(body.diamond_price) || toNum(body.diamond_labour_amount)
  const metalLabourAmount = toNum(body.metal_labour_amount)
  const fineWeight = toNum(body.fine_weight) || Math.round((netWeight * (purity / 100)) * 1000) / 1000
  const metalPrice = Math.round(((fineWeight + wastage) * metalRate) * 100) / 100
  const labourCharge = metalLabourAmount ? Math.round(metalLabourAmount * 100) / 100 : Math.round((labour * labourRate) * 100) / 100
  const totalPayable = Math.round((metalPrice + labourCharge + diamondPrice) * 100) / 100
  const finalAmount = toNum(body.final_amount) || totalPayable
  return { fineWeight, metalPrice, labourCharge, totalPayable, finalAmount }
}

function resolveId(request: NextRequest, params: any): string {
  const raw = (params && (params.id as string)) ?? ''
  const id1 = typeof raw === 'string' ? raw.trim() : ''
  if (id1 && id1.toLowerCase() !== 'undefined') return id1
  const path = request.nextUrl?.pathname || ''
  const parts = path.split('/').filter(Boolean)
  const last = parts[parts.length - 1] || ''
  return last.trim()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const resolvedParams = await params
    const id = resolveId(request, resolvedParams)
    if (!id || id.toLowerCase() === 'undefined') {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const { data, error } = await supabaseServer.from('ledger_entries').select('*').eq('id', id).single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch ledger entry' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const resolvedParams = await params
    const id = resolveId(request, resolvedParams)
    if (!id || id.toLowerCase() === 'undefined') {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const body = await request.json()
    const calc = compute(body || {})
    const updates: Record<string, any> = {
      ...body,
      fine_weight: calc.fineWeight,
      metal_price: calc.metalPrice,
      labour_charge: calc.labourCharge,
      total_payable: calc.totalPayable,
      final_amount: calc.finalAmount,
      total_metal: calc.metalPrice,
      total_price: calc.finalAmount,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabaseServer
      .from('ledger_entries')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to update ledger entry' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const resolvedParams = await params
    const id = resolveId(request, resolvedParams)
    if (!id || id.toLowerCase() === 'undefined') {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const { error } = await supabaseServer.from('ledger_entries').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete ledger entry' }, { status: 500 })
  }
}
