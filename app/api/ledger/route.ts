import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

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
  const metalLabourAmount = toNum(body.metal_labour_amount)
  const metalRate = toNum(body.metal_rate)
  const diamondLabourAmount = toNum(body.diamond_labour_amount)
  const diamondPrice = toNum(body.diamond_price) || diamondLabourAmount
  const fineWeight = toNum(body.fine_weight) || Math.round((netWeight * (purity / 100)) * 1000) / 1000
  const metalPrice = Math.round(((fineWeight + wastage) * metalRate) * 100) / 100
  const labourCharge = metalLabourAmount ? Math.round(metalLabourAmount * 100) / 100 : Math.round((labour * labourRate) * 100) / 100
  const totalPayable = Math.round((metalPrice + labourCharge + diamondPrice) * 100) / 100
  const finalAmount = toNum(body.final_amount) || totalPayable
  return { fineWeight, metalPrice, labourCharge, totalPayable, finalAmount }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const { data, error } = await supabaseServer
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data || [], { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch ledger entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const body = await request.json()
    const {
      customer_name = null,
      bill_no = null,
      bill_date = null,
      sr_no = null,
      design_no = null,
      cpm = null,
      percentage = null,
      design_name = null,
      item_photo = null,
      gold_kt = null,
      metal_type = null,
      gross_weight = null,
      net_weight = null,
      wastage = null,
      touch_purity = null,
      solitaire_diamond_pcs = null,
      solitaire_diamond_wt = null,
      loose_diamond_pcs = null,
      loose_diamond_wt = null,
      diamond_pcs = null,
      diamond_weight = null,
      labour = null,
      metal_rate = null,
      labour_rate = null,
      metal_labour_amount = null,
      diamond_labour_amount = null,
      diamond_price = null,
      due_amount = null,
      credit_amount = null,
      mat_debit_metal = null,
      mat_debit_price = null,
      mat_credit_metal = null,
      mat_credit_price = null,
    } = body || {}
    const calc = compute({
      net_weight,
      touch_purity,
      wastage,
      labour,
      labour_rate,
      metal_rate,
      diamond_price,
      metal_labour_amount,
      diamond_labour_amount,
      fine_weight: body?.fine_weight,
      final_amount: body?.final_amount
    })
    const payload = {
      customer_name,
      bill_no,
      bill_date,
      sr_no: toNum(sr_no) || null,
      design_no,
      cpm: toNum(cpm) || null,
      percentage: toNum(percentage) || null,
      design_name,
      item_photo,
      gold_kt: toNum(gold_kt) || null,
      metal_type,
      gross_weight: (gross_weight === null || gross_weight === undefined || String(gross_weight).trim() === '')
        ? null : String(gross_weight).trim(),
      net_weight: (net_weight === null || net_weight === undefined || String(net_weight).trim() === '')
        ? null : String(net_weight).trim(),
      wastage: toNum(wastage) || null,
      touch_purity: toNum(touch_purity) || null,
      fine_weight: calc.fineWeight,
      solitaire_diamond_pcs: solitaire_diamond_pcs !== null ? Number(solitaire_diamond_pcs) : null,
      solitaire_diamond_wt: toNum(solitaire_diamond_wt) || null,
      loose_diamond_pcs: loose_diamond_pcs !== null ? Number(loose_diamond_pcs) : null,
      loose_diamond_wt: toNum(loose_diamond_wt) || null,
      diamond_pcs: diamond_pcs !== null ? Number(diamond_pcs) : null,
      diamond_weight: toNum(diamond_weight) || null,
      labour: toNum(labour) || null,
      metal_rate: toNum(metal_rate) || null,
      labour_rate: toNum(labour_rate) || null,
      metal_labour_amount: toNum(metal_labour_amount) || null,
      diamond_labour_amount: toNum(diamond_labour_amount) || null,
      metal_price: calc.metalPrice,
      labour_charge: calc.labourCharge,
      diamond_price: toNum(diamond_price) || toNum(diamond_labour_amount) || 0,
      total_metal: calc.metalPrice,
      total_payable: calc.totalPayable,
      final_amount: calc.finalAmount,
      total_price: calc.finalAmount,
      due_amount: toNum(due_amount) || null,
      credit_amount: toNum(credit_amount) || null,
      mat_debit_metal: mat_debit_metal ?? null,
      mat_debit_price: toNum(mat_debit_price) || null,
      mat_credit_metal: mat_credit_metal ?? null,
      mat_credit_price: toNum(mat_credit_price) || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabaseServer.from('ledger_entries').insert([payload]).select('*').single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create ledger entry' }, { status: 500 })
  }
}
