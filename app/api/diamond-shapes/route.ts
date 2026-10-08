import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { refreshStorefront } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

const DEFAULT_SHAPES = [
    { key: 'round', name: 'Round', sub: 'A classic and timeless cut that maximizes brilliance and fire.', image: '', is_enabled: true },
    { key: 'cushion', name: 'Cushion', sub: 'A romantic pillow-shaped cut with rounded corners and large facets.', image: '', is_enabled: true },
    { key: 'princess', name: 'Princess', sub: 'A modern square cut with exceptional brilliance and sharp corners.', image: '', is_enabled: true },
    { key: 'emerald', name: 'Emerald', sub: 'An elegant step-cut with a rectangular shape and hall-of-mirrors effect.', image: '', is_enabled: true },
    { key: 'oval', name: 'Oval', sub: 'A brilliant cut that elongates the finger with exceptional sparkle.', image: '', is_enabled: true },
    { key: 'marquise', name: 'Marquise', sub: 'A regal elongated shape with pointed ends for maximum carat appearance.', image: '', is_enabled: true },
    { key: 'pear', name: 'Pear', sub: 'A teardrop-shaped cut combining the best of round and marquise.', image: '', is_enabled: true },
    { key: 'heart', name: 'Heart', sub: 'A sentimental shape symbolizing love and romance.', image: '', is_enabled: true },
    { key: 'radiant', name: 'Radiant', sub: 'A vibrant cut blending the elegance of emerald with the sparkle of round.', image: '', is_enabled: true },
    { key: 'asscher', name: 'Asscher', sub: 'A vintage square step-cut with deep pavilion and high crown.', image: '', is_enabled: true },
]

export async function GET() {
    // Rarely-changing lookup data — safe for a few minutes on the edge.
    const cache = { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    try {
        let data: any = null
        let error: any = null
        ;({ data, error } = await supabaseServer
            .from('diamond_shapes')
            .select('key, name, sub, image, model_3d, is_enabled, category_ids')
            .order('name', { ascending: true }))
        if (error) {
            // Pre-migration DB (no category_ids column) — retry without it.
            const retry = await supabaseServer
                .from('diamond_shapes')
                .select('key, name, sub, image, model_3d, is_enabled')
                .order('name', { ascending: true })
            data = retry.data
            error = retry.error as any
        }
        if (error) {
            return NextResponse.json(DEFAULT_SHAPES, cache)
        }
        const rows = (Array.isArray(data) ? data : []).map((row) => ({
            ...row,
            // NULL/missing = every category (shape is a stone cut, not a
            // category attribute — scoping is optional).
            category_ids: Array.isArray((row as any).category_ids) ? (row as any).category_ids : [],
        }))
        if (rows.length === 0) return NextResponse.json(DEFAULT_SHAPES, cache)
        return NextResponse.json(rows, cache)
    } catch {
        return NextResponse.json(DEFAULT_SHAPES, cache)
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const items: Array<{ key: string; name?: string; sub?: string; image?: string; model_3d?: string; is_enabled?: boolean; category_ids?: string[] }> =
            Array.isArray(body?.items) ? body.items : []
        if (items.length === 0) {
            return NextResponse.json({ error: 'items required' }, { status: 400 })
        }
        const buildPayload = (strip: boolean) => items.map((it) => {
            const row: Record<string, any> = {
                key: it.key,
                name: it.name ?? null,
                sub: it.sub ?? null,
                image: it.image ?? null,
                model_3d: it.model_3d ?? null,
                is_enabled: typeof it.is_enabled === 'boolean' ? it.is_enabled : null,
            }
            if (!strip) row.category_ids = Array.isArray(it.category_ids) ? it.category_ids : []
            return row
        })
        let { data, error } = await supabaseServer.from('diamond_shapes').upsert(buildPayload(false), { onConflict: 'key' }).select()
        if (error && /category_ids|42703|column/i.test(String((error as any)?.message || ''))) {
            // Pre-migration DB — retry without the new column.
            const retry = await supabaseServer.from('diamond_shapes').upsert(buildPayload(true), { onConflict: 'key' }).select()
            data = retry.data
            error = retry.error as any
        }
        if (error) {
            const merged = [
                ...DEFAULT_SHAPES.filter(d => !items.find(i => i.key === d.key)),
                ...items.map(i => ({ ...i, is_enabled: i.is_enabled !== false })),
            ]
            refreshStorefront(['/'])
            return NextResponse.json(merged, { status: 200 })
        }
        refreshStorefront(['/'])
        return NextResponse.json(data || [], { status: 200 })
    } catch {
        return NextResponse.json({ error: 'Failed to update diamond shapes' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const key = String(request.nextUrl.searchParams.get('key') || '').trim()
        if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
        const { error } = await supabaseServer.from('diamond_shapes').delete().eq('key', key)
        if (error) {
            return NextResponse.json({ ok: true }, { status: 200 })
        }
        return NextResponse.json({ ok: true }, { status: 200 })
    } catch {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
