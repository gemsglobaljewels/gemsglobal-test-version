import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { refreshStorefront } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/* ── Homepage style sections ──────────────────────────────────────────────
   Admin-managed blocks such as "Rings By Style" / "Bracelets By Style".
   Each row carries its own title, order, and the `is_active` switch that
   decides whether it appears on the homepage.

   Table (migration 120):
     style_sections(id uuid pk, key text unique, title text,
                    category_ids text[], position int, is_active bool)

   GET  → ordered list ([] when the table does not exist yet, so the
          homepage can fall back to auto-grouping).
   PUT  → upsert `items` by `key` (creates sections too).
   DELETE ?key= → remove a section; styles keep their rows (section_id
          goes NULL via ON DELETE SET NULL) and the homepage parks them in
          the first active section.                                          */

const COLS = 'id, key, title, category_ids, position, is_active'

type SectionRow = {
    id?: string
    key: string
    title?: string
    category_ids?: string[] | null
    position?: number
    is_active?: boolean
}

function normalise(row: any): SectionRow {
    return {
        id: row?.id || undefined,
        key: String(row?.key || ''),
        title: String(row?.title || row?.key || ''),
        category_ids: Array.isArray(row?.category_ids) ? row.category_ids : [],
        position: typeof row?.position === 'number' ? row.position : 0,
        is_active: row?.is_active !== false,
    }
}

export async function GET() {
    const cache = { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    try {
        let data: any = null
        let error: any = null
        ;({ data, error } = await supabaseServer
            .from('style_sections')
            .select(COLS)
            .order('position', { ascending: true }))
        if (error) {
            // Pre-migration DB (no style_sections table) — homepage falls back
            // to grouping styles by category on its own.
            return NextResponse.json([], cache)
        }
        return NextResponse.json((Array.isArray(data) ? data : []).map(normalise), cache)
    } catch {
        return NextResponse.json([], cache)
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const items: SectionRow[] = Array.isArray(body?.items) ? body.items : []
        if (items.length === 0) {
            return NextResponse.json({ error: 'items required' }, { status: 400 })
        }

        const slug = (s: string) =>
            String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

        const payload = items.map((it, i) => ({
            key: slug(it.key || it.title || `section-${i + 1}`) || `section-${i + 1}`,
            title: (it.title || it.key || '').toString().trim() || 'Untitled section',
            category_ids: Array.isArray(it.category_ids) ? it.category_ids : [],
            position: typeof it.position === 'number' ? it.position : i + 1,
            is_active: it.is_active !== false,
        }))

        const { data, error } = await supabaseServer
            .from('style_sections')
            .upsert(payload, { onConflict: 'key' })
            .select(COLS)

        if (error) {
            return NextResponse.json(
                { error: String((error as any)?.message || 'Failed to save sections') },
                { status: 400 },
            )
        }

        // Homepage reads sections on every render — warm the paths now.
        refreshStorefront(['/'])
        return NextResponse.json((Array.isArray(data) ? data : []).map(normalise), { status: 200 })
    } catch {
        return NextResponse.json({ error: 'Failed to update sections' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const key = String(request.nextUrl.searchParams.get('key') || '').trim()
        if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
        const { error } = await supabaseServer.from('style_sections').delete().eq('key', key)
        if (error) {
            return NextResponse.json(
                { error: String((error as any)?.message || 'Failed to delete') },
                { status: 400 },
            )
        }
        refreshStorefront(['/'])
        return NextResponse.json({ ok: true }, { status: 200 })
    } catch {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
