import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

type Mode = 'visit' | 'online' | 'both'

// Fallback used when the appointment_services table doesn't exist yet
// (i.e. migration 018 hasn't been run) or is empty. Mirrors the seed data.
const DEFAULT_SERVICES = [
  { key: 'consultation', name: 'Personal Consultation', description: 'One-on-one with our jewellery specialists in a private salon', duration: '45 min', tag: 'Most Popular', mode: 'both' as Mode, is_enabled: true, position: 0 },
  { key: 'fitting', name: 'Jewellery Fitting', description: 'Precision sizing and bespoke fitting for every piece', duration: '30 min', tag: null, mode: 'visit' as Mode, is_enabled: true, position: 1 },
  { key: 'custom-design', name: 'Custom Design Session', description: 'Co-create your dream piece with our master jewellers', duration: '90 min', tag: 'Exclusive', mode: 'both' as Mode, is_enabled: true, position: 2 },
  { key: 'repair', name: 'Repair Assessment', description: 'Expert evaluation, restoration, and transparent quotation', duration: '30 min', tag: null, mode: 'visit' as Mode, is_enabled: true, position: 3 },
  { key: 'styling', name: 'Styling Advice', description: 'Curated recommendations based on your wardrobe and occasion', duration: '30 min', tag: null, mode: 'online' as Mode, is_enabled: true, position: 4 },
]

// A service with mode 'both' matches either requested mode.
function matchesMode(rowMode: string | null | undefined, requested: string | null): boolean {
  if (!requested || requested === 'all') return true
  const m = (rowMode || 'both').toLowerCase()
  return m === requested || m === 'both'
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode')
  const enabledOnly = request.nextUrl.searchParams.get('all') !== '1'

  try {
    const { data, error } = await supabaseServer
      .from('appointment_services')
      .select('key, name, description, duration, tag, mode, is_enabled, position')
      .order('position', { ascending: true })

    if (error) {
      // Table missing → serve defaults filtered by the request.
      return NextResponse.json(DEFAULT_SERVICES.filter(s => matchesMode(s.mode, mode)))
    }

    let rows = Array.isArray(data) ? data : []
    if (rows.length === 0) {
      return NextResponse.json(DEFAULT_SERVICES.filter(s => matchesMode(s.mode, mode)))
    }
    if (enabledOnly) rows = rows.filter(r => r.is_enabled !== false)
    if (mode) rows = rows.filter(r => matchesMode(r.mode, mode))

    return NextResponse.json(rows)
  } catch {
    return NextResponse.json(DEFAULT_SERVICES.filter(s => matchesMode(s.mode, mode)))
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const items: Array<{
      key: string; name?: string; description?: string; duration?: string;
      tag?: string | null; mode?: string; is_enabled?: boolean; position?: number
    }> = Array.isArray(body?.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json({ error: 'items required' }, { status: 400 })
    }

    const payload = items
      .filter((it) => it.key && it.name)
      .map((it, idx) => ({
        key: it.key,
        name: it.name ?? null,
        description: it.description ?? null,
        duration: it.duration ?? null,
        tag: it.tag ? it.tag : null,
        mode: (['visit', 'online', 'both'].includes(String(it.mode)) ? it.mode : 'both'),
        is_enabled: typeof it.is_enabled === 'boolean' ? it.is_enabled : true,
        position: typeof it.position === 'number' ? it.position : idx,
      }))

    const { data, error } = await supabaseServer
      .from('appointment_services')
      .upsert(payload, { onConflict: 'key' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data || [], { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to update appointment services' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const key = String(request.nextUrl.searchParams.get('key') || '').trim()
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
    const { error } = await supabaseServer.from('appointment_services').delete().eq('key', key)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
