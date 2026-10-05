import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isValidToken, shapeRequestForPublic } from '@/lib/customPayment'

export const dynamic = 'force-dynamic'

// ── GET: public read of a payment request by its secure token ───────────────
// Returns only customer-safe fields. Bad/short tokens are rejected before any
// DB lookup to blunt enumeration attempts. A missing token → 404 (never leaks
// whether a token "shape" exists).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    const { data: req, error } = await supabaseServer
      .from('custom_payment_requests')
      .select('token, customer_name, customer_email, customer_phone, title, description, amount, currency, status, expires_at, paid_at, payment_id')
      .eq('token', token)
      .maybeSingle()

    if (error) return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    if (!req) return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })

    return NextResponse.json(shapeRequestForPublic(req))
  } catch {
    return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
  }
}
