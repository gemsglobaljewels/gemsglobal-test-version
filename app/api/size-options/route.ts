import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

const DEFAULT_SIZES = [
    { key: '5', name: '5', price_modifier: 0, is_enabled: true, position: 0 },
    { key: '5-5', name: '5.5', price_modifier: 0, is_enabled: true, position: 1 },
    { key: '6', name: '6', price_modifier: 0, is_enabled: true, position: 2 },
    { key: '6-5', name: '6.5', price_modifier: 0, is_enabled: true, position: 3 },
    { key: '7', name: '7', price_modifier: 0, is_enabled: true, position: 4 },
    { key: '7-5', name: '7.5', price_modifier: 0, is_enabled: true, position: 5 },
    { key: '8', name: '8', price_modifier: 0, is_enabled: true, position: 6 },
]

export async function GET() {
    try {
        const { data, error } = await supabaseServer
            .from('size_options')
            .select('key, name, price_modifier, is_enabled, position')
            .order('position', { ascending: true })
        if (error) {
            return NextResponse.json(DEFAULT_SIZES)
        }
        const rows = (Array.isArray(data) ? data : []).map((row, i) => ({
            ...row,
            price_modifier: Number(row.price_modifier) || 0
        }))
        if (rows.length === 0) return NextResponse.json(DEFAULT_SIZES)
        return NextResponse.json(rows)
    } catch {
        return NextResponse.json(DEFAULT_SIZES)
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const items: Array<{ key: string; name?: string; price_modifier?: number; is_enabled?: boolean; position?: number }> =
            Array.isArray(body?.items) ? body.items : []
        if (items.length === 0) {
            return NextResponse.json({ error: 'items required' }, { status: 400 })
        }
        const payload = items.map((it) => ({
            key: it.key,
            name: it.name ?? null,
            price_modifier: it.price_modifier ?? null,
            is_enabled: typeof it.is_enabled === 'boolean' ? it.is_enabled : null,
            position: it.position ?? null,
        }))
        const { data, error } = await supabaseServer.from('size_options').upsert(payload, { onConflict: 'key' }).select()
        if (error) {
            const merged = [
                ...DEFAULT_SIZES.filter(d => !items.find(i => i.key === d.key)),
                ...items.map(i => ({ ...i, is_enabled: i.is_enabled !== false })),
            ]
            return NextResponse.json(merged, { status: 200 })
        }
        return NextResponse.json(data || [], { status: 200 })
    } catch {
        return NextResponse.json({ error: 'Failed to update size options' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const key = String(request.nextUrl.searchParams.get('key') || '').trim()
        if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
        const { error } = await supabaseServer.from('size_options').delete().eq('key', key)
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ ok: true }, { status: 200 })
    } catch {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
