import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'
import {
  isOptionType, shapeOption, fallbackOptions, OptionType,
} from '@/lib/customOrderOptions'

export const dynamic = 'force-dynamic'

const TABLE = 'custom_order_options'

// ── GET: list options ────────────────────────────────────────────────────────
// Public by default → only enabled rows (the /custom-order form consumes this).
// ?all=1 → admin only, returns every row (enabled + disabled) for management.
export async function GET(request: NextRequest) {
  const wantAll = request.nextUrl.searchParams.get('all') === '1'

  if (wantAll) {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
  }

  try {
    let query = supabaseServer
      .from(TABLE)
      .select('id, type, label, position, is_enabled')
      .order('type', { ascending: true })
      .order('position', { ascending: true })

    if (!wantAll) query = query.eq('is_enabled', true)

    const { data, error } = await query
    if (error) {
      // Table missing / not migrated yet → serve sensible defaults.
      return NextResponse.json(
        wantAll ? fallbackOptions() : fallbackOptions().filter((o) => o.isEnabled)
      )
    }
    return NextResponse.json((data || []).map(shapeOption))
  } catch {
    return NextResponse.json(fallbackOptions())
  }
}

// ── POST: add an option (admin) ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json().catch(() => ({}))
    const type = String(body?.type || '').toLowerCase() as OptionType
    const label = String(body?.label || '').trim()

    if (!isOptionType(type)) {
      return NextResponse.json({ error: 'Invalid option type' }, { status: 400 })
    }
    if (!label) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 })
    }
    if (label.length > 120) {
      return NextResponse.json({ error: 'Label is too long' }, { status: 400 })
    }

    // Position = end of its type group.
    const { data: last } = await supabaseServer
      .from(TABLE)
      .select('position')
      .eq('type', type)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()
    const position = (last?.position ?? -1) + 1

    const { data, error } = await supabaseServer
      .from(TABLE)
      .insert({ type, label, position, is_enabled: true })
      .select('id, type, label, position, is_enabled')
      .single()

    if (error) {
      // 23505 = unique_violation (duplicate label within type).
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'That option already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(shapeOption(data), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to add option' }, { status: 500 })
  }
}

// ── PUT: bulk reorder (admin) ────────────────────────────────────────────────
// Body: { items: [{ id, position }] }
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json().catch(() => ({}))
    const items: Array<{ id: string; position: number }> = Array.isArray(body?.items) ? body.items : []
    if (!items.length) {
      return NextResponse.json({ error: 'items required' }, { status: 400 })
    }

    await Promise.all(
      items
        .filter((it) => it && typeof it.id === 'string')
        .map((it) =>
          supabaseServer
            .from(TABLE)
            .update({ position: Number(it.position) || 0 })
            .eq('id', it.id)
        )
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to reorder options' }, { status: 500 })
  }
}
