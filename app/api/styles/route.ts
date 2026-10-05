import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

const DEFAULT_STYLES = [
    { key: 'solitaire', name: 'Solitaire', sub: 'Pure Elegance', desc: 'One diamond. Infinite meaning. The solitaire distils jewellery to its purest form — a single stone suspended in timeless light.', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'three-stone', name: 'Three Stone', sub: 'Timeless Trinity', desc: 'Past, present and future — three stones united in one enduring symbol. A ring that carries your whole story.', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'halo', name: 'Halo', sub: 'Radiant Aura', desc: 'A crown of diamonds encircles the centre stone, amplifying its brilliance and creating an unmistakable aura of light.', image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'floral-inspired', name: 'Floral Inspired', sub: "Nature's Beauty", desc: 'Inspired by petals in bloom — organic curves and hand-set diamonds that celebrate the living beauty of nature.', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'hidden-halo', name: 'Hidden Halo', sub: 'Secret Sparkle', desc: 'A whisper of diamonds hidden beneath the centre stone — visible only to those who know where to look.', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop&q=90', is_enabled: true },
]

export async function GET() {
    try {
        const { data, error } = await supabaseServer
            .from('ring_styles')
            .select('key, name, sub, desc, image, is_enabled')
            .order('name', { ascending: true })
        if (error) {
            // Table may not exist yet; fall back to defaults
            return NextResponse.json(DEFAULT_STYLES)
        }
        const rows = (Array.isArray(data) ? data : []).map((row, i) => {
            if (!row.image) {
                // Find matching default image by key or index
                const def = DEFAULT_STYLES.find(d => d.key === row.key) || DEFAULT_STYLES[i % DEFAULT_STYLES.length]
                return { ...row, image: def.image }
            }
            return row
        })
        if (rows.length === 0) return NextResponse.json(DEFAULT_STYLES)
        return NextResponse.json(rows)
    } catch {
        return NextResponse.json(DEFAULT_STYLES)
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const items: Array<{ key: string; name?: string; sub?: string; desc?: string; image?: string; is_enabled?: boolean }> =
            Array.isArray(body?.items) ? body.items : []
        if (items.length === 0) {
            return NextResponse.json({ error: 'items required' }, { status: 400 })
        }
        // Try upsert; requires table ring_styles (key text primary key, name text, sub text, desc text, image text, is_enabled boolean)
        const payload = items.map((it) => ({
            key: it.key,
            name: it.name ?? null,
            sub: it.sub ?? null,
            desc: it.desc ?? null,
            image: it.image ?? null,
            is_enabled: typeof it.is_enabled === 'boolean' ? it.is_enabled : null,
        }))
        const { data, error } = await supabaseServer.from('ring_styles').upsert(payload, { onConflict: 'key' }).select()
        if (error) {
            const merged = [
                ...DEFAULT_STYLES.filter(d => !items.find(i => i.key === d.key)),
                ...items.map(i => ({ ...i, is_enabled: i.is_enabled !== false })),
            ]
            return NextResponse.json(merged, { status: 200 })
        }
        return NextResponse.json(data || [], { status: 200 })
    } catch {
        return NextResponse.json({ error: 'Failed to update styles' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const key = String(request.nextUrl.searchParams.get('key') || '').trim()
        if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
        const { error } = await supabaseServer.from('ring_styles').delete().eq('key', key)
        if (error) {
            // If table unavailable, respond OK to keep UI consistent with fallback
            return NextResponse.json({ ok: true }, { status: 200 })
        }
        return NextResponse.json({ ok: true }, { status: 200 })
    } catch {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
