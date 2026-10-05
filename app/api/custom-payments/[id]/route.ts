import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isUuid, shapeRequestForAdmin, logEvent } from '@/lib/customPayment'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

// ── GET: single request + its event timeline (admin) ────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(_request)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })
    }

    const { data: req, error } = await supabaseServer
      .from('custom_payment_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!req) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })

    const { data: events } = await supabaseServer
      .from('custom_payment_events')
      .select('id, type, detail, created_at')
      .eq('request_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      ...shapeRequestForAdmin(req),
      events: events || [],
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payment request' }, { status: 500 })
  }
}

// ── PATCH: edit unpaid request details, or archive/unarchive ────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))

    const { data: existing, error: fetchErr } = await supabaseServer
      .from('custom_payment_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    if (!existing) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })

    const patch: any = {}

    // Status transitions (archive / restore). A paid request can only be archived,
    // never edited or reopened.
    if (typeof body.status === 'string') {
      const next = body.status.toLowerCase()
      if (!['pending', 'archived'].includes(next)) {
        return NextResponse.json({ error: 'Status can only be set to pending or archived' }, { status: 400 })
      }
      if (existing.status === 'paid' && next !== 'archived') {
        return NextResponse.json({ error: 'A paid request cannot be reopened' }, { status: 400 })
      }
      patch.status = next
    }

    // Detail edits are only allowed while the request is still unpaid.
    const wantsDetailEdit =
      body.customerName !== undefined ||
      body.customerEmail !== undefined ||
      body.customerPhone !== undefined ||
      body.title !== undefined ||
      body.description !== undefined ||
      body.amount !== undefined ||
      body.currency !== undefined ||
      body.expiresInDays !== undefined ||
      body.expiresAt !== undefined

    if (wantsDetailEdit) {
      if (existing.status === 'paid') {
        return NextResponse.json({ error: 'A paid request can no longer be edited' }, { status: 400 })
      }
      if (body.customerName !== undefined) {
        const name = String(body.customerName || '').trim()
        if (!name) return NextResponse.json({ error: 'Customer name cannot be empty' }, { status: 400 })
        patch.customer_name = name
      }
      if (body.customerEmail !== undefined) {
        const email = String(body.customerEmail || '').trim()
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({ error: 'Please enter a valid customer email' }, { status: 400 })
        }
        patch.customer_email = email || null
      }
      if (body.customerPhone !== undefined) patch.customer_phone = String(body.customerPhone || '').trim() || null
      if (body.title !== undefined) {
        const title = String(body.title || '').trim()
        if (!title) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
        patch.title = title
      }
      if (body.description !== undefined) patch.description = String(body.description || '').trim() || null
      if (body.currency !== undefined) {
        patch.currency = String(body.currency).toUpperCase() === 'USD' ? 'USD' : 'INR'
      }
      if (body.amount !== undefined) {
        const amount = Number(body.amount)
        if (!Number.isFinite(amount) || amount <= 0) {
          return NextResponse.json({ error: 'A valid amount greater than zero is required' }, { status: 400 })
        }
        patch.amount = amount
      }
      // Expiry: expiresAt (ISO or null) takes precedence; else expiresInDays.
      if (body.expiresAt !== undefined) {
        patch.expires_at = body.expiresAt ? new Date(body.expiresAt).toISOString() : null
      } else if (body.expiresInDays !== undefined) {
        const days = Number(body.expiresInDays)
        patch.expires_at =
          Number.isFinite(days) && days > 0
            ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
            : null
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: updated, error: updErr } = await supabaseServer
      .from('custom_payment_requests')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    if (patch.status) await logEvent(id, patch.status === 'archived' ? 'archived' : 'restored')

    return NextResponse.json(shapeRequestForAdmin(updated))
  } catch {
    return NextResponse.json({ error: 'Failed to update payment request' }, { status: 500 })
  }
}

// ── DELETE: remove a request (events cascade) ───────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(_request)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })
    }
    const { error } = await supabaseServer
      .from('custom_payment_requests')
      .delete()
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete payment request' }, { status: 500 })
  }
}
