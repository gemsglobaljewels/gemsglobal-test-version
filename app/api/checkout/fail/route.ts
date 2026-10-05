import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { orderId, reason } = await request.json()
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

    // Use statuses that exist in the DB constraint
    // 'cancelled' = user dismissed/cancelled, 'payment_failed' = gateway rejected
    const status = reason === 'payment_failed' ? 'payment_failed' : 'cancelled'
    const note = reason === 'cancelled'
      ? 'Payment cancelled by user'
      : reason === 'payment_failed'
        ? 'Payment failed at gateway'
        : 'Payment was not completed'

    console.log('[Checkout Fail] Marking order:', orderId, '| status:', status, '| reason:', reason || 'none')

    const { data, error } = await supabaseServer
      .from('orders')
      .update({
        status: status,
        notes: note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .in('status', ['pending']) // Only update if still pending
      .select('id, status')

    if (error) {
      console.error('[Checkout Fail] DB Error:', error)
      return NextResponse.json({ error: 'Failed to update order status: ' + error.message }, { status: 500 })
    }

    console.log('[Checkout Fail] Order', orderId, 'updated to:', status, '| rows affected:', data?.length || 0)
    return NextResponse.json({ success: true, status })
  } catch (err: any) {
    console.error('[Checkout Fail] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
