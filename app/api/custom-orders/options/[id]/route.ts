import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'
import { isUuid } from '@/lib/customOrder'
import { shapeOption } from '@/lib/customOrderOptions'

export const dynamic = 'force-dynamic'

const TABLE = 'custom_order_options'

// ── PATCH: edit label / toggle enabled (admin) ──────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Invalid option id' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const patch: any = {}

    if (body.label !== undefined) {
      const label = String(body.label || '').trim()
      if (!label) return NextResponse.json({ error: 'Label cannot be empty' }, { status: 400 })
      if (label.length > 120) return NextResponse.json({ error: 'Label is too long' }, { status: 400 })
      patch.label = label
    }
    if (body.isEnabled !== undefined) {
      patch.is_enabled = !!body.isEnabled
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from(TABLE)
      .update(patch)
      .eq('id', id)
      .select('id, type, label, position, is_enabled')
      .maybeSingle()

    if (error) {
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'That option already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Option not found' }, { status: 404 })
    return NextResponse.json(shapeOption(data))
  } catch {
    return NextResponse.json({ error: 'Failed to update option' }, { status: 500 })
  }
}

// ── DELETE: remove an option (admin) ────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Invalid option id' }, { status: 400 })
  }

  try {
    const { error } = await supabaseServer.from(TABLE).delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete option' }, { status: 500 })
  }
}
