/* ── Auto-placement of a style into its homepage section ───────────────────
   Admin should never have to hand-pick a section just to see their style on
   the homepage. When a style is saved without an explicit `section_id`:

     1. its category family decides the section — a necklace style goes to
        "Necklaces By Style", a bracelet style to "Bracelets By Style";
     2. if that family has no section yet, one is CREATED on the spot
        (title "<Family> By Style", "show on homepage" ON, appended last) —
        so the first necklace style admin adds mints its own box;
     3. family comes from the style's `category_ids` (resolved through the
        `categories` table) and, for legacy rows with no categories, from the
        style name ("Pave Solitaire" → Rings);
     4. anything still unknown stays unplaced — the homepage parks it in the
        first visible section rather than dropping it.

   Runs inside `PUT /api/styles` and is best-effort: pre-migration DBs (no
   `style_sections` table) simply get `null` and nothing breaks. */

import { supabaseServer } from '@/lib/supabaseServer'
import { categoryFamily } from '@/lib/categoryScope'

const slug = (s: string) =>
    String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/** categoryFamily() passes unknown names through — keep only real families. */
const KNOWN_FAMILIES = ['Earrings', 'Rings', 'Necklaces', 'Bracelets', 'Chains', 'Diamonds']
function strictFamily(nameOrSlug?: string | null): string | null {
    const f = categoryFamily(nameOrSlug)
    return KNOWN_FAMILIES.includes(f) ? f : null
}

/* Name keywords for rows that never got categories (checked in order — a
   "Rose Gold Ring" must not match `chain`/`diamond` first). */
const NAME_FAMILY: Array<[RegExp, string]> = [
    [/earring|stud\b|hoop|huggie|climber/, 'Earrings'],
    [/necklace|pendant|lariat|choker|medallion/, 'Necklaces'],
    [/bracelet|bangle|cuff|charm|anklet/, 'Bracelets'],
    [/chain/, 'Chains'],
    [/solitaire|halo|three stone|wedding band|engagement|eternity|\bring\b|band/, 'Rings'],
    [/diamond|round|oval|princess|pear|cushion|radiant|marquise|emerald|heart/, 'Diamonds'],
]

type SectionLike = {
    id: string
    key?: string | null
    title?: string | null
    category_ids?: string[] | null
    position?: number | null
    is_active?: boolean | null
}

/**
 * Fill `section_id` on every row that has none, creating sections when a new
 * jewellery family shows up. Mutates `rows` in place and persists the choice.
 */
export async function autoAssignSections(rows: Array<Record<string, any>>): Promise<void> {
    const pending = (rows || []).filter(r => r && !r.section_id)
    if (pending.length === 0) return

    try {
        const [catsRes, secRes] = await Promise.all([
            supabaseServer.from('categories').select('id, name, slug'),
            supabaseServer
                .from('style_sections')
                .select('id, key, title, category_ids, position, is_active')
                .order('position', { ascending: true }),
        ])

        // Pre-migration DB: no style_sections table → nothing to place into.
        const sections: SectionLike[] = Array.isArray(secRes.data) ? (secRes.data as SectionLike[]) : []
        if (secRes.error && sections.length === 0) return

        const nameOf = new Map<string, string>(
            (Array.isArray(catsRes.data) ? catsRes.data : []).map((c: any) => [
                String(c.id),
                String(c.name || c.slug || ''),
            ]),
        )

        const familyOf = (ids: string[], name: string, key: string): string => {
            for (const id of ids) {
                const f = strictFamily(nameOf.get(String(id)) || '')
                if (f) return f
            }
            const t = `${name || ''} ${key || ''}`.toLowerCase()
            for (const [re, fam] of NAME_FAMILY) if (re.test(t)) return fam
            return 'Rings' // legacy default, same rule as migration 119's backfill
        }

        for (const row of pending) {
            const ids: string[] = Array.isArray(row.category_ids) ? row.category_ids : []
            const fam = familyOf(ids, row.name || '', row.key || '')
            const key = slug(fam)

            let hit: SectionLike | undefined =
                sections.find(s => String(s.key || '') === key) ||
                sections.find(
                    s =>
                        ids.length > 0 &&
                        Array.isArray(s.category_ids) &&
                        ids.some(id => s.category_ids!.includes(id)),
                )

            if (!hit) {
                // First style of this family → mint its own section box.
                const pos = sections.length
                    ? Math.max(...sections.map(s => Number(s.position) || 0)) + 1
                    : 1
                const { data: created, error: cerr } = await supabaseServer
                    .from('style_sections')
                    .insert({
                        key,
                        title: `${fam} By Style`,
                        category_ids: ids,
                        position: pos,
                        is_active: true,
                    })
                    .select('id, key, title, category_ids, position, is_active')
                    .single()

                if (created && !cerr) {
                    hit = created as SectionLike
                    sections.push(hit)
                } else {
                    // Key already exists (concurrent save) — re-read it.
                    const { data: again } = await supabaseServer
                        .from('style_sections')
                        .select('id, key, title, category_ids, position, is_active')
                        .eq('key', key)
                        .maybeSingle()
                    hit = (again as SectionLike) || undefined
                }
            }

            if (!hit || !hit.id) continue
            row.section_id = String(hit.id)
            // Persist so the choice survives the next render (best effort).
            await supabaseServer.from('ring_styles').update({ section_id: row.section_id }).eq('key', row.key)
        }
    } catch {
        // Best effort — the homepage parks unplaced styles anyway.
    }
}
