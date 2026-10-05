import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

// Default fallback items (match original ImgGallery component)
const DEFAULT_GALLERY_ITEMS = [
  { id: 'g1', image_url: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=900&q=80&fit=crop', alt_text: 'Statement necklace editorial', is_big: true, side: 'left', show_shop_now: true, magazine_text: 'ELLE', magazine_position: 'tl', show_parallax: true, position: 0, is_enabled: true, show_on_homepage: true },
  { id: 'g2', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80&fit=crop', alt_text: 'Drop earring close-up', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 1, is_enabled: true, show_on_homepage: true },
  { id: 'g3', image_url: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80&fit=crop', alt_text: 'Hand with diamond bracelet', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 2, is_enabled: true, show_on_homepage: true },
  { id: 'g4', image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80&fit=crop', alt_text: 'Editorial portrait', is_big: false, side: 'left', show_shop_now: false, magazine_text: 'VOGUE', magazine_position: 'br', show_parallax: false, position: 3, is_enabled: true, show_on_homepage: true },
  { id: 'g5', image_url: 'https://images.unsplash.com/photo-1591209627710-a26a9a07e6d6?w=600&q=80&fit=crop', alt_text: 'Leather jacket & rings', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 4, is_enabled: true, show_on_homepage: true },
  { id: 'g6', image_url: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=600&q=80&fit=crop', alt_text: 'Earring through the hair', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 5, is_enabled: true, show_on_homepage: true },
  { id: 'g7', image_url: 'https://images.unsplash.com/photo-1614303384681-15ea2c5b4f96?w=600&q=80&fit=crop', alt_text: 'Gold initial pendant', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 6, is_enabled: true, show_on_homepage: true },
  { id: 'g8', image_url: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=900&q=80&fit=crop', alt_text: 'Kitten cover story', is_big: true, side: 'right', show_shop_now: false, magazine_text: 'ELLE', magazine_position: 'tl', show_parallax: true, position: 7, is_enabled: true, show_on_homepage: true },
  { id: 'g9', image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80&fit=crop', alt_text: 'Solitaire ring', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 8, is_enabled: true, show_on_homepage: true },
  { id: 'g10', image_url: 'https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=600&q=80&fit=crop', alt_text: 'Gold hoop earrings', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 9, is_enabled: true, show_on_homepage: true },
  { id: 'g11', image_url: 'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=600&q=80&fit=crop', alt_text: 'Emerald ring', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 10, is_enabled: true, show_on_homepage: true },
  { id: 'g12', image_url: 'https://images.unsplash.com/photo-1599459183200-59c7687a0275?w=600&q=80&fit=crop', alt_text: 'Bridal jewelry set', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 11, is_enabled: true, show_on_homepage: true },
  { id: 'g13', image_url: 'https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?w=600&q=80&fit=crop', alt_text: 'Sapphire necklace', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 12, is_enabled: true, show_on_homepage: true },
  { id: 'g14', image_url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80&fit=crop', alt_text: 'Stacked bracelets', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 13, is_enabled: true, show_on_homepage: true },
  { id: 'g15', image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80&fit=crop', alt_text: 'The bridal story', is_big: true, side: 'left', show_shop_now: true, magazine_text: '', magazine_position: 'tl', show_parallax: true, position: 14, is_enabled: true, show_on_homepage: true },
  { id: 'g16', image_url: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=600&q=80&fit=crop', alt_text: 'Earring close-up, soft light', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 15, is_enabled: true, show_on_homepage: true },
  { id: 'g17', image_url: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80&fit=crop', alt_text: 'Layered necklaces', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 16, is_enabled: true, show_on_homepage: true },
  { id: 'g18', image_url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80&fit=crop', alt_text: 'Diamond bracelet, hand resting', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 17, is_enabled: true, show_on_homepage: true },
  { id: 'g19', image_url: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80&fit=crop', alt_text: 'Golden hour close-up', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 18, is_enabled: true, show_on_homepage: true },
  { id: 'g20', image_url: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=600&q=80&fit=crop', alt_text: 'Side profile, gold earring', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 19, is_enabled: true, show_on_homepage: true },
  { id: 'g21', image_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&fit=crop', alt_text: 'Pearl pendant necklace', is_big: false, side: 'left', show_shop_now: false, magazine_text: '', magazine_position: 'tl', show_parallax: false, position: 20, is_enabled: true, show_on_homepage: true },
]

// Shared fetch used by GET and by PUT's response.
//
// The DEFAULT_GALLERY_ITEMS fallback exists ONLY so the public homepage is
// never blank before an admin has curated the wall. It must NOT leak into the
// admin editor: those rows have ids like `g1`…`g21` (not real DB rows), so the
// admin would show fake placeholder images and — worse — a Save would try to
// UPDATE non-existent ids and silently do nothing.
//
// `admin` mode therefore returns the raw table contents (an empty array when
// the table is empty), so the editor shows the true state and its empty screen.
async function fetchItems(opts: { admin?: boolean } = {}) {
  const { data, error } = await supabaseServer
    .from('img_gallery')
    // The products table's image column is `image` (there is no `image_url`),
    // so alias it back to image_url for the client. Selecting the non-existent
    // `image_url` here makes PostgREST fail the WHOLE query (code 42703), which
    // made fetchItems return an empty list — the admin saw "No items yet" and
    // every save looked empty even though rows persisted fine.
    .select('*, products:product_id(id, name, slug, image_url:image, price)')
    .order('position', { ascending: true })

  if (error) {
    console.error('Supabase GET error:', error)
    // Admin needs the truth (surface the error, no fake rows); the public site
    // degrades gracefully to the defaults so it never renders empty.
    return opts.admin
      ? { items: [], error: error.message }
      : { items: DEFAULT_GALLERY_ITEMS, error: error.message }
  }
  if (data && data.length > 0) {
    return { items: data }
  }
  // Empty table: real emptiness for admin, curated defaults for the storefront.
  return { items: opts.admin ? [] : DEFAULT_GALLERY_ITEMS }
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = request.nextUrl.searchParams.get('admin') === 'true'
    return NextResponse.json(await fetchItems({ admin: isAdmin }))
  } catch (e) {
    console.error('Img Gallery GET error:', e)
    const isAdmin = request.nextUrl.searchParams.get('admin') === 'true'
    return NextResponse.json({ items: isAdmin ? [] : DEFAULT_GALLERY_ITEMS, error: String(e) })
  }
}

// Real DB rows use a UUID primary key. Anything else — the `item-…` ids the
// editor mints for brand-new rows, or the `g1…g21` placeholder ids from the
// public fallback — must be treated as an INSERT, never an UPDATE (an UPDATE
// keyed by a non-uuid id throws `invalid input syntax for type uuid: "g1"`).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isRealDbId = (id: unknown): id is string => typeof id === 'string' && UUID_RE.test(id)

// Columns whose migrations may not have been run on every deployment. If a
// write fails because one of these is missing from the live schema, we strip it
// and retry so the rest of the row still saves.
const OPTIONAL_COLUMNS = ['crop_position', 'product_id'] as const

// Return the optional column named in a "column does not exist" error, if any.
function missingOptionalColumn(error: { message?: string } | null): string | null {
  const msg = error?.message
  if (!msg) return null
  if (!/column|schema cache|does not exist|could not find/i.test(msg)) return null
  return OPTIONAL_COLUMNS.find(col => new RegExp(col, 'i').test(msg)) || null
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { items } = body

    console.log('PUT img_gallery items:', items)

    if (Array.isArray(items)) {
      // First, get all existing items
      const { data: existingItems, error: fetchError } = await supabaseServer
        .from('img_gallery')
        .select('id')
      
      if (fetchError) console.error('Fetch existing items error:', fetchError)

      const existingIdsFromDb = existingItems?.map(i => i.id) || []
      // Only genuine uuid ids can refer to existing DB rows; everything else is
      // a new/placeholder row that will be inserted, not matched for deletion.
      const incomingExistingIds = items.filter(i => isRealDbId(i.id)).map(i => i.id)
      
      // Delete items that are in DB but not in incoming list
      const idsToDelete = existingIdsFromDb.filter(id => !incomingExistingIds.includes(id))
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabaseServer
          .from('img_gallery')
          .delete()
          .in('id', idsToDelete)
        if (deleteError) console.error('Delete error:', deleteError)
      }

      const writeErrors: string[] = []
      let cropColumnMissing = false

      // Build the row payload. Columns listed in `omit` are dropped so writes
      // still succeed on deployments where an optional column (crop_position,
      // product_id) hasn't been added yet — see the retry loop in writeItem.
      const buildItemData = (item: any, omit: Set<string>) => {
        const data: Record<string, any> = {
          image_url: item.image_url,
          alt_text: item.alt_text || '',
          is_big: !!item.is_big,
          side: item.side || 'left',
          show_shop_now: !!item.show_shop_now,
          magazine_text: item.magazine_text || '',
          magazine_position: item.magazine_position || 'tl',
          show_parallax: !!item.show_parallax,
          position: item.position,
          is_enabled: item.is_enabled ?? true,
          show_on_homepage: item.show_on_homepage ?? true,
          crop_position: item.crop_position || 'center',
          product_id: item.product_id || null,
          updated_at: new Date().toISOString()
        }
        for (const col of omit) delete data[col]
        return data
      }

      const writeItem = async (item: any) => {
        const isNew = !isRealDbId(item.id)
        const omit = new Set<string>()
        const run = () => {
          const payload = buildItemData(item, omit)
          return isNew
            ? supabaseServer.from('img_gallery').insert(payload)
            : supabaseServer.from('img_gallery').update(payload).eq('id', item.id)
        }

        // Retry, stripping any optional column the live schema is missing, so a
        // not-yet-migrated column never blocks the rest of the row from saving.
        for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.length; attempt++) {
          const { error } = await run()
          if (!error) return
          const missing = missingOptionalColumn(error)
          if (missing && !omit.has(missing)) {
            omit.add(missing)
            if (missing === 'crop_position') cropColumnMissing = true
            continue
          }
          console.error(`${isNew ? 'Insert' : 'Update'} error for`, item.id, error)
          writeErrors.push(`${isNew ? 'insert' : 'update'} ${item.id}: ${error.message}`)
          return
        }
      }

      for (const item of items) {
        await writeItem(item)
      }

      // Don't lie about success: if any row failed, report it.
      if (writeErrors.length > 0) {
        return NextResponse.json(
          { error: `Failed to save ${writeErrors.length} item(s): ${writeErrors[0]}`, details: writeErrors },
          { status: 500 }
        )
      }

      // PUT is admin-only — return the real persisted rows, never the defaults.
      const result = await fetchItems({ admin: true })
      return NextResponse.json(
        cropColumnMissing
          ? { ...result, warning: 'Saved, but "Crop Position" was not stored — run the img_gallery migration to add the crop_position column.' }
          : result
      )
    }

    return NextResponse.json(await fetchItems({ admin: true }))
  } catch (e) {
    console.error('Img Gallery PUT error:', e)
    return NextResponse.json({ error: 'Failed to save gallery', details: String(e) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    console.log('DELETE img_gallery item:', id)

    const { error } = await supabaseServer
      .from('img_gallery')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Img Gallery DELETE error:', e)
    return NextResponse.json({ error: 'Failed to delete item', details: String(e) }, { status: 500 })
  }
}
