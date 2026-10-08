import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { refreshStorefront } from '@/lib/revalidate'
import { autoAssignSections } from '@/lib/styleSections'

export const dynamic = 'force-dynamic'

const DEFAULT_STYLES = [
    { key: 'solitaire', name: 'Solitaire', sub: 'Pure Elegance', desc: 'One diamond. Infinite meaning. The solitaire distils jewellery to its purest form — a single stone suspended in timeless light.', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'three-stone', name: 'Three Stone', sub: 'Timeless Trinity', desc: 'Past, present and future — three stones united in one enduring symbol. A ring that carries your whole story.', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'halo', name: 'Halo', sub: 'Radiant Aura', desc: 'A crown of diamonds encircles the centre stone, amplifying its brilliance and creating an unmistakable aura of light.', image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'floral-inspired', name: 'Floral Inspired', sub: "Nature's Beauty", desc: 'Inspired by petals in bloom — organic curves and hand-set diamonds that celebrate the living beauty of nature.', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'hidden-halo', name: 'Hidden Halo', sub: 'Secret Sparkle', desc: 'A whisper of diamonds hidden beneath the centre stone — visible only to those who know where to look.', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop&q=90', is_enabled: true },
]

export async function GET() {
    // Rarely-changing lookup data — safe for a few minutes on the edge.
    const cache = { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    try {
        let data: any = null
        let error: any = null
        ;({ data, error } = await supabaseServer
            .from('ring_styles')
            .select('key, name, sub, desc, image, is_enabled, position, category_ids, section_id')
            .order('name', { ascending: true }))
        if (error) {
            // Pre-migration DB (no category_ids / section_id yet) — retry lean.
            const retry = await supabaseServer
                .from('ring_styles')
                .select('key, name, sub, desc, image, is_enabled, position, category_ids')
                .order('name', { ascending: true })
            data = retry.data
            error = retry.error as any
        }
        if (error) {
            // Older DB (no category_ids either) — still serve the real rows.
            const retry2 = await supabaseServer
                .from('ring_styles')
                .select('key, name, sub, desc, image, is_enabled')
                .order('name', { ascending: true })
            data = retry2.data
            error = retry2.error as any
        }
        if (error) {
            // Table may not exist yet; fall back to defaults
            return NextResponse.json(DEFAULT_STYLES, cache)
        }
        const rows = (Array.isArray(data) ? data : []).map((row: any) => {
            const out = {
                ...row,
                // NULL/missing = every category.
                category_ids: Array.isArray(row.category_ids) ? row.category_ids : [],
                // Which homepage block this style belongs to (null = unplaced).
                section_id: row.section_id || null,
            }
            if (!out.image) {
                // Only the legacy ring styles carry a stock photo here — a
                // keyless match (e.g. a new necklace style) keeps '' and the
                // homepage renders its lettered plate instead of a wrong photo.
                const def = DEFAULT_STYLES.find(d => d.key === row.key)
                if (def) return { ...out, image: def.image }
            }
            return out
        })
        if (rows.length === 0) return NextResponse.json(DEFAULT_STYLES, cache)
        return NextResponse.json(rows, cache)
    } catch {
        return NextResponse.json(DEFAULT_STYLES, cache)
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const items: Array<{ key: string; name?: string; sub?: string; desc?: string; image?: string; is_enabled?: boolean; category_ids?: string[]; section_id?: string | null }> =
            Array.isArray(body?.items) ? body.items : []
        if (items.length === 0) {
            return NextResponse.json({ error: 'items required' }, { status: 400 })
        }
        // Try upsert; requires table ring_styles (key text primary key, name text, sub text, desc text, image text, is_enabled boolean, category_ids text[], section_id uuid)
        const buildPayload = (strip: boolean) => items.map((it) => {
            const row: Record<string, any> = {
                key: it.key,
                name: it.name ?? null,
                sub: it.sub ?? null,
                desc: it.desc ?? null,
                image: it.image ?? null,
                is_enabled: typeof it.is_enabled === 'boolean' ? it.is_enabled : null,
            }
            if (!strip) {
                row.category_ids = Array.isArray(it.category_ids) ? it.category_ids : []
                // Which homepage block ("Rings By Style") this style lives in.
                row.section_id = it.section_id || null
            }
            return row
        })
        let { data, error } = await supabaseServer.from('ring_styles').upsert(buildPayload(false), { onConflict: 'key' }).select()
        if (error && /category_ids|section_id|42703|column/i.test(String((error as any)?.message || ''))) {
            // Pre-migration DB — retry without the new columns.
            const retry = await supabaseServer.from('ring_styles').upsert(buildPayload(true), { onConflict: 'key' }).select()
            data = retry.data
            error = retry.error as any
        }
        if (error) {
            const merged = [
                ...DEFAULT_STYLES.filter(d => !items.find(i => i.key === d.key)),
                ...items.map(i => ({ ...i, is_enabled: i.is_enabled !== false })),
            ]
            refreshStorefront(['/'])
            return NextResponse.json(merged, { status: 200 })
        }

        // No section picked → work it out from the style's category: find the
        // matching box, or create it ("<Family> By Style") if this is the first
        // style of that family. So a new necklace style instantly gets its own
        // homepage section, with the admin on/off switch in Admin → Styles.
        await autoAssignSections(Array.isArray(data) ? data : [])

        refreshStorefront(['/'])
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
