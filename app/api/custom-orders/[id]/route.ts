import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isUuid, shapeForAdmin, ADMIN_COLUMNS, isValidStatus, canAdvance, canonicalStatus, STATUS_LABELS } from '@/lib/customOrder'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

// ── GET: single custom order (admin) ────────────────────────────────────────
export async function GET(
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

    const { data, error } = await supabaseServer
      .from('custom_orders')
      .select(ADMIN_COLUMNS)
      .eq('id', id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Custom order not found' }, { status: 404 })

    return NextResponse.json(shapeForAdmin(data))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch custom order' }, { status: 500 })
  }
}

// ── PATCH: update status (admin) ────────────────────────────────────────────
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
    const patch: any = {}

    if (body.status !== undefined) {
      const next = String(body.status || '').toLowerCase()
      if (!isValidStatus(next)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      // Forward-only: a request can advance through the funnel but never revert
      // to an earlier stage. Fetch the current status and reject a backward move.
      const { data: current, error: curErr } = await supabaseServer
        .from('custom_orders')
        .select('status')
        .eq('id', id)
        .maybeSingle()
      if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 })
      if (!current) return NextResponse.json({ error: 'Custom order not found' }, { status: 404 })

      if (!canAdvance(current.status, next)) {
        const fromLabel = STATUS_LABELS[canonicalStatus(current.status)] || current.status
        const toLabel = STATUS_LABELS[next as keyof typeof STATUS_LABELS] || next
        return NextResponse.json(
          { error: `Status can only move forward. “${fromLabel}” cannot revert to “${toLabel}”.` },
          { status: 409 }
        )
      }
      patch.status = next
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('custom_orders')
      .update(patch)
      .eq('id', id)
      .select(ADMIN_COLUMNS)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Custom order not found' }, { status: 404 })

    return NextResponse.json(shapeForAdmin(data))
  } catch {
    return NextResponse.json({ error: 'Failed to update custom order' }, { status: 500 })
  }
}

// ── DELETE: remove a custom order (admin) ───────────────────────────────────
export async function DELETE(
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
    const { error } = await supabaseServer.from('custom_orders').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete custom order' }, { status: 500 })
  }
}
